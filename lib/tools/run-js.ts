import vm from "node:vm";

const MAX_CODE_CHARS = 4_000;
const MAX_DATA_CHARS = 200_000;
const DEFAULT_TIMEOUT_MS = 1_000;

export type RunJsInput = {
  /** Function body that receives `data` and must `return` a JSON-serializable value. */
  code: string;
  /** Input payload from a prior LMS tool (rows, counts, etc.). */
  data?: unknown;
  timeoutMs?: number;
};

export type RunJsOutput = {
  ok: boolean;
  result?: unknown;
  logs: string[];
  error?: string;
};

function assertJsonSize(value: unknown, label: string, max: number) {
  let text: string;
  try {
    text = JSON.stringify(value) ?? "null";
  } catch {
    throw new Error(`${label} is not JSON-serializable.`);
  }
  if (text.length > max) {
    throw new Error(`${label} is too large (${text.length} chars; max ${max}).`);
  }
  return text;
}

function cloneData(data: unknown): unknown {
  if (data === undefined) return undefined;
  assertJsonSize(data, "data", MAX_DATA_CHARS);
  return structuredClone(data);
}

/**
 * Run a short JS function body against `data` in a Node VM context.
 * No fs, fetch, process, require, or network — compute only.
 */
export function runJs(input: RunJsInput): RunJsOutput {
  const code = input.code.trim();
  if (!code) {
    return { ok: false, logs: [], error: "code is empty." };
  }
  if (code.length > MAX_CODE_CHARS) {
    return {
      ok: false,
      logs: [],
      error: `code is too long (${code.length} chars; max ${MAX_CODE_CHARS}).`,
    };
  }

  const logs: string[] = [];
  const timeoutMs = Math.min(
    Math.max(input.timeoutMs ?? DEFAULT_TIMEOUT_MS, 50),
    5_000,
  );

  try {
    const data = cloneData(input.data);
    const sandbox: Record<string, unknown> = {
      data,
      result: undefined,
      console: {
        log: (...args: unknown[]) => {
          logs.push(args.map((arg) => formatLog(arg)).join(" "));
        },
      },
      JSON,
      Math,
      Number,
      String,
      Boolean,
      Array,
      Object,
      Date,
      Map,
      Set,
      RegExp,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      undefined,
    };

    vm.createContext(sandbox);
    const script = new vm.Script(
      `"use strict";\nresult = (function (data) {\n${code}\n})(data);`,
      { filename: "run-js.js" },
    );
    script.runInContext(sandbox, { timeout: timeoutMs, displayErrors: true });

    const result = sandbox.result;
    assertJsonSize(result, "result", MAX_DATA_CHARS);
    return { ok: true, result, logs };
  } catch (error) {
    return {
      ok: false,
      logs,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function formatLog(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
