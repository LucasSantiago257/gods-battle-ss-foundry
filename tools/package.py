"""Gera um ZIP instalável, sem dependências de desenvolvimento ou dados de usuário."""
from pathlib import Path
import json
import zipfile

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / "system.json").read_text(encoding="utf-8"))
dest = root / "dist"
dest.mkdir(exist_ok=True)
zip_path = dest / f"{manifest['id']}-{manifest['version']}.zip"
files = [root / "system.json", root / "README.md", root / "ATTRIBUTION.md"]
for folder in ("module", "templates", "styles", "assets", "lang", "docs"):
    files.extend(p for p in (root / folder).rglob("*") if p.is_file())
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(files):
        archive.write(file, str(Path(manifest["id"]) / file.relative_to(root)))
with zipfile.ZipFile(zip_path, "r") as archive:
    if archive.testzip() is not None:
        raise RuntimeError("ZIP inválido")
print(zip_path)
