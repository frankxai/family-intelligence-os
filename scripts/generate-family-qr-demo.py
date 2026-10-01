"""Generate inactive example QR SVGs and fill the self-contained prototype.

Developer dependency: ReportLab (installed in the artifact runtime).
No runtime dependency, family information, credential, or working invitation.
The locator is deliberately a fixed synthetic example; production issuance must
use a CSPRNG with at least 128 bits and persist server-owned routing/ACL records.
"""
import json
import re
from pathlib import Path
from reportlab.graphics.barcode.qrencoder import QRCode, QRErrorCorrectLevel

root = Path(__file__).resolve().parents[1]
out = root / "docs/family-qr"
cards = [
    ("household", "Everyday life", "On the kitchen wall: routines, instructions and household help.", "A123456789012345678901"),
    ("learning", "Little discoveries", "At the study desk: reviewed learning cards and adult-led exploration.", "B123456789012345678901"),
    ("values", "What matters to us", "At the family table: your charter, stories and conversation cards.", "C123456789012345678901"),
    ("documents", "Find the useful thing", "In the document folder: personal sign-in and record-specific access.", "D123456789012345678901"),
]
data = []
for key, title, description, locator in cards:
    url = "https://family.example.invalid/q/" + locator
    code = QRCode(version=None, errorCorrectLevel=QRErrorCorrectLevel.Q)
    code.addData(url)
    code.make()
    n = len(code.modules)
    # Full four-module quiet zone; monochrome, no logo or module distortion.
    path_data = "".join(f'M{x+4},{y+4}h1v1h-1z' for y,row in enumerate(code.modules) for x,bit in enumerate(row) if bit)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n+8} {n+8}" role="img" aria-label="Inactive sample QR for {title}"><rect width="100%" height="100%" fill="white"/><path fill="black" shape-rendering="crispEdges" d="{path_data}"/></svg>'
    (out / f"{key}-SAMPLE.svg").write_text(svg)
    data.append(dict(id=key,title=title,description=description,url=url,svg=svg))
(out / "qr-samples.json").write_text(json.dumps([{k: v for k, v in card.items() if k != "svg"} for card in data],indent=2)+"\n")
template = out / "PROTOTYPE.html"
content = template.read_text()
replacement = "const qrCards = " + json.dumps(data) + ";"
content, count = re.subn(r"^const qrCards = .*;$", lambda _: replacement, content, count=1, flags=re.MULTILINE)
if count != 1:
    raise SystemExit("Missing QR data marker.")
template.write_text(content)
print("Generated four inactive QR cards and embedded them in PROTOTYPE.html")
