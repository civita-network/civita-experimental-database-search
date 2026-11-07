import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { appRoot, resolveSchemaDirectory } from "./schema-directory.mjs";

const args = process.argv.slice(2);
const refIndex = args.indexOf("--reference");
const reference = refIndex >= 0 ? args[refIndex + 1] : undefined;
if (refIndex >= 0 && (!reference || reference.startsWith("--"))) throw new Error("--reference needs a directory path.");
const directory = resolveSchemaDirectory(reference);
const check = args.includes("--check");
const readJson = async (file) => JSON.parse((await readFile(resolve(directory, file), "utf8")).replace(/^\uFEFF/, ""));
const operatorSets = {
  number: ["eq", "ne", "gt", "gte", "lt", "lte", "between", "has", "missing"],
  text: ["eq", "ne", "contains", "starts", "has", "missing"],
  enum: ["eq", "in", "notIn", "has", "missing"],
  boolean: ["true", "false", "missing"],
  date: ["eq", "before", "after", "between", "missing"],
};
const labels = {
  literature_sources: "Literature sources", keywords: "Keywords", material_batches: "Material batches",
  geometries: "Geometries", specimens: "Specimens", tests: "Tests", data: "Data",
  reinforcement_materials: "Reinforcement materials", reinforcement_components: "Reinforcement components",
  reinforcement_layouts: "Reinforcement layouts", printing_variables: "Printing variables",
  devices_and_supports: "Devices and supports", loading_histories: "Loading histories",
  max_aggregate_size_mm: "Maximum aggregate size", cement_content_kg_m3: "Cement content",
  specimen_geometry_type: "Geometry type", date_of_pouring_yyyy_mm_dd: "Date of pouring",
  doi: "DOI", url: "URL", data_type: "Data type",
};
const title = (name) => name.replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase()).replace(/ id$/, " ID");
const unitFor = (name) => {
  if (name === "air_content_percent_volume_concrete") return "%";
  if (name === "water_binder_ratio") return "dimensionless";
  return [["_kg_m3", "kg/m³"], ["_ml_m3", "mL/m³"], ["_mm", "mm"]].find(([suffix]) => name.endsWith(suffix))?.[1];
};
const setupHint = "Clone civita-concrete-database-schema beside the application or specify its location with --reference or CIVITA_SCHEMA_DIR.";
const entries = await readdir(directory).catch((error) => {
  throw new Error(`Cannot read the authoritative schema directory at ${directory} (${error.code}). ${setupHint}`);
});
const files = entries.filter((name) => name.endsWith(".json")).sort();
const hierarchyFile = files.find((name) => /^database[-_]hierarchy\.json$/.test(name));
if (!hierarchyFile) throw new Error(`No database hierarchy JSON in ${directory}. ${setupHint}`);
const { database_hierarchy: hierarchy } = await readJson(hierarchyFile);
const categories = Object.entries(hierarchy).map(([id, entry]) => {
  const parents = (entry.parents ?? (entry.parent ? [entry.parent] : [])).map((parent) => {
    const category = parent === "source" ? "literature_sources" : parent;
    if (!hierarchy[category]) throw new Error(`Unknown parent ${category} of ${id}`);
    return {
      category, field: hierarchy[category].identifier,
      optional: (typeof entry.relationship === "string" ? entry.relationship : entry.relationship?.[parent]) === "many_to_one_optional",
    };
  });
  return { id, label: labels[id] ?? title(id), identifier: entry.identifier, example: entry.format, description: entry.description, parents };
});
const aliases = { geometry: "geometries" };
const parameters = [];
const unindexed = [];
const byCategory = new Map();
for (const file of files.filter((name) => name !== hierarchyFile)) {
  const schema = await readJson(file);
  const stem = file.replace(/_schema\.json$/, "");
  const category = aliases[stem] ?? stem;
  const record = schema.type === "array" ? schema.items : schema;
  const basePath = schema.type === "array" ? "#/items/properties" : "#/properties";
  if (!hierarchy[category] || !record?.properties) {
    unindexed.push([file, "#", "No recognized entity or record properties"]);
    continue;
  }
  byCategory.set(category, file);
  for (const [fieldName, definition] of Object.entries(record.properties)) {
    const path = `${basePath}/${fieldName.replace(/~/g, "~0").replace(/\//g, "~1")}`;
    const multiple = definition.type === "array";
    const scalar = multiple ? definition.items ?? {} : definition;
    const options = scalar.enum;
    const yesNo = scalar.type === "string" && options?.length === 2 && ["yes", "no"].every((option) => options.includes(option));
    const dataType = yesNo || scalar.type === "boolean" ? "boolean"
      : scalar.type === "string" && options?.every((option) => typeof option === "string") ? "enum"
      : scalar.type === "string" && (scalar.format === "date" || fieldName.endsWith("_yyyy_mm_dd")) ? "date"
      : scalar.type === "string" ? "text"
      : ["integer", "number"].includes(scalar.type) ? "number" : undefined;
    if (!dataType || (options && !["enum", "boolean"].includes(dataType))) {
      unindexed.push([file, path, "Requires a structured or typed vocabulary mapping"]);
      continue;
    }
    const presenceOnly = fieldName === "fiber_volume_fraction";
    parameters.push({
      id: `${category}.${fieldName}`, category, entityType: category, fieldName,
      label: labels[fieldName] ?? title(fieldName.replace(/_(kg_m3|ml_m3|mm)$/, "")),
      description: definition.description ?? (presenceOnly ? "Reported fraction. The JSON field does not identify decimal or percent notation." : undefined),
      dataType, schemaType: definition.type, required: record.required?.includes(fieldName) ?? false,
      multiple, unit: unitFor(fieldName), operators: presenceOnly ? ["has", "missing"] : operatorSets[dataType],
      options, encoding: yesNo ? "yes-no" : undefined,
      source: { file, path, kind: "schema" },
    });
  }
}
for (const category of categories) {
  if (parameters.some((parameter) => parameter.id === `${category.id}.${category.identifier}`)) continue;
  parameters.push({
    id: `${category.id}.${category.identifier}`, category: category.id, entityType: category.id, fieldName: category.identifier,
    label: title(category.identifier), description: `Local identifier. Example ${category.example ?? category.identifier}.`,
    dataType: "text", required: true, multiple: false, operators: operatorSets.text,
    source: { file: hierarchyFile, path: `#/database_hierarchy/${category.id}/identifier`, kind: "hierarchy" },
  });
}
const registry = {
  generated: "Derived from the shared JSON by scripts/generate-parameter-registry.mjs",
  categories: categories.map((category) => ({ ...category, schemaFile: byCategory.get(category.id) })),
  parameters,
};
const report = [
  "# Generated JSON coverage", "",
  "Regenerate this inventory with `npm run schema:generate`.",
  "The [schema issues](schema-issues.md) list the workbook-only fields and provisional search fields.", "",
  `Indexed **${parameters.filter((p) => p.source.kind === "schema").length} record-schema fields** and **${parameters.filter((p) => p.source.kind === "hierarchy").length} hierarchy-only identifiers**.`, "",
];
for (const category of registry.categories) {
  report.push(`## ${category.label}`, "", category.schemaFile ? `Record schema \`${category.schemaFile}\`.` : "Hierarchy coverage only.", "",
    "| Field | Search type | Required | Unit | Handling | JSON path |",
    "| --- | --- | --- | --- | --- | --- |");
  for (const p of parameters.filter((p) => p.category === category.id)) {
    const handling = [
      p.options?.map((value) => `\`${value.replace(/\|/g, "\\|")}\``).join(", "),
      p.encoding === "yes-no" ? "Stored as strings" : undefined,
      p.multiple ? "Array" : undefined,
      p.operators.length === 2 ? "Presence only" : undefined,
    ].filter(Boolean).join(". ");
    report.push(`| \`${p.fieldName}\` | ${p.dataType} | ${p.required ? "Yes" : "No"} | ${p.unit ?? "—"} | ${handling || "—"} | \`${p.source.path}\` |`);
  }
  report.push("");
}
if (unindexed.length) {
  report.push("## JSON definitions requiring a mapping", "", ...unindexed.map((item) => `- ${item.join(" · ")}`), "");
}
async function output(path, content) {
  const target = resolve(appRoot, path);
  if (check) {
    if ((await readFile(target, "utf8")).replace(/\r\n/g, "\n") !== content) throw new Error(`${path} is stale. Run npm run schema:generate.`);
    return;
  }
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content);
}
await output("src/lib/schema/registry.generated.json", JSON.stringify(registry, null, 2) + "\n");
await output("docs/schema-coverage.generated.md", report.join("\n"));
console.log(`${check ? "Verified" : "Generated"} ${parameters.length} JSON-derived search parameters in ${categories.length} categories.`);

