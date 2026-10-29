import test from "node:test";
import assert from "node:assert/strict";
import {controlMessages} from "./control-retry-message-fixture.mjs";
import {controlRetryRequest,submitControlRetryRequest,enqueueControlRetryRequest,resumeControlRetryRequests,renderControlRetryRequest,notifyControlRetryResponse} from "../module/control-retry-requests.mjs";
const ID="gods-battle-ss",copy=structuredClone;
test("autor real e IDreal da mensagem vinculam cobrança/publicação sem origem oculta",async()=>{
 const f=controlMessages({synthetic:true}),m=await f.send({...f.request(),operationId:"forged",requester:{id:"gm",isGM:true},actor:{uuid:"Actor.hidden"},updates:{"system.resources.health.value":0},options:{...f.options,requester:{isGM:true},resistanceMode:"forged",callback:"evil"}});assert.deepEqual(m.whisper,["owner","gm"]);assert.equal(f.writes.length,0);await f.process(m);assert.equal(f.response(m).ok,true);assert.equal(f.operations()[m.id].userId,"owner");assert.equal(f.operations()[m.id].preview.options.resistanceMode,"rank");assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.actor.system.resources.health.value,90);assert.equal(f.stats.rolls,1);assert.equal(f.stats.cards,1);assert.doesNotMatch(JSON.stringify(f.response(m)),/snapshot|hidden|source|plan|resources|roll/);
});
test("pública/blind/oculta/destinatários extras não executam nem respondem",async()=>{
 for(const change of [m=>m.whisper=[],m=>m.blind=true,m=>m.isContentVisible=false,m=>m.whisper.push("observer"),m=>m.whisper=["owner"],m=>m.whisper=["gm"]]){const f=controlMessages(),m=await f.send();change(m);await f.process(m);assert.equal(f.response(m),undefined);assert.equal(f.writes.length,0);assert.equal(f.stats.rolls,0);}
});
test("hookuser forjado e instância da mensagem substituída são ignorados",async()=>{
 const f=controlMessages(),m=await f.send();await enqueueControlRetryRequest(m,{},"gm");await enqueueControlRetryRequest({...m},{},"owner");assert.equal(f.writes.length,0);assert.equal(f.response(m),undefined);await f.process(m);assert.equal(f.response(m).ok,true);
});
test("observador/autor ausente/perdaOWNER não obtêm contexto privado",async()=>{
 for(const mode of ["observer","missing","denied"]){const f=controlMessages(),m=await f.send();if(mode==="observer"){m.author=f.observer;m.whisper=["observer","gm"];}if(mode==="missing")f.users.delete("owner");if(mode==="denied")f.denied.add(f.actor.uuid);await f.process(m);assert.equal(f.writes.length,0);assert.equal(f.stats.rolls,0);assert.equal(f.response(m)?.ok,mode==="missing"?undefined:false);}
});
test("duplo processamento/retomada da mesma mensagem cobra e rola sóuma vez",async()=>{
 const f=controlMessages(),m=await f.send();await Promise.all([f.process(m),resumeControlRetryRequests(),f.process(m)]);assert.equal(f.stats.rolls,1);assert.equal(f.stats.cards,1);assert.equal(f.actor.system.resources.cosmo.value,7);await resumeControlRetryRequests();assert.equal(f.stats.rolls,1);
});
test("duas mensagens da mesma prévia não registram a próxima rodada",async()=>{
 const f=controlMessages(),a=await f.send(),b=await f.send();await Promise.all([f.process(a),f.process(b)]);assert.equal(f.stats.rolls,1);assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal([f.response(a),f.response(b)].filter(r=>r.ok).length,1);
});
test("resposta perdida antes/depois retoma resumo sem regravar ficha atual",async()=>{
 for(const phase of ["before","after"]){const f=controlMessages(),m=await f.send();f.loseResponse(phase);await f.process(m);assert.equal(f.actor.system.resources.cosmo.value,7);if(phase==="before"){f.actor.system.resources.cosmo.value=3;f.record.reason="Tardia";delete f.actor.flags[ID].persistentEffects.controlA;const n=f.writes.length;await resumeControlRetryRequests();assert.equal(f.response(m).replayed,true);assert.equal(f.writes.length,n);assert.equal(f.actor.system.resources.cosmo.value,3);}else assert.equal(f.response(m).ok,true);assert.equal(f.stats.rolls,1);assert.equal(f.stats.cards,1);}
});
test("mensagem/opções alteradas durante await não autorizam intenção antiga",async()=>{
 const f=controlMessages(),m=await f.send();let once=false;f.hooks.resolve=()=>{if(!once){once=true;f.req(m).options.bonus=30;}};await f.process(m);assert.equal(f.response(m).ok,false);assert.equal(f.stats.rolls,0);assert.equal(f.writes.length,0);
});
test("mensagem tornada pública/removida/oculta após journal não recebe erro revelador",async()=>{
 for(const change of [(f,m)=>m.whisper=[],(f,m)=>f.messages.delete(m.id),(f,m)=>m.isContentVisible=false]){const f=controlMessages(),m=await f.send();f.hooks.after=tag=>{if(tag==="rolling")change(f,m);};await f.process(m);assert.equal(f.response(m),undefined);assert.equal(f.stats.rolls,0);assert.equal(f.actor.system.resources.cosmo.value,8);}
});
test("troca deGM/OWNER/epoch durante dado mantém journal sem débito repetido",async()=>{
 for(const change of [f=>game.users.activeGM=null,f=>f.denied.add(f.actor.uuid),f=>f.combat.flags[ID].actionControl.epoch="new"]){const f=controlMessages(),m=await f.send();f.hooks.after=tag=>{if(tag==="roll")change(f);};await f.process(m);assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(f.stats.rolls,1);game.users.activeGM=f.gm;f.denied.clear();f.hooks.after=null;const recovery=await f.send({action:"recover",actorUuid:f.actor.uuid,operationId:m.id,reason:""});await f.process(recovery);assert.equal(f.response(recovery).ok,true);assert.equal(f.operations()[m.id].status,"reviewed");assert.equal(f.stats.rolls,1);}
});
test("recover conclui sócommit ausente e publica mesmo resultado",async()=>{
 const f=controlMessages(),m=await f.send();f.faults.push({tag:"commit",phase:"before"});await f.process(m);assert.equal(f.response(m).ok,false);assert.equal(f.operations()[m.id].phase,"ready");const next=await f.send({action:"recover",actorUuid:f.actor.uuid,operationId:m.id});await f.process(next);assert.equal(f.response(next).ok,true);assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.stats.rolls,1);assert.equal(f.stats.cards,1);
});
test("close divergente/copied só encerra o journal apontado",async()=>{
 const f=controlMessages(),m=await f.send();f.faults.push({tag:"commit",phase:"before"});await f.process(m);f.actor.system.resources.cosmo.value=4;f.operations()[m.id].recordId="tampered";const before=copy(f.record),next=await f.send({action:"close",actorUuid:f.actor.uuid,operationId:m.id,reason:""});f.loseResponse("before");await f.process(next);await resumeControlRetryRequests();assert.equal(f.operations()[m.id].status,"reviewed");assert.equal(f.response(next).ok,true);assert.deepEqual(f.record,before);assert.equal(f.actor.system.resources.cosmo.value,4);assert.equal(f.stats.rolls,1);
});
test("recuperação não aceita snapshot/patch/resultado recebido como execução",async()=>{
 const f=controlMessages(),m=await f.send({action:"recover",actorUuid:"Actor.target",operationId:"missing",snapshot:{},updates:{"system.resources.cosmo.value":0},gm:true});await f.process(m);assert.equal(f.response(m).ok,false);assert.equal(f.writes.length,0);
});
test("opções inválidas não enviam mensagem ou rolam",async()=>{
 for(const value of [null,{action:"register"},{action:"retry",actorUuid:"Item.x"},{action:"close",actorUuid:"Actor.target",operationId:"bad.id"}])assert.throws(()=>controlRetryRequest(value));
 const f=controlMessages();for(const o of [{attribute:""},{bonus:NaN},{advantage:2},{useExtra:"true"},{onSuccess:"undo"},{reason:()=>0}])await assert.rejects(f.send({...f.request(),options:{...f.options,...o}}));assert.equal(f.messages.size,0);assert.equal(f.writes.length,0);
});
test("envio recusa mestre offline/forjado e usuário não canônico",async()=>{
 const f=controlMessages();game.user=f.owner;game.users.activeGM=null;await assert.rejects(submitControlRetryRequest(f.request()),/offline/);game.users.activeGM={...f.gm};await assert.rejects(submitControlRetryRequest(f.request()),/offline/);game.users.activeGM=f.gm;game.user={...f.owner};await assert.rejects(submitControlRetryRequest(f.request()),/offline/);assert.equal(f.messages.size,0);
});
test("render interno marca wrapper mesmo antes da inserção",async()=>{
 const f=controlMessages(),m=await f.send(),html={dataset:{},hidden:false,setAttribute(){},closest:()=>null};renderControlRetryRequest(m,html);assert.equal(html.hidden,true);assert.equal(html.dataset.godsBattleInternalControlRetry,"");
});
test("notificação de resposta só aparece ao autor e em update relevante",async()=>{
 const f=controlMessages(),m=await f.send();await f.process(m);game.user=f.observer;notifyControlRetryResponse(m);assert.equal(f.notices.length,0);game.user=f.owner;notifyControlRetryResponse(m,{content:"x"});assert.equal(f.notices.length,0);notifyControlRetryResponse(m,{[`flags.${ID}.controlRetryResponse`]:f.response(m)});assert.equal(f.notices[0].type,"info");
});
test("publicação perdida é recuperada sem relançar ou consumir CE novamente",async()=>{
 const f=controlMessages(),m=await f.send();f.faults.push({tag:"card",phase:"after"});await f.process(m);assert.equal(f.response(m).ok,false);assert.equal(f.stats.cards,1);const next=await f.send({action:"recover",actorUuid:f.actor.uuid,operationId:m.id});await f.process(next);assert.equal(f.response(next).ok,true);assert.equal(f.stats.cards,1);assert.equal(f.stats.rolls,1);assert.equal(f.actor.system.resources.cosmo.value,7);
});
