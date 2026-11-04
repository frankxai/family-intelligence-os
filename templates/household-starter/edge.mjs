// Source text is inlined by build.mjs, so the Worker needs no bindings or credentials.
export function serve(request, files, headers) {
  if (!["GET", "HEAD"].includes(request.method))
    return new Response(null, {
      status: 405,
      headers: { ...headers, Allow: "GET, HEAD" },
    });
  const path = new URL(request.url).pathname;
  const asset = Object.hasOwn(files, path) ? files[path] : null;
  if (!asset) return new Response(null, { status: 404, headers });
  return new Response(request.method === "HEAD" ? null : asset.body, {
    headers: {
      ...headers,
      "Content-Type": asset.type,
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
