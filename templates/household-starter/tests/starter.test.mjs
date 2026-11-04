import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  initial,
  restore,
  household,
  addActivity,
  palettes,
  scenes,
} from "../public/model.js";
import { printSVG } from "../public/art.js";
import { serve } from "../edge.mjs";
test("schedule survives reload without accepting duplicate or unknown activities", () => {
  const state = initial();
  assert.equal(addActivity(state, "games", "09:00"), true);
  for (const [id, time] of [
    ["games", "09:00"],
    ["__proto__", "09:00"],
    ["market", "25:00"],
  ])
    assert.equal(addActivity(state, id, time), false);
  assert.equal(household(restore(JSON.stringify(state))).plan[0].id, "games");
});
test("restore keeps an empty schedule, drops unknown keys, handles corrupt data", () => {
  assert.deepEqual(restore("invalid"), initial());
  const data = restore(
    JSON.stringify({
      plan: [{ id: "__proto__", time: "09:00" }],
      notes: "private text",
      careDone: "true",
      art: { palette: "__proto__", scene: "dunes" },
    }),
  );
  assert.deepEqual(data, { ...initial(), plan: [] });
});
test("household view excludes routine, private drafts and unapproved artwork", () => {
  const state = initial();
  state.careDone = true;
  state.pendingArt = state.art;
  assert.deepEqual(Object.keys(household(state)).sort(), [
    "checkIn",
    "plan",
    "sharedArt",
  ]);
  assert.equal(household(state).sharedArt, null);
  state.sharedArt = { ...state.art };
  state.art.scene = "dunes";
  assert.equal(household(state).sharedArt.scene, "valley");
});
test("nine distinct original print files contain no external resource or script", () => {
  const files = Object.keys(palettes).flatMap((palette) =>
    scenes.map((scene) => printSVG({ palette, scene })),
  );
  assert.equal(new Set(files).size, 9);
  assert.equal(
    printSVG({ palette: "<script>", scene: "invalid" }),
    printSVG({ palette: "orchard", scene: "valley" }),
  );
  files.forEach((file) => {
    assert.match(file, /^<svg /);
    assert.doesNotMatch(file, /<script|<image|href=/i);
  });
});
test("HTTP allowlist rejects other paths and writes, and HEAD has no payload", async () => {
  const files = { "/": { type: "text/html", body: "demo" } };
  const headers = { "Content-Security-Policy": "connect-src 'none'" };
  for (const path of ["/api/health", "/.env", "/constructor", "/toString"])
    assert.equal(
      serve(new Request("https://example.test" + path), files, headers).status,
      404,
    );
  assert.equal(
    serve(
      new Request("https://example.test", { method: "POST" }),
      files,
      headers,
    ).status,
    405,
  );
  const head = serve(
    new Request("https://example.test", { method: "HEAD" }),
    files,
    headers,
  );
  assert.equal(await head.text(), "");
  assert.equal(
    head.headers.get("Content-Security-Policy"),
    headers["Content-Security-Policy"],
  );
});
test("Vercel and public static headers match", async () => {
  const root = new URL("../", import.meta.url);
  const config = JSON.parse(
    await readFile(new URL("vercel.json", root), "utf8"),
  );
  const rules = (await readFile(new URL("public/_headers", root), "utf8"))
    .trim()
    .split("\n")
    .slice(1);
  assert.deepEqual(
    rules.map((line) => line.trim()),
    config.headers[0].headers.map((h) => h.key + ": " + h.value),
  );
});
test("founder export is complete and repeatable and refuses an existing destination", async () => {
  const { mkdtemp, rm, readdir } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { exportStarter, distribution } = await import("../founder.mjs");
  const tmp = await mkdtemp(join(tmpdir(), "household-"));
  try {
    const dest = join(tmp, "export");
    await exportStarter(dest);
    const listed = await readdir(dest, { recursive: true });
    assert.deepEqual(
      listed.filter((f) => !["public", "tests"].includes(f)).sort(),
      [...distribution].sort(),
    );
    await assert.rejects(exportStarter(dest), { code: "EEXIST" });
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
