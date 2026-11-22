# AGBase SDK

Plug-and-play AI assistants infrastructure as a service. Seamlessly integrate intelligent AI-powered chat assistants into your applications.

[![npm version](https://img.shields.io/npm/v/@agbase/sdk)](https://www.npmjs.com/package/@agbase/sdk)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

**Homepage:** [agbase](https://agbase.vercel.app)

## 🚀 Features

- ✨ **Ready-to-use Chat Widget** - Drop-in React component for instant chat functionality
- 📄 **Media Upload Support** - Allow users to upload images for AI analysis
- 🎨 **Markdown Support** - Rich text responses with formatting
- 🔔 **Toast Notifications** - User-friendly feedback for errors and interactions
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎯 **Type-Safe** - Full TypeScript support with types included
- 🔧 **Flexible Client** - Use the AGBaseClient directly for custom integrations
- 🌐 **Less Configuration** - Works out of the box with minimal setup

## 📦 Installation

Install the package using npm, yarn, or pnpm:

```bash
npm install @agbase/sdk
```

## 🎯 Quick Start

### Using the Chat Widget

The easiest way to add AI chat to your application:
<br/>
React:
```tsx
import { ChatWidget } from '@agbase/sdk';

export default function App() {
  return (
    <div>
      <h1>My App</h1>
      <ChatWidget appKey="your-app-key-here" name="YOUR_ASSISTANT_NAME" />
    </div>
  );
}
```
HTML:
```html
<script 
  src="/assets/loader.standalone.js"
  data-app-key="your-app-key-here"
  data-name="YOUR_ASSISTANT_NAME"
></script>
```

Copy `dist/loader.standalone.js` from the package or your local SDK build to the path used in the snippet.

### Using the AGBaseClient

For more control, use the client directly:

```typescript
import { AGBaseClient } from '@agbase/sdk';

const ai = new AGBaseClient({
  appKey: 'your-app-key-here'
});
 
const request = new AbortController();

await ai.ask({
  query: 'How do I get started?',
  // file: selectedImage,
  signal: request.signal,
  onText: (chunk) => console.log(chunk),
  onMeta: ({ route, elementId }) => console.log(route, elementId),
  onStatus: (message) => console.log(message),
  onDone: () => console.log('Complete'),
  onError: (message) => console.error(message),
});
```

`ask()` returns `Promise<void>` and delivers responses through callbacks. Call
`request.abort()` to cancel a request. An interrupted stream calls `onError`.

Omit `baseUrl` to use the hosted streaming endpoint. An absolute origin or an
absolute URL ending in `/api`, `/api/v1`, or `/api/v2` at the root uses
`/api/v2/chat` on that origin. An explicit URL ending in `/chat` is used
directly and must serve the streaming protocol.

In Next.js App Router, import and render `ChatWidget` from a file with
`'use client'`.

## Local development

Run `npm ci`, `npm run lint`, `npm run build`, then `npm test`. The tests import the built package. A release build creates the ESM and CommonJS entries, declarations, and `dist/loader.standalone.js`. If a dashboard uses `npm link`, run its `npm run dev:linked` command and run the SDK watcher with `npm run dev` after the initial build.

## 🔗 Resources

- **Homepage:** [agbase](https://agbase.vercel.app)
- **GitHub:** [github.com/agbasehq/agbase-sdk](https://github.com/agbasehq/agbase-sdk)
- **NPM Package:** [@agbase/sdk](https://www.npmjs.com/package/@agbase/sdk)

## 👥 Author

**Dattatray** - [GitHub Profile](https://github.com/Dattatray8)

## 🙏 Support

If you encounter any issues or have questions, please:
1. Check the [documentation](https://agbase.vercel.app/docs)
2. Search existing [issues](https://github.com/agbasehq/agbase-sdk/issues)
3. Create a new issue with detailed information

---

Built with ❤️
