import type { SearchParameter } from "@/lib/types";

const workbook = "concrete_data_collection_template.xlsx";
type Field = Pick<SearchParameter, "fieldName" | "label" | "dataType" | "operators"> &
  Partial<Pick<SearchParameter, "options" | "unit" | "description" | "applicableTo" | "multiple">>;

function field(category: string, cell: string, definition: Field): SearchParameter {
  return {
    ...definition, id: `${category}.${definition.fieldName}`, category, entityType: category,
    source: { kind: "provisional", file: workbook, path: `${category}!${cell}` },
  };
}

const text = ["eq", "ne", "contains", "starts", "has", "missing"] as const;
const numeric = ["eq", "ne", "gt", "gte", "lt", "lte", "between", "has", "missing"] as const;
const categorical = ["eq", "in", "notIn", "has", "missing"] as const;

export const provisionalParameters: SearchParameter[] = [
  field("tests", "G1", {
    fieldName: "test_type", label: "Test type", dataType: "enum", operators: [...categorical],
    description: "Experimental procedure. Options are the subset used by the synthetic collection.",
    options: ["axial_test", "three_point_bending_test", "four_point_bending_test", "direct_tensile_test", "cyclic_lateral_test"],
  }),
  field("tests", "D1", {
    fieldName: "number_of_repeats", label: "Number of repeats", dataType: "number", operators: [...numeric],
    description: "Number of repeats in this test family, represented as a count in the mock format.",
  }),
  field("tests", "I1", {
    fieldName: "main_observed_mechanisms", label: "Main observed mechanisms", dataType: "text", operators: [...text],
    multiple: true, description: "Mechanisms stored as a string array in the mock format.",
  }),
  field("tests", "J1", { fieldName: "age_days", label: "Age at testing", dataType: "number", unit: "days", operators: [...numeric] }),
  field("data", "I2", {
    fieldName: "data_type", label: "Data type", dataType: "enum", operators: [...categorical],
    description: "Measurement modality. Options are the subset used by the synthetic collection.",
    options: ["scalar", "curve", "table", "image", "video"],
  }),
  field("data", "D2", { fieldName: "test_repeat_id", label: "Test repeat ID", dataType: "text", operators: [...text] }),
  field("data", "M2", {
    fieldName: "quantity_reported", label: "Reported scalar quantity", dataType: "text", operators: [...text], applicableTo: ["scalar"],
  }),
  field("data", "O2", {
    fieldName: "quantity_reported_mean", label: "Reported scalar mean", dataType: "number", operators: ["has", "missing"],
    applicableTo: ["scalar"], description: "Raw mean. Presence checks are available because the unit depends on the quantity.",
  }),
  field("data", "Q2", {
    fieldName: "units", label: "Reported scalar units", dataType: "text", operators: [...text], applicableTo: ["scalar"],
  }),
  field("data", "T2", {
    fieldName: "x_quantity_reported", label: "Curve x-axis quantity", dataType: "text", operators: [...text], applicableTo: ["curve"],
  }),
  field("data", "V2", {
    fieldName: "y_quantity_reported", label: "Curve y-axis quantity", dataType: "text", operators: [...text], applicableTo: ["curve"],
  }),
  field("reinforcement_materials", "C1", {
    fieldName: "reinforcement_material_type", label: "Reinforcement material type", dataType: "text", operators: [...text],
  }),
  field("reinforcement_components", "F2", {
    fieldName: "reinforcement_type", label: "Reinforcement component type", dataType: "text", operators: [...text],
  }),
  field("printing_variables", "D2", {
    fieldName: "printing_speed_mm_sec", label: "Printing speed", dataType: "number", unit: "mm/s", operators: [...numeric],
    description: "Synthetic printing speed using the unit in the workbook header.",
  }),
  field("devices_and_supports", "D1", {
    fieldName: "device_type", label: "Device type", dataType: "text", operators: [...text],
  }),
  field("loading_histories", "E1", {
    fieldName: "loading_mode", label: "Loading mode", dataType: "text", operators: [...text],
  }),
  {
    id: "data.compressive_strength_mpa", fieldName: "compressive_strength_mpa", label: "Compressive strength",
    description: "Calculated from the mean and units of a compressive-strength scalar measurement on this test.",
    category: "data", entityType: "data", dataType: "number", unit: "MPa", operators: [...numeric],
    applicableTo: ["scalar"], source: { kind: "derived", file: workbook, path: "data!M2:Q2" },
  },
];

