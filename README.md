# Chat Next

Embeddable streaming AI chat widget built with Next.js. The root page can be dropped into a parent site as a compact launcher that expands into a chat panel. It syncs light/dark theme and open/close state with the host page over `postMessage`, and streams replies from OpenAI or OpenRouter backends.

**Live demo:** [chat-next-ashy-two.vercel.app](https://chat-next-ashy-two.vercel.app)

## Features

- Streaming assistant replies via the Vercel AI SDK
- OpenAI (`/api/chat/gpt`) and OpenRouter (`/api/chat/openrouter`) routes
- Embed mode with `token`, `origin`, `role`, and `theme` query params
- Host `postMessage` events for `theme`, `open`, `close`, and panel `resize`
- Light/dark theming with `next-themes`
- PM2 scripts for VPS deploys (`ecosystem.config.js`, default port 3606)

## Stack

- Next.js 16 + React 19 + TypeScript
- Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`)
- OpenRouter provider (`@openrouter/ai-sdk-provider`)
- Tailwind CSS 4, Radix UI, lucide-react, motion, sonner

## Setup

```bash
pnpm install
pnpm dev
```

The dev server listens on port 3606. Add the provider API keys your chosen route expects before sending messages.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Next.js dev server on port 3606 |
| `pnpm build` | Production build |
| `pnpm start` | Production server on port 3606 |
| `pnpm lint` | ESLint |
| `pnpm pm2:start` | Start with PM2 |
| `pnpm deploy:prod` | Build, then start or restart PM2 |

`pnpm start` still works without PM2. PM2 adds process monitoring, restart, and logs.
