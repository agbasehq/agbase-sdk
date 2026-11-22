import { readEventData } from "./stream.js";

export interface MetaData {
  route: string | null;
  elementId: string | null;
}

export interface AskOptions {
  query: string;
  file?: File;
  signal?: AbortSignal;

  onText?: (chunk: string) => void;

  onMeta?: (meta: MetaData) => void;

  onStatus?: (message: string) => void;

  onDone?: () => void;

  onError?: (message: string) => void;
}

export interface AGBaseConfig {
  appKey: string;
  baseUrl?: string;
}

const defaultEndpoint = "https://agbase.vercel.app/api/v2/chat";

function resolveEndpoint(baseUrl?: string) {
  if (!baseUrl?.trim()) return defaultEndpoint;

  const url = new URL(baseUrl.trim());
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("AGBase baseUrl must use HTTP or HTTPS");
  }
  const path = url.pathname.replace(/\/+$/, "");
  if (!path || path === "/api" || path === "/api/v1" || path === "/api/v2") {
    url.pathname = "/api/v2/chat";
  } else {
    url.pathname = path.endsWith("/chat") ? path : path + "/chat";
  }
  return url.href;
}

type StreamEvent = {
  type?: string;
  chunk?: unknown;
  message?: unknown;
  route?: unknown;
  elementId?: unknown;
};

export class AGBaseClient {
  private readonly appKey: string;
  private readonly baseUrl: string | undefined;

  constructor(config: AGBaseConfig) {
    this.appKey = config.appKey;
    this.baseUrl = config.baseUrl;
  }

  async ask(options: AskOptions): Promise<void> {
    const signal = options.signal ?? new AbortController().signal;
    let failure: string | undefined;
    let completed = false;

    try {
      if (signal.aborted) throw new Error("Request was aborted");

      const formData = new FormData();
      formData.append("appKey", this.appKey);
      formData.append("query", options.query);
      if (options.file) formData.append("image", options.file);

      const response = await fetch(resolveEndpoint(this.baseUrl), {
        method: "POST",
        signal,
        body: formData,
      });

      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      if (!response.body) throw new Error("Empty response body");

      for await (const frame of readEventData(response.body, signal)) {
        if (signal.aborted) break;

        let event: StreamEvent | null;
        try {
          event = JSON.parse(frame);
        } catch {
          continue;
        }

        switch (event?.type) {
          case "text":
            if (typeof event.chunk === "string") options.onText?.(event.chunk);
            break;
          case "status":
            if (typeof event.message === "string") options.onStatus?.(event.message);
            break;
          case "meta":
            options.onMeta?.({
              route: typeof event.route === "string" ? event.route : null,
              elementId: typeof event.elementId === "string" ? event.elementId : null,
            });
            break;
          case "done":
            completed = true;
            break;
          case "error":
            failure = typeof event.message === "string" ? event.message : "AGBase request failed";
            break;
        }
        if (completed || failure !== undefined) break;
      }

      if (!completed) failure ??= signal.aborted ? "Request was aborted" : "AGBase response ended before completion";
    } catch (error) {
      failure = signal.aborted ? "Request was aborted"
        : error instanceof Error ? error.message : "Unknown AGBase error";
    }

    if (completed) options.onDone?.();
    else if (failure !== undefined) options.onError?.(failure);
  }
}
