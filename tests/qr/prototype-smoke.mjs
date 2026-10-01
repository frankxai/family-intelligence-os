import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("@playwright/test")); }
catch {
  const runtime = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
  if (!runtime) throw new Error("Install the repository's Playwright dependency first.");
  ({ chromium } = require(require.resolve("playwright", { paths: [runtime] })));
}
const url = process.env.FAMILY_DEMO_TEST_URL ?? "http://127.0.0.1:8090/docs/family-qr/PROTOTYPE.html";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+\//.test(url)) throw new Error("This smoke test accepts a local synthetic prototype only.");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1120 } });
const failures = [];
const requests = [];
page.on("pageerror", error => failures.push(error.message));
page.on("request", request => requests.push(request.url()));
const output = path.resolve("docs/family-qr/verification");
fs.mkdirSync(output, { recursive: true });
try {
  await page.goto(url);
  await page.getByRole("heading", { name: "What do you want to know?" }).waitFor();
  await page.screenshot({ path: path.join(output, "desktop.png"), fullPage: true });
  await page.selectOption("#role", "child");
  await page.getByRole("button", { name: "Where is the insurance letter?", exact: true }).click();
  assert.match(await page.locator("#answer").innerText(), /adult document space/);
  await page.selectOption("#role", "parent");
  assert.match(await page.locator("#answer").innerText(), /contains no insurance records/);
  await page.getByRole("button", { name: "Learn & grow", exact: true }).click();
  await page.locator("#lesson-next").click();
  assert.match(await page.locator("#lesson-text").innerText(), /original source/);
  await page.locator("#lesson-next").click();
  assert.match(await page.locator("#lesson-text").innerText(), /uncertain/);
  await page.getByRole("button", { name: "AI & access", exact: true }).click();
  await page.selectOption("#role", "child");
  assert.match(await page.locator("#chatgpt-status").innerText(), /Adult-led interaction/);
  await page.selectOption("#role", "teen");
  assert.match(await page.locator("#chatgpt-status").innerText(), /Personal eligible teen account/);
  await page.getByRole("button", { name: "QR doorways", exact: true }).click();
  assert.equal(await page.locator(".qr svg").count(), 4);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download sample SVG", exact: true }).first().click();
  assert.equal((await downloadEvent).suggestedFilename(), "household-SAMPLE.svg");
  await page.screenshot({ path: path.join(output, "qr-cards.png"), fullPage: true });
  const qrDecoding = await page.evaluate(async () => {
    if (!("BarcodeDetector" in globalThis)) return { supported: false, decoded: [] };
    const formats = await BarcodeDetector.getSupportedFormats();
    if (!formats.includes("qr_code")) return { supported: false, decoded: [] };
    const detector = new BarcodeDetector({ formats: ["qr_code"] });
    const decoded = [];
    for (const svg of document.querySelectorAll(".qr svg")) {
      const img = new Image();
      const url = URL.createObjectURL(new Blob([svg.outerHTML], { type: "image/svg+xml" }));
      img.src = url; await img.decode();
      const canvas = document.createElement("canvas");canvas.width = 600;canvas.height = 600;
      canvas.getContext("2d").drawImage(img, 0, 0, 600, 600);
      decoded.push(...(await detector.detect(canvas)).map(item => item.rawValue));
      URL.revokeObjectURL(url);
    }
    return { supported: true, decoded };
  });
  if (qrDecoding.supported) {
    assert.equal(qrDecoding.decoded.length, 4);
    for (const decoded of qrDecoding.decoded) assert.match(decoded, /^https:\/\/family\.example\.invalid\/q\/[A-Za-z0-9_-]{22}$/);
  }
  await page.getByRole("button", { name: "Keep it safe", exact: true }).click();
  assert.match(await page.locator('[data-panel="protect"]').innerText(), /Not configured/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Our space", exact: true }).click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: path.join(output, "mobile.png"), fullPage: true });
  assert.deepEqual(failures, []);
  assert.ok(requests.every(request => new URL(request).hostname === "127.0.0.1" || new URL(request).hostname === "localhost" || request.startsWith("blob:")));
  const result = { status: "passed", screens: ["desktop", "qr-cards", "mobile"], roleSwitching: true, documentBoundaryIllustration: true, learningProgression: true, svgDownload: true, mobileOverflow: false, pageErrors: failures, externalRequests: 0, qrDecoding };
  fs.writeFileSync(path.join(output, "ui-results.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
