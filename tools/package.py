"""Gera um ZIP instalável, sem dependências de desenvolvimento ou dados de usuário."""
from pathlib import Path
from urllib.parse import urlsplit
import argparse
import json
import zipfile
import hashlib

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--release", action="store_true", help="Prepara URLs de uma release do GitHub; não publica arquivos.")
parser.add_argument("--manifest-url", help="URL HTTPS pública do system.json em outra hospedagem.")
parser.add_argument("--download-url", help="URL HTTPS pública do ZIP em outra hospedagem.")
parser.add_argument("--output", type=Path, help="Pasta de saída; por padrão dist/.")
args = parser.parse_args()
if bool(args.manifest_url) != bool(args.download_url):
    parser.error("Forneça --manifest-url e --download-url juntos.")
if args.release and args.manifest_url:
    parser.error("Escolha --release ou as URLs personalizadas.")
manifest = json.loads((root / "system.json").read_text(encoding="utf-8"))
zip_name = f"{manifest['id']}-{manifest['version']}.zip"
if args.release:
    repo = manifest["url"].rstrip("/")
    manifest["manifest"] = f"{repo}/releases/latest/download/system.json"
    manifest["download"] = f"{repo}/releases/download/v{manifest['version']}/{zip_name}"
elif args.manifest_url:
    for url in (args.manifest_url, args.download_url):
        parts = urlsplit(url)
        if parts.scheme != "https" or not parts.netloc or parts.username or parts.password or parts.query or parts.fragment:
            parser.error("Use URLs HTTPS sem credenciais, parâmetros ou fragmentos.")
    manifest.update(manifest=args.manifest_url, download=args.download_url)
dest = args.output or root / "dist"
dest.mkdir(parents=True, exist_ok=True)
zip_path = dest / zip_name
manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
files = [root / "README.md", root / "ATTRIBUTION.md"]
if manifest.get("packs"):
    report_path = root / "dist" / "packs" / "build-report.json"
    if not report_path.exists():
        parser.error("Compile os compêndios com npm run packs antes de gerar o ZIP.")
    report = json.loads(report_path.read_text(encoding="utf-8"))
    inputs = [root / p for p in ("system.json", "module/catalog.mjs", "module/combat-examples.mjs", "tools/catalog.mjs", "tools/build-packs.mjs")]
    inputs.extend((root / "data/catalog").glob("*.json"))
    fingerprint = hashlib.sha256()
    for file in sorted(inputs, key=lambda p: p.relative_to(root).as_posix()):
        fingerprint.update(file.relative_to(root).as_posix().encode())
        fingerprint.update(file.read_bytes())
    if report["version"] != manifest["version"] or report["fingerprint"] != fingerprint.hexdigest():
        parser.error("Compêndios desatualizados. Execute npm run packs novamente.")
    files.append(root / "LICENSE-CONTENT.md")
for folder in ("module", "templates", "styles", "assets", "lang", "docs"):
    files.extend(p for p in (root / folder).rglob("*") if p.is_file())
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
    archive.writestr(f"{manifest['id']}/system.json", manifest_text)
    for file in sorted(files):
        archive.write(file, f"{manifest['id']}/{file.relative_to(root).as_posix()}")
    for pack in manifest.get("packs", []):
        pack_path = Path(pack["path"])
        if pack_path.parts != ("packs", pack["name"]):
            raise RuntimeError("Caminho de compêndio inválido")
        built = root / "dist" / pack_path
        pack_files = [p for p in built.iterdir() if p.is_file() and p.name != "LOCK"]
        if not any(p.name == "CURRENT" for p in pack_files) or not any(p.suffix == ".ldb" for p in pack_files):
            raise RuntimeError(f"Compêndio LevelDB incompleto: {pack['name']}")
        for file in sorted(pack_files):
            archive.write(file, f"{manifest['id']}/{pack_path.as_posix()}/{file.name}")
with zipfile.ZipFile(zip_path, "r") as archive:
    if archive.testzip() is not None:
        raise RuntimeError("ZIP inválido")
    if archive.read(f"{manifest['id']}/system.json").decode("utf-8") != manifest_text:
        raise RuntimeError("Manifesto do ZIP inconsistente")
(dest / "system.json").write_text(manifest_text, encoding="utf-8")
print(zip_path)
print(dest / "system.json")
