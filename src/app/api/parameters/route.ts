import { categories } from "@/lib/schema/registry";
import { searchService } from "@/lib/services";

export async function GET() {
  return Response.json({ version: 1, categories, parameters: await searchService.getParameters() });
}

