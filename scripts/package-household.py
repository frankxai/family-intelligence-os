"""Build the clean founder download from the same manifest as a private repo export."""
import argparse
import subprocess
import tempfile
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

parser = argparse.ArgumentParser()
parser.add_argument("output", type=Path)
output = parser.parse_args().output.resolve()
starter = Path(__file__).resolve().parents[1] / "templates" / "household-starter"
with tempfile.TemporaryDirectory() as tmp:
    target = Path(tmp) / "household-starter"
    subprocess.run(["node", str(starter / "founder.mjs"), str(target)], check=True)
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, "w") as archive:
        for file in sorted(target.rglob("*")):
            if file.is_file():
                info = ZipInfo("household-starter/" + file.relative_to(target).as_posix(), (2026, 11, 4, 0, 0, 0))
                info.external_attr = 0o100644 << 16
                archive.writestr(info, file.read_bytes(), compress_type=ZIP_DEFLATED)
