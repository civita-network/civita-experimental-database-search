import { parameterById } from "@/lib/schema/registry";
import type { EntityRef, ResultMode, Scalar, SearchQuery, SearchResults, SearchRow } from "@/lib/types";
import { evaluate } from "./evaluate";
import { defaultColumns } from "./presentation";
import type { IndexedDataset } from "./relationships";
import { valuesFor } from "./values";

const modes = ["tests", "material_batches", "literature_sources"] as const;
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const ref = ({ key, id, category }: EntityRef) => ({ key, id, category });
const compare = (a: Scalar, b: Scalar) => typeof a === "number" && typeof b === "number" ? a - b : collator.compare(String(a), String(b));

function compareLists(a: Scalar[], b: Scalar[], direction: "asc" | "desc") {
  if (!a.length || !b.length) return Number(!a.length) - Number(!b.length);
  for (let index = 0; index < Math.min(a.length, b.length); index++) {
    const compared = compare(a[index], b[index]);
    if (compared) return compared * (direction === "asc" ? 1 : -1);
  }
  return (a.length - b.length) * (direction === "asc" ? 1 : -1);
}

export function executeSearch(datasets: IndexedDataset[], query: SearchQuery): SearchResults {
  const columns = query.columns ?? defaultColumns[query.mode];
  const { column, direction } = query.sort ?? { column: "source", direction: "asc" };
  const fields = [...new Set([...columns, column])].flatMap((id) => parameterById.get(id) ?? []);
  const matching: Record<ResultMode, Set<string>> = {
    tests: new Set(), material_batches: new Set(), literature_sources: new Set(),
  };
  const results = new Map<string, SearchRow>();
  for (const { dataset, sourceId, scopes } of datasets) {
    for (const scope of scopes) {
      const witnesses = evaluate(scope, query.where);
      if (!witnesses.length) continue;
      for (const mode of modes) for (const entity of scope.get(mode) ?? []) matching[mode].add(entity.key);
      const [entity] = scope.get(query.mode) ?? [];
      if (!entity) continue;
      const row = results.get(entity.key) ?? {
        datasetId: dataset.dataset_id, sourceId, entity: ref(entity), matches: [], values: {},
      };
      for (const match of new Set(witnesses.flatMap((witness) => [...witness.matches]))) {
        if (!row.matches.some((entry) => entry.key === match.key)) row.matches.push(ref(match));
      }
      for (const field of fields) {
        const values = (scope.get(field.category) ?? []).flatMap((record) => valuesFor(record.fields, field));
        row.values[field.id] = [...new Set([...row.values[field.id] ?? [], ...values])].sort(compare);
      }
      results.set(entity.key, row);
    }
  }
  const sortable = (row: SearchRow) => column === "source" ? [row.sourceId] : column === "record" ? [row.entity.id] : row.values[column] ?? [];
  const sorted = [...results.values()].sort((a, b) => compareLists(sortable(a), sortable(b), direction)
    || collator.compare(a.entity.key, b.entity.key));
  const pageSize = query.pageSize ?? 10;
  const page = Math.min(query.page ?? 1, Math.max(1, Math.ceil(sorted.length / pageSize)));
  const rows = sorted.slice((page - 1) * pageSize, page * pageSize);
  for (const row of rows) {
    if (!columns.includes(column)) delete row.values[column];
  }
  return {
    rows, total: sorted.length, page, pageSize, columns,
    counts: { tests: matching.tests.size, material_batches: matching.material_batches.size, literature_sources: matching.literature_sources.size },
  };
}

