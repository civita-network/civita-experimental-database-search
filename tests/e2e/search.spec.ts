import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("searches linked records, restores the URL and retrieves the original JSON", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Concrete Database Search" })).toBeVisible();
  await expect(page.getByText("Showing 1–10 of 17")).toBeVisible();

  await page.getByRole("button", { name: "Bending & aggregate size" }).click();
  await page.getByRole("button", { name: "Run search" }).click();
  await expect(page.getByText("Showing 1–3 of 3")).toBeVisible();
  await expect(page).toHaveURL(/\?q=/);
  await page.reload();
  await expect(page.getByText("Showing 1–3 of 3")).toBeVisible();
  await expect(page.getByText("Tests › Test type equals three point bending test", { exact: false })).toBeVisible();

  await page.getByRole("checkbox", { name: "Select SRC0001 TST0001" }).check();
  await page.getByRole("button", { name: "Open selected" }).click();
  const viewer = page.getByRole("dialog", { name: "Source dataset SRC0001" });
  await expect(viewer).toBeVisible();
  await expect(viewer.getByText("Query match", { exact: true })).toHaveCount(2);
  const testRecord = viewer.locator("article").filter({ has: page.getByText("Selected result") });
  await testRecord.getByRole("button", { name: "SPC0001" }).click();
  await expect(viewer.locator('article[id$=":specimens:SPC0001"]')).toBeFocused();

  await viewer.getByRole("button", { name: "Inspect JSON" }).click();
  await expect(viewer.locator("pre")).toContainText('"synthetic": true');
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    viewer.getByRole("link", { name: "Download JSON" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("fracture-program.json");
  expect(await readFile((await download.path())!, "utf8")).toBe(await readFile("mock-data/fracture-program.json", "utf8"));
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
});

test("builds a nested query with an OR branch and changes result types", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add group" }).click();
  const group = page.locator(".nested-group");
  await group.getByRole("button", { name: "OR" }).click();
  await group.getByRole("button", { name: "Add condition" }).click();
  await group.getByRole("combobox", { name: "Category", exact: true }).selectOption("specimens");
  await group.getByRole("combobox", { name: "Parameter", exact: true }).selectOption("specimens.printed_specimen");
  await group.getByRole("button", { name: "Add condition" }).click();
  const second = group.locator(".condition-card").nth(1);
  await second.getByRole("combobox", { name: "Category", exact: true }).selectOption("material_batches");
  await second.getByRole("combobox", { name: "Parameter", exact: true }).selectOption("material_batches.batch_label");
  await second.getByLabel("Value", { exact: true }).fill("Mix H80");
  await page.getByRole("button", { name: "Run search" }).click();
  await expect(page.getByText("Showing 1–4 of 4")).toBeVisible();
  await page.getByRole("button", { name: "Material batches 3", exact: true }).click();
  await expect(page.getByRole("columnheader", { name: "Batch ID" })).toBeVisible();
  await expect(page.getByText("Showing 1–3 of 3")).toBeVisible();
  await page.getByRole("button", { name: "Sources 2", exact: true }).click();
  await expect(page.getByText("Showing 1–2 of 2")).toBeVisible();
});

test("sorts, paginates and customizes the results table", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Showing 11–17 of 17")).toBeVisible();
  await page.getByRole("button", { name: "Source ID" }).click();
  await expect(page.getByRole("columnheader", { name: "Source ID" })).toHaveAttribute("aria-sort", "descending");
  await expect(page.locator("tbody tr").first()).toContainText("SRC0006");
  await page.getByText("Columns", { exact: true }).click();
  await page.getByRole("searchbox", { name: "Find result columns" }).fill("water_binder_ratio");
  await page.getByRole("checkbox", { name: /Water binder ratio/i }).check();
  await expect(page.getByRole("columnheader", { name: /Water binder ratio/i })).toBeVisible();
  await page.getByText("Columns", { exact: true }).click();
  await page.getByLabel("Rows per page").selectOption("5");
  await expect(page.getByText("Showing 1–5 of 17")).toBeVisible();
});

test("searches parameter descriptions, validates incomplete conditions and fits a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Find parameters" }).fill("Cement mass per unit concrete volume");
  await page.getByRole("button", { name: "Add Cement content to query" }).click();
  await page.getByRole("button", { name: "Run search" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Enter a valid value for Cement content" })).toBeVisible();
  await page.getByRole("combobox", { name: "Operator" }).selectOption("gte");
  await page.getByRole("spinbutton", { name: "Value" }).fill("500");
  await page.getByRole("button", { name: "Run search" }).click();
  await expect(page.getByText("Showing 1–5 of 5")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole("link", { name: "About" }).click();
  await expect(page.getByRole("heading", { name: "About CIVITA" })).toBeVisible();
});
