/**
 * PM2 process file for lms-agent (Next.js).
 *
 * Usage:
 *   pnpm build
 *   pm2 start ecosystem.config.cjs
 *   pm2 reload ecosystem.config.cjs
 *
 * Keep instances at 1 — agent secrets live in an in-memory Map on this process.
 */
module.exports = {
  apps: [
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
      env: {
        NODE_ENV: "production",
        PORT: 3607,
        LMS_AGENT_INTERNAL_URL: "http://127.0.0.1:3607",
      },
    },
  ],
};
