import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { AGBaseClient, ChatWidget } from "@agbase/sdk";

const require = createRequire(import.meta.url);
const encoder = new TextEncoder();

function mockResponse(fragments) {
    const bytes = encoder.encode(fragments.join(""));
    return new Response(new ReadableStream({
        start(controller) {
            for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
            controller.close();
        },
    }));
}

test("publishes the same package exports in ESM and CommonJS", () => {
    assert.equal(typeof AGBaseClient, "function");
    assert.equal(typeof ChatWidget, "function");
    assert.deepEqual(Object.keys(require("@agbase/sdk")).sort(), ["AGBaseClient", "ChatWidget"]);
});

test("renders the React component without a browser", () => {
    const html = renderToString(createElement(ChatWidget, { appKey: "test" }));
    assert.match(html, /aria-label="Open chat"/);
    assert.match(html, /data-agbase-widget/);
});

test("sends multipart input and reads fragmented UTF-8 and CRLF events", async (t) => {
    const image = new File(["image"], "image.png", { type: "image/png" });
    t.mock.method(globalThis, "fetch", async (url, options) => {
        assert.equal(url, "http://localhost:3000/api/v2/chat");
        assert.equal(options.body.get("appKey"), "test-key");
        assert.equal(options.body.get("query"), "question");
        assert.equal(options.body.get("image").name, image.name);
        return mockResponse([
            ': comment\r\n\r\n',
            'data: {"type":"status","message":"Working"}\r\n\r\n',
            'data:{"type":"text",\r\ndata: "chunk":"Caf\u00e9"}\r\n\r\n',
            'data: {"type":"meta","route":"/help","elementId":"topic"}\r\n\r\n',
            'data: {"type":"done"}\r\n\r\n',
            'data: {"type":"error","message":"ignored"}\r\n\r\n',
        ]);
    });

    const events = [];
    const client = new AGBaseClient({ appKey: "test-key", baseUrl: "http://localhost:3000/api/v1/" });
    await client.ask({
        query: "question",
        file: image,
        onText: chunk => events.push(chunk),
        onStatus: status => events.push(status),
        onMeta: meta => events.push(meta),
        onDone: () => events.push("done"),
        onError: message => events.push(message),
    });
    assert.deepEqual(events, ["Working", "Caf\u00e9", { route: "/help", elementId: "topic" }, "done"]);
});

test("reports a truncated stream without losing text", async (t) => {
    t.mock.method(globalThis, "fetch", async (url) => {
        assert.equal(url, "https://agbase.vercel.app/api/v2/chat");
        return mockResponse(['data: {"type":"text","chunk":"partial"}\n\n']);
    });
    const events = [];
    await new AGBaseClient({ appKey: "test" }).ask({
        query: "question",
        onText: text => events.push(text),
        onDone: () => events.push("done"),
        onError: error => events.push(error),
    });
    assert.deepEqual(events, ["partial", "AGBase response ended before completion"]);
});

test("cancels a pending read when the caller aborts", async (t) => {
    let canceled = false;
    const controller = new AbortController();
    t.mock.method(globalThis, "fetch", async () => new Response(new ReadableStream({
        start(stream) {
            stream.enqueue(encoder.encode('data: {"type":"status","message":"working"}\n\n'));
        },
        cancel() { canceled = true; },
    })));

    const errors = [];
    await new AGBaseClient({ appKey: "test" }).ask({
        query: "question",
        signal: controller.signal,
        onStatus: () => controller.abort(),
        onError: error => errors.push(error),
    });

    assert.equal(canceled, true);
    assert.deepEqual(errors, ["Request was aborted"]);
});
