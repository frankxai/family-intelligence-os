import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
test("capture produces a local private draft without a network mutation", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (r) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(r.method()))
      mutations.push(r.url());
  });
  await page.goto("/capture");
  await page.getByLabel("Give it a title").fill("Synthetic story");
  await page
    .getByLabel("What happened, who told the story, and what made it matter?")
    .fill("Synthetic test content.");
  const waiting = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download private draft" }).click();
  const download = await waiting;
  const file = await download.path();
  expect(file).toBeTruthy();
  const record = JSON.parse(await fs.readFile(file!, "utf8"));
  expect(record.visibility).toBe("private");
  expect(record.status).toBe("draft");
  expect(record.tenantId).toBeNull();
  expect(record.ownerId).toBeNull();
  expect(record.consentStatus).toBe("not_recorded");
  expect(mutations).toEqual([]);
  await page.reload();
  await expect(page.getByLabel("Give it a title")).toHaveValue("");
});
test("workspace navigation, locked health and mobile bounds", async ({
  page,
}) => {
  for (const path of [
    "/dashboard",
    "/graph",
    "/learn",
    "/workflows",
    "/setup",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  const response = await page.request.get("/api/health");
  expect(await response.json()).toMatchObject({
    privateArchive: "locked",
    privateRecordsConnected: false,
    remoteMcp: "not_provisioned",
  });
  await page.goto("/de/portal");
  await expect(page.locator("body")).toContainText(
    "Dieses Familienportal ist sicher verschlossen.",
  );
});
