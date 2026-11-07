# Schema coverage and implementation decisions

The shared directory supplies a hierarchy for all 13 categories. Eight categories currently have hierarchy identifiers and relationships without a record schema. The workbook and PDF give richer supporting context for those categories. Their columns cannot be treated as machine-validated scientific definitions.

## Differences between JSON and supporting documentation

| Area | Observed difference | Prototype handling |
| --- | --- | --- |
| Literature | The PDF describes peer review as yes/no. JSON also permits `unknown`. The workbook example DOI is a placeholder outside the JSON pattern. | Use the three-value JSON enumeration and omit mock DOI values. |
| Keywords | The workbook example shows two rows. The JSON and PDF require five or more. | All mock sources contain at least five. |
| Material batches | The workbook uses `date_of_pouring_yyyy-mm-dd`, while JSON uses `date_of_pouring_yyyy_mm_dd`. Several categories, including material class, cement type, aggregate type, and fiber type, are described as vocabulary fields in the PDF or workbook but are unconstrained strings in the record JSON. | Preserve exact JSON keys and text operators. The generator uses controlled options declared in the record schemas. |
| Units | `fiber_volume_fraction` allows decimal or percent in the PDF and carries no unit discriminator in the JSON. The workbook and PDF describe variable units for scalar data and loading rates. | Expose fiber fraction and generic scalar mean for presence checks only. Numeric strength is a separate quantity-specific projection with compatible pressure units. |
| Geometries | Workbook `specimen_geometry_file_name` and `Notes` differ from JSON `geometry_file_name` and its closed field set. The workbook/PDF vocabulary includes forms such as `dogbone` and notched prism. JSON has `dog_bone` and `notched_beam`. | Use exact JSON fields and options. The PDF p. 23 JSON example contains coordinates and parameters that the geometry record schema cannot accept. Geometry file contents and dimensions remain outside the searchable registry. |
| Specimens | Workbook includes `reinforcement_layout_id`, `printing_variables_id`, and `structural_form_type`. The JSON record omits them and requires four yes/no fields absent from the workbook header. The hierarchy marks the layout and printing relationships optional, while the PDF table marks the corresponding rows required. | Preserve closed JSON records. Store optional layout and printing links separately and follow the hierarchy’s cardinality. Structural form remains unindexed. |
| Tests | The PDF prose mentions a direct batch reference, but both its field table and the hierarchy link the test through its specimen. The PDF types repeat count as a string, and the workbook example leaves it blank. | Resolve batch through the specimen. Use an integer repeat count provisionally for mock tests. |
| Data and repeats | The workbook and PDF describe repeat identifiers, scalar statistics, separate curve axis device IDs, and multiple data shapes. The hierarchy has no repeat entity and describes at most one optional device per data row. | Use local repeat labels as metadata. Resolve only the hierarchy’s optional single device relationship. Axis device IDs and cross-repeat link semantics remain unspecified. |
| Printing and supporting files | The PDF printing section is under development. Workbook examples include placeholder values and unit inconsistencies. CSV/JSON, image, and report filenames in workbook/schema fields describe attachments. | Use a few numeric speeds in the workbook header unit for mock printing. Fixture filenames are illustrative metadata. Source JSON is the downloadable artifact. |

## Supporting workbook coverage

The following inventory compares the workbook field headers against the JSON inventory. A field named as a parent link below is used to establish relationships where the hierarchy supplies an edge. Unless listed as provisional or derived, workbook-only fields are outside the searchable registry.

| Tab | Provisional searchable fields | Remaining workbook-only fields or details |
| --- | --- | --- |
| `geometries` | — | `specimen_geometry_file_name` and `Notes`. The registry uses the JSON file field. |
| `specimens` | — | `reinforcement_layout_id`, `printing_variables_id`, `structural_form_type`. Optional links live in the envelope. |
| `tests` | `test_type`, `number_of_repeats`, `main_observed_mechanisms`, `age_days` | `source_id`, `specimen_id`, `test_setup_visualization_file_name`, `test_protocol_file_name`, `test_parameters_file_name`, `curing_condition`, `hygral_boundary_conditions`, `thermal_boundary_conditions`, `initial_env_temperature_C`, `env_temperature_C_history_file_name`, `initial_env_relative_humidity_percent`, `env_relative_humidity_percent_history_file_name`, `test_date_yyyy-mm-dd`, `notes`. |
| `data` | `data_type`, `test_repeat_id`, `quantity_reported`, `quantity_reported_mean` (presence only), `units`, `x_quantity_reported`, `y_quantity_reported` | `source_id`, `test_id`, `notes`, `source_location`, `extraction_methods`, `extraction_date_yyyy-mm-dd`, `number_of_specimens`, `specimen_label`, `device_id`, `quantity_reported_type`, `quantity_reported_standard_deviation`, `x_device_id`, `y_device_id`, `x_quantity_reported_type`, `y_quantity_reported_type`, `file_name`, `table_name`, `table_description`, `table_file_name`, `name`, `description`, `type`, `format`, `filename`. |
| `reinforcement_materials` | `reinforcement_material_type` | `source_id`, `stress_strain_curve_file`, `elastic_modulus_mpa`, `yield_strength_mpa`, `rupture_strength_mpa`, `rupture_strain`, `notes`. |
| `reinforcement_layouts` | — | `source_id`, `geometry_id`, reinforcement flags, `reinforcement_file_name`, `Notes`. |
| `reinforcement_components` | `reinforcement_type` | `source_id`, `reinforcement_material_id`, `reinforcement_layout_id`, `notes`, `reinforcement_orientation`, `number_of_reinf_elements`, bar designation and nominal dimensions, layer depth, spacing, cover, begin/end distances, centroid coordinates, width/length/thickness/angle, adhesive and anchorage fields, and under-development prestressing columns. |
| `printing_variables` | `printing_speed_mm_sec` | `source_id`, `geometry_id`, `volumetric_flow_rate_m3_h`, `nozzle_orientation_angle_deg`, `nozzle_shape`, `nozzle_size_mm`, `extrusion_pressure_pa`, hose dimensions, pump type/model, arm type/model, `number_of_dofs`, `deliver_method`. The hierarchy does not define a printing-to-geometry edge. |
| `devices_and_supports` | `device_type` | `source_id`, `test_id`, position coordinates, `orientation`, `device_parameters_file`, `notes`. |
| `loading_histories` | `loading_mode` | `source_id`, `test_id`, `device_id`, `loading_control_variable`, `initial_control_variable_rate`, `control_variable_rate_units`, begin/end times, `loading_history_file_name`, `notes`. |

`literature_sources`, `keywords`, and `material_batches` are covered by record JSON with the discrepancies above. The workbook’s release, validation, and vocabulary tabs are supporting metadata. The workbook and PDF vocabularies inform the app's provisional test and data choices for the demo. The demo uses terms such as `three_point_bending_test`, even where workbook examples omit the `_test` suffix.

## Provisional source envelope

The shared JSON does not specify a complete source serialization. A mock file has `format: "civita-mock-v1"`, `synthetic: true`, a unique `dataset_id` slug, and `records` mapping exact category names to arrays of objects. It contains exactly one literature source. The optional `specimen_links` object maps a specimen ID to its `printing_id` and/or `reinforcement_layout_id`. Records covered by a JSON Schema validate independently against that original schema. An absent category is represented by an omitted array or an empty array.

The catalog includes 16 explicitly provisional workbook fields and one derived pressure field. `data.compressive_strength_mpa` is calculated from scalar observations on their linked tests. A compressive-strength result from a different test on the same batch is not treated as a measurement on a bending test. There is no shared JSON definition of a batch-level compressive-strength property or of how to aggregate across age, specimen, and test procedure.

