This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Interactive tools & Vercel Sandbox

Chat tools include:

| Tool | Purpose |
|------|---------|
| LMS MCP tools (`user_*`, `course_centre_*`, …) | Host app data |
| `render_widget` | Declarative human-in-the-loop widgets (select, table, form, dates, confirmation) |
| `execute_js` | Isolated JS in [Vercel Sandbox](https://vercel.com/docs/sandbox) for math / JSON transforms |

### Sandbox setup

1. Enable Sandbox on your Vercel team/project.
2. For local dev, authenticate so the SDK can create sandboxes (see Vercel Sandbox docs — typically `vercel link` + OIDC / project tokens).
3. Without credentials, `execute_js` returns a soft error and the model should continue without it.

Never put auth tokens or passwords into sandbox `code`.

### Dynamic widgets (`render_widget`)

When the user must pick, confirm, or browse LMS data, the model calls `render_widget` with a Zod-validated config (no URLs, tokens, or HTML). The chat UI renders a trusted widget; async data loads via `POST /api/widget-data` using the embed `token` + `origin` from searchParams (`WidgetAuthContext`). The proxy only appends allowlisted relative paths from the server resource registry.

**Origin resolution:** embed `searchParams.origin` (preferred) → else `LMS_API_ORIGIN` env fallback.

**Continuation after submit:** `AssistantProvider` uses AI SDK  
`sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls`  
so that after the widget calls `addResult` with `{ widgetId, action, value }`, a new request is sent and the model can call the next tool. Without that, selection only updates local state and **no next tool runs**.

Works on **AWS VPS** the same as Vercel for the widget flow (only `execute_js` needs Vercel Sandbox credentials).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Production with PM2

For self-hosting in production (e.g. on a VPS), use [PM2](https://pm2.keymetrics.io/) to manage the Next.js server process.

### Setup

1. Install dependencies and build:

   ```bash
   pnpm install
   pnpm build
   ```

2. (First time on server) Optionally install PM2 globally:

   ```bash
   pnpm add -g pm2
   # or npm install -g pm2
   ```

3. Start with PM2:

   ```bash
   pnpm pm2:start
   ```

### Useful PM2 commands (via npm scripts)

| Command            | Description                     |
|--------------------|---------------------------------|
| `pnpm pm2:start`   | Start the app with PM2                 |
| `pnpm pm2:stop`    | Stop the app                           |
| `pnpm pm2:restart` | Hard restart the app                   |
| `pnpm pm2:reload`  | Zero-downtime reload (cluster mode)    |
| `pnpm pm2:delete`  | Remove from PM2                        |
| `pnpm pm2:logs`    | View logs                              |
| `pnpm pm2:status`  | Show process status                    |
| `pnpm pm2:save`    | Save current PM2 process list          |
| `pnpm deploy:prod` | Build + startOrRestart with PM2        |

### PM2 ecosystem

Configuration is in `ecosystem.config.js`. Default runs 1 instance on port 3606.

To enable auto-start on server reboot:

```bash
pm2 startup
pm2 save
```

See the [PM2 documentation](https://pm2.keymetrics.io/docs/usage/startup/) for full setup (systemd etc.).

> Note: The default `pnpm start` / `npm start` still works without PM2. PM2 adds monitoring, auto-restart, logs, and clustering support.
