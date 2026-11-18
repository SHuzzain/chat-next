import type { SessionContext } from "eve/context";

import {
  requireLmsContext,
  type LmsToolContext,
} from "@/lib/tools/api-tool-context";

import { fetchCapabilityKeys } from "./fetch-capabilities";
import { normalizeCapabilityKey } from "./normalize-capability-key";

export { normalizeCapabilityKey };

function requiredKeyList(required: string | string[]): string[] {
  const list = Array.isArray(required) ? required : [required];
  return list.map(normalizeCapabilityKey).filter(Boolean);
}

/** Returns the first required key not present in `granted`, if any. */
export function findMissingCapability(
  granted: Iterable<string>,
  required: string | string[],
): string | undefined {
  const grantedSet = new Set(
    [...granted].map(normalizeCapabilityKey).filter(Boolean),
  );
  for (const key of requiredKeyList(required)) {
    if (!grantedSet.has(key)) return key;
  }
  return undefined;
}

export async function assertCapabilities(
  lms: LmsToolContext,
  required: string | string[],
  loadKeys: (ctx: LmsToolContext) => Promise<string[]> = fetchCapabilityKeys,
): Promise<void> {
  const missing = findMissingCapability(await loadKeys(lms), required);
  if (missing) {
    throw new Error(`Permission denied: missing ${missing}`);
  }
}

function isAsyncGeneratorFunction(
  fn: unknown,
): fn is (...args: never[]) => AsyncGenerator {
  return (
    typeof fn === "function" &&
    fn.constructor?.name === "AsyncGeneratorFunction"
  );
}

/** Exclude AsyncIterable so Promise overload cannot swallow generators. */
type NonStreamResult<T> = [T] extends [AsyncIterable<unknown>]
  ? never
  : T | Promise<T>;

type PermissionHandler<TInput, TResult> = (
  input: TInput,
  lms: LmsToolContext,
) => NonStreamResult<TResult>;

type PermissionGenerator<TInput, TYield> = (
  input: TInput,
  lms: LmsToolContext,
) => AsyncGenerator<TYield, void, unknown>;

type ExecuteGenerator<TInput, TYield> = (
  input: TInput,
  ctx: SessionContext,
) => AsyncGenerator<TYield, void, unknown>;

type ExecutePromise<TInput, TResult> = (
  input: TInput,
  ctx: SessionContext,
) => Promise<TResult>;

/**
 * Wrap an Eve tool `execute` so it loads capability keys (via Next cache)
 * and fails fast when the required catalog key(s) are missing.
 */
export function withPermission<TInput, TYield>(
  required: string | string[],
  handler: PermissionGenerator<TInput, TYield>,
): ExecuteGenerator<TInput, TYield>;
export function withPermission<TInput, TResult>(
  required: string | string[],
  handler: PermissionHandler<TInput, TResult>,
): ExecutePromise<TInput, TResult>;
export function withPermission<TInput, TResult>(
  required: string | string[],
  handler:
    | PermissionHandler<TInput, TResult>
    | PermissionGenerator<TInput, TResult>,
): ExecutePromise<TInput, TResult> | ExecuteGenerator<TInput, TResult> {
  if (isAsyncGeneratorFunction(handler)) {
    const execute: ExecuteGenerator<TInput, TResult> = async function* (
      input,
      ctx,
    ) {
      const lms = requireLmsContext(ctx);
      await assertCapabilities(lms, required);
      yield* (handler as PermissionGenerator<TInput, TResult>)(input, lms);
    };
    return execute;
  }

  const execute: ExecutePromise<TInput, TResult> = async (input, ctx) => {
    const lms = requireLmsContext(ctx);
    await assertCapabilities(lms, required);
    return (handler as PermissionHandler<TInput, TResult>)(input, lms) as Promise<TResult>;
  };
  return execute;
}
