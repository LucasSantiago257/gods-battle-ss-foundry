import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {CATALOG_PACKS} from "../module/catalog.mjs";

export async function readCatalog(pack) {
  return (await Promise.all(pack.sources.map(async source => JSON.parse(await readFile(`data/catalog/${source}.json`, "utf8"))))).flat();
}
export async function catalogFingerprint() {
  const hash = createHash("sha256");
  for (const file of ["system.json", "module/catalog.mjs", "module/combat-examples.mjs", "tools/catalog.mjs", "tools/build-packs.mjs", ...CATALOG_PACKS.flatMap(p => p.sources.map(s => `data/catalog/${s}.json`))].sort()) {
    hash.update(file); hash.update(await readFile(file));
  }
  return hash.digest("hex");
}
export function folderId(category) {return createHash("sha256").update(`folder:${category}`).digest("hex").slice(0, 16);}
export function packDocuments(entries) {
  const categories = [...new Set(entries.map(e => e.system.category))].sort();
  const folders = categories.map(name => ({_key: `!folders!${folderId(name)}`, _id: folderId(name), name, type: "Item", folder: null, sorting: "a", sort: 0, color: "#4c6180"}));
  const items = entries.map(e => ({...structuredClone(e), _key: `!items!${e._id}`, folder: folderId(e.system.category), sort: 0, effects: [], ownership: {default: 2}}));
  return [...folders, ...items];
}
