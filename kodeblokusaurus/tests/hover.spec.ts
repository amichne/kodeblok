import { test, expect } from "@playwright/test";

test("hover reveals insight card and highlights token", async ({ page }) => {
  await page.goto("/");

  await page.waitForSelector('.monaco-editor', { timeout: 15000 });
  await page.waitForTimeout(500);

  await expect(page.getByTestId("import-button")).toBeVisible();
  await expect(page.getByRole("button", { name: "Filter" })).toHaveCount(0);

  const decorations = page.locator('.insight-decoration');
  await expect(decorations.first()).toBeVisible();

  const box = await decorations.first().boundingBox();
  if (!box) {
    throw new Error("Expected decoration to have a bounding box");
  }
  await page.mouse.move(box.x + 6, box.y + 6);

  await expect(page.getByTestId("hover-card")).toBeVisible();

  const activeCount = await page.locator('.insight-active').count();
  expect(activeCount).toBeGreaterThan(0);
  const scopeCount = await page.locator('.scope-decoration').count();
  expect(scopeCount).toBeGreaterThan(0);

  await page.mouse.move(0, 0);
  await expect(page.getByTestId("hover-card")).toBeHidden();
  await expect(page.locator('.insight-active')).toHaveCount(0);
});
