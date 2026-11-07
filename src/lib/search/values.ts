import type { Condition, EntityFields, Scalar, SearchParameter } from "@/lib/types";

const pressureToMPa = new Map([["MPa", 1], ["Pa", 0.000001], ["kPa", 0.001], ["GPa", 1000], ["N/mm²", 1], ["N/mm^2", 1]]);

export function appliesTo(record: EntityFields, parameter: SearchParameter) {
  if (parameter.source.kind === "derived" && parameter.fieldName === "compressive_strength_mpa" &&
      record.quantity_reported !== "compressive_strength") return false;
  return !parameter.applicableTo || (typeof record.data_type === "string" && parameter.applicableTo.includes(record.data_type));
}

export function valuesFor(record: EntityFields, parameter: SearchParameter): Scalar[] {
  if (!appliesTo(record, parameter)) return [];
  if (parameter.source.kind === "derived" && parameter.fieldName === "compressive_strength_mpa") {
    const { units, quantity_reported_mean: mean } = record;
    const factor = typeof units === "string" ? pressureToMPa.get(units.trim()) : undefined;
    if (typeof mean !== "number" || factor === undefined) return [];
    const normalized = mean * factor;
    return Number.isFinite(normalized) ? [Number(normalized.toPrecision(15))] : [];
  }
  const raw = record[parameter.fieldName];
  const entries: unknown[] = parameter.multiple && Array.isArray(raw) ? raw : [raw];
  return entries.filter((entry): entry is Scalar => {
    switch (parameter.dataType) {
      case "number": return typeof entry === "number" && Number.isFinite(entry);
      case "boolean": return parameter.encoding === "yes-no" ? entry === "yes" || entry === "no" : typeof entry === "boolean";
      case "enum": return typeof entry === "string" && !!parameter.options?.includes(entry);
      default: return typeof entry === "string" && !!entry.trim();
    }
  });
}

export function matchesCondition(record: EntityFields, parameter: SearchParameter, condition: Condition) {
  if (!appliesTo(record, parameter)) return false;
  const { operator, value } = condition;
  const values = valuesFor(record, parameter);
  if (operator === "missing") return values.length === 0;
  if (operator === "has") return values.length > 0;
  if (!values.length) return false;

  const normalize = (entry: Scalar | undefined) => typeof entry === "string" && parameter.dataType === "text"
    ? entry.trim().toLowerCase() : entry;
  const expected = Array.isArray(value) ? value : [];
  const lower = expected[0];
  const upper = expected[1];
  if (operator === "ne") return values.every((entry) => normalize(entry) !== normalize(Array.isArray(value) ? undefined : value));
  if (operator === "notIn") return values.every((entry) => !expected.includes(entry as string | number));

  return values.some((entry) => {
    const actual = normalize(entry);
    const target = normalize(Array.isArray(value) ? undefined : value);
    switch (operator) {
      case "true": return actual === (parameter.encoding === "yes-no" ? "yes" : true);
      case "false": return actual === (parameter.encoding === "yes-no" ? "no" : false);
      case "eq": return actual === target;
      case "contains": return String(actual).includes(String(target));
      case "starts": return String(actual).startsWith(String(target));
      case "in": return expected.includes(entry as string | number);
      case "gt": case "after": return entry > (target as string | number);
      case "gte": return entry >= (target as string | number);
      case "lt": case "before": return entry < (target as string | number);
      case "lte": return entry <= (target as string | number);
      case "between": return entry >= lower && entry <= upper;
      default: return false;
    }
  });
}

