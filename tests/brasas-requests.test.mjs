import test from "node:test";
import assert from "node:assert/strict";
import {messages} from "./brasas-message-fixture.mjs";
import {resources,healthWrites,copy} from "./brasas-fixture.mjs";
import {brasasState} from "../module/brasas-rules.mjs";
import {brasasRequest,submitBrasasRequest,enqueueBrasasRequest,resumeBrasasRequests,renderBrasasRequest,notifyBrasasResponse} from "../module/brasas-requests.mjs";
const ID="gods-battle-ss";
test("mensagem privada usa ID real e só dono/mestre; alvo sintético não lê atacante",async()=>{
 const f=messages({synthetic:true}),m=await f.send({...f.request(),operationId:"forged",requester:{id:"gm",isGM:true},updates:{"system.resources.health.value":999},options:{damage:2.5,updates:{"system.resources.cosmo.value":999}}});
 assert.deepEqual(m.whisper,["owner","gm"]);assert.equal(f.writes.length,0);await f.process(m);assert.equal(f.actor.system.resources.health.value,97.5);assert.equal(f.operations()[m.id].userId,"owner");assert.equal(f.response(m).ok,true);assert.equal(f.response(m).record,undefined);assert.doesNotMatch(JSON.stringify(f.response(m)),/profile|source|snapshot|health|hidden/);assert.equal(f.actor.system.resources.cosmo.value,12);
});
test("pública, cega, oculta e destinatário extra não operam nem recebem resposta pública",async()=>{
 for(const change of [m=>m.whisper=[],m=>m.blind=true,m=>m.isContentVisible=false,m=>m.whisper.push("observer"),m=>m.whisper=["gm"],m=>m.whisper=["owner"]]){const f=messages(),m=await f.send();change(m);await f.process(m);assert.equal(f.writes.length,0);assert.equal(f.response(m),undefined);}
});
test("hookuser falso, observador e autor inexistente não ganham permissão",async()=>{
 const f=messages(),m=await f.send();await enqueueBrasasRequest(m,{},"gm");assert.equal(f.writes.length,0);assert.equal(f.response(m),undefined);await f.process(m);assert.equal(f.response(m).ok,true);
 for(const mode of ["observer","missing","lost"]){const g=messages(),m=await g.send();if(mode==="observer"){m.author=g.observer;m.whisper=["observer","gm"];}if(mode==="missing")g.users.delete("owner");if(mode==="lost")g.denied.add(g.actor.uuid);await g.process(m);assert.equal(g.writes.length,0);assert.equal(g.response(m)?.ok,mode==="missing"?undefined:false);}
});
test("create e retomadas concorrentes consomem uma parcela",async()=>{
 const f=messages(),m=await f.send();await Promise.all([f.process(m),resumeBrasasRequests(),f.process(m)]);assert.equal(f.response(m).ok,true);assert.equal(healthWrites(f).length,1);await resumeBrasasRequests();assert.equal(healthWrites(f).length,1);
});
test("resposta perdida antes/depois retoma recibo sem regravar Undo posterior",async()=>{
 for(const phase of ["before","after"]){const f=messages(),m=await f.send();f.loseResponse(phase);await f.process(m);assert.equal(healthWrites(f).length,1);if(phase==="before"){await f.undo({operationId:"undo1"});const record=copy(f.record()),before=resources(f),n=f.writes.length;await resumeBrasasRequests();assert.equal(f.response(m).replayed,true);assert.deepEqual(f.record(),record);assert.deepEqual(resources(f),before);assert.equal(f.writes.length,n);}else{assert.equal(f.response(m).ok,true);await resumeBrasasRequests();assert.equal(healthWrites(f).length,1);}}
});
test("dispensa, inversão e encerramento percorrem runtime real por IDs distintos",async()=>{
 const f=messages(),skip=await f.send({...f.request(),options:{skip:true}});await f.process(skip);assert.equal(f.record().ticks.round3.damage,0);
 const undo=await f.send({action:"undo",actorUuid:f.actor.uuid,recordId:"fire",expectedState:brasasState(f.actor,"fire")});await f.process(undo);assert.equal(f.response(undo).ok,true);assert.deepEqual(f.record().ticks,{});
 const end=await f.send({action:"end",actorUuid:f.actor.uuid,recordId:"fire",expectedState:brasasState(f.actor,"fire")});f.loseResponse("before");await f.process(end);assert.equal(f.record().status,"ended");await resumeBrasasRequests();assert.equal(f.response(end).replayed,true);assert.equal(healthWrites(f).length,0);
});
test("mensagem modificada antes do journal não debita",async()=>{
 const f=messages(),m=await f.send();let once=false;f.hooks.resolve=()=>{if(!once){once=true;f.req(m).options.damage=0;}};await f.process(m);assert.equal(f.response(m).ok,false);assert.equal(f.writes.length,0);
});
test("mensagem modificada depois do journal deixa recuperação explícita",async()=>{
 const f=messages(),m=await f.send();f.hooks.after=tag=>{if(tag==="journal"){f.hooks.after=null;f.req(m).options.damage=0;}};await f.process(m);assert.equal(f.pending().id,m.id);assert.equal(healthWrites(f).length,0);
 const recovery=await f.send({action:"recover",actorUuid:f.actor.uuid,operationId:m.id});await f.process(recovery);assert.equal(f.response(recovery).ok,true);assert.equal(f.actor.system.resources.health.value,90);assert.equal(healthWrites(f).length,1);
});
test("mensagem tornada pública após journal não divulga erro e close conserva record",async()=>{
 const f=messages(),m=await f.send();f.hooks.after=tag=>{if(tag==="journal"){f.hooks.after=null;m.whisper=[];}};await f.process(m);assert.equal(f.response(m),undefined);assert.equal(healthWrites(f).length,0);const record=copy(f.record()),close=await f.send({action:"close",actorUuid:f.actor.uuid,operationId:m.id});await f.process(close);assert.equal(f.response(close).ok,true);assert.deepEqual(f.record(),record);assert.equal(f.operations()[m.id].status,"reviewed");
});
test("mensagem removida depois do commit reaparece sem outra perda",async()=>{
 const f=messages(),m=await f.send();f.hooks.after=tag=>{if(tag==="commit"){f.hooks.after=null;f.collection.delete(m.id);}};await f.process(m);assert.equal(f.response(m),undefined);f.collection.set(m.id,m);await resumeBrasasRequests();assert.equal(f.response(m).replayed,true);assert.equal(healthWrites(f).length,1);
});
test("troca de mestre após journal permite recuperar pela autoria original",async()=>{
 const f=messages(),m=await f.send(),next={id:"nextgm",isGM:true,active:true};f.users.set(next.id,next);f.hooks.after=tag=>{if(tag==="journal"){f.hooks.after=null;game.users.activeGM=next;}};await f.process(m);assert.equal(f.response(m),undefined);assert.equal(healthWrites(f).length,0);game.user=next;
 const recover=await ChatMessage.create({whisper:["nextgm"],flags:{[ID]:{brasasRequest:{action:"recover",actorUuid:f.actor.uuid,operationId:m.id}}}});await enqueueBrasasRequest(recover,{},next.id);assert.equal(f.response(recover).ok,true);await resumeBrasasRequests();assert.equal(f.response(m).replayed,true);assert.equal(healthWrites(f).length,1);
});
test("sem mestre ativo não envia; jogador não processa",async()=>{
 const f=messages();game.users.activeGM=null;await assert.rejects(f.send());assert.equal(f.collection.size,0);game.users.activeGM=f.gm;const m=await f.send();game.user=f.owner;await enqueueBrasasRequest(m,{},"owner");assert.equal(f.writes.length,0);
});
test("normalização rejeita dados inválidos e remove comandos e papéis",()=>{
 const f=messages();for(const change of [{action:"register"},{actorUuid:"Compendium.pack.Item.foo"},{recordId:"../bad"},{expectedState:17},{expectedRound:0},{options:{skip:null}},{options:{damage:Infinity}},{options:{damage:"5"}},{options:{reason:7}}])assert.throws(()=>brasasRequest({...f.request(),...change}));
 const v=brasasRequest({...f.request(),requester:{isGM:true},operationId:"evil",patch:{x:1},options:{damage:0,reason:"",script:"do not run"}});assert.deepEqual(v.options,{damage:0,reason:""});assert.equal(v.operationId,undefined);assert.equal(v.requester,undefined);
});
test("troca de instância de mensagem após await impede perda",async()=>{
 const f=messages(),m=await f.send();let once=false;f.hooks.resolve=()=>{if(!once){once=true;f.collection.set(m.id,{...m});}};await f.process(m);assert.equal(f.response(m),undefined);assert.equal(f.writes.length,0);
});
test("recibo sobrevive a registro removido e não recria ficha",async()=>{
 const f=messages(),m=await f.send();f.loseResponse("before");await f.process(m);delete f.actor.flags[ID].persistentEffects.fire;const n=f.writes.length;await resumeBrasasRequests();assert.equal(f.response(m).replayed,true);assert.equal(f.writes.length,n);assert.deepEqual(f.actor.flags[ID].persistentEffects,{});
});
test("recuperação não aceita snapshot recebido; runtime lê seu próprio journal",async()=>{
 const f=messages(),m=await f.send();f.faults.push({tag:"commit",phase:"before"});await f.process(m);const recovery=await f.send({action:"recover",actorUuid:f.actor.uuid,operationId:m.id,snapshot:{health:999},patch:{"system.resources.health.value":999},actor:{isGM:true}});await f.process(recovery);assert.equal(f.actor.system.resources.health.value,90);assert.equal(f.response(recovery).ok,true);
});
test("mensagem interna fica oculta antes da inserção e só autor recebe aviso",async()=>{
 const f=messages(),m=await f.send(),html={dataset:{},hidden:false,closest:()=>null,setAttribute(){}};renderBrasasRequest(m,html);assert.equal(html.hidden,true);assert.equal(html.dataset.godsBattleInternalBrasas,"");await f.process(m);game.user=f.observer;notifyBrasasResponse(m);assert.equal(f.notices.length,0);game.user=f.owner;notifyBrasasResponse(m,{"flags.other":1});assert.equal(f.notices.length,0);notifyBrasasResponse(m,{[`flags.${ID}.brasasResponse`]:f.response(m)});assert.equal(f.notices.length,1);assert.equal(f.notices[0].type,"info");
});
test("retomada ignora resposta concluída e mensagem sem namespace",async()=>{
 const f=messages(),m=await f.send();await f.process(m);await ChatMessage.create({whisper:["gm"],flags:{}});const n=f.writes.length;await resumeBrasasRequests();assert.equal(f.writes.length,n);assert.equal(f.response(m).ok,true);
});
