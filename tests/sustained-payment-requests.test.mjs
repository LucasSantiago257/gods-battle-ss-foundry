import test from "node:test";
import assert from "node:assert/strict";
import {sustainMessages} from "./sustained-payment-message-fixture.mjs";
import {sustainPaymentRequest,submitSustainPaymentRequest,enqueueSustainPaymentRequest,resumeSustainPaymentRequests,renderSustainPaymentRequest,notifySustainPaymentResponse} from "../module/sustained-payment-requests.mjs";
import {sustainEndState} from "../module/sustained-payment-rules.mjs";
const ID="gods-battle-ss",copy=structuredClone;
test("autor/ID reais cobram no pagador sem executar pap\u00e9is/patches recebidos",async()=>{
 const f=sustainMessages({synthetic:true}),m=await f.send({...f.request(),operationId:"forged",requester:{id:"gm",isGM:true},actor:{uuid:"Actor.hidden"},updates:{"system.resources.health.value":0},options:{...f.options,cost:0,callback:"evil"}});assert.deepEqual(m.whisper,["owner","gm"]);assert.equal(f.writes.length,0);await f.process(m);assert.equal(f.response(m).ok,true);assert.equal(f.operations()[m.id].userId,"owner");assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.actor.system.resources.health.value,90);assert.equal(Object.hasOwn(f.operations()[m.id].options,"cost"),false);assert.doesNotMatch(JSON.stringify(f.response(m)),/snapshot|hidden|source|plan|resources/);
});
test("mensagem p\u00fablica/blind/oculta/com destinat\u00e1rio extra n\u00e3o executa nem responde",async()=>{
 for(const change of [m=>m.whisper=[],m=>m.blind=true,m=>m.isContentVisible=false,m=>m.whisper.push("observer"),m=>m.whisper=["owner"],m=>m.whisper=["gm"]]){const f=sustainMessages(),m=await f.send();change(m);await f.process(m);assert.equal(f.response(m),undefined);assert.equal(f.writes.length,0);}
});
test("hookuser forjado/inst\u00e2ncia substitu\u00edda s\u00e3o ignorados",async()=>{
 const f=sustainMessages(),m=await f.send();await enqueueSustainPaymentRequest(m,{},"gm");await enqueueSustainPaymentRequest({...m},{},"owner");assert.equal(f.writes.length,0);assert.equal(f.response(m),undefined);await f.process(m);assert.equal(f.response(m).ok,true);
});
test("observador/autor removido/perdaOWNER n\u00e3o acessam contexto financeiro",async()=>{
 for(const mode of ["observer","missing","denied"]){const f=sustainMessages(),m=await f.send();if(mode==="observer"){m.author=f.observer;m.whisper=["observer","gm"];}if(mode==="missing")f.users.delete("owner");if(mode==="denied")f.denied.add(f.actor.uuid);await f.process(m);assert.equal(f.writes.length,0);assert.equal(f.response(m)?.ok,mode==="missing"?undefined:false);}
});
test("duplo processamento e retomada da mesma mensagem cobram uma vez",async()=>{
 const f=sustainMessages(),m=await f.send();await Promise.all([f.process(m),resumeSustainPaymentRequests(),f.process(m)]);assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.writes.filter(w=>w.tag==="commit").length,1);await resumeSustainPaymentRequests();assert.equal(f.writes.filter(w=>w.tag==="commit").length,1);
});
test("duas mensagens da mesma pr\u00e9via n\u00e3o pagam rodada seguinte",async()=>{
 const f=sustainMessages(),a=await f.send(),b=await f.send();await Promise.all([f.process(a),f.process(b)]);assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal([f.response(a),f.response(b)].filter(r=>r.ok).length,1);
});
test("resposta perdida retoma resumo hist\u00f3rico sem restaurar registro",async()=>{
 for(const phase of ["before","after"]){const f=sustainMessages(),m=await f.send();f.loseResponse(phase);await f.process(m);assert.equal(f.actor.system.resources.cosmo.value,7);if(phase==="before"){f.actor.system.resources.cosmo.value=3;delete f.actor.flags[ID].persistentEffects.sustain1;const n=f.writes.length;await resumeSustainPaymentRequests();assert.equal(f.response(m).replayed,true);assert.equal(f.writes.length,n);assert.equal(f.actor.system.resources.cosmo.value,3);}else assert.equal(f.response(m).ok,true);}
});
test("op\u00e7\u00f5es alteradas durante await n\u00e3o autorizam inten\u00e7\u00e3o antiga",async()=>{
 const f=sustainMessages(),m=await f.send();let once=false;f.hooks.resolve=()=>{if(!once){once=true;f.req(m).options.useExtra=true;}};await f.process(m);assert.equal(f.response(m).ok,false);assert.equal(f.writes.length,0);
});
test("mensagem tornada p\u00fablica/removida/oculta ap\u00f3s journal n\u00e3o recebe erro revelador",async()=>{
 for(const change of [(f,m)=>m.whisper=[],(f,m)=>f.messages.delete(m.id),(f,m)=>m.isContentVisible=false]){const f=sustainMessages(),m=await f.send();f.hooks.after=tag=>{if(tag==="journal")change(f,m);};await f.process(m);assert.equal(f.response(m),undefined);assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(f.operations()[m.id].status,"prepared");}
});
test("GM/OWNER/epoch mudados ap\u00f3s preparo impedem d\u00e9bito e permitem close",async()=>{
 for(const change of [f=>game.users.activeGM=null,f=>f.denied.add(f.actor.uuid),f=>f.combat.flags[ID].actionControl.epoch="new"]){const f=sustainMessages(),m=await f.send();f.hooks.after=tag=>{if(tag==="journal")change(f);};await f.process(m);assert.equal(f.actor.system.resources.cosmo.value,8);game.users.activeGM=f.gm;f.denied.clear();f.hooks.after=null;const recovery=await f.send({action:"close",actorUuid:f.actor.uuid,operationId:m.id});await f.process(recovery);assert.equal(f.response(recovery).ok,true);assert.equal(f.operations()[m.id].status,"reviewed");}
});
test("recover usa journal pr\u00f3prio para concluir somente commit ausente",async()=>{
 const f=sustainMessages(),m=await f.send();f.faults.push({tag:"commit",phase:"before"});await f.process(m);assert.equal(f.response(m).ok,false);const next=await f.send({action:"recover",actorUuid:f.actor.uuid,operationId:m.id,snapshot:{},updates:{"system.resources.cosmo.value":999}});await f.process(next);assert.equal(f.response(next).ok,true);assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.writes.filter(w=>w.tag==="commit").length,1);
});
test("close divergente/copiado preserva registro e n\u00e3o repete recurso",async()=>{
 const f=sustainMessages(),m=await f.send();f.faults.push({tag:"commit",phase:"before"});await f.process(m);f.actor.system.resources.cosmo.value=4;f.operations()[m.id].recordId="tampered";const before=copy(f.record),next=await f.send({action:"close",actorUuid:f.actor.uuid,operationId:m.id});f.loseResponse("before");await f.process(next);await resumeSustainPaymentRequests();assert.equal(f.operations()[m.id].status,"reviewed");assert.equal(f.response(next).ok,true);assert.deepEqual(f.record,before);assert.equal(f.actor.system.resources.cosmo.value,4);
});
test("normaliza\u00e7\u00e3o rejeita a\u00e7\u00e3o/ID/op\u00e7\u00f5es inv\u00e1lidos sem enviar",async()=>{
 for(const value of [null,{action:"register"},{action:"pay",actorUuid:"Item.x"},{action:"close",actorUuid:"Actor.payer",operationId:"bad.id"}])assert.throws(()=>sustainPaymentRequest(value));const f=sustainMessages();for(const o of [{useExtra:"true"},{reason:()=>0},{reason:12},{useExtra:null}])await assert.rejects(f.send({...f.request(),options:{...f.options,...o}}));assert.equal(f.messages.size,0);
});
test("envio recusa GM offline/forjado e usu\u00e1rio n\u00e3o can\u00f4nico",async()=>{
 const f=sustainMessages();game.user=f.owner;game.users.activeGM=null;await assert.rejects(submitSustainPaymentRequest(f.request()),/offline/);game.users.activeGM={...f.gm};await assert.rejects(submitSustainPaymentRequest(f.request()),/offline/);game.users.activeGM=f.gm;game.user={...f.owner};await assert.rejects(submitSustainPaymentRequest(f.request()),/offline/);assert.equal(f.messages.size,0);
});
test("End por mensagem tem inten\u00e7\u00e3o real e funciona sem alvo/encontro",async()=>{
 const f=sustainMessages();await f.pay();f.docs.delete(f.target.uuid);game.combat=null;game.combats.contents=[];const before=copy(f.actor.system.resources),m=await f.send({action:"end",actorUuid:f.actor.uuid,recordId:"sustain1",expectedState:sustainEndState(f.actor,"sustain1"),reason:""});await f.process(m);assert.equal(f.response(m).ok,true);assert.equal(f.operations()[m.id].action,"end");assert.equal(f.record.status,"ended");assert.deepEqual(f.actor.system.resources,before);
});
test("wrapper interno fica marcado mesmo antes da inser\u00e7\u00e3o",async()=>{
 const f=sustainMessages(),m=await f.send(),html={dataset:{},hidden:false,setAttribute(){},closest:()=>null};renderSustainPaymentRequest(m,html);assert.equal(html.hidden,true);assert.equal(html.dataset.godsBattleInternalSustainPayment,"");
});
test("notifica\u00e7\u00e3o s\u00f3 aparece ao autor no update pertinente",async()=>{
 const f=sustainMessages(),m=await f.send();await f.process(m);game.user=f.observer;notifySustainPaymentResponse(m);assert.equal(f.notices.length,0);game.user=f.owner;notifySustainPaymentResponse(m,{content:"x"});assert.equal(f.notices.length,0);notifySustainPaymentResponse(m,{[`flags.${ID}.sustainPaymentResponse`]:f.response(m)});assert.equal(f.notices[0].type,"info");
});
test("End com resposta perdida retoma sem reabrir efeito ou exigir registro",async()=>{
 const f=sustainMessages(),m=await f.send({action:"end",actorUuid:f.actor.uuid,recordId:"sustain1",expectedState:sustainEndState(f.actor,"sustain1"),reason:""});f.loseResponse("before");await f.process(m);assert.equal(f.record.status,"ended");delete f.actor.flags[ID].persistentEffects.sustain1;const n=f.writes.length;await resumeSustainPaymentRequests();assert.equal(f.response(m).replayed,true);assert.equal(f.writes.length,n);assert.equal(f.actor.system.resources.cosmo.value,8);
});
