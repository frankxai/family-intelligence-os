import assert from "node:assert/strict";
import { test } from "node:test";
import { buildQrUrl, evaluateConsumerAiAccess, evaluateQrEntry, generateQrLocator } from "../../packages/family-auth/src/qr-entry.ts";

const now = new Date("2026-10-01T12:00:00.000Z");
const locator = "A123456789012345678901";
const session = { familyId: "synthetic_family", actorId: "synthetic_adult", actorRole: "adult_member", sessionId: "session_1234567890", authenticatedAt: "2026-10-01T11:00:00Z", expiresAt: "2026-10-01T13:00:00Z", assurance: "passkey" };
const record = { locator, familyId: session.familyId, resourceId: "synthetic_learning", destination: "learning", status: "active", revokedAt: null, createdAt: "2026-10-01T10:00:00Z", expiresAt: "2026-10-02T10:00:00Z", allowedMemberIds: [session.actorId], sensitivity: "low", childApproved: true };
const evaluate = (s: unknown = session, r: unknown = record, l: unknown = locator) => evaluateQrEntry({ session: s, record: r, locator: l, now });

test("production locators use 128 random bits with no personal metadata", () => {
  const values = Array.from({ length: 100 }, () => generateQrLocator());
  assert.equal(new Set(values).size, 100);
  for (const value of values) {
    assert.match(value, /^[A-Za-z0-9_-]{22}$/);
    assert.equal(Buffer.from(value, "base64url").length, 16);
  }
});

test("explicit same-family grant allows navigation and returns no member metadata", () => {
  assert.deepEqual(evaluate(), { mode: "authorized", destination: "learning", resourceId: "synthetic_learning" });
});
const rejected: Array<[string, unknown, unknown, unknown]> = [
  ["anonymous", null, record, locator],
  ["expired session", { ...session, expiresAt: now.toISOString() }, record, locator],
  ["password-only session", { ...session, assurance: "password" }, record, locator],
  ["unknown assurance", { ...session, assurance: "qr" }, record, locator],
  ["wrong family", session, { ...record, familyId: "another_family" }, locator],
  ["wrong actor", { ...session, actorId: "another_actor" }, record, locator],
  ["owner has no automatic override", { ...session, actorRole: "family_owner", actorId: "another_actor" }, record, locator],
  ["missing record", session, null, locator],
  ["revoked", session, { ...record, revokedAt: now.toISOString() }, locator],
  ["missing revocation status", session, { ...record, revokedAt: undefined }, locator],
  ["inactive", session, { ...record, status: "disabled" }, locator],
  ["expired locator", session, { ...record, expiresAt: now.toISOString() }, locator],
  ["future creation", session, { ...record, createdAt: "2026-10-01T12:01:00Z" }, locator],
  ["impossible date", session, { ...record, expiresAt: "2026-02-30T10:00:00Z" }, locator],
  ["missing expiration", session, { ...record, expiresAt: undefined }, locator],
  ["unknown destination", session, { ...record, destination: "admin" }, locator],
  ["URL destination", session, { ...record, destination: "https://evil.example" }, locator],
  ["resource traversal", session, { ...record, resourceId: "../credentials" }, locator],
  ["high sensitivity", session, { ...record, sensitivity: "high" }, locator],
  ["missing classification", session, { ...record, sensitivity: undefined }, locator],
  ["malformed ACL", session, { ...record, allowedMemberIds: [session.actorId, 1] }, locator],
  ["empty ACL", session, { ...record, allowedMemberIds: [] }, locator],
  ["unknown role", { ...session, actorRole: "superuser" }, record, locator],
  ["agent identity", { ...session, actorRole: "agent" }, record, locator],
  ["array record", session, [], locator],
  ["locator substitution", session, record, "B123456789012345678901"],
  ["query injection", session, record, locator + "?role=family_owner"],
  ["malformed locator", session, record, "../../secret"],
];
for (const [name, s, r, l] of rejected) test(name + " stays indistinguishably locked", () => assert.deepEqual(evaluate(s, r, l), evaluate(null)));
for (const actorRole of ["child_member", "teen_member"]) {
  test(actorRole + " can read explicitly approved learning", () => assert.equal(evaluate({ ...session, actorRole }).mode, "authorized"));
  for (const delta of [{ childApproved: false }, { sensitivity: "medium" }, { destination: "accounts" }, { destination: "documents" }, { destination: "memories" }]) {
    test(actorRole + " denied " + JSON.stringify(delta), () => assert.equal(evaluate({ ...session, actorRole }, { ...record, ...delta }).mode, "locked"));
  }
}
test("invalid clock fails closed", () => assert.equal(evaluateQrEntry({ locator, session, record, now: new Date(NaN) }).mode, "locked"));
test("same-origin URL contains only opaque routing locator", () => assert.equal(buildQrUrl("https://family.example.invalid", locator), "https://family.example.invalid/q/" + locator));
for (const origin of ["http://family.example.invalid", "https://x:y@family.example.invalid", "https://family.example.invalid/elsewhere", "https://family.example.invalid/?token=secret", "https://family.example.invalid/#secret", "https://family.example.invalid:8443", "javascript:alert(1)"]) {
  test("reject noncanonical origin " + origin, () => assert.throws(() => buildQrUrl(origin, locator)));
}
const ai = { age: 15, minimumAge: 13, policyCurrent: true, parentalConsentActive: true, accountOwnedByMember: true };
test("teen personal account with current policy and consent", () => assert.equal(evaluateConsumerAiAccess(ai), "personal_account"));
test("under minimum requires adult-led interaction, never account sharing", () => assert.equal(evaluateConsumerAiAccess({ ...ai, age: 12 }), "adult_led_only"));
test("higher local age threshold is honored", () => assert.equal(evaluateConsumerAiAccess({ ...ai, minimumAge: 16 }), "adult_led_only"));
for (const delta of [{ age: 15.5 }, { age: NaN }, { age: "15" }, { minimumAge: 0 }, { policyCurrent: false }, { parentalConsentActive: false }, { accountOwnedByMember: false }]) {
  test("AI access denies " + JSON.stringify(delta), () => assert.equal(evaluateConsumerAiAccess({ ...ai, ...delta }), "blocked"));
}
test("adult controls own account", () => assert.equal(evaluateConsumerAiAccess({ ...ai, age: 18, parentalConsentActive: false }), "personal_account"));
