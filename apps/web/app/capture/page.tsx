import CaptureCanvas from "./canvas";
export default function CapturePage() {
  return (
    <div className="shell page studio-page">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">THE CAPTURE CANVAS</span>
          <h1>Keep something meaningful.</h1>
          <p>
            A memory, a source, a principle. Start privately. Share
            deliberately.
          </p>
        </div>
      </div>
      <CaptureCanvas />
    </div>
  );
}
