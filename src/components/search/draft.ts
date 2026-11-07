import { categoryById, displayValue, operatorLabels, parameterById, unaryOperators } from "@/lib/schema/registry";
import type { Condition, Group } from "@/lib/types";

export type DraftCondition = Omit<Condition, "value"> & { id: string; category: string; value: string | string[] };
export type DraftGroup = Omit<Group, "children"> & { id: string; children: DraftNode[] };
export type DraftNode = DraftGroup | DraftCondition;

export function newCondition(id: string, parameter?: string): DraftCondition {
  const field = parameter ? parameterById.get(parameter) : undefined;
  return { id, kind: "condition", category: field?.category ?? "", parameter: field?.id ?? "",
    operator: field?.operators[0] ?? "eq", value: "" };
}

export function toDraft(group: Group, id = "root"): DraftGroup {
  return {
    ...group, id, children: group.children.map((child, index) => {
      const childId = `${id}.${index}`;
      return child.kind === "group" ? toDraft(child, childId) : {
        ...child, id: childId, category: parameterById.get(child.parameter)?.category ?? "",
        value: Array.isArray(child.value) ? child.value.map(String) : String(child.value ?? ""),
      };
    }),
  };
}

export function toGroup(draft: DraftGroup): Group {
  return { kind: "group", logic: draft.logic, children: draft.children.map((child) => {
    if (child.kind === "group") return toGroup(child);
    const { parameter, operator, value } = child;
    const condition: Condition = { kind: "condition", parameter, operator };
    if (unaryOperators.has(operator)) return condition;
    if (parameterById.get(parameter)?.dataType === "number") {
      if (Array.isArray(value)) condition.value = value.map((entry) => entry.trim() ? Number(entry) : NaN);
      else if (value.trim()) condition.value = Number(value);
    } else if (value !== "") condition.value = value;
    return condition;
  }) };
}

export function summarize(node: DraftNode): string {
  if (node.kind === "group") return node.children.length
    ? `(${node.children.map(summarize).join(node.logic === "and" ? " AND " : " OR ")})`
    : "All records";
  const field = parameterById.get(node.parameter);
  if (!field) return "Choose a parameter";
  const value = Array.isArray(node.value) ? node.value.filter(Boolean).map(displayValue).join(node.operator === "between" ? " to " : ", ")
    : field.dataType === "enum" ? displayValue(node.value) : node.value;
  return `${categoryById.get(field.category)?.label} › ${field.label} ${operatorLabels[node.operator].toLowerCase()}${value ? ` ${value}${field.unit ? ` ${field.unit}` : ""}` : ""}`;
}

export function draftCount(node: DraftNode): number {
  return node.kind === "condition" ? 1 : 1 + node.children.reduce((sum, child) => sum + draftCount(child), 0);
}

