import generated from "./registry.generated.json";
import { provisionalParameters } from "./provisional";
import type { Category, SearchOperator, SearchParameter } from "@/lib/types";

export const categories: Category[] = generated.categories;
export const parameters: SearchParameter[] = [
  ...generated.parameters as SearchParameter[],
  ...provisionalParameters.filter((field) => !generated.parameters.some((entry) => entry.id === field.id)),
];

export const categoryById = new Map(categories.map((category) => [category.id, category]));
export const parameterById = new Map(parameters.map((parameter) => [parameter.id, parameter]));

export const operatorLabels: Record<SearchOperator, string> = {
  eq: "Equals", ne: "Not equal", gt: "Greater than", gte: "Greater than or equal",
  lt: "Less than", lte: "Less than or equal", between: "Between", has: "Has value",
  missing: "Missing value", contains: "Contains", starts: "Starts with",
  in: "Is one of", notIn: "Is not one of", true: "True", false: "False", before: "Before", after: "After",
};

export const unaryOperators = new Set<SearchOperator>(["true", "false", "has", "missing"]);

export function displayValue(value: string | number | boolean) {
  return typeof value === "string" ? value.replace(/_/g, " ") : String(value);
}

