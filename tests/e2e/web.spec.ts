import { expect, test } from "@playwright/test";

for (const path of ["/", "/dashboard", "/connectors", "/audit", "/security"]) {
  test(`renders ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("body")).toContainText("Family");
  });
}

