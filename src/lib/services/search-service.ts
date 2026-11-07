import type { DatasetDetail, SearchParameter, SearchQuery, SearchResults } from "@/lib/types";

export interface SearchService {
  search(query: SearchQuery): Promise<SearchResults>;
  getDataset(id: string): Promise<DatasetDetail | undefined>;
  getDatasetJson(id: string): Promise<string | undefined>;
  getParameters(): Promise<SearchParameter[]>;
}

