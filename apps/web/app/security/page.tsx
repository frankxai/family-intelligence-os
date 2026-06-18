const controls = [
  ["Read-only first", "Write and export tools are blocked or confirmation-required."],
  ["Static MCP tools", "No dynamic untrusted tool loading in the gateway."],
  ["Audit everything", "Success, failure, blocked, and confirmation-required outcomes are events."],
  ["Child data protection", "Child, medical, legal, finance, and credential data are high-risk."],
  ["Local-first option", "Raw sensitive data should remain in family-owned systems."]
];

export default function SecurityPage() {
  return (
    <section className="shell page">
      <div className="eyebrow">Security posture</div>
      <h1>Security</h1>
      <div className="connector-grid">
        {controls.map(([title, body]) => (
          <article className="panel" key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

