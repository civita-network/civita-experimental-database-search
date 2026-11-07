import { join } from "node:path";
import { createMockSearchService } from "./mock-search";
import type { SearchService } from "./search-service";

export const searchService: SearchService = createMockSearchService(join(process.cwd(), "mock-data"));

