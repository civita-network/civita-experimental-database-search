import { SearchHero } from "@/components/search/hero";
import { SearchWorkspace } from "@/components/search/workspace";
import { emptyQuery, restoreQuery } from "@/lib/search/query";
import { searchService } from "@/lib/services";

export default async function SearchPage({ searchParams }: PageProps<"/">) {
  const { q } = await searchParams;
  const restored = typeof q === "string" ? restoreQuery(q) : undefined;
  const query = restored?.success ? restored.data : emptyQuery();
  const results = await searchService.search(query);
  return <main id="main-content" className="page-wrap">
    <SearchHero />
    <SearchWorkspace query={query} results={results} invalidLink={q !== undefined && !restored?.success} />
  </main>;
}
