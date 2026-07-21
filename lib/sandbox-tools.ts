import { tool, type ToolSet } from "ai";
import { z } from "zod";

const MAX_CODE_CHARS = 20_000;
const MAX_STDOUT_CHARS = 50_000;
const MAX_STDERR_CHARS = 10_000;

const npmPackageSchema = z
  .string()
  .min(1)
  .max(150)
  .regex(
    /^(?:@[\w.-]+\/)?[\w.-]+(?:@[\w*^~<>=|.-]+)?$/,
    "Invalid npm package name",
  );

function getSandboxCredentials() {
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const token = process.env.VERCEL_TOKEN;

  if (!teamId || !projectId || !token) {
    throw new Error(
      "Missing VERCEL_TEAM_ID, VERCEL_PROJECT_ID, or VERCEL_TOKEN",
    );
  }

  return { teamId, projectId, token };
}

export function createSandboxTools(): ToolSet {
  return {
    execute_js: tool({
      description: [
        "Run short JavaScript in an isolated Vercel Sandbox using Node.js.",
        "Use it only for exact calculations, sorting, filtering, aggregation, and transforming JSON.",
        "Do not call LMS APIs.",
        "Do not use credentials, passwords, access tokens, cookies, or private data.",
        "Do not access the host filesystem.",
        "Print only the required final result using console.log.",
      ].join(" "),

      inputSchema: z.object({
        code: z
          .string()
          .min(1)
          .max(MAX_CODE_CHARS)
          .describe(
            "JavaScript source executed with node -e. Prefer pure computation and print the final result using console.log.",
          ),

        packages: z
          .array(npmPackageSchema)
          .max(5)
          .optional()
          .describe(
            "Optional npm package names required for execution. Keep this list minimal.",
          ),
      }),

      execute: async ({ code, packages }, { abortSignal }) => {
        const trimmedCode = code.trim();

        if (!trimmedCode) {
          return {
            ok: false,
            error: "Empty code",
          };
        }

        const uniquePackages = [...new Set(packages ?? [])];
        const needsPackages = uniquePackages.length > 0;

        const { Sandbox } = await import("@vercel/sandbox");

        let sandbox: Awaited<ReturnType<typeof Sandbox.create>> | undefined;

        try {
          const credentials = getSandboxCredentials();

          sandbox = await Sandbox.create({
            ...credentials,
            runtime: "node24",
            timeout: 60_000,
            resources: { vcpus: 1 },
            persistent: false,
            networkPolicy: needsPackages ? "allow-all" : "deny-all",
          });

          if (needsPackages) {
            const install = await sandbox.runCommand(
              "npm",
              [
                "install",
                "--silent",
                "--no-audit",
                "--no-fund",
                "--ignore-scripts",
                ...uniquePackages,
              ],
              {
                signal: abortSignal,
              },
            );

            if (install.exitCode !== 0) {
              return {
                ok: false,
                error: "npm install failed",
                stderr: String(await install.stderr()).slice(
                  0,
                  MAX_STDERR_CHARS,
                ),
                exitCode: install.exitCode,
              };
            }

            // Disable internet access before running model-generated code.
            await sandbox.update({
              networkPolicy: "deny-all",
            });
          }

          const run = await sandbox.runCommand(
            "node",
            ["-e", trimmedCode],
            {
              signal: abortSignal,
            },
          );

          const stdout = String(await run.stdout());
          const stderr = String(await run.stderr());

          return {
            ok: run.exitCode === 0,
            stdout: stdout.slice(0, MAX_STDOUT_CHARS),
            stderr: stderr.slice(0, MAX_STDERR_CHARS),
            exitCode: run.exitCode,
            truncated: {
              stdout: stdout.length > MAX_STDOUT_CHARS,
              stderr: stderr.length > MAX_STDERR_CHARS,
            },
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);

          console.error("execute_js sandbox error:", message);

          return {
            ok: false,
            error: "Sandbox execution failed",
            detail:
              process.env.NODE_ENV === "development"
                ? message
                : undefined,
          };
        } finally {
          await sandbox?.stop().catch((stopError) => {
            console.error("Failed to stop sandbox:", stopError);
          });
        }
      },
    }),
  };
}