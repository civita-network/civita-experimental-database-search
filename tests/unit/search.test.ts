import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import type { Condition, Group, ResultMode, SearchQuery } from "@/lib/types";
import { emptyQuery, querySchema, restoreQuery, serializeQuery } from "@/lib/search/query";
import { createMockSearchService } from "@/lib/services/mock-search";
import { executeSearch } from "@/lib/search/execute";
import { indexDataset } from "@/lib/search/relationships";

const service = createMockSearchService(resolve("mock-data"));
const c = (parameter: string, operator: Condition["operator"], value?: Condition["value"]): Condition =>
  ({ kind: "condition", parameter, operator, ...(value === undefined ? {} : { value }) });
const g = (logic: Group["logic"], ...children: Group["children"]): Group => ({ kind: "group", logic, children });
const search = (where: Group, mode: ResultMode = "tests", overrides: Partial<SearchQuery> = {}) =>
  service.search(querySchema.parse({ version: 1, mode, where, pageSize: 50, ...overrides }));
const source = c("literature_sources.source_id", "eq", "SRC0001");

describe("scientific search", () => {
  test("numeric comparison follows the specimen’s batch", async () => {
    const results = await search(g("and", source, c("material_batches.max_aggregate_size_mm", "gt", 16)));
    expect(results.rows.map((r) => r.entity.id)).toEqual(["TST0002"]);
    expect(results.rows[0].matches.map((r) => r.id)).toEqual(["SRC0001", "BAT0002"]);
  });

  test("inclusive range normalizes compatible pressure units", async () => {
    const results = await search(g("and", source, c("data.compressive_strength_mpa", "between", [40, 41.2])));
    expect(results.rows.map((r) => r.entity.id)).toEqual(["TST0003"]);
    expect(results.rows[0].values["data.compressive_strength_mpa"]).toEqual([40, 41.2]);
    expect(results.rows[0].matches.map((r) => r.id)).toEqual(["SRC0001", "DAT0005", "DAT0006"]);
  });

  test("a pressure measurement with incompatible units has no canonical value", async () => {
    const { dataset } = (await service.getDataset("fracture-program"))!;
    const copy = structuredClone(dataset);
    copy.records.data.find((record) => record.data_id === "DAT0005")!.units = "kg";
    const indexed = [indexDataset(copy)];
    const field = "data.compressive_strength_mpa";
    expect(executeSearch(indexed, { ...emptyQuery(), where: g("and", c(field, "eq", 40)) }).total).toBe(0);
    const missing = executeSearch(indexed, { ...emptyQuery(), where: g("and", c(field, "missing")) });
    expect(missing.rows[0].matches.map((match) => match.id)).toEqual(["DAT0005"]);
  });

  test("text matching is case insensitive and scoped to one keyword", async () => {
    const result = await search(g("and", c("keywords.keyword", "starts", "FRAC"), c("keywords.keyword", "contains", "ACTU")), "literature_sources");
    expect(result.rows.map((r) => r.sourceId)).toEqual(["SRC0001"]);
    expect((await search(g("and", c("keywords.keyword", "eq", "fracture"), c("keywords.keyword", "eq", "compression")))).total).toBe(0);
  });

  test("enumerations, yes/no encoding and ISO date use typed operators", async () => {
    const result = await search(g("and", c("specimens.printed_specimen", "true"), c("geometries.specimen_geometry_type", "in", ["cube", "prism"])));
    expect(result.rows.map((r) => r.entity.id)).toEqual(["TST0001", "TST0003"]);
    const dates = await search(g("and", c("material_batches.date_of_pouring_yyyy_mm_dd", "after", "2024-12-31")), "material_batches");
    expect(dates.rows.map((r) => r.sourceId)).toEqual(["SRC0003", "SRC0005"]);
  });

  test("matches missing fields on existing applicable records only", async () => {
    const missing = await search(g("and", c("tests.age_days", "missing")));
    expect(missing.rows.map((r) => r.sourceId)).toEqual(["SRC0003"]);
    expect((await search(g("and", c("printing_variables.printing_speed_mm_sec", "missing")))).total).toBe(0);
    expect((await search(g("and", c("data.compressive_strength_mpa", "missing")))).total).toBe(0);
  });

  test("nested Boolean expressions preserve a branch’s entity identity", async () => {
    const result = await search(g("and", source, g("or",
      g("and", c("material_batches.max_aggregate_size_mm", "lte", 8), c("tests.test_type", "eq", "three_point_bending_test")),
      g("and", c("material_batches.max_aggregate_size_mm", "gt", 16), c("data.compressive_strength_mpa", "gte", 70)),
    )));
    expect(result.rows.map((r) => r.entity.id)).toEqual(["TST0001", "TST0002", "TST0004"]);
    expect(result.counts).toEqual({ tests: 3, material_batches: 2, literature_sources: 1 });
  });

  test("an OR branch can match even when another category is absent", async () => {
    const result = await search(g("or", c("literature_sources.source_id", "eq", "SRC0001"), c("printing_variables.printing_speed_mm_sec", "gte", 50)));
    expect(result.rows.map((r) => r.sourceId)).toEqual(["SRC0001", "SRC0001", "SRC0001", "SRC0001", "SRC0005"]);
  });

  test("regression: unrelated batches and tests in a source never satisfy one AND", async () => {
    const where = g("and", source, c("material_batches.max_aggregate_size_mm", "lt", 12), c("tests.test_type", "eq", "axial_test"), c("data.compressive_strength_mpa", "gt", 70));
    for (const mode of ["tests", "material_batches", "literature_sources"] as const) expect((await search(where, mode)).total).toBe(0);
    expect((await search(g("and", source, c("material_batches.cement_content_kg_m3", "lt", 400),
      c("material_batches.max_aggregate_size_mm", "gt", 16)), "material_batches")).total).toBe(0);
  });

  test("AND cannot mix measurement fields from separate records on the same test", async () => {
    const result = await search(g("and", source, c("data.x_quantity_reported", "eq", "CMOD"), c("data.data_id", "eq", "DAT0002")));
    expect(result.total).toBe(0);
  });

  test("a device predicate uses the measurement’s specific device", async () => {
    const where = (type: string) => g("and", source, c("data.x_quantity_reported", "eq", "CMOD"), c("devices_and_supports.device_type", "eq", type));
    expect((await search(where("LVDT"))).total).toBe(0);
    expect((await search(where("load_cell"))).rows.map((r) => r.entity.id)).toEqual(["TST0001"]);
  });

  test("negation requires known values on one eligible record", async () => {
    const result = await search(g("and", source, c("material_batches.max_aggregate_size_mm", "gt", 16), c("material_batches.batch_label", "ne", "Mix H80")));
    expect(result.total).toBe(0);
    const unknown = await search(g("and", c("literature_sources.source_id", "eq", "SRC0003"), c("material_batches.max_aggregate_size_mm", "ne", 8)));
    expect(unknown.total).toBe(0);
    const vocabulary = await search(g("and", source, c("tests.test_type", "notIn", ["three_point_bending_test"])));
    expect(vocabulary.rows.map((r) => r.entity.id)).toEqual(["TST0002", "TST0003"]);
    const multi = await search(g("and", source, c("tests.test_id", "eq", "TST0001"),
      c("tests.main_observed_mechanisms", "ne", "fracture | crack_localization")));
    expect(multi.total).toBe(0);
  });

  test("batch and source modes include batches with no tests", async () => {
    const where = g("and", c("material_batches.batch_label", "eq", "Mix design only"));
    expect((await search(where, "material_batches")).rows.map((r) => r.entity.id)).toEqual(["BAT0003"]);
    expect((await search(where, "literature_sources")).rows.map((r) => r.sourceId)).toEqual(["SRC0005"]);
    expect((await search(where)).total).toBe(0);
  });

  test("sorting precedes pagination, selects columns, and keeps missing values last", async () => {
    const field = "data.compressive_strength_mpa";
    const other = "material_batches.water_binder_ratio";
    const result = await search(g("and"), "tests", {
      columns: [other], sort: { column: field, direction: "desc" }, pageSize: 2, page: 2,
    });
    expect(result.total).toBe(17);
    expect(result.rows.map((row) => [row.sourceId, row.entity.id])).toEqual([["SRC0006", "TST0003"], ["SRC0001", "TST0003"]]);
    expect(Object.keys(result.rows[0].values)).toEqual([other]);
    const ascending = await search(g("and"), "tests", { sort: { column: field, direction: "asc" }, pageSize: 1 });
    expect(ascending.rows[0].sourceId).toBe("SRC0006");
    expect(ascending.rows[0].values[field]).toEqual([24.5]);
  });

  test("dataset keys separate local IDs, detail preserves links, download is original JSON", async () => {
    const first = await service.getDataset("fracture-program");
    const second = await service.getDataset("fiber-flexure");
    const test = first?.entities.find((e) => e.id === "TST0001");
    expect(test?.key).not.toBe(second?.entities.find((e) => e.id === "TST0001")?.key);
    expect(test?.related.map((entity) => entity.id)).toContain("SPC0001");
    expect(JSON.parse((await service.getDatasetJson("fracture-program"))!)).toEqual(first?.dataset);
    expect(await service.getDataset("../fracture-program")).toBeUndefined();
  });
});

describe("query contract", () => {
  test("serializes and restores a versioned nested query", () => {
    const query = { ...emptyQuery(), where: g("or", source, g("and", c("literature_sources.title", "contains", "a + b / c?"))) };
    const value = new URLSearchParams(serializeQuery(query)).get("q")!;
    expect(restoreQuery(value)).toMatchObject({ success: true, data: query });
    expect(restoreQuery("invalid").success).toBe(false);
  });

  test.each([
    c("missing.column", "has"), c("tests.test_type", "eq", "unsupported"),
    c("material_batches.cement_content_kg_m3", "between", [10, 2]),
    c("material_batches.fiber_volume_fraction", "gt", 0.5),
    c("specimens.printed_specimen", "true", true),
    c("material_batches.date_of_pouring_yyyy_mm_dd", "before", "2024-02-31"),
  ])("rejects invalid field or operator input for $parameter", (condition) => {
    expect(querySchema.safeParse({ ...emptyQuery(), where: g("and", condition) }).success).toBe(false);
  });
});
