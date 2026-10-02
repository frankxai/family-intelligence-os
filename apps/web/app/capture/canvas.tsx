"use client";
import { useState } from "react";
import {
  Download,
  Feather,
  FileText,
  Fingerprint,
  LockKeyhole,
} from "lucide-react";
const kinds = [
  {
    id: "memory",
    label: "A memory",
    icon: Feather,
    prompt: "What happened, who told the story, and what made it matter?",
  },
  {
    id: "document",
    label: "A source",
    icon: FileText,
    prompt:
      "Describe the original, its owner, and the page or location of the evidence.",
  },
  {
    id: "principle",
    label: "A principle",
    icon: Fingerprint,
    prompt:
      "What do we choose to live by? Describe a real example and whose view this represents.",
  },
] as const;
export default function CaptureCanvas() {
  const [kind, setKind] = useState<(typeof kinds)[number]["id"]>("memory");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [source, setSource] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const selected = kinds.find((k) => k.id === kind)!;
  function download() {
    const draft = {
      schemaVersion: "1.0",
      kind,
      title: title.trim(),
      body: body.trim(),
      source: source.trim(),
      visibility: "private",
      status: "draft",
      tenantId: null,
      ownerId: null,
      consentStatus: "not_recorded",
      createdAt: new Date().toISOString(),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "family-private-draft.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  }
  return (
    <div className="capture-grid">
      <section className="studio-card">
        <div className="capture-tabs" role="group" aria-label="Capture type">
          {kinds.map((k) => (
            <button
              key={k.id}
              className={kind === k.id ? "selected" : ""}
              aria-pressed={kind === k.id}
              onClick={() => {
                setKind(k.id);
                setDownloaded(false);
              }}
            >
              <k.icon size={16} />
              {k.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            download();
          }}
          onChange={() => setDownloaded(false)}
        >
          <label htmlFor="capture-title">Give it a title</label>
          <input
            id="capture-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A story worth keeping"
            maxLength={200}
            required
          />
          <label htmlFor="capture-body">{selected.prompt}</label>
          <textarea
            id="capture-body"
            rows={9}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Let the original voice lead…"
            maxLength={20000}
            required
          />
          <label htmlFor="capture-source">
            Source or storyteller reference
          </label>
          <input
            id="capture-source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Recording timestamp, page reference or source note"
            maxLength={1000}
          />
          <div className="capture-actions">
            <button
              type="submit"
              className="button primary"
              disabled={!title.trim() || !body.trim()}
            >
              <Download size={16} />
              Download private draft
            </button>
            <span className="pill">Private · draft</span>
          </div>
          <p className="microcopy" role="status">
            {downloaded
              ? "Draft downloaded. It has not been saved to the family vault."
              : "This canvas stays in memory in this tab. Reloading clears it. Downloading creates a local, unencrypted file; keep it in your private storage."}
          </p>
        </form>
      </section>
      <aside className="studio-card capture-help">
        <LockKeyhole size={25} />
        <h2>The original comes first.</h2>
        <p>
          Keep the recording, scan or letter. A summary helps you find a story;
          it cannot replace its source.
        </p>
        <h3>A gentle interview</h3>
        <ol>
          <li>Tell me about a turning point.</li>
          <li>Which tradition should we keep?</li>
          <li>What did experience teach you?</li>
          <li>What would you like the next generation to know?</li>
        </ol>
        <div className="studio-note">
          Vault saving, voice capture and scanned-file processing become
          available when the private identity, consent and storage adapters are
          connected.
        </div>
      </aside>
    </div>
  );
}
