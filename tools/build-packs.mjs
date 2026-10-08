import {mkdir, readFile, writeFile, rm} from "node:fs/promises";
import path from "node:path";
import {compilePack} from "@foundryvtt/foundryvtt-cli";
import {CATALOG_PACKS} from "../module/catalog.mjs";
import {readCatalog, packDocuments, catalogFingerprint} from "./catalog.mjs";

const root = path.resolve("dist");
function insideDist(relative) {
  const target = path.resolve(root, relative), check = path.relative(root, target);
  if (!check || check.startsWith("..") || path.isAbsolute(check)) throw Error("Diretório de compilação fora de dist.");
  return target;
}
const report = [];
for (const pack of CATALOG_PACKS) {
  const source = insideDist(`pack-sources/${pack.name}`), dest = insideDist(`packs/${pack.name}`);
  await rm(source, {recursive: true, force: true});
  await mkdir(source, {recursive: true});
  const entries = await readCatalog(pack);
  for (const entry of packDocuments(entries)) await writeFile(path.join(source, `${entry._id}.json`), JSON.stringify(entry), "utf8");
  await compilePack(source, dest);
  report.push({name: pack.name, items: entries.length});
}
const manifest = JSON.parse(await readFile("system.json", "utf8"));
await writeFile(insideDist("packs/build-report.json"), JSON.stringify({version: manifest.version, fingerprint: await catalogFingerprint(), packs: report}, null, 2));
console.log(JSON.stringify({packs: report, total: report.reduce((n, p) => n + p.items, 0)}));
