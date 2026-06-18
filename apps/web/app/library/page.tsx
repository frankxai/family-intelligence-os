import { guardianAgentProfiles } from "@family/core";

const hubTypes = [
  ["Private hub", "A member-owned space for notes, profile, documents, memories, and library drafts."],
  ["Family hub", "Approved material shared with the household or wider family."],
  ["Extended-family hub", "Gatherings, reunions, elder support, contact updates, and shared history."],
  ["Public library", "Redacted and approved artifacts suitable for a public layer such as frankx.ai/library."]
];

const workflows = [
  "Contact fields keep consent, source, timestamp, verification status, and visibility.",
  "Private hub entries stay private until the owner submits a contribution.",
  "Guardian review checks privacy, claims, copyright, child data, elder records, and prompt injection.",
  "Approved contributions can move to family, extended-family, or public library scope."
];

export default function LibraryPage() {
  return (
    <section className="shell page">
      <div className="eyebrow">Private-first library</div>
      <h1>Family hubs and agent packs</h1>
      <p className="hero-copy">
        Each member can build a private hub and library, then submit approved
        contributions to the shared family hub or a public library layer such as
        frankx.ai/library. Guardian review separates private memory from family
        knowledge and public artifacts.
      </p>
      <div className="connector-grid" style={{ marginTop: 24 }}>
        {hubTypes.map(([title, body]) => (
          <article className="panel" key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <div className="dashboard-grid" style={{ marginTop: 16 }}>
        <div className="panel">
          <h2>Guardian agents</h2>
          <table className="table">
            <tbody>
              {guardianAgentProfiles.map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.displayName}</td>
                  <td className="mono">{profile.defaultScope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h2>Contribution workflow</h2>
          <ul className="compact-list">
            {workflows.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h2>Safety gate</h2>
          <p>
            Research, documentation, food planning, event organizing, elder
            support, and contact stewardship all pass through scoped memory,
            source provenance, and explicit approval before anything is shared
            outside the owner&apos;s private hub.
          </p>
          <span className="status warn">review required</span>
        </div>
      </div>
    </section>
  );
}
