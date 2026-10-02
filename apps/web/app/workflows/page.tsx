import { workflows } from "../../lib/studio";
import { Workflow, ArrowUpRight } from "lucide-react";
export default function WorkflowsPage() {
  return (
    <div className="shell page studio-page">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">THE FAMILY AGENT TEAM</span>
          <h1>Thoughtful work. Human authority.</h1>
          <p>
            Small, bounded teams prepare the work your family wants to review.
          </p>
        </div>
        <Workflow size={28} />
      </div>
      <div className="studio-banner">
        Workflow definitions are ready to adopt. Private processing and
        recurring runs remain disabled until deployment authorization is
        connected.
      </div>
      <div className="workflow-grid">
        {workflows.map((w) => (
          <section className="studio-card workflow-card" key={w.id}>
            <span className="eyebrow">{w.agents.join(" · ")}</span>
            <h2>{w.name}</h2>
            <p>{w.output}</p>
            <dl>
              <dt>Starts with</dt>
              <dd>{w.trigger}</dd>
              <dt>Human gate</dt>
              <dd>{w.gate}</dd>
            </dl>
            <details>
              <summary>Explore the workflow</summary>
              <ol>
                {w.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </details>
          </section>
        ))}
      </div>
      <a
        className="text-link"
        href="https://github.com/frankxai/family-intelligence-os/tree/codex/family-intelligence-2026-10-02/workflows"
      >
        Open the portable workflow pack <ArrowUpRight size={16} />
      </a>
    </div>
  );
}
