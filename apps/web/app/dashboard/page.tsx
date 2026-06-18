import { connectorManifests } from "@family/connectors";

const members = [
  ["Frank", "family_owner"],
  ["Family Admin", "family_admin"],
  ["Agent Runtime", "agent"]
];

const audit = [
  ["search_family_docs", "blocked", "critical connector not configured"],
  ["get_household_tasks", "success", "read-only stub"],
  ["prepare_emergency_pack", "requires_confirmation", "critical export"]
];

export default function DashboardPage() {
  const highPriority = connectorManifests.filter((connector) => connector.mvpPriority >= 4);

  return (
    <section className="shell page">
      <div className="eyebrow">Family overview</div>
      <h1>Dashboard</h1>
      <div className="dashboard-grid">
        <div className="panel">
          <h3>Members</h3>
          <div className="metric">{members.length}</div>
          <p>Owner, admin, and controlled agent contexts are modeled.</p>
        </div>
        <div className="panel">
          <h3>High-priority connectors</h3>
          <div className="metric">{highPriority.length}</div>
          <p>Ready as manifest-backed read-only integration targets.</p>
        </div>
        <div className="panel">
          <h3>Security mode</h3>
          <div className="metric">deny</div>
          <p>Unknown action and sensitivity default to blocked.</p>
        </div>
      </div>
      <div className="dashboard-grid" style={{ marginTop: 16 }}>
        <div className="panel">
          <h2>Members</h2>
          <table className="table">
            <tbody>
              {members.map(([name, role]) => (
                <tr key={role}>
                  <td>{name}</td>
                  <td className="mono">{role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h2>Weekly review</h2>
          <p>
            Review calendar risks, overdue tasks, document changes, finance
            summary shifts, relationship dates, family memories, and open
            decisions.
          </p>
          <span className="status warn">draft only</span>
        </div>
        <div className="panel">
          <h2>Recent audit</h2>
          <table className="table">
            <tbody>
              {audit.map(([action, result, reason]) => (
                <tr key={action}>
                  <td className="mono">{action}</td>
                  <td>{result}</td>
                  <td>{reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

