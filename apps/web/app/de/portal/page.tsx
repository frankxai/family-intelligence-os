import type { Metadata } from "next";
import { ArrowRight, CircleDot, Clock3, FileWarning, Fingerprint, LockKeyhole, ShieldAlert, ShieldCheck, UsersRound } from "lucide-react";
import { resolvePortalAccess } from "@family/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Familienportal | Family Intelligence OS",
  description: "Privater, deutschsprachiger Arbeitsbereich für Familienwissen, Einwilligungen und Kontinuität.",
  robots: { index: false, follow: false, nocache: true }
};

const circles = [
  ["Ich", "Nur persönliche Notizen und Anweisungen"],
  ["Haushalt", "Menschen, die den Alltag miteinander teilen"],
  ["Engster Kreis", "Vertrauenspersonen mit genau definiertem Zugriff"],
  ["Erweiterte Familie", "Verwandtschaft, Geschichten und gemeinsame Termine"],
  ["Nachkommen & Patenschaften", "Geschützte Begleitung mit altersgerechten Rechten"],
  ["Vertrauenspersonen", "Befristeter, zweckgebundener Zugang für fachliche Hilfe"],
  ["Öffentliches Archiv", "Nur einzeln freigegebene, redigierte Inhalte"]
] as const;

const queue = [
  ["Neue Aussage", "0", "Muss als Behauptung geprüft werden"],
  ["Einwilligung offen", "0", "Ohne Freigabe keine Weitergabe"],
  ["Quellenprüfung", "0", "Beleg, Herkunft und Nutzungsrecht prüfen"],
  ["Sicherer Eingang", "0", "Einmal-Link, Quarantäne und Scanstatus prüfen"],
  ["Kontinuitätsprüfung", "0", "Menschliche Entscheidung und Guardian-Quorum"]
] as const;

const intakeSteps = ["Einmal-Link", "Quarantäne", "Datei- & Malware-Prüfung", "Steward-Entscheidung"] as const;
const continuitySteps = ["Notfall", "Handlungsunfähigkeit", "Tod"] as const;

export default function GermanFamilyPortalPage() {
  const access = resolvePortalAccess({
    nodeEnv: process.env.NODE_ENV,
    demoEnabled: process.env.FAMILY_PORTAL_DEMO === "true",
    authConfigured: process.env.FAMILY_AUTH_CONFIGURED === "true",
    session: null
  });
  const accessReasonDe = access.mode === "authorized"
    ? "Authentifizierte, familiengebundene Sitzung."
    : access.mode === "demo"
      ? "Synthetische Vorschau; es werden keine Familiendatensätze geladen."
      : "Persönliche Authentifizierung und eine familiengebundene Sitzung sind erforderlich.";

  if (access.mode === "locked") {
    return (
      <section className="shell page portal-lock" lang="de">
        <div className="lock-card">
          <div className="icon-disc"><LockKeyhole size={24} aria-hidden="true" /></div>
          <p className="kicker">Privater Bereich</p>
          <h1>Dieses Familienportal ist sicher verschlossen.</h1>
          <p className="hero-copy">
            Es werden keine Familiendaten geladen. Der Zugang wird erst geöffnet, wenn persönliche
            Konten, Familienzuordnung, Wiederherstellung und Protokollierung vollständig eingerichtet sind.
          </p>
          <div className="notice"><ShieldCheck size={18} aria-hidden="true" /> {accessReasonDe}</div>
          <span className="button" aria-disabled="true">
            Persönliche Einladung erforderlich <ArrowRight size={17} aria-hidden="true" />
          </span>
          <p className="microcopy">Ein verifizierter Familien-Steward richtet persönliche Konten und Einladungen ein.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="shell page portal-page" lang="de">
      <div className="portal-hero">
        <div>
          <p className="kicker">Familienportal · synthetische Vorschau</p>
          <h1>Wissen bewahren. Nähe organisieren. Zugriff verantwortlich weitergeben.</h1>
          <p className="hero-copy">
            Hier arbeitet eine Familie mit Erinnerungen, Quellen, Aufgaben und Notfallvorsorge –
            getrennt nach Kreisen, mit Einwilligung und menschlicher Entscheidungshoheit.
          </p>
        </div>
        <div className="privacy-seal">
          <ShieldCheck size={28} aria-hidden="true" />
          <strong>Keine echten Familiendaten</strong>
          <span>{accessReasonDe}</span>
        </div>
      </div>

      <div className="portal-section-heading">
        <div><p className="kicker">Zugriffsmodell</p><h2>Sieben getrennte Familienkreise</h2></div>
        <p>Verwandtschaft, Haushalt, Patenschaft, Guardian-Rolle und Zugriff bleiben getrennte Beziehungen.</p>
      </div>
      <div className="circle-grid">
        {circles.map(([title, description], index) => (
          <article className="circle-card" key={title}>
            <span className="circle-index">0{index + 1}</span>
            <CircleDot size={19} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>

      <div className="portal-section-heading review-heading">
        <div><p className="kicker">Steward-Arbeit</p><h2>Heute zu prüfen</h2></div>
        <div className="status"><Clock3 size={14} aria-hidden="true" /> Vorschau leer</div>
      </div>
      <div className="review-list">
        {queue.map(([title, count, description]) => (
          <article className="review-row" key={title}>
            <UsersRound size={19} aria-hidden="true" />
            <div><h3>{title}</h3><p>{description}</p></div>
            <strong>{count}</strong>
          </article>
        ))}
      </div>

      <div className="portal-control-grid">
        <article className="control-panel">
          <div className="control-heading">
            <FileWarning size={22} aria-hidden="true" />
            <div><p className="kicker">Mitmachen</p><h2>Sicherer Eingang</h2></div>
          </div>
          <p>Kein aktiver Upload: Der Adapter bleibt geschlossen, bis Token, Speicherung, Scan und Audit verbunden sind.</p>
          <ol className="control-steps">
            {intakeSteps.map((step, index) => (
              <li key={step}><span>0{index + 1}</span>{step}</li>
            ))}
          </ol>
          <div className="status-chip status-chip-waiting"><Fingerprint size={14} aria-hidden="true" /> Privater Adapter fehlt</div>
        </article>

        <article className="control-panel">
          <div className="control-heading">
            <ShieldAlert size={22} aria-hidden="true" />
            <div><p className="kicker">Kontinuität</p><h2>Drei getrennte Protokolle</h2></div>
          </div>
          <p>Kein Timer und kein Agent darf allein freigeben. Jeder Weg braucht Nachweis, Wartezeit, menschliches Quorum und begrenzte Endfreigabe.</p>
          <ol className="control-steps">
            {continuitySteps.map((step, index) => (
              <li key={step}><span>0{index + 1}</span>{step}</li>
            ))}
          </ol>
          <div className="status-chip status-chip-blocked"><LockKeyhole size={14} aria-hidden="true" /> Autonome Freigabe blockiert</div>
        </article>
      </div>
    </section>
  );
}
