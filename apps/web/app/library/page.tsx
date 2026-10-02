import Link from "next/link";
import {
  BookOpen,
  Archive,
  ScrollText,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
const collections = [
  {
    title: "Stories & voices",
    icon: Archive,
    description:
      "Interviews, letters and memories, with the storyteller and original source kept together.",
    action: "Capture a story",
    href: "/capture",
  },
  {
    title: "Books & discoveries",
    icon: BookOpen,
    description:
      "Books, scans and research notes with page citations, processing rights and context.",
    action: "Explore the intake workflow",
    href: "/workflows",
  },
  {
    title: "Principles & practice",
    icon: ScrollText,
    description:
      "Your family's chosen principles, connected to the stories and experiences that give them meaning.",
    action: "Explore learning",
    href: "/learn",
  },
];
export default function LibraryPage() {
  return (
    <div className="shell page studio-page">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">THE LEGACY LIBRARY</span>
          <h1>Knowledge worth keeping.</h1>
          <p>
            A place for originals, context and the discoveries that connect
            generations.
          </p>
        </div>
        <Link className="button primary" href="/capture">
          Begin a collection <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="studio-banner">
        <ShieldCheck size={16} />
        <span>
          Template collections · 0 records · private archive not connected
        </span>
        <Link href="/setup">
          Set up storage <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="collection-grid">
        {collections.map((c) => (
          <section className="studio-card" key={c.title}>
            <c.icon size={26} />
            <h2>{c.title}</h2>
            <p>{c.description}</p>
            <span className="pill">STARTER COLLECTION</span>
            <p>
              <Link href={c.href} className="text-link">
                {c.action}
                <ArrowUpRight size={16} />
              </Link>
            </p>
          </section>
        ))}
      </div>
      <div className="section-title">
        <div>
          <span className="eyebrow">PRESERVE THE CONTEXT</span>
          <h2>Every source keeps its story.</h2>
        </div>
      </div>
      <div className="studio-bottom-grid">
        <section className="studio-card">
          <h2>Original → searchable copy → knowledge.</h2>
          <p>
            Keep the original intact. Link every transcription, OCR page and
            extracted claim back to it. Conflicting accounts remain visible for
            review.
          </p>
          <Link href="/graph" className="text-link">
            See the knowledge model <ArrowUpRight size={16} />
          </Link>
        </section>
        <section className="studio-card">
          <h2>Sharing begins with a decision.</h2>
          <p>
            Member, family and advisor collections need separate grants.
            Publication requires a separately reviewed, sanitized copy. A
            source's presence in the library does not grant permission to share
            it.
          </p>
          <Link href="/setup" className="text-link">
            Review the foundation <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}
