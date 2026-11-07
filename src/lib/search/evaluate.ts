import type { Group, Condition } from "@/lib/types";
import { parameterById } from "@/lib/schema/registry";
import { matchesCondition } from "./values";
import type { Entity, Scope } from "./relationships";

interface Witness {
  bindings: Map<string, Entity>;
  matches: Set<Entity>;
}

function combine(left: Witness, right: Witness): Witness | undefined {
  const bindings = new Map(left.bindings);
  for (const [category, entity] of right.bindings) {
    if (bindings.has(category) && bindings.get(category) !== entity) return;
    bindings.set(category, entity);
  }
  const matches = new Set([...left.matches, ...right.matches]);
  if ([...matches].some((entity) => entity.category === "devices_and_supports")) {
    for (const category of ["data", "loading_histories"]) {
      const entity = bindings.get(category);
      if (entity && entity.lineage.get("devices_and_supports") !== bindings.get("devices_and_supports")) return;
    }
  }
  return { bindings, matches };
}

function distinct(witnesses: Witness[]) {
  const unique = new Map<string, Witness>();
  for (const witness of witnesses) {
    const key = JSON.stringify([[...witness.bindings.values()].map((entity) => entity.key).sort(),
      [...witness.matches].map((entity) => entity.key).sort()]);
    unique.set(key, witness);
  }
  return [...unique.values()];
}

export function evaluate(scope: Scope, query: Group | Condition): Witness[] {
  if (query.kind === "condition") {
    const parameter = parameterById.get(query.parameter);
    if (!parameter) return [];
    return (scope.get(parameter.category) ?? [])
      .filter((entity) => matchesCondition(entity.fields, parameter, query))
      .map((entity) => ({ bindings: entity.lineage, matches: new Set([entity]) }));
  }
  if (!query.children.length) return [{ bindings: new Map(), matches: new Set() }];
  if (query.logic === "or") return distinct(query.children.flatMap((child) => evaluate(scope, child)));
  let compatible = evaluate(scope, query.children[0]);
  for (const child of query.children.slice(1)) {
    if (!compatible.length) break;
    const right = evaluate(scope, child);
    compatible = distinct(compatible.flatMap((left) => right.flatMap((entry) => combine(left, entry) ?? [])));
  }
  return compatible;
}

