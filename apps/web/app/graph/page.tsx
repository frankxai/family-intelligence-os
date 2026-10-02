import { Network, ArrowUpRight } from "lucide-react";
const nodes = [
  { x: 290, y: 100, label: "A family story", type: "Testimony" },
  { x: 110, y: 240, label: "Original recording", type: "Evidence" },
  { x: 470, y: 240, label: "A guiding principle", type: "Family belief" },
  { x: 175, y: 380, label: "A source-linked claim", type: "Candidate" },
  {
    x: 415,
    y: 380,
    label: "A learning activity",
    type: "Guardian-reviewed draft",
  },
];
export default function GraphPage() {
  return (
    <div className="shell page studio-page">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">THE KNOWLEDGE GRAPH</span>
          <h1>Connected. Never flattened.</h1>
          <p>
            Stories retain their sources. Claims retain their uncertainty.
            Principles retain their authors.
          </p>
        </div>
        <Network size={28} />
      </div>
      <div className="graph-grid">
        <section className="studio-card graph-canvas">
          <span className="pill">Illustrative graph · synthetic labels</span>
          <svg
            viewBox="0 0 580 460"
            role="img"
            aria-label="A synthetic family story linked to original evidence, a candidate claim, a family principle and a learning activity"
          >
            <g stroke="#b7c3ba" strokeWidth="1.5" fill="none">
              <path d="M290 100L110 240L175 380M290 100L470 240L415 380M110 240L470 240" />
            </g>
            {nodes.map((n) => (
              <g key={n.label}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r="36"
                  fill="#f1f4ed"
                  stroke="#799585"
                />
                <circle cx={n.x} cy={n.y} r="5" fill="#386553" />
                <text
                  x={n.x}
                  y={n.y + 56}
                  textAnchor="middle"
                  fill="#243d37"
                  fontSize="14"
                  fontWeight="600"
                >
                  {n.label}
                </text>
                <text
                  x={n.x}
                  y={n.y + 74}
                  textAnchor="middle"
                  fill="#66746d"
                  fontSize="11"
                >
                  {n.type}
                </text>
              </g>
            ))}
          </svg>
        </section>
        <section className="studio-card">
          <h2>A graph of evidence.</h2>
          <p>
            The contract describes people, artifacts, testimony, claims,
            principles, lessons and consent references. A connection never
            grants access.
          </p>
          <ul className="studio-list">
            <li>Tenant and scope on every record</li>
            <li>Evidence required for factual connections</li>
            <li>No identity merge from resemblance</li>
            <li>Children excluded from public projection</li>
            <li>Contradictions preserved for human review</li>
            <li>Retrieval filters before search and generation</li>
          </ul>
          <a
            href="https://github.com/frankxai/family-intelligence-os/tree/codex/family-intelligence-2026-10-02/packages/family-knowledge"
            className="text-link"
          >
            View the graph contract <ArrowUpRight size={16} />
          </a>
          <div className="studio-note">
            An illustration of the model. No private data is loaded; a graph
            database is not connected.
          </div>
        </section>
      </div>
    </div>
  );
}
