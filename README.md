# LMS Agent

Eve + assistant-ui chatbot for the MindChamps LMS. The LMS frontend embeds it with `chatbot-widget.js`.

## Setup

```bash
pnpm install
```

Add `OPENAI_API_KEY` to `.env.local`, then:

```bash
pnpm dev
```

The app listens on [http://localhost:3607/agent](http://localhost:3607/agent) (`basePath: /agent`). Point the LMS frontend `NEXT_PUBLIC_CHATBOT_URL` at that base (e.g. `https://lmschatbot.champslms.com/agent`).

### Production (PM2)

`withEve` proxies `/agent/eve/v1/*` to Eve on `127.0.0.1:4274`. Production needs
both processes: Eve (`.output` from `eve build`) and Next.

```bash
# Ensure .env.production has OPENAI_API_KEY, LMS_BACKEND_URL, DB_* (use DB_HOST=127.0.0.1 if Postgres is on this host)
pnpm build
pm2 start ecosystem.config.cjs
# or: pnpm pm2:start
```

Reload after a new build:

```bash
pm2 reload ecosystem.config.cjs
curl -sS http://127.0.0.1:4274/eve/v1/health
curl -sS http://127.0.0.1:3607/agent/eve/v1/health
```

The LMS host already injects `window.ChatbotConfig` and loads `/chatbot-widget.js`.
