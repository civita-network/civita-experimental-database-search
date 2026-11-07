import { expect, test } from "vitest";
import { POST } from "@/app/api/search/route";
import { GET as getParameters } from "@/app/api/parameters/route";
import { GET as getDataset } from "@/app/api/datasets/[id]/route";
import { emptyQuery } from "@/lib/search/query";

const post = (body: string) => POST(new Request("http://localhost/api/search", { method: "POST", body }));

test("search API returns results and rejects invalid request bodies", async () => {
  expect(await (await post(JSON.stringify(emptyQuery()))).json()).toMatchObject({ total: 17, page: 1, pageSize: 10 });
  expect((await post("{")).status).toBe(400);
  expect((await post(JSON.stringify({ ...emptyQuery(), version: 9 }))).status).toBe(400);
  expect((await post("x".repeat(24_001))).status).toBe(413);
});

test("parameters and dataset routes expose a stable read-only contract", async () => {
  expect(await (await getParameters()).json()).toMatchObject({ version: 1 });
  const id = "fracture-program";
  const context = { params: Promise.resolve({ id }) };
  const detail = await getDataset(new Request(`http://localhost/api/datasets/${id}`), context);
  expect(await detail.json()).toMatchObject({ dataset: { dataset_id: id, synthetic: true } });
  const download = await getDataset(new Request(`http://localhost/api/datasets/${id}?download=1`), context);
  expect(download.headers.get("Content-Disposition")).toBe('attachment; filename="fracture-program.json"');
  expect((await getDataset(new Request("http://localhost/api/datasets/unknown"), { params: Promise.resolve({ id: "unknown" }) })).status).toBe(404);
});
