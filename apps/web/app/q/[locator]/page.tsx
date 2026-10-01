import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Starlight Family · Sign in",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer"
};

/**
 * Intentionally locked until a deployment-owned session adapter, QR repository,
 * resource authorization and persistent bounded audit sink are wired together.
 * Never authorize using params, flags, client roles, or the existence of a QR.
 * Unknown, expired and revoked locators render the same generic response.
 */
export default function FamilyQrEntryPage() {
  return (
    <section className="shell page">
      <p className="kicker">Starlight Family</p>
      <h1>Your family space starts with you.</h1>
      <p>Sign in with your own family account to continue. This code is a doorway; your account controls what opens.</p>
      <p>No family information is loaded. A family steward must connect private sign-in before this doorway can open.</p>
    </section>
  );
}
