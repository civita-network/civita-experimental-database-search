import { categories, categoryById } from "@/lib/schema/registry";
import type { Dataset, DatasetDetail, EntityFields, EntityRef } from "@/lib/types";

export interface Entity extends EntityRef {
  fields: EntityFields;
  parents: Entity[];
  lineage: Map<string, Entity>;
}

export type Scope = Map<string, Entity[]>;

const scopeOrder = ["tests", "specimens", "material_batches", "reinforcement_components", "reinforcement_layouts"];
const pathCategories = [...scopeOrder, ...categories.map((category) => category.id).filter((id) => !scopeOrder.includes(id))];
const testChildren = new Set(["devices_and_supports", "loading_histories", "data"]);

function ref(entity: Entity): EntityRef {
  return { key: entity.key, category: entity.category, id: entity.id };
}

export function indexDataset(dataset: Dataset) {
  const sourceId = dataset.records.literature_sources?.[0]?.source_id;
  if (typeof sourceId !== "string" || dataset.records.literature_sources.length !== 1) {
    throw new Error(`Expected one source in ${dataset.dataset_id}.`);
  }
  const entities = new Map<string, Entity>();
  const children = new Map<string, Entity[]>();
  const byCategory = new Map<string, Entity[]>();
  const keyFor = (category: string, id: string) => [dataset.dataset_id, category, id].map(encodeURIComponent).join(":");
  for (const [category, records] of Object.entries(dataset.records)) {
    const definition = categoryById.get(category);
    if (!definition) throw new Error(`Unrecognized category ${category}.`);
    for (const fields of records) {
      const id = fields[definition.identifier];
      if (typeof id !== "string" || !id.trim()) throw new Error(`Missing ${definition.identifier} in ${dataset.dataset_id}.`);
      if (definition.example && !new RegExp(`^${definition.example.replace(/\d+$/, "")}[0-9]{4}$`).test(id)) {
        throw new Error(`Invalid ${definition.identifier} ${id}.`);
      }
      if ("source_id" in fields && fields.source_id !== sourceId) throw new Error(`Mismatched source for ${id}.`);
      const key = keyFor(category, id);
      if (entities.has(key)) throw new Error(`Duplicate identifier ${key}.`);
      const entity = { key, category, id, fields, parents: [], lineage: new Map() };
      entities.set(key, entity);
      const entries = byCategory.get(category) ?? [];
      entries.push(entity);
      byCategory.set(category, entries);
    }
  }
  for (const id of Object.keys(dataset.specimen_links ?? {})) {
    if (!entities.has(keyFor("specimens", id))) throw new Error(`Unknown specimen ${id} in specimen_links.`);
  }
  for (const entity of entities.values()) {
    for (const { field, category, optional } of categoryById.get(entity.category)!.parents) {
      const links = entity.category === "specimens" ? dataset.specimen_links?.[entity.id] : undefined;
      const id = entity.fields[field] ?? (links as EntityFields | undefined)?.[field];
      if (id == null && optional) continue;
      const parent = typeof id === "string" ? entities.get(keyFor(category, id)) : undefined;
      if (!parent) throw new Error(`Invalid reference from ${entity.key} via ${field}.`);
      entity.parents.push(parent);
      const related = children.get(parent.key) ?? [];
      related.push(entity);
      children.set(parent.key, related);
    }
  }
  function lineage(entity: Entity, visiting: Set<string>): Map<string, Entity> {
    if (entity.lineage.size) return entity.lineage;
    if (visiting.has(entity.key)) throw new Error(`Cyclic relationship at ${entity.key}.`);
    visiting.add(entity.key);
    const bindings = new Map([[entity.category, entity]]);
    for (const parent of entity.parents) {
      for (const [category, ancestor] of lineage(parent, visiting)) {
        if (bindings.has(category) && bindings.get(category) !== ancestor) {
          throw new Error(`Conflicting ${category} references for ${entity.key}.`);
        }
        bindings.set(category, ancestor);
      }
    }
    visiting.delete(entity.key);
    entity.lineage = bindings;
    return bindings;
  }
  for (const entity of entities.values()) lineage(entity, new Set());

  const keywords = byCategory.get("keywords") ?? [];
  const scopes: Scope[] = [];
  const covered = new Set<string>();
  function addScope(anchor: Entity) {
    const scope: Scope = new Map();
    function include(entity: Entity) {
      for (const ancestor of entity.lineage.values()) {
        const entries = scope.get(ancestor.category) ?? [];
        if (!entries.includes(ancestor)) entries.push(ancestor);
        scope.set(ancestor.category, entries);
        covered.add(ancestor.key);
      }
    }
    include(anchor);
    for (const keyword of keywords) include(keyword);
    const test = scope.get("tests")?.[0];
    if (test) for (const child of children.get(test.key) ?? []) if (testChildren.has(child.category)) include(child);
    const layout = scope.get("reinforcement_layouts")?.[0];
    if (layout) {
      for (const child of children.get(layout.key) ?? []) if (child.category === "reinforcement_components") include(child);
    }
    scopes.push(scope);
  }
  for (const category of pathCategories) {
    for (const entity of byCategory.get(category) ?? []) {
      if (!covered.has(entity.key)) addScope(entity);
    }
  }

  function detail(): DatasetDetail {
    return {
      dataset,
      entities: [...entities.values()].map((entity) => ({
        ...ref(entity), fields: entity.fields,
        related: [...new Set([...entity.parents, ...children.get(entity.key) ?? []])].map(ref),
      })),
    };
  }
  return { dataset, sourceId, scopes, detail };
}

export type IndexedDataset = ReturnType<typeof indexDataset>;

