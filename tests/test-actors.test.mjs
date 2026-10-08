import test,{beforeEach} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from "node:fs/promises";
import path from "node:path";
import {compilePack,extractPack} from "@foundryvtt/foundryvtt-cli";
import {knight,content,validateStrings} from "./foundry-stub.mjs";
import {KnightData,ContentData} from "../module/models.mjs";
import {TEST_ACTORS,TEST_ACTOR_PACK,testActorDocuments,importTestActors} from "../module/combat-examples.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {techniqueReadiness} from "../module/technique-rules.mjs";
const ID="gods-battle-ss";
const merge=(target,source)=>{for(const[key,value]of Object.entries(source)) target[key]=value&&typeof value==="object"&&!Array.isArray(value)?merge(target[key]??{},value):value;return target;};
let creations,alerts;
beforeEach(()=>{
 creations=[];alerts=[];
 globalThis.ui={notifications:{warn:m=>alerts.push(m),error:m=>alerts.push(m),info:m=>alerts.push(m)}};
 game.user={isGM:true};game.actors={contents:[]};game.folders={contents:[]};
 game.packs=new Map([[`${ID}.${TEST_ACTOR_PACK.name}`,{getDocuments:async()=>TEST_ACTORS.map(source=>({id:source._id,uuid:`Compendium.${ID}.fichas-teste.Actor.${source._id}`,flags:source.flags,toObject:()=>structuredClone(source)}))}]]);
 globalThis.Folder={create:async source=>{const folder={...source,id:"demo-folder"};game.folders.contents.push(folder);return folder;}};
 globalThis.Actor={createDocuments:async sources=>{creations.push(...sources);const docs=sources.map((source,i)=>({...source,id:`new-${i}`}));game.actors.contents.push(...docs);return docs;}};
});

test("fichas de teste têm recursos coerentes, luta, técnicas prontas e não iniciam criação",()=>{
 assert.equal(TEST_ACTORS.length,3);
 for(const source of TEST_ACTORS){
  assert.match(source._id,/^[a-zA-Z0-9]{16}$/);
  const system=merge(knight(),source.system),items=source.items.map(item=>({...item,system:merge(content(),item.system)}));
  validateStrings(KnightData.defineSchema(),system);for(const item of items)validateStrings(ContentData.defineSchema(),item.system);
  prepareKnight(system,items);
  assert.equal(system.resources.health.value,system.resources.health.max);
  assert.equal(system.resources.cosmo.value,system.resources.cosmo.max);
  assert.equal(system.creation.total,14);assert.equal(system.creationGuide.status,"");
  assert.ok(system.fighting.defense>=1);assert.ok(Object.entries(system.fighting).some(([key,value])=>key!=="defense"&&value>=1));
  assert.ok(system.skills.asterism.value>=1&&system.skills.cosmoUse.value>=1&&system.skills.training.value>=1);
  const technique=items.find(item=>item.type==="technique");assert.equal(techniqueReadiness(technique),null);
  assert.ok(system.resources.cosmo.value>=technique.system.cost);
  assert.equal(items.find(item=>item.type==="armor").system.health.max,30);
 }
});

test("grupo importa cópias privadas e repetir preserva PV, notas e ficha editada",async()=>{
 const originals=JSON.stringify(TEST_ACTORS);
 const first=await importTestActors();assert.equal(first.length,3);assert.equal(creations.length,3);
 assert.equal(game.folders.contents.length,1);
 for(const source of creations){assert.equal(source._id,undefined);assert.equal(source.folder,"demo-folder");assert.equal(source.ownership.default,0);assert.match(source.flags[ID].testActorOrigin,/^Compendium\./);}
 first[0].name="Nome editado";first[0].system.resources.health.value=-2.5;first[0].items[0].system.notes="Notas do usuário";
 const second=await importTestActors();assert.equal(creations.length,3);assert.equal(second[0],first[0]);assert.equal(second[0].system.resources.health.value,-2.5);
 assert.equal(second[0].items[0].system.notes,"Notas do usuário");assert.equal(JSON.stringify(TEST_ACTORS),originals);
 game.actors.contents.splice(1,1);await importTestActors();assert.equal(creations.length,4);assert.equal(game.folders.contents.length,1);
});

test("importação rejeita jogador e instalação incompleta sem criar personagens",async()=>{
 game.user.isGM=false;await importTestActors();assert.equal(creations.length,0);assert.equal(game.folders.contents.length,0);
 game.user.isGM=true;game.packs.clear();await importTestActors();assert.equal(creations.length,0);
 assert.match(alerts.at(-1),/indisponível/);
 game.packs.set(`${ID}.fichas-teste`,{getDocuments:async()=>[]});await importTestActors();assert.equal(creations.length,0);assert.match(alerts.at(-1),/incompleto/);
});

test("cliques simultâneos no importador criam apenas um grupo",async()=>{
 const results=await Promise.all([importTestActors(),importTestActors()]);assert.equal(results[0].length,3);assert.equal(results[1],undefined);assert.equal(creations.length,3);
});

test("banco Actor preserva fichas, armaduras e técnicas embutidas no round-trip",async()=>{
 const manifest=JSON.parse(await readFile("system.json","utf8"));assert.deepEqual(manifest.packs.filter(pack=>pack.type==="Actor").map(pack=>pack.name),[TEST_ACTOR_PACK.name]);
 const root=path.resolve("dist/test-actor-tests");await mkdir(root,{recursive:true});const temp=await mkdtemp(path.join(root,"roundtrip-"));
 try{
  const input=path.join(temp,"sources"),db=path.join(temp,"db"),output=path.join(temp,"output");await mkdir(input);
  const docs=testActorDocuments();for(const doc of docs)await writeFile(path.join(input,`${doc._id}.json`),JSON.stringify(doc));
  await compilePack(input,db);await extractPack(db,output,{folders:false});
  const extracted=await Promise.all((await readdir(output)).map(async file=>JSON.parse(await readFile(path.join(output,file),"utf8"))));
  assert.equal(extracted.length,3);for(const doc of docs)assert.deepEqual(extracted.find(actor=>actor._id===doc._id),doc);
 }finally{assert.ok(path.resolve(temp).startsWith(root+path.sep));await rm(temp,{recursive:true,force:true});}
});
