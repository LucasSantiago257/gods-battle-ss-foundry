import test from "node:test";
import assert from "node:assert/strict";
import {fixture,patch,counts,resources} from "./armor-repair-fixture.mjs";
import {armorRepairContext,beginArmorRepair,applyArmorRepairHour,finishArmorRepairWork,openArmorRepairRecovery,installArmorRepairPreview} from "../module/armor-repair-ui.mjs";
import {enqueueArmorRepairRequest} from "../module/armor-repair-requests.mjs";
import {KnightSheet} from "../module/sheets.mjs";
const ID="gods-battle-ss";
function setup(options){
 const f=fixture(options),messages=new Map(),answers=[],dialogs=[],notices=[];let n=0;
 game.actors={contents:[...new Set([f.caster,f.target])]};game.combats={contents:[]};globalThis.canvas={tokens:{placeables:[]}};game.messages={get:id=>messages.get(id),get contents(){return [...messages.values()];}};
 globalThis.ui={notifications:{error:t=>notices.push(t)}};
 globalThis.ChatMessage={async create(data){const m={id:`ui${++n}`,author:game.user,blind:false,...structuredClone(data),async update(data){patch(m,data);}};messages.set(m.id,m);return m;}};
 foundry.applications.api.DialogV2={async wait(config){dialogs.push(config);const a=answers.shift();return typeof a==="function"?a(config):a??null;},async confirm(config){dialogs.push(config);const a=answers.shift();return typeof a==="function"?a(config):a??false;}};
 const owner=()=>game.user=f.owner;
 return {...f,messages,answers,dialogs,notices,owner,context:()=>armorRepairContext(f.caster),async process(message=[...messages.values()].at(-1)){game.user=f.gm;await enqueueArmorRepairRequest(message,{},message.author.id);owner();return message;}};
}
function form(values={}){const elements={repair:{value:"11"},cost:{value:"1"},useExtra:{checked:true},allowOverload:{checked:false},reason:{value:""},...values},listeners={},out={textContent:""},button={disabled:false};return {elements,listeners,out,button,querySelector:s=>s.includes("preview")?out:s.includes("button")?button:null,addEventListener:(key,fn)=>listeners[key]=fn};}
const registration=(f,config)=>config.buttons.find(b=>b.action==="register").callback(null,{form:{elements:{sourceUuid:{value:f.item.uuid},armorUuid:{value:f.armor.uuid},reason:{value:""}}}});

test("diálogo de registro usa escolhas autorizadas e callback real sem cobrar",async()=>{
 const f=setup();f.owner();f.item.name='<img src=x onerror="evil">';f.answers.push(c=>registration(f,c));await beginArmorRepair(f.caster);assert.equal(f.messages.size,1);assert.equal(f.writes.length,0);assert.doesNotMatch(f.dialogs[0].content,/<img/);assert.match(f.dialogs[0].content,/&lt;img/);await f.process();assert.equal(Object.values(f.caster.flags[ID].armorRepairs).length,1);assert.deepEqual(counts(f),{payment:0,repair:0});
});
test("observador, alvo sem permissão, token oculto e modelos não são enumerados",async()=>{
 const f=setup();game.user=f.observer;assert.equal((await f.context()).visible,false);await assert.rejects(beginArmorRepair(f.caster));f.owner();const hidden={uuid:"Actor.hidden",type:"knight",testUserPermission:()=>false};Object.defineProperty(hidden,"items",{get(){throw Error("hidden items read");}});const pack={uuid:"Compendium.pack.actors.Actor.model",type:"knight",testUserPermission:()=>true};Object.defineProperty(pack,"items",{get(){throw Error("pack items read");}});game.actors.contents.push(hidden,pack);
 f.target.isToken=true;f.target.token={hidden:true};f.answers.push(null);await assert.rejects(beginArmorRepair(f.caster),/Nenhuma/);assert.equal(f.messages.size,0);
});
test("contexto perde nome/valores/ações ao revogar acesso ao alvo",async()=>{
 const f=setup();await f.register();f.owner();const before=await f.context();assert.equal(before.active[0].name,f.armor.name);f.denied.add(f.target.uuid);let reads=0;f.hooks.resolve=async()=>reads++;const after=await f.context();assert.equal(reads,0);assert.equal(after.active[0].name,"Reparo indisponível");assert.equal(after.active[0].health,undefined);assert.equal(after.active[0].ticks,undefined);
});
test("permissão perdida enquanto o contexto aguarda não revela valores anteriores",async()=>{
 const f=setup();await f.register();f.owner();const waiting=f.context();f.denied.add(f.target.uuid);const result=await waiting;assert.equal(result.active[0].health,undefined);assert.equal(result.active[0].name,"Reparo indisponível");
});
test("cancelar registro/ajuste/undo não envia mensagens ou modifica recursos",async()=>{
 const f=setup();f.owner();f.answers.push(null);await beginArmorRepair(f.caster);game.user=f.gm;await f.register();f.owner();const row=(await f.context()).active[0];f.answers.push(null);await applyArmorRepairHour(f.caster,row.id,{adjust:true,revision:row.revision,signature:row.signature});f.answers.push(false);await finishArmorRepairWork(f.caster,row.id,row.revision,{undo:true});assert.equal(f.messages.size,0);assert.deepEqual(counts(f),{payment:0,repair:0});
});
test("callback Ajustar aceita custo0 explícito quando a sugestão não cabe na CE",async()=>{
 const f=setup({synthetic:true});await f.register();f.caster.system.resources.cosmo.value=0;f.owner();const row=(await f.context()).active[0];assert.equal(row.canApply,undefined);assert.equal(row.canAdjust,true);f.answers.push(c=>c.buttons.find(b=>b.action==="apply").callback(null,{form:form({repair:{value:"2.5"},cost:{value:"0"}})}));await applyArmorRepairHour(f.caster,row.id,{adjust:true,revision:row.revision,signature:row.signature});assert.equal(f.messages.size,1);await f.process();assert.equal(f.armor.system.health.value,21.5);assert.equal(f.caster.system.resources.cosmo.value,0);assert.deepEqual(counts(f),{payment:0,repair:1});
});
test("prévia dinâmica mostra PVA/CE/excesso e não grava; campo vazio não vira0",async()=>{
 const f=setup();await f.register();f.caster.system.resources.cosmo.value=0;f.owner();const row=(await f.context()).active[0],input=form({allowOverload:{checked:true}});installArmorRepairPreview(input,f.item,f.armor,row.signature);assert.match(input.out.textContent,/11 PVA.*1 CE.*11 PV/);assert.equal(input.button.disabled,false);input.elements.cost.value="";input.listeners.input();assert.equal(input.button.disabled,true);input.elements.cost.value="0";input.listeners.input();assert.match(input.out.textContent,/0 CE/);assert.deepEqual(counts(f),{payment:0,repair:0});
});
test("recursos ou permissão alterados durante ajuste recusam antes do envio",async()=>{
 for(const change of [f=>f.caster.system.resources.cosmo.value--,f=>f.denied.add(f.target.uuid)]){const f=setup();await f.register();f.owner();const row=(await f.context()).active[0];f.answers.push(c=>{const value=c.buttons.find(b=>b.action==="apply").callback(null,{form:form()});change(f);return value;});await assert.rejects(applyArmorRepairHour(f.caster,row.id,{adjust:true,revision:row.revision,signature:row.signature}));assert.equal(f.messages.size,0);assert.deepEqual(counts(f),{payment:0,repair:0});}
});
test("ações reais da ficha aplicam/desfazem e deixam Técnicas/Atacar intocados",async()=>{
 const f=setup();await f.register();f.owner();const row=(await f.context()).active[0],button={disabled:false,dataset:{repair:row.id,revision:String(row.revision),signature:row.signature}},sheet={actor:f.caster,isEditable:true};await KnightSheet.DEFAULT_OPTIONS.actions.applyArmorRepair.call(sheet,null,button);assert.equal(button.disabled,false);assert.equal((await f.context()).waiting,true);await f.process();assert.equal(f.saved().hours,1);const after=(await f.context()).active[0];assert.equal(after.canUndo,true);button.dataset.revision=String(after.revision);f.answers.push(true);await KnightSheet.DEFAULT_OPTIONS.actions.undoArmorRepair.call(sheet,null,button);await f.process();assert.equal(f.saved().hours,0);assert.deepEqual(resources(f),{ce:10,extra:0,health:100,armor:19});assert.equal(typeof KnightSheet.DEFAULT_OPTIONS.actions.attackTarget,"function");assert.equal(typeof KnightSheet.DEFAULT_OPTIONS.actions.useTechnique,"function");
});
test("encerrar trabalho com fonte removida é possível sem cura ou cobrança",async()=>{
 const f=setup();await f.register();f.caster.items.contents=f.caster.items.contents.filter(x=>x!==f.item);f.docs.delete(f.item.uuid);f.owner();const row=(await f.context()).active[0];assert.equal(row.canEnd,true);f.answers.push(true);await finishArmorRepairWork(f.caster,row.id,row.revision);await f.process();assert.equal(f.saved().status,"ended");assert.deepEqual(counts(f),{payment:0,repair:0});assert.equal((await f.context()).history.length,1);
});
test("recuperação pelo alvo usa origem autorizada e journal correto",async()=>{
 const f=setup();await f.register();f.faults.push({tag:"payment",phase:"after"});await assert.rejects(f.apply());f.owner();const op=f.pending();const context=await armorRepairContext(f.target);assert.equal(context.interruptions[0].canRecover,true);f.answers.push(c=>c.buttons.find(b=>b.action==="recover").callback(null,{form:form()}));await openArmorRepairRecovery(f.target,op.id);assert.equal([...f.messages.values()][0].flags[ID].armorRepairRequest.actorUuid,f.caster.uuid);await f.process();assert.deepEqual(counts(f),{payment:1,repair:1});
});
test("órfão aparece só para mestre e encerramento não muda recursos",async()=>{
 const f=setup();await f.register();f.faults.push({tag:"payment",phase:"after"});await assert.rejects(f.apply());const op=f.pending(),before=resources(f);f.docs.delete(f.caster.uuid);game.actors.contents=[f.target];game.user=f.gm;const context=await armorRepairContext(f.target);assert.equal(context.interruptions[0].canOrphan,true);f.answers.push(c=>c.buttons.find(b=>b.action==="close").callback(null,{form:form()}));await openArmorRepairRecovery(f.target,op.id);const message=[...f.messages.values()][0];await enqueueArmorRepairRequest(message,{},f.gm.id);assert.equal(f.target.flags[ID].effectOperations[op.id].status,"reviewed");assert.deepEqual(resources(f),before);
});
test("offline e cópia estrangeira exibem estado sem controles de gasto",async()=>{
 const f=setup();await f.register();f.owner();game.users.activeGM=null;const context=await f.context();assert.equal(context.offline,true);assert.equal(context.canRegister,false);assert.equal(context.active[0].canApply,undefined);game.users.activeGM=f.gm;f.caster.uuid="Actor.copy";const copied=await f.context();assert.equal(copied.active[0].foreign,true);assert.equal(copied.active[0].sourceName,undefined);assert.equal(copied.active[0].canEnd,undefined);
});
