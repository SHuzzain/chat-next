/**
 * Start the Eve Nitro production server with env files loaded.
 * Next loads `.env*` automatically; Eve's node process does not.
 * Server deploy uses `.env` (not `.env.production`).
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const entry = resolve(root, ".output/server/index.mjs");
/** Prefer plain `.env` on the VPS; fall back for local prod-file setups. */
const envFiles = [resolve(root, ".env"), resolve(root, ".env.production")];

if (!existsSync(entry)) {
  console.error(
    `Missing ${entry}. Run: pnpm eve:build (or pnpm build) before starting Eve.`,
  );
  process.exit(1);
}

function loadEnvFile(path) {
  if (!existsSync(path)) return false;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return true;
}

const loaded = envFiles.filter((path) => loadEnvFile(path));
if (loaded.length === 0) {
  console.error(
    "No .env or .env.production found. Eve needs LMS_BACKEND_URL and OPENAI_API_KEY.",
  );
  process.exit(1);
}

process.env.NODE_ENV ??= "production";
process.env.HOST ??= "127.0.0.1";
process.env.NITRO_HOST ??= "127.0.0.1";
process.env.PORT ??= "4274";
process.env.NITRO_PORT ??= process.env.PORT;

if (!process.env.LMS_BACKEND_URL?.trim()) {
  console.error(
    "LMS_BACKEND_URL is missing after loading .env. Eve auth will fail.",
  );
  process.exit(1);
}

const child = spawn(process.execPath, [entry], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
