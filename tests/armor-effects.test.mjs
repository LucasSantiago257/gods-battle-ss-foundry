import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {knight,content} from "./foundry-stub.mjs";
import {componentUuid} from "../module/technique-builder-rules.mjs";
import {ARMOR_BREAK,armorBreakSource,armorBreakDefinition,armorBreakView,armorBreakTickPlan,armorBreakState,armorBreakSnapshot,armorBreakAfter,armorBreakRecoveryPlan} from "../module/armor-effect-rules.mjs";
const ID="gods-battle-ss",copy=structuredClone;
function fixture(classification="bronze"){
 const actor={uuid:"Actor.target",type:"knight",name:"Defensor",system:knight(),flags:{[ID]:{persistentEffects:{}}}},caster={uuid:"Actor.caster",type:"knight"};actor.system.resources.health.value=100;actor.system.resources.cosmo.value=10;
 const armor={id:"armor",uuid:`${actor.uuid}.Item.armor`,name:"Bronze de exercício",type:"armor",parent:actor,system:{...content(),equipped:true,health:{value:30},state:"active"}};
 const items=[armor];actor.items={contents:items,get:id=>items.find(i=>i.id===id)};
 const item={id:"tech",uuid:"Actor.caster.Item.tech",type:"technique",name:"Nome livre",parent:caster,system:{...content(),effectKind:"sustained",classification},flags:{[ID]:{techniqueConstructionId:"saved",techniqueConstructionHistory:{saved:{primary:{uuid:ARMOR_BREAK.primary},components:[{uuid:componentUuid(ARMOR_BREAK.id),key:ARMOR_BREAK.key,type:"bigbang",rank:1}]}}}}};caster.items={get:id=>id===item.id?item:null};
 const combat={uuid:"Combat.arena",started:true,round:2,combatants:{contents:[{id:"defender",actor}]}};globalThis.game={combat,combats:{contents:[combat]}};
 const create=(answer={})=>{const definition=armorBreakDefinition(actor,item,{rounds:2,firstOffset:1,reason:"",...answer}),record={...definition,id:"periodic",actorUuid:actor.uuid,status:"active",ticks:{}};actor.flags[ID].persistentEffects.periodic=record;return record;};
 return {actor,caster,armor,item,combat,create};
}

test("fonte canônica da p.229 aceita só Sustentada, sem nome ou Big Bang solto",async()=>{
 const catalog=JSON.parse(await readFile("data/catalog/bigbangs.json","utf8")),entry=catalog.find(d=>d._id===ARMOR_BREAK.id);assert.equal(entry.flags[ID].source.key,ARMOR_BREAK.key);
 for(const classification of ["bronze","silver","gold"]){const f=fixture(classification);assert.equal(armorBreakSource(f.item).damage,{bronze:1,silver:2,gold:3}[classification]);f.item.name="Outro nome";assert.equal(armorBreakSource(f.item).classification,classification);}
 for(const change of [f=>f.item.system.effectKind="damage",f=>f.item.system.classification="divine",f=>f.item.system.classification="constructor",f=>f.item.flags[ID].techniqueDraft={},f=>f.item.flags={},f=>f.caster.items.get=()=>null,f=>f.item.flags[ID].techniqueConstructionHistory.saved.primary.uuid=componentUuid("13841831d802c5be")]){const f=fixture();change(f);assert.throws(()=>armorBreakSource(f.item));}
});

test("duplicatas, graduação, chave, tipo e misturas mantêm execução manual",()=>{
 for(const change of [c=>c[0].rank=2,c=>c[0].key="nome falso",c=>c[0].type="increment",c=>c[0].uuid=componentUuid("13841831d802c5be"),c=>c.push({...c[0]}),c=>c.push({key:"bigbang:primordial:Dano"})]){const f=fixture();change(f.item.flags[ID].techniqueConstructionHistory.saved.components);assert.throws(()=>armorBreakSource(f.item));}
});

test("registro vincula armadura específica e prazo explícito sem tocar corpo/CE/ações",()=>{
 const f=fixture(),before=copy({system:f.actor.system,armor:f.armor.system}),record=f.create();assert.equal(record.firstRound,3);assert.equal(record.lastRound,4);assert.equal(record.damage,1);assert.equal(record.armor.uuid,f.armor.uuid);assert.deepEqual({system:f.actor.system,armor:f.armor.system},before);
 for(const change of [{rounds:0},{rounds:1.5},{rounds:1001},{firstOffset:2},{reason:42},{description:42}])assert.throws(()=>f.create(change));
 assert.equal(f.create({firstOffset:0}).firstRound,2);f.combat.started=false;assert.throws(()=>f.create(),/encontro/);
});

test("troca, remoção, duplicata e PV inválidos nunca transferem parcela a outra armadura",()=>{
 for(const change of [f=>f.armor.system.equipped=false,f=>f.armor.system.health.value=-1,f=>f.armor.system.health.value=NaN,f=>f.armor.system.state="dead",f=>f.armor.uuid="Actor.target.Item.other",f=>f.actor.items.contents.push({...f.armor,id:"other",uuid:"Actor.target.Item.other"})]){const f=fixture(),record=f.create();f.combat.round=3;change(f);assert.equal(armorBreakView(f.actor,record).canResolve,false);assert.throws(()=>armorBreakTickPlan(f.actor,record));}
 const f=fixture(),record=f.create();f.combat.round=3;f.actor.items.contents.splice(0,1);assert.throws(()=>armorBreakSnapshot(f.actor,record.id),/removida/);
});

test("parcelas 1/2/3 não dependem de ND e respeitam rodada, atraso, fração e dispensa",()=>{
 for(const classification of ["bronze","silver","gold"]){const f=fixture(classification),record=f.create();f.item.system.damageLevel=999;f.actor.system.combat.damageBonus=999;assert.equal(armorBreakView(f.actor,record).canResolve,false);f.combat.round=9;
 const before=copy({system:f.actor.system,flags:f.actor.flags,armor:f.armor.system}),plan=armorBreakTickPlan(f.actor,record);assert.equal(plan.tick.damage,ARMOR_BREAK.damage[classification]);assert.equal(plan.tick.round,3);assert.equal(plan.tick.pool,"armor");assert.equal(plan.after,30-plan.tick.damage);assert.equal(plan.view.overdue,true);
 assert.equal(armorBreakTickPlan(f.actor,record,{damage:.5}).after,29.5);assert.equal(armorBreakTickPlan(f.actor,record,{skip:true}).after,30);assert.deepEqual({system:f.actor.system,flags:f.actor.flags,armor:f.armor.system},before);
 for(const damage of [-1,Infinity,NaN,"1",1000001])assert.throws(()=>armorBreakTickPlan(f.actor,record,{damage}));assert.throws(()=>armorBreakTickPlan(f.actor,record,{skip:"true"}));
 }
});

test("parcelas já registradas não repetem; cópia e manipulação da tabela são recusadas",()=>{
 const f=fixture(),record=f.create();f.combat.round=3;const first=armorBreakTickPlan(f.actor,record);record.ticks.round3=first.tick;assert.equal(armorBreakView(f.actor,record).canResolve,false);assert.throws(()=>armorBreakTickPlan(f.actor,record));f.combat.round=4;assert.equal(armorBreakTickPlan(f.actor,record).status,"expired");
 const copied={...f.actor,uuid:"Actor.copy"};assert.equal(armorBreakView(copied,record).foreign,true);assert.throws(()=>armorBreakTickPlan(copied,record));
 record.damage=2;assert.equal(armorBreakView(f.actor,record).canResolve,false);record.damage=undefined;record.source.damage=undefined;record.source.classification="unknown";assert.equal(armorBreakView(f.actor,record).canResolve,false);
});

test("assinatura vê edição/reparo de armadura e mantém identidade sintética separada",()=>{
 const f=fixture(),record=f.create(),state=armorBreakState(f.actor);f.armor.system.health.value=29;assert.notEqual(armorBreakState(f.actor),state);f.armor.system.health.value=30;assert.equal(armorBreakState(f.actor),state);f.armor.system.notes="Nota nova";assert.notEqual(armorBreakState(f.actor),state);
 const base=f.actor.uuid;f.actor.uuid="Scene.arena.Token.defender.Actor.target";f.armor.uuid=`${f.actor.uuid}.Item.armor`;const synthetic=f.create();assert.notEqual(synthetic.armor.uuid,record.armor.uuid);assert.notEqual(f.actor.uuid,base);assert.equal(armorBreakView(f.actor,record).foreign,true);
});

function prepared(f){
 const record=f.create();f.combat.round=3;const before=armorBreakSnapshot(f.actor,record.id),plan=armorBreakTickPlan(f.actor,record),afterRecord={...copy(record),ticks:{round3:{...plan.tick,operationId:"operation"}},status:plan.status},after=armorBreakAfter(before,afterRecord,plan.after);
 return {kind:"armorBreak",status:"prepared",actorUuid:f.actor.uuid,effectId:record.id,round:3,before,after};
}
test("recuperação distingue antes/depois e completa só o registro após Item gravado",()=>{
 const f=fixture(),op=prepared(f),baseline=copy({system:f.actor.system,flags:f.actor.flags,armor:f.armor.system});assert.deepEqual(armorBreakRecoveryPlan(f.actor,op),{status:"failed"});
 f.armor.system=copy(op.after.armorSystem);const partial=armorBreakRecoveryPlan(f.actor,op);assert.equal(partial.status,"applied");assert.deepEqual(partial.record,op.after.record);assert.equal(f.actor.flags[ID].persistentEffects.periodic.ticks.round3,undefined);assert.equal(f.actor.system.resources.health.value,baseline.system.resources.health.value);
 f.actor.flags[ID].persistentEffects.periodic=copy(op.after.record);assert.deepEqual(armorBreakRecoveryPlan(f.actor,op),{status:"applied"});assert.equal(f.armor.system.health.value,29);
});

test("recuperação preserva edições posteriores, armadura substituída e registro de outra ficha",()=>{
 for(const change of [f=>f.armor.system.health.value=17,f=>f.armor.system.notes="Nova nota",f=>f.armor.uuid="Actor.target.Item.replacement",f=>f.actor.flags[ID].persistentEffects.periodic.description="Anotação posterior"]){const f=fixture(),op=prepared(f);f.armor.system=copy(op.after.armorSystem);change(f);const before=copy({system:f.actor.system,flags:f.actor.flags,armor:f.armor.system});assert.throws(()=>armorBreakRecoveryPlan(f.actor,op));assert.deepEqual({system:f.actor.system,flags:f.actor.flags,armor:f.armor.system},before);}
 const f=fixture(),op=prepared(f);assert.throws(()=>armorBreakRecoveryPlan({...f.actor,uuid:"Actor.copy"},op),/outra ficha/);op.status="applied";assert.throws(()=>armorBreakRecoveryPlan(f.actor,op));
});

test("recuperação rejeita journal adulterado antes de completar qualquer registro",()=>{
 for(const change of [op=>op.round=4,op=>op.after.armorSystem.health.value=20,op=>op.after.record.description="alterada",op=>op.after.record.ticks.round3.damage=5,op=>op.before.record.actorUuid="Actor.other",op=>op.after.record.ticks.round3.pool="health",op=>op.after.record.ticks.round3.status="skipped"]){const f=fixture(),op=prepared(f);f.armor.system=copy(op.after.armorSystem);change(op);assert.throws(()=>armorBreakRecoveryPlan(f.actor,op));}
});
