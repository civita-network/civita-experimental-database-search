import { searchService } from "@/lib/services";

export async function GET(request: Request, context: RouteContext<"/api/datasets/[id]">) {
  const { id } = await context.params;
  const download = new URL(request.url).searchParams.get("download") === "1";
  if (download) {
    const json = await searchService.getDatasetJson(id);
    if (json) return new Response(json, {
      headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${id}.json"` },
    });
  } else {
    const detail = await searchService.getDataset(id);
    if (detail) return Response.json(detail);
  }
  return Response.json({ error: "Dataset not found." }, { status: 404 });
}

