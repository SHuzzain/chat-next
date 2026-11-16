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

```bash
pnpm build
pm2 start ecosystem.config.cjs
# or: pnpm pm2:start
```

Reload after a new build:

```bash
pm2 reload ecosystem.config.cjs
```

The LMS host already injects `window.ChatbotConfig` and loads `/chatbot-widget.js`.
