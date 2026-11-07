# Generated JSON coverage

Regenerate this inventory with `npm run schema:generate`.
The [schema issues](schema-issues.md) list the workbook-only fields and provisional search fields.

Indexed **67 record-schema fields** and **8 hierarchy-only identifiers**.

## Literature sources

Record schema `literature_sources_schema.json`.

| Field | Search type | Required | Unit | Handling | JSON path |
| --- | --- | --- | --- | --- | --- |
| `source_id` | text | Yes | — | — | `#/properties/source_id` |
| `source_type` | enum | No | — | `journal_article`, `conference_paper`, `book_chapter`, `phd_thesis`, `report`, `dataset`, `other` | `#/properties/source_type` |
| `peer_reviewed` | enum | No | — | `yes`, `no`, `unknown` | `#/properties/peer_reviewed` |
| `title` | text | Yes | — | — | `#/properties/title` |
| `authors` | text | Yes | — | — | `#/properties/authors` |
| `year` | number | No | — | — | `#/properties/year` |
| `journal_or_publisher` | text | No | — | — | `#/properties/journal_or_publisher` |
| `volume` | text | No | — | — | `#/properties/volume` |
| `issue` | text | No | — | — | `#/properties/issue` |
| `pages` | text | No | — | — | `#/properties/pages` |
| `doi` | text | No | — | — | `#/properties/doi` |
| `url` | text | No | — | — | `#/properties/url` |
| `institution` | text | No | — | — | `#/properties/institution` |
| `notes` | text | No | — | — | `#/properties/notes` |

## Keywords

Record schema `keywords_schema.json`.

| Field | Search type | Required | Unit | Handling | JSON path |
| --- | --- | --- | --- | --- | --- |
| `source_id` | text | Yes | — | — | `#/items/properties/source_id` |
| `keyword` | text | Yes | — | — | `#/items/properties/keyword` |

## Material batches

Record schema `material_batches_schema.json`.

| Field | Search type | Required | Unit | Handling | JSON path |
| --- | --- | --- | --- | --- | --- |
| `batch_id` | text | Yes | — | — | `#/properties/batch_id` |
| `source_id` | text | Yes | — | — | `#/properties/source_id` |
| `mixing_protocol_file_name` | text | No | — | — | `#/properties/mixing_protocol_file_name` |
| `batch_label` | text | No | — | — | `#/properties/batch_label` |
| `material_class` | text | Yes | — | — | `#/properties/material_class` |
| `cement_type` | text | No | — | — | `#/properties/cement_type` |
| `printable` | boolean | No | — | `yes`, `no`. Stored as strings | `#/properties/printable` |
| `self_consolidating` | boolean | No | — | `yes`, `no`. Stored as strings | `#/properties/self_consolidating` |
| `cement_content_kg_m3` | number | Yes | kg/m³ | — | `#/properties/cement_content_kg_m3` |
| `water_binder_ratio` | number | Yes | dimensionless | — | `#/properties/water_binder_ratio` |
| `silica_fume_content_kg_m3` | number | No | kg/m³ | — | `#/properties/silica_fume_content_kg_m3` |
| `fly_ash_content_kg_m3` | number | No | kg/m³ | — | `#/properties/fly_ash_content_kg_m3` |
| `fly_ash_class` | text | No | — | — | `#/properties/fly_ash_class` |
| `slag_content_kg_m3` | number | No | kg/m³ | — | `#/properties/slag_content_kg_m3` |
| `fine_aggregate_content_kg_m3` | number | No | kg/m³ | — | `#/properties/fine_aggregate_content_kg_m3` |
| `fine_aggregate_dry_density_kg_m3` | number | No | kg/m³ | — | `#/properties/fine_aggregate_dry_density_kg_m3` |
| `coarse_aggregate_content_kg_m3` | number | No | kg/m³ | — | `#/properties/coarse_aggregate_content_kg_m3` |
| `coarse_aggregate_dry_density_kg_m3` | number | No | kg/m³ | — | `#/properties/coarse_aggregate_dry_density_kg_m3` |
| `max_aggregate_size_mm` | number | No | mm | — | `#/properties/max_aggregate_size_mm` |
| `aggregate_type` | text | No | — | — | `#/properties/aggregate_type` |
| `superplasticizer_type` | text | No | — | — | `#/properties/superplasticizer_type` |
| `superplasticizer_content_kg_m3` | number | No | kg/m³ | — | `#/properties/superplasticizer_content_kg_m3` |
| `water_reducer_type` | text | No | — | — | `#/properties/water_reducer_type` |
| `water_reducer_content_ml_m3` | number | No | mL/m³ | — | `#/properties/water_reducer_content_ml_m3` |
| `air_entrainment_type` | text | No | — | — | `#/properties/air_entrainment_type` |
| `air_entrainment_content_ml_m3` | number | No | mL/m³ | — | `#/properties/air_entrainment_content_ml_m3` |
| `rheology_modifier_type` | text | No | — | — | `#/properties/rheology_modifier_type` |
| `rheology_modifier_content_kg_m3` | number | No | kg/m³ | — | `#/properties/rheology_modifier_content_kg_m3` |
| `hydration_accelerator_type` | text | No | — | — | `#/properties/hydration_accelerator_type` |
| `hydration_accelerator_content_ml_m3` | number | No | mL/m³ | — | `#/properties/hydration_accelerator_content_ml_m3` |
| `fiber_type` | text | No | — | — | `#/properties/fiber_type` |
| `fiber_product_name` | text | No | — | — | `#/properties/fiber_product_name` |
| `fiber_volume_fraction` | number | No | — | Presence only | `#/properties/fiber_volume_fraction` |
| `fiber_length_mm` | number | No | mm | — | `#/properties/fiber_length_mm` |
| `fiber_diameter_mm` | number | No | mm | — | `#/properties/fiber_diameter_mm` |
| `air_content_percent_volume_concrete` | number | No | % | — | `#/properties/air_content_percent_volume_concrete` |
| `date_of_pouring_yyyy_mm_dd` | date | No | — | — | `#/properties/date_of_pouring_yyyy_mm_dd` |
| `notes` | text | No | — | — | `#/properties/notes` |

## Geometries

Record schema `geometry_schema.json`.

| Field | Search type | Required | Unit | Handling | JSON path |
| --- | --- | --- | --- | --- | --- |
| `geometry_id` | text | Yes | — | — | `#/properties/geometry_id` |
| `source_id` | text | Yes | — | — | `#/properties/source_id` |
| `specimen_geometry_type` | enum | Yes | — | `prism`, `cube`, `cylinder`, `beam`, `notched_beam`, `panel`, `wall`, `plate`, `l_shaped`, `dog_bone` | `#/properties/specimen_geometry_type` |
| `geometry_file_name` | text | Yes | — | — | `#/properties/geometry_file_name` |

## Printing variables

Hierarchy coverage only.

| Field | Search type | Required | Unit | Handling | JSON path |
| --- | --- | --- | --- | --- | --- |
| `printing_id` | text | Yes | — | — | `#/database_hierarchy/printing_variables/identifier` |

## Reinforcement materials

Hierarchy coverage only.

| Field | Search type | Required | Unit | Handling | JSON path |
| --- | --- | --- | --- | --- | --- |
| `reinforcement_material_id` | text | Yes | — | — | `#/database_hierarchy/reinforcement_materials/identifier` |

## Reinforcement layouts

Hierarchy coverage only.

| Field | Search type | Required | Unit | Handling | JSON path |
| --- | --- | --- | --- | --- | --- |
| `reinforcement_layout_id` | text | Yes | — | — | `#/database_hierarchy/reinforcement_layouts/identifier` |

## Reinforcement components

Hierarchy coverage only.

| Field | Search type | Required | Unit | Handling | JSON path |
| --- | --- | --- | --- | --- | --- |
| `reinforcement_component_id` | text | Yes | — | — | `#/database_hierarchy/reinforcement_components/identifier` |

## Specimens

Record schema `specimens_schema.json`.

| Field | Search type | Required | Unit | Handling | JSON path |
| --- | --- | --- | --- | --- | --- |
| `specimen_id` | text | Yes | — | — | `#/properties/specimen_id` |
| `source_id` | text | Yes | — | — | `#/properties/source_id` |
| `batch_id` | text | Yes | — | — | `#/properties/batch_id` |
| `geometry_id` | text | Yes | — | — | `#/properties/geometry_id` |
| `longitudinal_reinforcement` | boolean | Yes | — | `yes`, `no`. Stored as strings | `#/properties/longitudinal_reinforcement` |
| `transverse_reinforcement` | boolean | Yes | — | `yes`, `no`. Stored as strings | `#/properties/transverse_reinforcement` |
| `external_reinforcement` | boolean | Yes | — | `yes`, `no`. Stored as strings | `#/properties/external_reinforcement` |
| `printed_specimen` | boolean | Yes | — | `yes`, `no`. Stored as strings | `#/properties/printed_specimen` |
| `notes` | text | No | — | — | `#/properties/notes` |

## Tests

Hierarchy coverage only.

| Field | Search type | Required | Unit | Handling | JSON path |
| --- | --- | --- | --- | --- | --- |
| `test_id` | text | Yes | — | — | `#/database_hierarchy/tests/identifier` |

## Devices and supports

Hierarchy coverage only.

| Field | Search type | Required | Unit | Handling | JSON path |
| --- | --- | --- | --- | --- | --- |
| `device_id` | text | Yes | — | — | `#/database_hierarchy/devices_and_supports/identifier` |

## Loading histories

Hierarchy coverage only.

| Field | Search type | Required | Unit | Handling | JSON path |
| --- | --- | --- | --- | --- | --- |
| `loading_id` | text | Yes | — | — | `#/database_hierarchy/loading_histories/identifier` |

## Data

Hierarchy coverage only.

| Field | Search type | Required | Unit | Handling | JSON path |
| --- | --- | --- | --- | --- | --- |
| `data_id` | text | Yes | — | — | `#/database_hierarchy/data/identifier` |
