import { connectorManifests } from "@family/connectors";

export default function ConnectorsPage() {
  return (
    <section className="shell page">
      <div className="eyebrow">Adapter registry</div>
      <h1>Connectors</h1>
      <div className="connector-grid">
        {connectorManifests.map((connector) => (
          <article className="panel" key={connector.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
              <h2>{connector.name}</h2>
              <span className="status">{connector.mvpStatus}</span>
            </div>
            <p>{connector.description}</p>
            <table className="table">
              <tbody>
                <tr>
                  <th>Category</th>
                  <td className="mono">{connector.category}</td>
                </tr>
                <tr>
                  <th>Sensitivity</th>
                  <td>{connector.dataSensitivity}</td>
                </tr>
                <tr>
                  <th>Mode</th>
                  <td>{connector.deploymentModes.join(", ")}</td>
                </tr>
                <tr>
                  <th>Capabilities</th>
                  <td>{connector.capabilities.map((capability) => capability.id).join(", ")}</td>
                </tr>
              </tbody>
            </table>
          </article>
        ))}
      </div>
    </section>
  );
}

