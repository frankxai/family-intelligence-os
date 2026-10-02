import Link from "next/link";
import { Compass, Sprout, Hammer, ArrowUpRight } from "lucide-react";
const paths = [
  {
    title: "Curiosity & truth",
    icon: Compass,
    question: "How do we know what we know?",
    activity:
      "Choose an approved family story. Compare the account with its original source. Record one question the source leaves open.",
    source: "An approved story + its original evidence",
  },
  {
    title: "Stewardship & care",
    icon: Sprout,
    question: "What do we choose to care for?",
    activity:
      "Ask a guardian to choose an object, plant or shared place. Make a small care plan and reflect together on responsibility.",
    source: "A family-approved principle",
  },
  {
    title: "Craft & contribution",
    icon: Hammer,
    question: "What can we make for someone else?",
    activity:
      "Create a drawing, recipe or practical object with an adult. Keep a note about the process and what you would change.",
    source: "A guardian-selected skill or tradition",
  },
];
export default function LearnPage() {
  return (
    <div className="shell page studio-page">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">THE NEXT GENERATION</span>
          <h1>Wisdom becomes experience.</h1>
          <p>
            Family principles come alive through questions, practice and time
            together.
          </p>
        </div>
      </div>
      <div className="studio-banner">
        Example learning cards · a guardian chooses the audience, sources and
        final activity.
      </div>
      <div className="learning-grid">
        {paths.map((p) => (
          <section className="studio-card learning-card" key={p.title}>
            <p.icon size={28} />
            <span className="eyebrow">A SHARED EXPLORATION</span>
            <h2>{p.title}</h2>
            <h3>{p.question}</h3>
            <p>{p.activity}</p>
            <div className="lesson-source">Source to choose: {p.source}</div>
            <Link href="/capture" className="text-link">
              Keep the reflection <ArrowUpRight size={16} />
            </Link>
          </section>
        ))}
      </div>
      <div className="studio-card principle-note">
        <h2>Your family writes its own principles.</h2>
        <p>
          These examples are starting points. Record who proposed each
          principle, who agreed, when it changed, and how it is practiced.
          Children can ask questions without being assessed, profiled or
          monitored by an agent.
        </p>
        <Link href="/capture" className="button">
          Draft a principle
        </Link>
      </div>
    </div>
  );
}
