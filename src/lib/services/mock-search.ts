import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { parameters } from "@/lib/schema/registry";
import { executeSearch } from "@/lib/search/execute";
import { indexDataset } from "@/lib/search/relationships";
import type { SearchService } from "./search-service";

const mockEnvelope = z.strictObject({
  format: z.literal("civita-mock-v1"),
  synthetic: z.literal(true),
  dataset_id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/),
  records: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
  specimen_links: z.record(z.string(), z.strictObject({
    reinforcement_layout_id: z.string().optional(), printing_id: z.string().optional(),
  })).optional(),
});

export function createMockSearchService(directory: string): SearchService {
  async function load() {
    const names = (await readdir(directory)).filter((name) => name.endsWith(".json")).sort();
    const entries = await Promise.all(names.map(async (name) => {
      const json = await readFile(join(directory, name), "utf8");
      const dataset = mockEnvelope.parse(JSON.parse(json));
      return [dataset.dataset_id, { json, index: indexDataset(dataset) }] as const;
    }));
    const datasets = new Map(entries);
    if (datasets.size !== entries.length) throw new Error("Duplicate dataset identifiers.");
    return datasets;
  }
  let cache: ReturnType<typeof load> | undefined;
  const getCollection = () => cache ??= load().catch((error) => {
    cache = undefined;
    throw error;
  });
  return {
    async search(query) {
      const collection = await getCollection();
      return executeSearch([...collection.values()].map(({ index }) => index), query);
    },
    async getDataset(id) {
      return (await getCollection()).get(id)?.index.detail();
    },
    async getDatasetJson(id) {
      return (await getCollection()).get(id)?.json;
    },
    async getParameters() {
      return parameters;
    },
  };
}

