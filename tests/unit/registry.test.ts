import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { expect, test } from "vitest";
import { categories, parameterById, parameters } from "@/lib/schema/registry";
import type { Dataset } from "@/lib/types";
import { indexDataset } from "@/lib/search/relationships";

const reference = resolve(process.env.CIVITA_SCHEMA_DIR || "reference");
const json = (file: string) => JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const hasSchemas = existsSync(resolve(reference, "specimens_schema.json"));

test("registered fields retain exact names, provenance and compatible operators", () => {
  expect(new Set(parameters.map((p) => p.id)).size).toBe(parameters.length);
  expect(categories).toHaveLength(13);
  for (const parameter of parameters) {
    expect(parameter.id).toBe(`${parameter.category}.${parameter.fieldName}`);
    expect(parameter.source.path).toBeTruthy();
    expect(parameter.operators.length).toBeGreaterThan(0);
  }
  expect(parameterById.get("literature_sources.peer_reviewed")?.options).toEqual(["yes", "no", "unknown"]);
  expect(parameterById.get("geometries.geometry_file_name")?.source.path).toBe("#/properties/geometry_file_name");
  expect(parameterById.get("material_batches.max_aggregate_size_mm")?.unit).toBe("mm");
});

test.skipIf(!hasSchemas)("generated artifacts match the actual shared JSON and contain each record field", () => {
  expect(execFileSync(process.execPath, ["scripts/generate-parameter-registry.mjs", "--reference", reference, "--check"], { encoding: "utf8" })).toContain("Verified");
  const authoritative = parameters.filter((parameter) => parameter.source.kind === "schema");
  let fields = 0;
  for (const { id, schemaFile } of categories) {
    if (!schemaFile) continue;
    const schema = json(resolve(reference, schemaFile));
    const record = schema.type === "array" ? schema.items : schema;
    for (const key of Object.keys(record.properties)) {
      expect(parameterById.get(`${id}.${key}`)?.source.file).toBe(schemaFile);
      fields++;
    }
  }
  expect(authoritative.length).toBe(fields);
});

test.skipIf(!hasSchemas)("every synthetic record passes its authoritative schema and links resolve", () => {
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  const validators = categories.flatMap(({ id, schemaFile }) => {
    if (!schemaFile) return [];
    const schema = json(resolve(reference, schemaFile));
    return [{ id, array: schema.type === "array", validate: ajv.compile(schema) }];
  });
  for (const name of readdirSync("mock-data").filter((file) => file.endsWith(".json"))) {
    const dataset: Dataset = json(resolve("mock-data", name));
    expect(() => indexDataset(dataset)).not.toThrow();
    for (const { id, array, validate } of validators) {
      const records = dataset.records[id] ?? [];
      for (const value of array ? [records] : records) {
        expect(validate(value), `${name}: ${id} ${JSON.stringify(validate.errors)}`).toBe(true);
      }
    }
  }
});
