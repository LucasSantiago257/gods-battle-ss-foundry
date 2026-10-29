import test from "node:test";
import assert from "node:assert/strict";
import {ownedFixture,patch} from "./control-retry-owned-fixture.mjs";
import {retryOwnedControl,recoverOwnedControlRetry} from "../module/control-retry-owned.mjs";
import {validateOwnedControlJournal,ownedControlContext} from "../module/control-retry-owned-records.mjs";
const ID="gods-battle-ss",copy=structuredClone,ceWrites=f=>f.writes.filter(w=>Object.keys(w.data).some(k=>k.startsWith("system.resources.")));
test("dono autorizado paga1/1/2CE uma vez, sem alterar PV/PVA/reserva/ações/condições",async()=>{
 for(const tier of ["bronze","silver","gold"]){const f=ownedFixture({tier}),before=copy(f.actor.system),r=await f.run();assert.equal(r.status,"applied");assert.equal(r.published,true);assert.equal(f.actor.system.resources.cosmo.value,8-(tier==="gold"?2:1));assert.equal(f.actor.system.resources.health.value,90);assert.equal(f.actor.system.resources.cosmoReserved,2);assert.deepEqual(f.actor.system.conditions,before.conditions);assert.deepEqual(f.actor.system.combat,before.combat);assert.equal(f.stats.rolls,1);assert.equal(f.stats.cards,1);assert.equal(ceWrites(f).length,1);validateOwnedControlJournal(f.op());}
});
test("fonte oculta não é resolvida/nomeada e dados são publicados sem relançar",async()=>{
 const f=ownedFixture({synthetic:true});await f.run();const m=[...f.messages.values()][0];assert.equal(m.blind,false);assert.deepEqual(m.whisper,[]);assert.doesNotMatch(m.content,/Nome privado|Texto privado|Actor.hidden|secret/);assert.match(m.content,/Controle/);assert.equal(m.rolls[0].total,f.op().plan.result.total);assert.equal(f.stats.rolls,1);
});
test("sucesso encerra só o registro ou mantém prazo sem criar estado",async()=>{
 for(const onSuccess of ["end","keep"]){const f=ownedFixture();await f.run({bonus:30,onSuccess});assert.equal(f.record.status,onSuccess==="end"?"ended":"active");assert.equal(f.record.lastRound,6);assert.equal(f.record.firstRound,2);assert.equal(Object.keys(f.record.ticks).length,0);assert.equal(f.op().plan.attempt.success,true);assert.equal(f.actor.flags[ID].untouched,"keep");}
});
test("reserva/CEextra/ilimitada seguem pagamento publicado, sem excesso",async()=>{
 const f=ownedFixture({tier:"gold"});await f.run({useExtra:true});assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(f.actor.system.resources.cosmoExtra,1);assert.equal(f.actor.system.resources.cosmoReserved,2);
 const g=ownedFixture();g.actor.system.resources.cosmo.unlimited=true;g.actor.system.resources.cosmo.value=0;const before=copy(g.actor.system.resources);await g.run();assert.deepEqual(g.actor.system.resources,before);assert.equal(ceWrites(g).length,0);assert.equal(Object.keys(g.record.controlRetries).length,1);
});
test("preflight de saldo inválido não rola ou prepara journal",async()=>{
 const f=ownedFixture(),request=f.request();f.actor.system.resources.cosmo.value=2;await assert.rejects(retryOwnedControl(f.actor,"controlA",request),/insuficiente/);assert.equal(f.stats.rolls,0);assert.equal(f.writes.length,0);await f.run({useExtra:true});assert.equal(f.actor.system.resources.cosmo.value,2);
});
test("identidade real de usuário/GM e OWNER são obrigatórias",async()=>{
 for(const change of [f=>f.denied.add(f.actor.uuid),f=>game.user=f.owner,f=>game.users.activeGM={...f.gm},f=>game.users.activeGM=f.owner,f=>{f.owner.isGM=true;f.denied.add(f.actor.uuid);}]){const f=ownedFixture(),request=f.request();change(f);await assert.rejects(retryOwnedControl(f.actor,"controlA",request));assert.equal(f.stats.rolls,0);}
 const f=ownedFixture();await assert.rejects(retryOwnedControl(f.actor,"controlA",{...f.request(),requester:{...f.owner}}),/indisponível/);assert.equal(f.writes.length,0);
});
test("duas intenções concorrentes gastam/rolam só uma; replay não regrava",async()=>{
 const f=ownedFixture(),a=f.request({},"intent1"),b=f.request({},"intent2"),r=await Promise.allSettled([retryOwnedControl(f.actor,"controlA",a),retryOwnedControl(f.actor,"controlA",b)]);assert.equal(r.filter(x=>x.status==="fulfilled").length,1);assert.equal(f.stats.rolls,1);assert.equal(f.actor.system.resources.cosmo.value,7);const writes=f.writes.length;const replay=await retryOwnedControl(f.actor,"controlA",a);assert.equal(replay.replayed,true);assert.equal(f.writes.length,writes);assert.equal(f.stats.cards,1);
});
test("intenção já respondida é histórica após registro removido e sob outro lock",async()=>{
 const f=ownedFixture(),request=f.request();await retryOwnedControl(f.actor,"controlA",request);delete f.actor.flags[ID].persistentEffects.controlA;f.actor.flags[ID].effectOperations.other={status:"prepared"};f.actor.system.resources.cosmo.value=4;const n=f.writes.length,r=await retryOwnedControl(f.actor,"controlA",request);assert.equal(r.replayed,true);assert.equal(f.writes.length,n);assert.equal(f.actor.system.resources.cosmo.value,4);
});
test("mesmoID não serve a outro requester ou outro registro",async()=>{
 const f=ownedFixture(),request=f.request();await retryOwnedControl(f.actor,"controlA",request);await assert.rejects(retryOwnedControl(f.actor,"other",request),/outro registro/);await assert.rejects(retryOwnedControl(f.actor,"controlA",{...request,requester:f.gm}),/outro registro/);assert.equal(f.stats.rolls,1);
});
test("rodada posterior permite tentativa; retrocesso e perfil alterado exigem nova prévia",async()=>{
 const f=ownedFixture();await f.run();f.combat.round=4;f.combat.flags[ID].actionControl.epoch="epoch4";await f.run({},"intent2");assert.equal(f.stats.rolls,2);f.combat.round=3;await assert.rejects(async()=>f.run({},"intent3"),/registrada/);
 const g=ownedFixture(),request=g.request();g.record.controlOrigin.powerCosmic++;await assert.rejects(retryOwnedControl(g.actor,"controlA",request),/prévia/);assert.equal(g.stats.rolls,0);
});
test("política de mundo é local e mudança após prévia impede resultado obsoleto",async()=>{
 const f=ownedFixture(),request=f.request();f.controls.mode="modifier";await assert.rejects(retryOwnedControl(f.actor,"controlA",request),/prévia/);assert.equal(f.stats.rolls,0);await f.run({resistanceMode:"forged"});assert.equal(f.op().preview.options.resistanceMode,"modifier");
});
test("falhas antes/depois de cada gravação preservam cobrança única e recuperação",async()=>{
 for(const [tag,phase]of [["rolling","before"],["rolling","after"],["ready","before"],["ready","after"],["commit","before"],["commit","after"],["published","before"],["published","after"]]){
  const f=ownedFixture();f.faults.push({tag,phase});await assert.rejects(f.run());const op=f.op();if(!op){assert.equal(f.stats.rolls,0);assert.equal(f.actor.system.resources.cosmo.value,8);continue;}
  const rolls=f.stats.rolls;await f.recover();assert.equal(f.stats.rolls,rolls);const rolling=op.phase==="rolling";assert.equal(f.op().status,rolling?"reviewed":"applied");assert.equal(f.actor.system.resources.cosmo.value,rolling?8:7);assert.equal(ceWrites(f).length,rolling?0:1);assert.equal(f.stats.cards,rolling?0:1);
 }
});
test("falha de render/publicação conserva resultado pago sem novo dado ou CE",async()=>{
 for(const tag of ["render","card"])for(const phase of ["before","after"]){const f=ownedFixture();f.faults.push({tag,phase});await assert.rejects(f.run());assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.op().phase,"ready");await f.recover();assert.equal(f.stats.rolls,1);assert.equal(f.stats.cards,1);assert.equal(ceWrites(f).length,1);assert.equal(f.op().published,true);}
});
test("rolling sem resultado salvo encerra sem relançar/cobrar",async()=>{
 const f=ownedFixture();f.faults.push({tag:"roll",phase:"after"});await assert.rejects(f.run());assert.equal(f.op().phase,"rolling");assert.equal(f.stats.rolls,1);await f.recover();assert.equal(f.op().status,"reviewed");assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(f.stats.rolls,1);assert.equal(f.stats.cards,0);
});
test("recuperação ready conclui commit ausente e conserva notas tardias",async()=>{
 const f=ownedFixture();f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.run({reason:"Nota da tentativa"}));f.record.reason="Edição tardia";f.record.custom={value:7};f.actor.name="Nome atual";f.actor.system.resources.health.value=50;await f.recover();assert.equal(f.record.reason,"Edição tardia");assert.deepEqual(f.record.custom,{value:7});assert.equal(f.record.controlRetries.intent1.reason,"Nota da tentativa");assert.equal(f.actor.system.resources.health.value,50);assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.stats.rolls,1);
});
test("estado posterior reconhecido finaliza apenas status sem regravar registro",async()=>{
 const f=ownedFixture();f.faults.push({tag:"published",phase:"before"});await assert.rejects(f.run());const op=f.op();op.status="prepared";f.record.reason="Nota posterior";f.record.controlRetries.intent1.reason="Nota de parcela";const n=ceWrites(f).length;f.docs.delete(f.combat.uuid);game.combats.contents=[];game.combat=null;await f.recover();assert.equal(ceWrites(f).length,n);assert.equal(f.record.reason,"Nota posterior");assert.equal(f.record.controlRetries.intent1.reason,"Nota de parcela");assert.equal(f.stats.cards,1);assert.equal(f.op().status,"applied");
});
test("divergência e encerrar operação preservam CE/registro atuais",async()=>{
 const f=ownedFixture();f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.run());f.actor.system.resources.cosmo.value=4;const r=copy(f.record);await assert.rejects(f.recover(),/prévia/);assert.equal(f.actor.system.resources.cosmo.value,4);await f.recover({close:true,reason:""});assert.deepEqual(f.record,r);assert.equal(f.actor.system.resources.cosmo.value,4);assert.equal(f.op().status,"reviewed");assert.equal(f.stats.rolls,1);
});
test("epoch/rodada/perdaOWNER após dado impedem débito e não relançam",async()=>{
 for(const change of [f=>f.combat.round++,f=>f.combat.flags[ID].actionControl.epoch="different",f=>f.denied.add(f.actor.uuid),f=>game.users.activeGM=null]){const f=ownedFixture();f.hooks.after=(tag)=>{if(tag==="roll")change(f);};await assert.rejects(f.run());assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(f.stats.rolls,1);f.hooks.after=null;f.denied.clear();game.users.activeGM=f.gm;await f.recover();assert.equal(f.op().status,"reviewed");assert.equal(f.stats.rolls,1);}
});
test("instância de Actor/Combat substituída ou membro duplicado recusa",async()=>{
 for(const change of [f=>f.docs.set(f.actor.uuid,{...f.actor}),f=>f.docs.set(f.combat.uuid,{...f.combat}),f=>f.member.actor={...f.actor},f=>f.combat.combatants.contents.push({id:"another",actor:f.actor})]){const f=ownedFixture(),request=f.request();change(f);await assert.rejects(retryOwnedControl(f.actor,"controlA",request));assert.equal(f.stats.rolls,0);assert.equal(f.writes.length,0);}
});
test("interrupção surgida depois do journal bloqueia gasto; close só libera própria",async()=>{
 const f=ownedFixture();f.hooks.after=tag=>{if(tag==="rolling")f.actor.flags[ID].effectOperations.other={status:"prepared",kind:"anything"};};await assert.rejects(f.run());assert.equal(f.stats.rolls,0);f.hooks.after=null;await recoverOwnedControlRetry(f.actor,"intent1",{close:true,requester:f.owner});assert.equal(f.op().status,"prepared");assert.equal(f.operations().intent1.status,"reviewed");assert.equal(f.operations().other.status,"prepared");assert.equal(f.actor.system.resources.cosmo.value,8);
});
test("journal legado preparado ou publicação antiga pendente mantém recuperador anterior",async()=>{
 for(const status of ["prepared","applied"]){const f=ownedFixture();f.actor.flags[ID].effectOperations={legacy:{kind:"controlRetry",status,actorUuid:f.actor.uuid,effectId:"controlA",round:2,published:false}};await assert.rejects(f.run(),/interrompida|publicação/);assert.equal(f.stats.rolls,0);assert.equal(f.writes.length,0);await assert.rejects(recoverOwnedControlRetry(f.actor,"legacy",{requester:f.owner,close:true}),/outro tipo/);}
});
test("cópia com journal de outroActor só pode liberar operação local sem CE",async()=>{
 const f=ownedFixture();f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.run());f.actor.uuid="Actor.copy";f.docs.set(f.actor.uuid,f.actor);f.record.actorUuid=f.actor.uuid;const prior=copy(f.record);await assert.rejects(f.recover(),/outra ficha/);await f.recover({close:true});assert.deepEqual(f.record,prior);assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(f.op().status,"reviewed");
});
test("nativeRoll adulterado não publica dados falsos, não repete gasto",async()=>{
 const f=ownedFixture();f.faults.push({tag:"card",phase:"before"});await assert.rejects(f.run());f.op().roll.terms[0].results[0].result=9;await assert.rejects(f.recover(),/Rolagem salva/);assert.equal(f.stats.cards,0);assert.equal(f.actor.system.resources.cosmo.value,7);await f.recover({close:true});assert.equal(f.op().status,"reviewed");assert.equal(f.stats.rolls,1);
});
test("cartão removido/alterado depois de publicado não é recriado pelo recibo",async()=>{
 const f=ownedFixture();f.faults.push({tag:"published",phase:"after"});await assert.rejects(f.run());const op=f.op();op.published=false;const m=f.messages.get(op.messageId);m.flags[ID].controlRetryOwnedResolution.total++;await assert.rejects(f.recover(),/alterado/);assert.equal(f.stats.cards,1);assert.equal(f.actor.system.resources.cosmo.value,7);await f.recover({close:true});assert.equal(f.op().status,"reviewed");
});
test("falso cartão de proprietário não substitui publicação coordenadaGM",async()=>{
 const f=ownedFixture();f.faults.push({tag:"card",phase:"before"});await assert.rejects(f.run());const p=f.op().plan,m={id:"forged",author:f.owner,whisper:[],blind:false,isContentVisible:true,flags:{[ID]:{controlRetryOwnedResolution:{actorUuid:f.actor.uuid,operationId:f.op().id,signature:p.signature,total:p.result.total,round:p.context.round}}}};f.messages.set(m.id,m);await f.recover();assert.notEqual(f.op().messageId,m.id);assert.equal(f.stats.cards,1);assert.equal(f.stats.rolls,1);
});
test("recuperar sob OWNER/GM alterado recusa antes de ler flags ou gravar",async()=>{
 const f=ownedFixture();f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.run());f.denied.add(f.actor.uuid);Object.defineProperty(f.actor,"flags",{get(){throw Error("private flags read");}});await assert.rejects(recoverOwnedControlRetry(f.actor,"intent1",{requester:f.owner}),/indisponível/);assert.equal(f.stats.rolls,1);
});
test("payloads de funções/snapshots/papéis nunca viram comandos",async()=>{
 const f=ownedFixture(),r=f.request();await assert.rejects(retryOwnedControl(f.actor,"controlA",{...r,intentGuard:"function(){evil()}"}),/Guarda local/);let called=0;const answer=await retryOwnedControl(f.actor,"controlA",{...r,options:{...r.options,updates:{"system.resources.health.value":0},gm:true,callback:()=>called++},patch:{evil:true}});assert.equal(answer.status,"applied");assert.equal(called,0);assert.equal(f.actor.system.resources.health.value,90);
});
test("dados/recurso/plano/journal adulterados depois de ready não gastam",async()=>{
 for(const change of [f=>f.op().plan.payment.cost++,f=>f.op().plan.after.resources.current--,f=>f.op().plan.result.total++,f=>f.op().userId="forged",f=>f.record.time++]){const f=ownedFixture();f.hooks.after=tag=>{if(tag==="ready")change(f);};await assert.rejects(f.run());assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(f.stats.rolls,1);}
});
test("recuperação não consegue mover intenção para outro registro",async()=>{
 const f=ownedFixture();f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.run());f.op().recordId="another";const before=copy(f.record);await assert.rejects(f.recover());await f.recover({close:true});assert.deepEqual(f.record,before);assert.equal(f.actor.system.resources.cosmo.value,8);
});

test("rolagem nativa corrompida em ready recusa antes do débito na recuperação",async()=>{
 const f=ownedFixture();f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.run());f.op().roll.terms[0].results[0].result=10;await assert.rejects(f.recover(),/Rolagem salva/);assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(ceWrites(f).length,0);await f.recover({close:true});assert.equal(f.op().status,"reviewed");
});
test("cartão com carimbo real mas dados alterados não conclui publicação",async()=>{
 const f=ownedFixture();f.faults.push({tag:"published",phase:"after"});await assert.rejects(f.run());f.op().published=false;const m=f.messages.get(f.op().messageId);m.rolls[0].total++;await assert.rejects(f.recover(),/alterado/);assert.equal(f.stats.cards,1);assert.equal(f.stats.rolls,1);assert.equal(f.actor.system.resources.cosmo.value,7);
});
