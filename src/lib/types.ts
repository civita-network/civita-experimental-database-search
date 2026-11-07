export type SearchOperator = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "between" |
  "has" | "missing" | "contains" | "starts" | "in" | "notIn" | "true" | "false" | "before" | "after";

export type Scalar = string | number | boolean;
export type SearchValue = Scalar | (string | number)[];
export type ResultMode = "tests" | "material_batches" | "literature_sources";

export interface SearchParameter {
  id: string;
  category: string;
  fieldName: string;
  label: string;
  description?: string;
  dataType: "number" | "text" | "enum" | "boolean" | "date";
  schemaType?: string;
  unit?: string;
  operators: SearchOperator[];
  options?: string[];
  entityType: string;
  required?: boolean;
  multiple?: boolean;
  encoding?: "yes-no";
  applicableTo?: string[];
  source: { file: string; path: string; kind: "schema" | "hierarchy" | "provisional" | "derived" };
}

export interface Category {
  id: string;
  label: string;
  identifier: string;
  example?: string;
  description: string;
  schemaFile?: string;
  parents: { category: string; field: string; optional: boolean }[];
}

export interface Condition {
  kind: "condition";
  parameter: string;
  operator: SearchOperator;
  value?: SearchValue;
}

export interface Group {
  kind: "group";
  logic: "and" | "or";
  children: (Group | Condition)[];
}

export interface SearchQuery {
  version: 1;
  mode: ResultMode;
  where: Group;
  columns?: string[];
  sort?: { column: string; direction: "asc" | "desc" };
  page?: number;
  pageSize?: number;
}

export interface EntityRef {
  key: string;
  category: string;
  id: string;
}

export interface SearchRow {
  datasetId: string;
  sourceId: string;
  entity: EntityRef;
  matches: EntityRef[];
  values: Record<string, Scalar[]>;
}

export interface SearchResults {
  rows: SearchRow[];
  total: number;
  counts: Record<ResultMode, number>;
  page: number;
  pageSize: number;
  columns: string[];
}

export type EntityFields = Record<string, unknown>;

export interface Dataset {
  format: "civita-mock-v1";
  synthetic: true;
  dataset_id: string;
  records: Record<string, EntityFields[]>;
  specimen_links?: Record<string, { reinforcement_layout_id?: string; printing_id?: string }>;
}

export interface DatasetEntity extends EntityRef {
  fields: EntityFields;
  related: EntityRef[];
}

export interface DatasetDetail {
  dataset: Dataset;
  entities: DatasetEntity[];
}

