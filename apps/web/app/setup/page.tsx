import { runtimeProfiles, vercelDeployUrl } from "../../lib/studio";
import { ShieldCheck, ArrowUpRight, KeyRound } from "lucide-react";
const steps = [
  "Deploy the template workspace",
  "Choose your private identity provider",
  "Connect family-owned encrypted storage",
  "Assign family stewards and guardians",
  "Test a scoped capture and an isolated restore",
  "Connect the AI interfaces your family chooses",
];
export default function SetupPage() {
  return (
    <div className="shell page studio-page">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">A PRIVATE HOME, ON YOUR TERMS</span>
          <h1>Own the foundation.</h1>
          <p>
            Your archive, access rules and recovery keys stay independent of the
            AI interface.
          </p>
        </div>
      </div>
      <div className="setup-grid">
        <section className="legacy-hero setup-hero">
          <ShieldCheck size={32} />
          <h2>
            Start beautifully.
            <br />
            Activate deliberately.
          </h2>
          <p>
            The template deploys with zero family records. Connect private
            services before inviting your family.
          </p>
          <a className="button light" href={vercelDeployUrl}>
            Deploy template on Vercel <ArrowUpRight size={16} />
          </a>
          <a
            className="text-link inverse"
            href="https://github.com/frankxai/family-intelligence-os/blob/codex/family-intelligence-2026-10-02/infra/railway/README.md"
          >
            Railway deployment guide <ArrowUpRight size={16} />
          </a>
        </section>
        <section className="studio-card">
          <h2>A considered beginning.</h2>
          <ol className="setup-steps">
            {steps.map((s, i) => (
              <li key={s}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {s}
              </li>
            ))}
          </ol>
        </section>
      </div>
      <div className="section-title">
        <div>
          <span className="eyebrow">THE INTERFACE LAYER</span>
          <h2>Choose the way you work.</h2>
        </div>
      </div>
      <div className="runtime-grid">
        {runtimeProfiles.map((r) => (
          <section className="studio-card" key={r.id}>
            <span className="pill">{r.status}</span>
            <h2>{r.name}</h2>
            <p>{r.purpose}</p>
            <dl>
              <dt>Deployment</dt>
              <dd>{r.mode}</dd>
              <dt>Connection</dt>
              <dd>{r.transport}</dd>
            </dl>
          </section>
        ))}
      </div>
      <section className="studio-card principle-note">
        <KeyRound size={25} />
        <h2>Access is a family responsibility.</h2>
        <p>
          Use individual identities, passkeys and short-lived permissions. Keep
          technical administration separate from permission to read the archive.
          Hardware-backed keys and a tested trustee recovery process belong in
          the vault design; a wallet signature alone cannot confer archive
          membership.
        </p>
        <p>
          Family-scoped OAuth, remote MCP and encrypted vault adapters require
          provisioning and independent verification before activation.
        </p>
        <a
          className="text-link"
          href="https://github.com/frankxai/family-intelligence-os/blob/codex/family-intelligence-2026-10-02/docs/sovereign-family-workspace.md"
        >
          Read the architecture <ArrowUpRight size={16} />
        </a>
      </section>
    </div>
  );
}
