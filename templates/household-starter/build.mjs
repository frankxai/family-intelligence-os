import { readFile, writeFile, mkdir } from "node:fs/promises";
import { assets } from "./assets.mjs";
import { serve } from "./edge.mjs";
const root = new URL("./", import.meta.url);
const files = {};
for (const [name, type] of Object.entries(assets)) {
  files["/" + name] = {
    type,
    body: await readFile(new URL("public/" + name, root), "utf8"),
  };
}
files["/"] = files["/index.html"];
const config = JSON.parse(await readFile(new URL("vercel.json", root), "utf8"));
const headers = Object.fromEntries(
  config.headers[0].headers.map(({ key, value }) => [key, value]),
);
const code =
  "const files=" +
  JSON.stringify(files) +
  ";\nconst headers=" +
  JSON.stringify(headers) +
  ";\n" +
  serve.toString() +
  "\nexport default { fetch(request) { return serve(request,files,headers); } };\n";
await mkdir(new URL("dist/", root), { recursive: true });
await writeFile(new URL("dist/worker.mjs", root), code);
