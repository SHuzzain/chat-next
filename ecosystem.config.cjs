/**
 * PM2 process file for lms-agent (Next.js + Eve).
 *
 * Usage:
 *   pnpm build          # eve build + next build
 *   pm2 start ecosystem.config.cjs
 *   pm2 reload ecosystem.config.cjs
 *
 * Keep instances at 1 — agent secrets live in an in-memory Map on Next.
 * Eve must listen on 127.0.0.1:4274 (withEve production rewrite target).
 */
module.exports = {
  apps: [
    {
      name: "lms-agent-eve",
      cwd: __dirname,
      script: "scripts/start-eve.mjs",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        NITRO_HOST: "127.0.0.1",
        PORT: 4274,
        NITRO_PORT: 4274,
      },
    },
    {
      name: "lms-agent",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3607",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env_file: ".env",
      env: {
        NODE_ENV: "production",
        PORT: 3607,
        LMS_AGENT_INTERNAL_URL: "http://127.0.0.1:3607",
      },
    },
  ],
};
