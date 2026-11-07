# Shared schema analysis

The search application derives its registry from the authoritative `database_hierarchy.json` and five JSON Schema draft 2020-12 record definitions. Registry generation and verification default to the sibling schema checkout. The workbook's experimental and vocabulary tabs and the supporting PDF (pp. 8–17, 18–37, 54–93) informed the analysis and the app's provisional mappings. The PNG and PowerPoint illustrate the hierarchy. [Authoritative schema repository](https://github.com/civita-network/civita-concrete-database-schema) · [Local schema commands](../README.md#authoritative-schema)

## Entities and relationships

| Category | Identifier example | Parent records in the hierarchy |
| --- | --- | --- |
| `literature_sources` | `source_id`, `SRC0001` | Root |
| `keywords` | `keyword` | Source |
| `material_batches` | `batch_id`, `BAT0001` | Source |
| `geometries` | `geometry_id`, `GEO0001` | Source |
| `printing_variables` | `printing_id`, `PRI0001` | Source |
| `reinforcement_materials` | `reinforcement_material_id`, `RMT0001` | Source |
| `reinforcement_layouts` | `reinforcement_layout_id`, `RFL0001` | Source and geometry |
| `reinforcement_components` | `reinforcement_component_id`, `REF0001` | Source, layout, and reinforcement material |
| `specimens` | `specimen_id`, `SPC0001` | Source, batch, geometry, optional printing and layout |
| `tests` | `test_id`, `TST0001` | Source and specimen |
| `devices_and_supports` | `device_id`, `DEV0001` | Test |
| `loading_histories` | `loading_id`, `LDG0001` | Test and optional device |
| `data` | `data_id`, `DAT0001` | Test and optional device |

All parent edges are many-to-one from the child. The source contains the dataset. Tests reference the material batch through the specimen, and reinforcement components link a layout to a reinforcement material. A geometry or layout can be reused, and a test can have multiple data, device, and loading records. The hierarchy gives sample ID formats. The five record schemas enforce four-digit patterns where applicable. The mock adapter validates the same prefix convention for the eight hierarchy-only IDs. The internal key combines the dataset slug, category, and local identifier, so both `SRC0001` and child identifiers may recur in different files.

## Record definitions

| JSON definition | Shape | Required fields |
| --- | --- | --- |
| `literature_sources_schema.json` | Object, 14 fields | `source_id`, `title`, `authors` |
| `keywords_schema.json` | Array of objects, 2 fields, minimum 5 rows | `source_id`, `keyword` per row |
| `material_batches_schema.json` | Object, 38 fields | `batch_id`, `source_id`, `material_class`, `cement_content_kg_m3`, `water_binder_ratio` |
| `geometry_schema.json` | Object, 4 fields | `geometry_id`, `source_id`, `specimen_geometry_type`, `geometry_file_name` |
| `specimens_schema.json` | Object, 9 fields | `specimen_id`, `source_id`, `batch_id`, `geometry_id`, `longitudinal_reinforcement`, `transverse_reinforcement`, `external_reinforcement`, `printed_specimen` |

Each record schema sets `additionalProperties: false`. The 67 record fields are strings, integers, or numbers, and none is a property-level array. Authors are a single comma-delimited string. Keywords are repeatable through the enclosing array. The workbook and PDF also describe repeat data rows and multiple observed mechanisms. Those are provisional in the prototype.

The JSON enumerates source types, peer review status, geometry types, and six binary string fields for printable, self-consolidating, and specimen flags. The search UI exposes the six binary fields as Boolean operators with their original `yes` and `no` values preserved in the records. Peer review remains a three-value enumeration. Casting date uses the exact JSON key `date_of_pouring_yyyy_mm_dd`. Its date operators require calendar-valid ISO input. The generator reads canonical mass, volume, length, and percentage units from field names, and treats water-to-binder ratio as dimensionless based on its definition. The PDF’s units policy corroborates the encoded units.

[The generated coverage inventory](schema-coverage.generated.md) lists every field, type, required status, unit, controlled option, and JSON path. [Coverage issues](schema-issues.md) distinguish the fields outside the shared JSON and how they are handled.

