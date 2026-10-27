import test from "node:test";
import assert from "node:assert/strict";
import {effectOperationContext,recoverEffect} from "../module/effects.mjs";
import {fixture,patch,resources,counts} from "./armor-repair-fixture.mjs";
import {armorRepairState} from "../module/armor-repair-rules.mjs";
import {armorRepairRequest,submitArmorRepairRequest,enqueueArmorRepairRequest,resumeArmorRepairRequests,renderArmorRepairRequest,notifyArmorRepairResponse} from "../module/armor-repair-requests.mjs";
const ID="gods-battle-ss";
function setup(options){
 const f=fixture(options),messages=new Map(),responses=[],notices=[];let n=0,fail=null;
 game.messages={get:id=>messages.get(id),get contents(){return [...messages.values()];}};
 globalThis.ui={notifications:{info:t=>notices.push(["info",t]),error:t=>notices.push(["error",t])}};
 globalThis.ChatMessage={async create(data){const m={id:`msg${++n}`,author:game.user,blind:false,...structuredClone(data),async update(data){if(fail==="before"){fail=null;throw Error("response lost before save");}patch(m,data);responses.push(structuredClone(data));if(fail==="after"){fail=null;throw Error("response lost after save");}return m;}};messages.set(m.id,m);return m;}};
 const request=()=>({action:"apply",actorUuid:f.caster.uuid,recordId:f.saved().id,expectedRevision:f.saved().revision,expectedState:armorRepairState(f.item,f.armor)});
 return {...f,messages,responses,notices,request,response:m=>m.flags[ID].armorRepairResponse,req:m=>m.flags[ID].armorRepairRequest,loseResponse:phase=>fail=phase,async send(value=request()){game.user=f.owner;const m=await submitArmorRepairRequest(value);game.user=f.gm;return m;},process:m=>enqueueArmorRepairRequest(m,{},m.author.id)};
}
test("solicitação privada é discreta e não grava recursos antes do processamento",async()=>{
 const f=setup(),before=resources(f),m=await f.send({action:"register",actorUuid:f.caster.uuid,sourceUuid:f.item.uuid,armorUuid:f.armor.uuid,expectedState:armorRepairState(f.item,f.armor)});assert.deepEqual(m.whisper,["owner","gm"]);assert.equal(f.writes.length,0);assert.deepEqual(resources(f),before);const html={hidden:false,setAttribute(){}};renderArmorRepairRequest(m,html);assert.equal(html.hidden,true);await f.process(m);assert.equal(f.response(m).status,"registered");assert.equal(Object.values(f.caster.flags[ID].armorRepairs)[0].id,m.id);assert.deepEqual(resources(f),before);
});
test("apply usa autor real e identidade da mensagem, sem patches/roles recebidos",async()=>{
 const f=setup();await f.register();const m=await f.send({...f.request(),operationId:"evil",requester:{id:"gm",isGM:true},updates:{"system.resources.cosmo.value":999},options:{updates:{"system.resources.health.value":999}}});await f.process(m);assert.equal(f.response(m).ok,true);assert.equal(f.last().id,m.id);assert.equal(f.last().userId,"owner");assert.deepEqual(resources(f),{ce:9,extra:0,health:100,armor:30});assert.equal(Object.hasOwn(f.response(m),"record"),false);assert.doesNotMatch(JSON.stringify(f.response(m)),/description|sourceName|armorName/);
});
test("autoria falsa, públicas, cegas e destinatário extra não alteram recursos",async()=>{
 for(const change of [(_f,m)=>m.whisper=[],(_f,m)=>m.blind=true,(_f,m)=>m.whisper.push("observer"),(_f,m)=>m.whisper=["gm"]]){const f=setup();await f.register();const m=await f.send();change(f,m);await enqueueArmorRepairRequest(m,{},"owner");assert.equal(f.response(m).ok,false);assert.deepEqual(counts(f),{payment:0,repair:0});}
 const f=setup();await f.register();const m=await f.send();f.messages.delete(m.id);await f.process(m);assert.equal(f.response(m),undefined);assert.deepEqual(counts(f),{payment:0,repair:0});
});
test("observador ou proprietário sem alvo não ganha permissão de payload",async()=>{
 for(const lost of ["origin","target","observer"]){const f=setup();await f.register();const m=await f.send({...f.request(),requester:{id:"gm",isGM:true}});if(lost==="observer"){m.author=f.observer;m.whisper=["observer","gm"];}else f.denied.add(lost==="origin"?f.caster.uuid:f.target.uuid);await f.process(m);assert.equal(f.response(m).ok,false);assert.deepEqual(counts(f),{payment:0,repair:0});}
});
test("create e retomada concorrentes usam uma única intenção",async()=>{
 const f=setup({synthetic:true});await f.register();const m=await f.send();await Promise.all([f.process(m),resumeArmorRepairRequests(),f.process(m)]);assert.equal(f.response(m).ok,true);assert.deepEqual(counts(f),{payment:1,repair:1});assert.equal(f.saved().hours,1);await resumeArmorRepairRequests();assert.deepEqual(counts(f),{payment:1,repair:1});
});
test("resposta perdida de apply é retomada sem débito e recibo não reverte undo posterior",async()=>{
 for(const phase of ["before","after"]){const f=setup();await f.register();const m=await f.send();f.loseResponse(phase);await f.process(m);assert.deepEqual(counts(f),{payment:1,repair:1});if(phase==="before"){assert.equal(f.response(m),undefined);await f.undo();const current=structuredClone(f.saved());await resumeArmorRepairRequests();assert.equal(f.response(m).replayed,true);assert.deepEqual(f.saved(),current);assert.deepEqual(resources(f),{ce:10,extra:0,health:100,armor:19});}else{assert.equal(f.response(m).ok,true);await resumeArmorRepairRequests();assert.deepEqual(counts(f),{payment:1,repair:1});}}
});
test("resposta perdida de registro não duplica trabalho gratuito",async()=>{
 const f=setup(),m=await f.send({action:"register",actorUuid:f.caster.uuid,sourceUuid:f.item.uuid,armorUuid:f.armor.uuid,expectedState:armorRepairState(f.item,f.armor)});f.loseResponse("before");await f.process(m);assert.equal(f.response(m),undefined);await resumeArmorRepairRequests();assert.equal(f.response(m).ok,true);assert.equal(Object.keys(f.caster.flags[ID].armorRepairs).length,1);assert.deepEqual(counts(f),{payment:0,repair:0});
});
test("solicitação alterada durante resolução é recusada antes do journal",async()=>{
 const f=setup();await f.register();const m=await f.send({...f.request(),options:{cost:1}});f.hooks.resolve=async()=>{f.hooks.resolve=null;f.req(m).options.cost=0;};await f.process(m);assert.equal(f.response(m).ok,false);assert.equal(f.pending(),undefined);assert.deepEqual(counts(f),{payment:0,repair:0});
});
test("mensagem alterada depois do journal não cobra e removida depois do débito recupera",async()=>{
 const f=setup();await f.register();const m=await f.send({...f.request(),options:{cost:1}});f.hooks.after=async(_actor,tag)=>{if(tag==="originJournal"){f.hooks.after=null;f.req(m).options.cost=0;}};await f.process(m);assert.equal(f.response(m).ok,false);assert.equal(f.pending().id,m.id);assert.deepEqual(counts(f),{payment:0,repair:0});await f.recover();
 const g=setup();await g.register();const a=await g.send();g.hooks.after=async(_actor,tag)=>{if(tag==="payment"){g.hooks.after=null;g.messages.delete(a.id);}};await g.process(a);assert.deepEqual(counts(g),{payment:1,repair:0});const recover=await g.send({action:"recover",actorUuid:g.caster.uuid,operationId:g.pending().id});await g.process(recover);assert.equal(g.response(recover).ok,true);assert.deepEqual(counts(g),{payment:1,repair:1});
});
test("mudança de mestre no meio da hora deixa retomada vinculada ao mesmo ID",async()=>{
 const f=setup();await f.register();const m=await f.send(),newGM={id:"gm2",isGM:true,active:true};f.users.set(newGM.id,newGM);f.hooks.after=async(_actor,tag)=>{if(tag==="payment"){f.hooks.after=null;game.users.activeGM=newGM;}};await f.process(m);assert.equal(f.response(m),undefined);assert.deepEqual(counts(f),{payment:1,repair:0});game.user=newGM;await resumeArmorRepairRequests();assert.equal(f.response(m).ok,false);assert.equal(f.pending().id,m.id);await f.recover();assert.deepEqual(counts(f),{payment:1,repair:1});
});
test("ações de undo/encerrar/fechar e órfão passam pelos controles reais",async()=>{
 const f=setup();await f.register();await f.process(await f.send());const undo=await f.send({action:"undo",actorUuid:f.caster.uuid,recordId:f.saved().id,expectedRevision:f.saved().revision});await f.process(undo);assert.equal(f.response(undo).ok,true);assert.equal(f.saved().hours,0);const end=await f.send({action:"end",actorUuid:f.caster.uuid,recordId:f.saved().id,expectedRevision:f.saved().revision});await f.process(end);assert.equal(f.saved().status,"ended");
 const g=setup();await g.register();g.faults.push({tag:"payment",phase:"after"});const apply=await g.send();await g.process(apply);const op=g.pending();g.armor.system.health.value=22;const close=await g.send({action:"close",actorUuid:g.caster.uuid,operationId:op.id});await g.process(close);assert.equal(g.response(close).ok,true);assert.equal(g.armor.system.health.value,22);assert.equal(g.caster.system.resources.cosmo.value,9);
});
test("sem mestre ativo não se envia, e cliente jogador não processa",async()=>{
 const f=setup();await f.register();game.users.activeGM=null;await assert.rejects(f.send(),/mestre ativo/);assert.equal(f.messages.size,0);game.users.activeGM=f.gm;const m=await f.send();game.user=f.owner;await f.process(m);assert.equal(f.response(m),undefined);game.user=f.gm;await f.process(m);assert.equal(f.response(m).ok,true);
});
test("parâmetros nulos/herdados e comando estranho não viram outra ação",async()=>{
 for(const value of [null,[],Object.create({action:"apply"}),{action:"delete",actorUuid:"Actor.x"},{action:"apply",actorUuid:"Actor.x",recordId:"x",expectedRevision:"0"}])assert.throws(()=>armorRepairRequest(value));
 const f=setup();await f.register();const m=await f.send({...f.request(),options:{cost:null}});await f.process(m);assert.equal(f.response(m).ok,false);assert.deepEqual(counts(f),{payment:0,repair:0});
});
test("modelos de compêndio nunca viram pagadores/armaduras de trabalho",async()=>{
 const f=setup();await f.register();const original=f.caster.uuid;f.caster.uuid="Compendium.examples.actors.Actor.template";f.docs.set(f.caster.uuid,f.caster);const m=await f.send({action:"apply",actorUuid:f.caster.uuid,recordId:f.saved().id,expectedRevision:0,expectedState:"irrelevant"});await f.process(m);assert.equal(f.response(m).ok,false);assert.deepEqual(counts(f),{payment:0,repair:0});f.caster.uuid=original;
});
test("respostas só notificam o autor e mensagens internas não mostram solicitação",async()=>{
 const f=setup();await f.register();const m=await f.send();await f.process(m);game.user=f.observer;notifyArmorRepairResponse(m);assert.equal(f.notices.length,0);game.user=f.owner;notifyArmorRepairResponse(m);assert.deepEqual(f.notices,[["info","Hora de reparo registrada."]]);const root={hidden:false,setAttribute(){}};renderArmorRepairRequest(m,{closest:()=>root});assert.equal(root.hidden,true);
});

test("hook com userId falso não responde nem cancela a intenção legítima",async()=>{
 const f=setup();await f.register();const m=await f.send();await enqueueArmorRepairRequest(m,{},"observer");assert.equal(f.response(m),undefined);assert.deepEqual(counts(f),{payment:0,repair:0});await f.process(m);assert.equal(f.response(m).ok,true);
});
test("journals de reparo não são listados/resolvidos pelo recuperador genérico",async()=>{
 const f=setup();await f.register();f.faults.push({tag:"payment",phase:"after"});const m=await f.send();await f.process(m);assert.equal(effectOperationContext(f.caster).length,0);assert.equal(effectOperationContext(f.target).length,0);let dialogs=0;foundry.applications.api.DialogV2={wait:async()=>{dialogs++;return null;}};await recoverEffect(f.caster,m.id);assert.equal(dialogs,1);assert.equal(f.pending().status,"prepared");assert.deepEqual(counts(f),{payment:1,repair:0});
});
