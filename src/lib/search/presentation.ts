import type { ResultMode } from "@/lib/types";

export const modeLabels: Record<ResultMode, string> = {
  tests: "Tests", material_batches: "Material batches", literature_sources: "Sources",
};

export const defaultColumns: Record<ResultMode, string[]> = {
  tests: ["literature_sources.title", "material_batches.material_class", "data.compressive_strength_mpa",
    "geometries.specimen_geometry_type", "tests.test_type", "data.data_type"],
  material_batches: ["literature_sources.title", "material_batches.batch_label", "material_batches.material_class",
    "material_batches.cement_content_kg_m3", "material_batches.water_binder_ratio", "material_batches.max_aggregate_size_mm"],
  literature_sources: ["literature_sources.title", "literature_sources.authors", "literature_sources.year",
    "literature_sources.source_type", "keywords.keyword"],
};

