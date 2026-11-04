// Copy only the distribution manifest into a new, empty directory.
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { assets } from "./assets.mjs";
export const distribution = [
  ".gitignore",
  "README.md",
  "LICENSE",
  "package.json",
  "assets.mjs",
  "edge.mjs",
  "build.mjs",
  "founder.mjs",
  "wrangler.jsonc",
  "vercel.json",
  "tests/starter.test.mjs",
  "public/_headers",
  ...Object.keys(assets).map((f) => "public/" + f),
];
export async function exportStarter(destination) {
  const root = new URL("./", import.meta.url);
  // Read every approved source before creating the destination.
  const payload = await Promise.all(
    distribution.map(async (f) => [f, await readFile(new URL(f, root))]),
  );
  await mkdir(destination, { recursive: false });
  try {
    for (const [file, bytes] of payload) {
      const target = resolve(destination, file);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes, { flag: "wx" });
    }
  } catch (error) {
    await rm(destination, { recursive: true, force: true });
    throw error;
  }
}
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  if (process.argv.length !== 3)
    throw Error("Usage: node founder.mjs ../new-household-repo");
  const dest = resolve(process.argv[2]);
  await exportStarter(dest);
  console.log(
    "Exported " +
      distribution.length +
      " starter files to " +
      basename(dest) +
      ". Initialize a new private Git repository there.",
  );
}
