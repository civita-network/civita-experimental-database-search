import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const appRoot = fileURLToPath(new URL("../", import.meta.url));

/** @param {string} [reference] */
export function resolveSchemaDirectory(reference) {
  return resolve(reference ?? (process.env.CIVITA_SCHEMA_DIR || resolve(appRoot, "../civita-concrete-database-schema")));
}
