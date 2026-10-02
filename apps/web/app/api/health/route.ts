export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(
    {
      status: "ok",
      surface: "family-template",
      privateArchive: "locked",
      privateRecordsConnected: false,
      remoteMcp: "not_provisioned",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
