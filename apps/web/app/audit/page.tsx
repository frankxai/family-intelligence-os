const rows = [
  {
    action: "search_family_docs",
    actor: "agent",
    result: "blocked",
    sensitivity: "critical",
    reason: "paperless connector not configured"
  },
  {
    action: "get_home_status",
    actor: "service",
    result: "success",
    sensitivity: "high",
    reason: "read-only stub"
  },
  {
    action: "prepare_emergency_pack",
    actor: "family_owner",
    result: "requires_confirmation",
    sensitivity: "critical",
    reason: "critical export workflow"
  }
];

export default function AuditPage() {
  return (
    <section className="shell page">
      <div className="eyebrow">Operational record</div>
      <h1>Audit</h1>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Actor</th>
              <th>Result</th>
              <th>Sensitivity</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.action}>
                <td className="mono">{row.action}</td>
                <td>{row.actor}</td>
                <td>{row.result}</td>
                <td>{row.sensitivity}</td>
                <td>{row.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

