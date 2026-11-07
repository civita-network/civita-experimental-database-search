import { z } from "zod";
import type { Condition, Group, SearchQuery } from "@/lib/types";
import { operatorLabels, parameterById, unaryOperators } from "@/lib/schema/registry";

const validOperators = Object.keys(operatorLabels) as [Condition["operator"], ...Condition["operator"][]];
const modes = ["tests", "material_batches", "literature_sources"] as const;
const text = z.string().trim().min(1).max(200);
const isoDate = z.iso.date();
const value = z.union([text, z.number(), z.boolean(), z.array(z.union([text, z.number()])).min(1).max(24)]);
const condition = z.strictObject({
  kind: z.literal("condition"), parameter: z.string().max(150), operator: z.enum(validOperators), value: value.optional(),
}).superRefine(({ parameter, operator, value }, ctx) => {
  function issue(message: string) {
    ctx.addIssue({ code: "custom", message });
  }
  const field = parameterById.get(parameter);
  if (!field) return issue("Select a searchable parameter.");
  if (!field.operators.includes(operator)) return issue(`${operatorLabels[operator]} cannot be used with ${field.label}.`);
  if (unaryOperators.has(operator)) {
    if (value !== undefined) issue("This operator does not take a value.");
    return;
  }
  if (operator === "in" || operator === "notIn") {
    if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string" && field.options?.includes(entry))) {
      issue(`Select one or more available values for ${field.label}.`);
    }
    return;
  }
  const validScalar = (entry: unknown) => {
    if (field.dataType === "number") return typeof entry === "number" && Number.isFinite(entry);
    if (field.dataType === "date") return isoDate.safeParse(entry).success;
    if (field.dataType === "enum") return typeof entry === "string" && field.options?.includes(entry);
    return typeof entry === "string" && !!entry.trim();
  };
  if (operator === "between") {
    if (!Array.isArray(value) || value.length !== 2 || !value.every(validScalar)) issue(`Enter two valid endpoints for ${field.label}.`);
    else if (value[0] > value[1]) issue("The lower endpoint must precede or equal the upper endpoint.");
  } else if (!validScalar(value)) issue(`Enter a valid value for ${field.label}.`);
});

export const maxDepth = 5;
export const maxNodes = 40;

function groupSchema(depth: number): z.ZodType<Group> {
  return z.strictObject({
    kind: z.literal("group"),
    logic: z.enum(["and", "or"]),
    children: z.array(depth >= maxDepth ? condition : z.union([condition, groupSchema(depth + 1)]))
      .min(depth === 1 ? 0 : 1, "Add a condition to each group.").max(maxNodes),
  });
}

const registered = z.string().refine((id) => parameterById.has(id), "Unknown column.");
export const querySchema: z.ZodType<SearchQuery> = z.strictObject({
  version: z.literal(1), mode: z.enum(modes), where: groupSchema(1),
  columns: z.array(registered).max(16).refine((ids) => new Set(ids).size === ids.length, "Duplicate column.").optional(),
  sort: z.strictObject({
    column: z.union([z.enum(["record", "source"]), registered]),
    direction: z.enum(["asc", "desc"]),
  }).optional(),
  page: z.number().int().min(1).max(1_000_000).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
}).superRefine(({ where }, ctx) => {
  if (nodeCount(where) > maxNodes) ctx.addIssue({ code: "custom", message: `Use at most ${maxNodes} query nodes.` });
});

export function nodeCount(node: Group | Condition): number {
  return node.kind === "condition" ? 1 : 1 + node.children.reduce((count, child) => count + nodeCount(child), 0);
}

export function emptyQuery(): SearchQuery {
  return { version: 1, mode: "tests", where: { kind: "group", logic: "and", children: [] }, pageSize: 10 };
}

export function serializeQuery(query: SearchQuery) {
  return new URLSearchParams({ q: JSON.stringify(query) }).toString();
}

export function restoreQuery(value: string) {
  try {
    return querySchema.safeParse(JSON.parse(value));
  } catch {
    return querySchema.safeParse(null);
  }
}

