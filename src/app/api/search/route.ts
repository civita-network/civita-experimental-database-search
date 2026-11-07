import { querySchema } from "@/lib/search/query";
import { searchService } from "@/lib/services";

export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > 24_000) return Response.json({ error: "Query is too large." }, { status: 413 });
  let input: unknown;
  try {
    input = JSON.parse(body);
  } catch {
    return Response.json({ error: "Send a valid JSON search request." }, { status: 400 });
  }
  const query = querySchema.safeParse(input);
  if (!query.success) {
    return Response.json({
      error: "Check the search request.",
      issues: query.error.issues.map(({ path, message }) => ({ path, message })),
    }, { status: 400 });
  }
  return Response.json(await searchService.search(query.data));
}

