import test from "node:test";
import assert from "node:assert/strict";
import {readFile, readdir, mkdir, writeFile, mkdtemp, rm} from "node:fs/promises";
import path from "node:path";
import {createHash} from "node:crypto";
import {compilePack, extractPack} from "@foundryvtt/foundryvtt-cli";
import {content, validateStrings} from "./foundry-stub.mjs";
import {ContentData} from "../module/models.mjs";
import {CATALOG_PACKS, openCatalog} from "../module/catalog.mjs";
import {readCatalog, packDocuments, folderId} from "../tools/catalog.mjs";
import {KnightSheet} from "../module/sheets.mjs";

const catalogs = await Promise.all(CATALOG_PACKS.map(async p => ({...p, entries: await readCatalog(p)})));
const all = catalogs.flatMap(p => p.entries);
const source = async name => JSON.parse(await readFile(`data/catalog/${name}.json`, "utf8"));

test("manifesto registra todos os compêndios e todas as fontes disponíveis", async () => {
 const manifest = JSON.parse(await readFile("system.json", "utf8"));
 assert.deepEqual(manifest.packs.filter(p=>p.type==="Item").map(p => p.name), CATALOG_PACKS.map(p => p.name));
 for (const p of manifest.packs) {assert.equal(p.path, `packs/${p.name}`); assert.ok(["Item","Actor"].includes(p.type)); assert.equal(p.system, manifest.id);}
 assert.deepEqual((await readdir("data/catalog")).sort(), CATALOG_PACKS.flatMap(p => p.sources.map(s => `${s}.json`)).sort());
 assert.deepEqual(catalogs.map(p => p.entries.length), [129, 229, 98, 88, 34, 14, 49, 59, 166]);
});
test("conteúdos importáveis têm IDs estáveis, proveniência e dados válidos sem informações pessoais", () => {
 assert.equal(new Set(all.map(e => e._id)).size, all.length);
 const keys = new Set();
 for (const e of all) {
  const provenance=e.flags["gods-battle-ss"].source;
  assert.equal(e._id, createHash("sha256").update(provenance.key).digest("hex").slice(0,16), e.name);
  assert.ok(!keys.has(provenance.key)); keys.add(provenance.key);
  assert.ok(e.name.trim() && e.system.description.trim(), e.name);
  assert.ok(["ability", "virtue", "divineCosmo", "bigbang", "increment", "technique"].includes(e.type));
  assert.doesNotThrow(() => validateStrings(ContentData.defineSchema(), {...content(), ...e.system}), e.name);
  for (const key of ["level", "power", "cost"]) assert.ok(Number.isInteger(e.system[key]) && e.system[key]>=0);
  assert.equal(provenance.author, "Dhoko de Libra"); assert.equal(provenance.license, "CC BY-NC-SA 4.0");
  assert.ok(provenance.pages.length && provenance.pages.every(p => Number.isInteger(p) && p>=1 && p<=702));
  assert.doesNotMatch(JSON.stringify(e), /Autorizada para|CPF\s*:|E-mail\s*:|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\d{3}\.\d{3}\.\d{3}-\d{2}|C:[\\/]/i);
 }
});
test("listas dos estilos, especializações e evoluções cobrem os níveis nomeados no livro", async () => {
 for (const style of ["saint", "sage", "guardian", "artist", "asgardian", "beastmaster"]) {
  const entries=await source(`abilities-${style}`);
  assert.deepEqual(entries.filter(e => e.system.abilityKind!=="improvement").map(e => e.system.level), Array.from({length:20},(_,i)=>i+1));
  assert.equal(entries.filter(e => e.system.abilityKind==="improvement").length,1);
 }
 for (const style of ["protector", "assassin", "telekinetic"]) assert.deepEqual((await source(`abilities-${style}`)).map(e=>e.system.level), [5,6,8,10,12,14,16,18]);
 for (const style of ["aesir", "gold", "judges", "marinas", "dryads", "berserkers"]) assert.deepEqual((await source(`abilities-${style}`)).map(e=>e.system.level), Array.from({length:10},(_,i)=>i+21));
});
test("títulos quebrados e regras distintas de mesmo nome permanecem separados", async () => {
 const virtues=await source("virtues"); assert.ok(virtues.some(e=>e.name==="Determinação ou Orgulho"));
 const tele=await source("abilities-telekinetic");
 assert.match(tele[0].system.description,/Tabela: Telecinético/); assert.doesNotMatch(tele[1].system.description,/Tabela: Telecinético/);
 const sage=await source("abilities-sage"); assert.equal(sage.filter(e=>e.name.startsWith("Transcendência —")).length,2);
 assert.equal(catalogs.find(p=>p.name==="cosmo-especial").entries.filter(e=>e.name.startsWith("Viajante das Sombras")).length,2);
 assert.ok(catalogs.find(p=>p.name==="criaturas").entries.some(e=>e.name==="Sétimo Sentido Ômega — Hypnos"));
 for (const e of catalogs.find(p=>p.name==="cosmos-divinos").entries) for (const rank of [1,2,3]) assert.match(e.system.description,new RegExp(`Refino ${rank}:`));
});
test("atalhos abrem apenas compêndios conhecidos e não criam dados no mundo", async () => {
 let opened=0;
 game.packs=new Map([["gods-battle-ss.habilidades", {render: flag=>{assert.equal(flag,true);opened++;}}]]);
 await openCatalog("../../unknown"); assert.equal(opened,0);
 await KnightSheet.openCatalog({}, {dataset:{pack:"habilidades"}}); assert.equal(opened,1);
});
test("referências de Sentidos e Auras distinguem estágios e não aplicam bônus ao importar", () => {
 const entries=catalogs.find(p=>p.name==="sentidos-auras").entries;
 assert.equal(entries.filter(e=>e.system.abilityKind==="aura").length,38);
 const senses=entries.filter(e=>e.system.abilityKind==="sense");
 assert.equal(senses.length,11);
 for (const [ordinal,expected] of [[6,4],[7,5],[8,1],[9,1]]) assert.equal(senses.filter(e=>e.flags["gods-battle-ss"].source.reference.ordinal===ordinal).length,expected);
 const omega=senses.find(e=>e.flags["gods-battle-ss"].source.reference.stage==="omega");
 assert.match(omega.system.description,/Nível \+6/); assert.match(omega.system.description,/Desperta 1 Cosmo Divino/);
 const ninth=senses.find(e=>e.flags["gods-battle-ss"].source.reference.ordinal===9);
 assert.match(ninth.system.description,/Resistência Divina/); assert.doesNotMatch(ninth.system.description,/O COSMO DIVINO/);
 assert.ok(entries.every(e=>!e.effects && e.system.cost===0 && e.system.power===0));
});
test("índice e ocorrência com requisitos divergentes preservam suas condições e páginas", () => {
 const entry=catalogs.find(p=>p.name==="cosmo-especial").entries.find(e=>e.name==="Olho de Fogo");
 assert.match(entry.system.description,/Sensitivo/);
 const original=entry.flags["gods-battle-ss"].source.occurrences.find(o=>o.name==="Visão Aérea");
 assert.ok(original); assert.match(original.text,/Fotógrafo de Cosmo/); assert.ok(original.pages.includes(122));
 assert.ok(entry.flags["gods-battle-ss"].source.indexPages.includes(465));
 assert.match(entry.system.notes,/não some condições/);
 const variants=catalogs.find(p=>p.name==="cosmo-especial").entries.filter(e=>e.name.startsWith("Viajante das Sombras"));
 assert.ok(variants.find(e=>e.name.endsWith("— Técnicas")).flags["gods-battle-ss"].source.occurrences.some(o=>o.category==="Técnica Prata" && /Flecha.*Sombras/i.test(o.name)));
 assert.ok(variants.find(e=>e.name==="Viajante das Sombras").flags["gods-battle-ss"].source.occurrences.every(o=>o.category==="Asgardiano"));
 assert.equal(catalogs.find(p=>p.name==="habilidades").entries.filter(e=>e.system.category==="Natural — Muvianos (raças)").length,3);
});
test("componentes preservam exceções de custo, graduação única e regras complementares", async () => {
 const bang=await source("bigbangs"), increments=await source("increments");
 assert.equal(bang.filter(e=>e.system.category==="Big Bang Primordial").length,4);
 assert.equal(bang.filter(e=>e.system.category==="Big Bang Extra").length,43);
 const support=bang.find(e=>e.name==="Big Bang Apoiar");
 assert.equal(support.system.cost,0); assert.equal(support.flags["gods-battle-ss"].source.reference.slots,1);
 assert.match(support.system.description,/NÃO altera a classificação original/);
 assert.ok(bang.filter(e=>e.system.category==="Big Bang Extra" && e!==support).every(e=>e.system.cost===1));
 const residual=bang.find(e=>e.name==="Big Bang Cosmo Residual");
 assert.match(residual.system.description,/Um novo Teste de\s+Resistência poderá/);
 assert.doesNotMatch(residual.system.description,/Tabela: Testes/);
 assert.ok(residual.flags["gods-battle-ss"].source.occurrences.some(o=>o.pages.includes(232)));
 assert.match(bang.find(e=>e.name==="Big Bang Zero Absoluto").system.description,/-273, 15 °C/);
 const cosmic=increments.find(e=>e.name==="Controle Cósmico");
 assert.equal(cosmic.flags["gods-battle-ss"].source.reference.maxRank,1);
 assert.doesNotMatch(cosmic.system.description,/Graduação [23]:/);
 assert.match(cosmic.system.description,/após a resistência/);
 for (const e of increments.filter(e=>e!==cosmic)) {
  assert.equal(e.flags["gods-battle-ss"].source.reference.benefits.length,3);
  for (const rank of [1,2,3]) assert.match(e.system.description,new RegExp(`Graduação ${rank}:`));
 }
 const energy=increments.find(e=>e.name==="Controle sobre a Energia");
 assert.match(energy.system.description,/NUNCA pode recuperar mais/);
 assert.match(increments.find(e=>e.name==="Controle sobre o Big Bang").system.description,/Só funciona em Técnicas com o Big Bang Guardar/);
 assert.ok([...bang,...increments].every(e=>!e.effects && /manual|manuais/.test(e.system.notes)));
});
test("técnicas preservam elementos, cabeçalho quebrado, custos variáveis e referências válidas", async () => {
 const entries=await source("techniques"), components=await source("bigbangs");
 assert.deepEqual(["Mentais ou Ilusórias","Físicos","Manipulação de Cosmo","Controle da Natureza","Cooperativa"].map(c=>entries.filter(e=>e.system.category===`Técnica — ${c}`).length),[27,46,47,45,1]);
 const aurora=entries.find(e=>e.name==="Aniquilação Aurora (Ar)");
 assert.ok(aurora);assert.deepEqual(aurora.flags["gods-battle-ss"].source.pages,[355,356,357]);
 assert.match(aurora.system.description,/congela seu corpo e sua alma/);
 assert.doesNotMatch(entries.find(e=>e.name==="Execução Aurora (Ar)").system.description,/ANIQUILAÇÃO AURORA/);
 assert.equal(entries.filter(e=>e.name.startsWith("Velocidade")).length,3);
 const poison=entries.find(e=>e.name==="Veneno");assert.equal(poison.system.nature,"");assert.equal(poison.system.cost,0);assert.match(poison.system.costText,/separadamente/);
 const shield=entries.find(e=>e.name==="Escudo Entrópico");assert.equal(shield.system.effectKind,"manual");assert.equal(shield.system.cost,0);assert.match(shield.system.costText,/2, 3, 4/);
 const athena=entries.find(e=>e.name==="Exclamação de Athena");assert.deepEqual(athena.flags["gods-battle-ss"].source.pages,[215,216,217]);assert.equal(athena.system.cost,8);assert.ok(athena.flags["gods-battle-ss"].source.reference.manualOnly);
 for (const e of entries) {
  const provenance=e.flags["gods-battle-ss"].source;
  assert.equal(e.system.techniqueReviewed,false);assert.ok(provenance.reference.reviewRequired);
  assert.equal(e.system.power,0);assert.equal(e.system.damageLevel,0);assert.equal(e.system.range,0);
  assert.ok(e.system.costText.trim());assert.ok(provenance.references.every(r=>components.some(c=>r.uuid===`Compendium.gods-battle-ss.componentes-tecnicas.Item.${c._id}` && c.name===r.name)));
 }
});
test("compêndios LevelDB preservam todos os Items, regras, fontes e pastas no round-trip nativo", async () => {
 const root=path.resolve("dist/catalog-tests"); await mkdir(root,{recursive:true}); const temp=await mkdtemp(path.join(root,"roundtrip-"));
 try {
  for (const pack of catalogs) {
   const input=path.join(temp,pack.name,"sources"), db=path.join(temp,pack.name,"db"), output=path.join(temp,pack.name,"output");
   await mkdir(input,{recursive:true});
   const docs=packDocuments(pack.entries);
   for (const doc of docs) await writeFile(path.join(input,`${doc._id}.json`), JSON.stringify(doc));
   await compilePack(input,db); await extractPack(db,output,{folders:false});
   const exported=await Promise.all((await readdir(output)).filter(f=>f.endsWith(".json")).map(async f=>JSON.parse(await readFile(path.join(output,f),"utf8"))));
   const items=exported.filter(e=>e._key.startsWith("!items!")), folders=exported.filter(e=>e._key.startsWith("!folders!"));
   assert.equal(items.length,pack.entries.length); assert.equal(folders.length,new Set(pack.entries.map(e=>e.system.category)).size);
   for (const original of pack.entries) {
    const item=items.find(e=>e._id===original._id); assert.ok(item,original.name);
    assert.equal(item.name,original.name); assert.equal(item.type,original.type);
    assert.deepEqual(item.system,original.system); assert.deepEqual(item.flags,original.flags);
    assert.equal(item.folder,folderId(original.system.category)); assert.deepEqual(item.effects,[]);
   }
  }
 } finally {
  const resolved=path.resolve(temp); assert.ok(resolved.startsWith(root+path.sep)); await rm(resolved,{recursive:true,force:true});
 }
});
