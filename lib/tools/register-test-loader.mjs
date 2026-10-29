import { register } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.join(fileURLToPath(new URL(".", import.meta.url)), "../..");

const hook = `
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = ${JSON.stringify(projectRoot)};

async function resolveWithSuffixes(specifier, context, nextResolve) {
  for (const suffix of ["", ".ts", ".tsx", ".mjs", "/index.ts"]) {
    try {
      return await nextResolve(specifier + suffix, context);
    } catch (error) {
      if (
        error?.code !== "ERR_MODULE_NOT_FOUND" &&
        error?.code !== "ERR_UNSUPPORTED_DIR_IMPORT"
      ) {
        throw error;
      }
    }
  }
  return nextResolve(specifier, context);
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = pathToFileURL(path.join(root, specifier.slice(2))).href;
    return resolveWithSuffixes(base, context, nextResolve);
  }
  const ext = path.extname(specifier);
  const hasModuleExt = [".ts", ".tsx", ".mjs", ".js", ".cjs", ".json"].includes(
    ext,
  );
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !hasModuleExt
  ) {
    const parent = fileURLToPath(context.parentURL);
    const base = pathToFileURL(path.resolve(path.dirname(parent), specifier)).href;
    return resolveWithSuffixes(base, context, nextResolve);
  }
  return nextResolve(specifier, context);
}
`;

register(`data:text/javascript,${encodeURIComponent(hook)}`, import.meta.url);
