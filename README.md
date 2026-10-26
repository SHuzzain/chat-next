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

The app listens on [http://localhost:3606](http://localhost:3606) so it matches `NEXT_PUBLIC_CHATBOT_URL` in the LMS frontend.

The LMS host already injects `window.ChatbotConfig` and loads `/chatbot-widget.js`.
