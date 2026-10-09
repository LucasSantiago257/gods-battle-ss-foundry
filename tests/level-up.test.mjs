import test,{beforeEach} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {knight,content} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {STYLES} from "../module/config.mjs";
import {EVOLUTIONS,LEVEL_XP,levelMilestones,eligibleLevelPower,levelSignature,planLevel} from "../module/level-rules.mjs";
import {beginLevelUp,levelUpContext,requestLevelUp,discardLevelDraft,applyLevelOperation,executeLevelRequest,enqueueLevelRequest,clearInterruptedLevel} from "../module/level-up.mjs";
const ID="gods-battle-ss",id="draft00000000001";
const merge=(target,source)=>{for(const[key,value]of Object.entries(source))target[key]=value&&typeof value==="object"&&!Array.isArray(value)?merge(target[key]??{},value):structuredClone(value);return target;};
const catalog=await Promise.all(["saint","sage","protector","gold"].map(async route=>JSON.parse(await readFile(`data/catalog/abilities-${route}.json`,"utf8"))));
const example=(route,kind,level)=>{const entry=structuredClone(catalog[["saint","sage","protector","gold"].indexOf(route)].find(entry=>entry.system.abilityKind===kind&&(level===undefined||entry.system.level===level)));entry.system=merge(content(),entry.system);entry.uuid=`Compendium.${ID}.habilidades.Item.${entry._id}`;return entry;};
const gift=()=>example("saint","gift",2),improvement=()=>example("saint","improvement"),spec=()=>example("protector","specialization",5);
function system(level=1){const s=knight();s.profile.level=level;s.profile.style="saint";s.creationGuide.status="complete";s.progression.xp=550;for(const[key,value]of Object.entries({for:4,vig:3,vel:2,cos:2,sen:3}))s.attributes[key].value=value;s.resources.health.value=17.5;s.resources.cosmo.value=2;s.fighting.defense=1;prepareKnight(s,[]);return s;}
function draft(s,extra={}){return {id,from:s.profile.level,to:s.profile.level+1,attributes:{},skills:{},fighting:{},advanceSense:true,reviewedContent:true,reviewedManual:true,acceptExceptions:false,reason:"",...extra};}
function patch(target,changes){for(const[path,value]of Object.entries(changes)){const parts=path.split(".");let node=target;for(const key of parts.slice(0,-1))node=node[key]??={};const last=parts.at(-1);if(last.startsWith("-="))delete node[last.slice(2)];else node[last]=structuredClone(value);}}
let registry,alerts,confirmed,createdMessages;
beforeEach(()=>{
 registry=new Map();alerts=[];confirmed=true;createdMessages=[];
 game.user={id:"gm",isGM:true};const gm={id:"gm",active:true,isGM:true},player={id:"player",isGM:false};game.users={activeGM:gm,get:key=>key==="gm"?gm:key==="player"?player:null};
 game.messages={contents:[]};game.settings={get:()=>"rank"};
 foundry.utils={randomID:()=>id};foundry.applications.api.DialogV2={confirm:async()=>confirmed};
 globalThis.ui={notifications:{warn:message=>alerts.push(message),error:message=>alerts.push(message),info:message=>alerts.push(message)}};
 globalThis.fromUuid=async uuid=>registry.get(uuid);
 globalThis.ChatMessage={create:async data=>{createdMessages.push(data);return data;}};
 for(const entry of [gift(),improvement(),spec(),example("gold","ability",21)])registry.set(entry.uuid,{uuid:entry.uuid,toObject:()=>{const data=structuredClone(entry);delete data.uuid;return data;}});
});
function actorFixture(level=1){
 const raw=system(level),flags={},docs=[];let counter=0;
 const actor={id:"sample",uuid:"Actor.sample",name:"Cavaleiro",isOwner:true,flags,items:{contents:docs,get:itemId=>docs.find(item=>item.id===itemId)},sheet:{render:()=>{}},testUserPermission:user=>["gm","player"].includes(user.id),failFinal:false,
  refresh(){const live=structuredClone(raw);prepareKnight(live,docs);Object.defineProperty(live,"toObject",{value:()=>structuredClone(raw)});this.system=live;},
  async update(changes){if(this.failFinal&&changes["system.profile.level"]){this.failFinal=false;throw Error("falha de gravação final");}patch({system:raw,flags},changes);this.refresh();},
  async createEmbeddedDocuments(_type,sources){const created=sources.map(source=>this.addItem(source));this.refresh();return created;},
  async updateEmbeddedDocuments(_type,changes){for(const change of changes){const item=this.items.get(change._id);item.patch(Object.fromEntries(Object.entries(change).filter(([key])=>key!=="_id")));}this.refresh();},
  async deleteEmbeddedDocuments(_type,ids){for(const itemId of ids){const index=docs.findIndex(item=>item.id===itemId);if(index>=0)docs.splice(index,1);}this.refresh();},
  addItem(source){const itemRaw={...structuredClone(source),_id:source._id??`copy${++counter}`};itemRaw.system=merge(content(),itemRaw.system);const item={id:itemRaw._id,_id:itemRaw._id,name:itemRaw.name,type:itemRaw.type,flags:itemRaw.flags??{},system:structuredClone(itemRaw.system),toObject:()=>structuredClone(itemRaw),patch(changes){patch(itemRaw,changes);itemRaw._stats={modifiedTime:Date.now()};this.system=structuredClone(itemRaw.system);}};docs.push(item);return item;}
 };
 actor.refresh();registry.set(actor.uuid,actor);return actor;
}
async function prepareActor(actor,entry=gift()) {await beginLevelUp(actor);await actor.update({[`flags.${ID}.levelDraft.power`]:entry.uuid,[`flags.${ID}.levelDraft.reviewedContent`]:true,[`flags.${ID}.levelDraft.reviewedManual`]:true});return actor.flags[ID].levelDraft;}

test("marcos e pontos seguem seis estilos e seis evoluções, um nível por vez",()=>{
 for(const route of Object.keys(STYLES)){const s=system();s.profile.style=route;const m=levelMilestones(s,draft(s));assert.equal(m.skillPoints,3+STYLES[route].skills);assert.equal(m.attributePoints,0);assert.equal(m.powerKind,"gift");}
 for(const route of Object.keys(EVOLUTIONS)){const s=system(20),m=levelMilestones(s,draft(s,{evolution:route}));assert.equal(m.skillPoints,Math.max(1,3+EVOLUTIONS[route].skills));assert.equal(m.technique,true);}
 const m=levelMilestones(system(3),draft(system(3)));assert.equal(m.virtue,true);
 assert.throws(()=>levelMilestones(system(),draft(system(),{to:3})),/um nível/);assert.throws(()=>levelMilestones(system(30),draft(system(30))),/nível 30/);
 assert.equal(LEVEL_XP[2],10);assert.equal(LEVEL_XP[20],250);assert.equal(LEVEL_XP[30],550);
});
test("atributo custa dois a partir de cinco, limites e saldo são conferidos",()=>{
 const s=system(4);assert.throws(()=>planLevel(s,[],draft(s,{attributes:{for:2}}),{power:spec()}),/excede/);
 s.progression.attributeBank=1;const p=planLevel(s,[],draft(s,{attributes:{for:2},skills:{combat:1},fighting:{punch:2}}),{power:spec()});
 assert.equal(p.attributeSpent,3);assert.equal(p.projected.attributes.for.value,6);assert.equal(p.projected.progression.attributeBank,0);assert.equal(p.projected.progression.fightBank,0);assert.equal(p.projected.progression.skillBank,3);
 s.attributes.for.value=10;assert.throws(()=>planLevel(s,[],draft(s,{attributes:{for:1}}),{power:spec()}),/limite de 10/);
 assert.throws(()=>planLevel(system(),[],draft(system(),{skills:{combat:5}}),{power:gift()}),/excede/);
 assert.throws(()=>planLevel(system(),[],draft(system(),{fighting:{defense:1}}),{power:gift()}),/excede/);
});
test("seleções respeitam tipo, origem, nível e especialização extra",()=>{
 assert.equal(eligibleLevelPower(system(),draft(system()),gift()),true);
 assert.equal(eligibleLevelPower(system(),draft(system()),example("sage","gift",2)),false);
 const s=system(4);assert.equal(eligibleLevelPower(s,draft(s),spec()),true);
 const p=planLevel(s,[],draft(s),{power:spec()});assert.equal(p.projected.profile.specialization,"Protetor");
 const extra=system(5);extra.profile.specialization="Protetor";assert.equal(eligibleLevelPower(extra,draft(extra),gift()),false);
 assert.throws(()=>planLevel(system(),[],draft(system()),{power:spec()}),/não corresponde/);
});
test("progressão recalcula máximos e mantém vida, CE, armadura e máximos manuais",()=>{
 const s=system(),item={_id:"armor",type:"armor",system:merge(content(),{equipped:true,health:{value:12}})};s.resources.health.manualMax=77;
 const original=JSON.stringify({s,item});const p=planLevel(s,[item],draft(s),{power:gift()});
 assert.equal(p.projected.resources.health.max,77);assert.equal(p.projected.resources.health.value,17.5);assert.equal(p.projected.resources.cosmo.value,2);
 assert.equal(item.system.health.value,12);assert.equal(JSON.stringify({s,item}),original);
 const plain=planLevel(system(),[],draft(system()),{power:gift()});assert.equal(plain.projected.resources.health.max,36);
 const epic=system(20),p21=planLevel(epic,[],draft(epic,{evolution:"gold"}),{power:example("gold","ability",21)});assert.equal(p21.projected.progression.epicActions,1);assert.equal(p21.projected.progression.epicCosmo,1);assert.equal(p21.projected.combat.attack,21);
});
test("Sentido preserva avanço horizontal e confere pré-requisito de sétimo",()=>{
 const s=system(4);s.sense.ordinal=7;s.sense.stage="expanded";const p=planLevel(s,[],draft(s),{power:spec()});assert.equal(p.projected.sense.ordinal,7);assert.equal(p.projected.sense.stage,"expanded");
 const later=system(19);later.sense.stage="full";later.attributes.for.value=6;const blocked=planLevel(later,[],draft(later),{power:gift()});assert.ok(blocked.warnings.some(w=>w.includes("atributo-chave")));
 const good=planLevel(later,[],draft(later,{attributes:{for:1}}),{power:gift()});assert.ok(!good.warnings.some(w=>w.includes("atributo-chave")));assert.equal(good.projected.sense.ordinal,7);assert.equal(good.projected.combat.attackLevel,10);
});
test("Melhoria atualiza graduação sem duplicar cópia e bloqueia sexta aquisição",()=>{
 const entry=improvement(),old={...structuredClone(entry),_id:"old",system:{...entry.system,originUuid:entry.uuid,rank:2}};
 const p=planLevel(system(),[old],draft(system()),{power:entry});assert.equal(p.grants.length,0);assert.deepEqual(p.rankUpdates,[{id:"old",before:2,after:3}]);
 old.system.rank=5;assert.throws(()=>planLevel(system(),[old],draft(system()),{power:entry}),/cinco vezes/);
 const duplicate={...gift(),system:{...gift().system,originUuid:gift().uuid,notes:"Notas editadas"}};
 const repeated=planLevel(system(),[duplicate],draft(system()),{power:gift()});assert.equal(repeated.grants.length,0);assert.match(repeated.warnings.join(),/já existe/);assert.equal(duplicate.system.notes,"Notas editadas");
});
test("pendências são informativas e assinatura ignora somente metadados voláteis",()=>{
 const s=system();s.progression.xp=0;const d=draft(s),p=planLevel(s,[],d);assert.equal(p.canApply,true);
 d.acceptExceptions=true;assert.equal(planLevel(s,[],d).canApply,true);d.reason="Avanço aprovado pelo mestre";assert.equal(planLevel(s,[],d).canApply,true);
 const item={_id:"i",system:{rank:1},_stats:{modifiedTime:1}};const before=levelSignature(s,[item]);item._stats.modifiedTime=2;assert.equal(levelSignature(s,[item]),before);item.system.rank=2;assert.notEqual(levelSignature(s,[item]),before);
});
test("rascunho persiste, cancelar não concede e ficha alterada exige nova revisão",async()=>{
 const actor=actorFixture();const d=await prepareActor(actor);assert.equal(actor.system.profile.level,1);assert.equal(actor.items.contents.length,0);
 await beginLevelUp(actor);assert.equal(actor.flags[ID].levelDraft,d);const context=await levelUpContext(actor);assert.equal(context.summary[1].after,36);assert.equal(context.error,undefined);
 confirmed=false;await requestLevelUp(actor);assert.equal(createdMessages.length,0);assert.equal(actor.system.profile.level,1);
 await actor.update({"system.resources.health.value":14});await requestLevelUp(actor);assert.match(alerts.at(-1),/ficha mudou/);
 confirmed=true;await discardLevelDraft(actor);assert.equal(actor.flags[ID].levelDraft,undefined);assert.equal(actor.items.contents.length,0);
});
test("mestre aplica uma vez, mantém recursos e registra histórico",async()=>{
 const actor=actorFixture();await prepareActor(actor);const r=await applyLevelOperation(actor,game.users.get("player"));
 assert.equal(actor.system.profile.level,2);assert.equal(actor.system.resources.health.value,17.5);assert.equal(actor.system.resources.cosmo.value,2);assert.equal(actor.items.contents.length,1);
 assert.equal(actor.items.contents[0].system.acquisitionLevel,2);assert.equal(actor.flags[ID].levelDraft,undefined);assert.equal(actor.flags[ID].levelHistory[id].status,"applied");assert.equal(r.balances.skills,4);
 await assert.rejects(()=>applyLevelOperation(actor,game.user),/já aplicada/);
});
test("fila do mestre rejeita duplicação, autoria falsa e usuário sem propriedade",async()=>{
 const actor=actorFixture(),d=await prepareActor(actor);const msg={flags:{[ID]:{levelRequest:{actorUuid:actor.uuid,draftId:d.id,baseline:d.baseline,draftSignature:levelSignature({},[{_id:d.id,draft:d}])}}},author:{id:"player"},async update(changes){patch(this,changes);}};
 await Promise.all([enqueueLevelRequest(msg,{},"player"),enqueueLevelRequest(msg,{},"player")]);assert.equal(actor.system.profile.level,2);assert.equal(actor.items.contents.length,1);assert.equal(msg.flags[ID].levelResponse.ok,true);
 const second=actorFixture();const next=await prepareActor(second);const forged={...msg,flags:{[ID]:{levelRequest:{actorUuid:second.uuid,draftId:next.id,baseline:next.baseline,draftSignature:levelSignature({},[{_id:next.id,draft:next}])}}},author:{id:"gm"}};await executeLevelRequest(forged,"player");assert.equal(second.system.profile.level,1);
 second.testUserPermission=()=>false;forged.author.id="player";await executeLevelRequest(forged,"player");assert.equal(second.system.profile.level,1);assert.equal(forged.flags[ID].levelResponse.ok,false);
});
test("falha final reverte apenas novas cópias e preserva item editado anterior",async()=>{
 const actor=actorFixture();actor.addItem({_id:"notes",name:"Virtude manual",type:"virtue",system:{notes:"Preservar"}});actor.refresh();await prepareActor(actor);actor.failFinal=true;
 await assert.rejects(()=>applyLevelOperation(actor,game.user),/gravação/);assert.equal(actor.system.profile.level,1);assert.equal(actor.items.contents.length,1);assert.equal(actor.items.get("notes").system.notes,"Preservar");assert.equal(actor.flags[ID].levelOperation.status,"failed");
 await applyLevelOperation(actor,game.user);assert.equal(actor.system.profile.level,2);assert.equal(actor.items.contents.length,2);
});
test("Melhoria em cópia existente é revertida após falha sem perder notas",async()=>{
 const actor=actorFixture();const entry=improvement();actor.addItem({...entry,_id:"improve",system:{...entry.system,rank:2,originUuid:entry.uuid,notes:"Nota original"}});actor.refresh();await prepareActor(actor,entry);actor.failFinal=true;
 await assert.rejects(()=>applyLevelOperation(actor,game.user),/gravação/);assert.equal(actor.items.get("improve").system.rank,2);assert.equal(actor.items.get("improve").system.notes,"Nota original");
 await applyLevelOperation(actor,game.user);assert.equal(actor.items.get("improve").system.rank,3);assert.equal(actor.items.contents.length,1);
});
test("interrupção persistente não é reaplicada e liberação exige mestre",async()=>{
 const actor=actorFixture();await prepareActor(actor);await actor.update({[`flags.${ID}.levelOperation`]:{status:"prepared",from:1,to:2}});
 await assert.rejects(()=>applyLevelOperation(actor,game.user),/interrompida/);game.user={id:"player",isGM:false};await clearInterruptedLevel(actor);assert.equal(actor.flags[ID].levelOperation.status,"prepared");
 game.user={id:"gm",isGM:true};await clearInterruptedLevel(actor);assert.equal(actor.flags[ID].levelOperation.status,"reviewed");assert.equal(actor.flags[ID].levelDraft,undefined);assert.equal(actor.system.profile.level,1);
});
test("mudança de escolha depois da confirmação invalida a solicitação",async()=>{
 const actor=actorFixture();await prepareActor(actor);await requestLevelUp(actor);assert.equal(createdMessages.length,1);
 const msg={...createdMessages[0],author:{id:"gm"},async update(changes){patch(this,changes);}};
 await actor.update({[`flags.${ID}.levelDraft.skills.combat`]:1});await executeLevelRequest(msg,"gm");
 assert.equal(actor.system.profile.level,1);assert.equal(actor.items.contents.length,0);assert.equal(msg.flags[ID].levelResponse.ok,false);
});
test("dados alterados durante confirmação e cliente sem mestre não aplicam",async()=>{
 const actor=actorFixture();await prepareActor(actor);
 foundry.applications.api.DialogV2.confirm=async()=>{await actor.update({[`flags.${ID}.levelDraft.skills.combat`]:1});return true;};
 await requestLevelUp(actor);assert.equal(createdMessages.length,0);assert.match(alerts.at(-1),/mudaram/);
 game.user={id:"player",isGM:false};await assert.rejects(()=>applyLevelOperation(actor,game.user),/Sem permissão/);
 game.users.activeGM=null;await requestLevelUp(actor);assert.match(alerts.at(-1),/mestre ativo/);
});
