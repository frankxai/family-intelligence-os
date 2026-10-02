import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Fingerprint,
  Sparkles,
  ShieldCheck,
  ScanLine,
  Network,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { workflows, runtimeProfiles } from "../../lib/studio";
const collections = [
  {
    title: "The family archive",
    subtitle: "Stories, letters & photographs",
    icon: BookOpen,
    color: "sage",
    href: "/capture",
  },
  {
    title: "Our guiding principles",
    subtitle: "Values made practical",
    icon: Fingerprint,
    color: "sand",
    href: "/learn",
  },
  {
    title: "The next generation",
    subtitle: "Curiosity, craft & discovery",
    icon: GraduationCap,
    color: "blue",
    href: "/learn",
  },
];
export default function DashboardPage() {
  return (
    <div className="shell page studio-page">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">YOUR FAMILY, THROUGH TIME</span>
          <h1>A home for what matters.</h1>
          <p>
            Preserve the stories. Connect the knowledge. Pass on the wisdom.
          </p>
        </div>
        <Link href="/capture" className="button primary">
          <Sparkles size={16} />
          Capture a memory
        </Link>
      </div>
      <div className="studio-banner">
        <ShieldCheck size={16} />
        <span>Template workspace · no family records connected</span>
        <Link href="/setup">
          Set up your private home <ArrowRight size={14} />
        </Link>
      </div>
      <div className="studio-feature-grid">
        <section className="legacy-hero">
          <span className="hero-small">THE LEGACY LIBRARY</span>
          <h2>
            Every family has a story.
            <br />
            Give yours a future.
          </h2>
          <p>
            A letter. A lesson. A voice you never want to forget.
            <br />
            Start with one thing worth keeping.
          </p>
          <Link href="/capture" className="button light">
            Begin your archive <ArrowUpRight size={16} />
          </Link>
          <div className="legacy-orbits" aria-hidden="true">
            <i />
            <i />
            <i />
            <b>✦</b>
          </div>
          <span className="hero-caption">
            OWNED BY YOUR FAMILY. BUILT TO LAST.
          </span>
        </section>
        <section className="studio-card getting-started">
          <div className="card-top">
            <span className="eyebrow">A GOOD BEGINNING</span>
            <ScanLine size={19} />
          </div>
          <h2>
            One story.
            <br />
            Three generations.
          </h2>
          <p>
            Use the first interview to capture a turning point, a tradition, and
            something worth passing on.
          </p>
          <ol>
            <li>Choose the storyteller</li>
            <li>Keep the original recording</li>
            <li>Review together before sharing</li>
          </ol>
          <Link className="text-link" href="/capture">
            Open the interview canvas <ArrowRight size={16} />
          </Link>
        </section>
      </div>
      <div className="section-title">
        <div>
          <span className="eyebrow">YOUR KNOWLEDGE SPACES</span>
          <h2>A library with a living purpose.</h2>
        </div>
        <Link href="/library" className="text-link">
          Explore the library <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="collection-grid">
        {collections.map((c) => (
          <Link
            className={"collection-card " + c.color}
            href={c.href}
            key={c.title}
          >
            <span className="collection-icon">
              <c.icon size={23} />
            </span>
            <ArrowUpRight className="collection-arrow" size={18} />
            <h3>{c.title}</h3>
            <p>{c.subtitle}</p>
            <span className="collection-footer">
              STARTER COLLECTION · 0 RECORDS
            </span>
          </Link>
        ))}
      </div>
      <div className="studio-bottom-grid">
        <section className="studio-card">
          <div className="card-top">
            <h2>Quiet intelligence.</h2>
            <Network size={20} />
          </div>
          <p>Your agent team prepares. Your family decides.</p>
          {workflows.slice(0, 3).map((w) => (
            <Link className="workflow-row" href="/workflows" key={w.id}>
              <span className="workflow-dot" />
              <div>
                <strong>{w.name}</strong>
                <small>{w.agents.join(" → ")}</small>
              </div>
              <span className="pill">Pack ready</span>
            </Link>
          ))}
          <Link className="text-link" href="/workflows">
            Explore {workflows.length} workflow packs <ArrowRight size={16} />
          </Link>
        </section>
        <section className="studio-card">
          <div className="card-top">
            <h2>Your AI. Your choice.</h2>
            <ShieldCheck size={20} />
          </div>
          <p>One family archive. Multiple trusted interfaces.</p>
          <div className="runtime-chips">
            {runtimeProfiles.map((r) => (
              <Link key={r.id} href="/setup">
                {r.name}
                <ArrowUpRight size={12} />
              </Link>
            ))}
          </div>
          <div className="studio-note">
            Connection guides are available. Live private integrations require a
            verified family identity and scoped access.
          </div>
        </section>
      </div>
    </div>
  );
}
