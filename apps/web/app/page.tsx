import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

const signals = [
  ["Documents", "Paperless-ready archive search"],
  ["Memory", "Immich and family story surfaces"],
  ["Relationships", "Monica-style family CRM"],
  ["Operations", "Household tasks, food, and calendar"]
];

export default function HomePage() {
  return (
    <section className="shell page hero">
      <div>
        <div className="eyebrow">Sovereign family infrastructure</div>
        <h1>Private AI-powered family operating system</h1>
        <p className="hero-copy">
          A controlled orchestration layer for the family vault, relationships,
          documents, memories, household operations, finance summaries, and
          emergency readiness. It integrates capabilities through adapters rather
          than absorbing upstream apps.
        </p>
        <div className="actions">
          <Link className="button primary" href="/dashboard">
            <ArrowRight size={18} aria-hidden="true" />
            Open dashboard
          </Link>
          <Link className="button" href="/security">
            <ShieldCheck size={18} aria-hidden="true" />
            Review security
          </Link>
        </div>
      </div>
      <div className="panel">
        <h2>Operating signals</h2>
        <div className="signal-grid">
          {signals.map(([label, value]) => (
            <div className="panel" key={label}>
              <h3>{label}</h3>
              <p>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

