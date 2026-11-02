import test from "node:test";
import assert from "node:assert/strict";
import {fixture,copy,resources,ceWrites} from "./sustained-payment-fixture.mjs";
import {payOwnedSustained,endOwnedSustained,recoverOwnedSustained} from "../module/sustained-payment-owned.mjs";
import {ownedSustainContext,validateOwnedSustainJournal} from "../module/sustained-payment-records.mjs";
import {sustainEndState} from "../module/sustained-payment-rules.mjs";
const ID="gods-battle-ss",recordPath=`flags.${ID}.persistentEffects.sustain1`;
test("OWNER pagador paga1CE sem possuir ou ler dados privados do alvo",async()=>{
 for(const synthetic of [false,true])for(const tier of ["bronze","silver","gold"]){const f=fixture({synthetic,tier}),before=resources(f),r=await f.pay();assert.equal(r.cost,1);assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(ceWrites(f).length,1);assert.equal(f.record.sustain.payments.intent1.cost,1);assert.equal(f.record.sustain.lastOperation.id,"intent1");assert.equal(f.op().status,"applied");validateOwnedSustainJournal(f.op());assert.doesNotMatch(JSON.stringify(f.op()),/Nome privado|Nome da fonte|Descri/);assert.deepEqual({...resources(f),cosmo:{...resources(f).cosmo,value:before.cosmo.value}},before);}
});
test("observador/papel forjado/GM clonado s\u00e3o recusados antes de flags",async()=>{
 for(const kind of ["observer","forged","gmClone","ownerExec"]){const f=fixture();let reads=0;const flags=f.actor.flags;Object.defineProperty(f.actor,"flags",{get(){reads++;return flags;},configurable:true});let requester=kind==="observer"?f.observer:kind==="forged"?{...f.owner,isGM:true}:f.owner;if(kind==="gmClone")game.user={...f.gm};if(kind==="ownerExec")game.user=f.owner;await assert.rejects(payOwnedSustained(f.actor,"sustain1",{options:{useExtra:false},expectedState:"bad",operationId:"one",requester}));assert.equal(reads,0);assert.equal(f.writes.length,0);}
});
test("GM e dono usam mesmo runtime com autoria real no journal",async()=>{
 for(const user of ["owner","gm"]){const f=fixture();await f.pay({requester:f[user]});assert.equal(f.op().userId,f[user].id);assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.writes.filter(w=>w.tag==="commit").length,1);}
});
test("duas inten\u00e7\u00f5es para mesma pr\u00e9via cobram apenas uma",async()=>{
 const f=fixture(),a=f.request(),b={...a,operationId:"two"};const r=await Promise.allSettled([payOwnedSustained(f.actor,"sustain1",a),payOwnedSustained(f.actor,"sustain1",b)]);assert.equal(r.filter(x=>x.status==="fulfilled").length,1);assert.equal(ceWrites(f).length,1);assert.equal(Object.keys(f.record.sustain.payments).length,1);
});
test("resposta perdida devolve resumo e n\u00e3o regrava ficha atual/encerramento",async()=>{
 const f=fixture(),a=f.request();f.faults.push({phase:"after",tag:"commit"});await assert.rejects(payOwnedSustained(f.actor,"sustain1",a));await f.end();f.actor.system.resources.cosmo.value=3;f.actor.flags[ID].effectOperations.other={status:"prepared"};delete f.actor.flags[ID].persistentEffects.sustain1;const before=resources(f),n=f.writes.length,r=await payOwnedSustained(f.actor,"sustain1",a);assert.equal(r.replayed,true);assert.equal(r.record,undefined);assert.equal(f.writes.length,n);assert.deepEqual(resources(f),before);
});
test("mesma ID n\u00e3o troca a\u00e7\u00e3o, usu\u00e1rio ou registro",async()=>{
 const f=fixture(),a=f.request();await payOwnedSustained(f.actor,"sustain1",a);for(const run of [()=>f.end({operationId:"intent1"}),()=>payOwnedSustained(f.actor,"sustain1",{...a,requester:f.gm}),()=>payOwnedSustained(f.actor,"other",{operationId:"intent1",requester:f.owner})])await assert.rejects(run(),/outra inten/);assert.equal(ceWrites(f).length,1);
});
test("extra expl\u00edcita/reserva/ilimitada preservam contrato sem excesso ou PV",async()=>{
 const f=fixture();f.actor.system.resources.cosmo.value=2;await assert.rejects(f.pay(),/insuficiente/);assert.equal(f.writes.length,0);await f.pay({options:{useExtra:true}});assert.equal(f.actor.system.resources.cosmoExtra,2);assert.equal(f.actor.system.resources.cosmo.value,2);assert.equal(f.actor.system.resources.cosmoOverload,7);assert.equal(f.actor.system.resources.health.value,90);
 const g=fixture();g.actor.system.resources.cosmo.unlimited=true;const before=resources(g);await g.pay();assert.deepEqual(resources(g),before);assert.equal(ceWrites(g).length,0);assert.equal(g.record.sustain.payments.intent1.unlimited,true);await assert.rejects(g.pay({operationId:"two"}));
});
test("perfil \u00fanico/rodada inicial/retrocesso/lacuna n\u00e3o ampliam cobran\u00e7a",async()=>{
 const f=fixture({mode:"once"});await f.pay();f.combat.round+=20;await assert.rejects(f.pay({operationId:"two"}));assert.equal(ceWrites(f).length,1);
 const g=fixture();g.combat.round=3;assert.throws(()=>g.preview(),/coberta/);g.combat.round=8;await g.pay();assert.deepEqual(g.record.sustain.payments.intent1.gap,{first:4,last:7});assert.equal(g.actor.system.resources.cosmo.value,7);g.combat.round=7;assert.throws(()=>g.preview(),/coberta/);g.combat.round=9;await g.pay({operationId:"two"});assert.equal(g.actor.system.resources.cosmo.value,6);
});
test("autossustenta\u00e7\u00e3o n\u00e3o cobra duas fichas nem depende de fonte atual",async()=>{
 const f=fixture({self:true,synthetic:true});await f.pay();assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(ceWrites(f).length,1);assert.equal(f.reads.some(x=>x.includes(".Item.")),false);assert.equal(f.op().context.targetUuid,f.actor.uuid);
});
test("falhas antes/depois de journal/commit recuperam s\u00f3 parte ausente",async()=>{
 for(const action of ["pay","end"])for(const tag of ["journal","commit"])for(const phase of ["before","after"]){const f=fixture(),before=resources(f);f.faults.push({tag,phase});await assert.rejects(f[action]());const op=f.op();if(!op){assert.deepEqual(resources(f),before);continue;}await f.recover();assert.equal(f.op().status,"applied");assert.equal(f.actor.system.resources.cosmo.value,action==="pay"?7:8);assert.equal(ceWrites(f).length,action==="pay"?1:0);const n=f.writes.length;assert.equal((await f.recover()).replayed,true);assert.equal(n,f.writes.length);}
});
test("notas/oposi\u00e7\u00f5es e recursos alheios tardios sobrevivem ao commit por paths",async()=>{
 const f=fixture(),a=f.request();f.hooks.after=tag=>{if(tag==="journal"){f.record.reason="Nota tardia";f.record.source.name="Outro nome";f.record.sustain.targetName="Outro alvo visual";f.record.sustain.oppositions={manual:{winner:"payer",reason:"tardia"}};f.record.other={keep:true};f.actor.system.resources.health.value=77;f.actor.system.resources.cosmoOverload=9;}};await payOwnedSustained(f.actor,"sustain1",a);assert.equal(f.record.reason,"Nota tardia");assert.equal(f.record.other.keep,true);assert.equal(f.record.sustain.oppositions.manual.reason,"tardia");assert.equal(f.actor.system.resources.health.value,77);assert.equal(f.actor.system.resources.cosmoOverload,9);assert.equal(f.writes.some(w=>Object.hasOwn(w.data,recordPath)),false);
});
test("notas em pagamentos anteriores n\u00e3o s\u00e3o apagadas na pr\u00f3xima recarga",async()=>{
 const f=fixture();await f.pay();f.advance();const a=f.request({},"two");f.hooks.after=tag=>{if(tag==="journal")f.record.sustain.payments.intent1.reason="Nota ap\u00f3s pr\u00e9via";};await payOwnedSustained(f.actor,"sustain1",a);assert.equal(f.record.sustain.payments.intent1.reason,"Nota ap\u00f3s pr\u00e9via");assert.equal(f.actor.system.resources.cosmo.value,6);
});
test("mudan\u00e7as financeiras/perfil/tempo/rodada/epoch durante await recusam pr\u00e9via",async()=>{
 for(const mutate of [f=>f.actor.system.resources.cosmo.value--,f=>f.actor.system.resources.cosmoExtra--,f=>f.actor.system.resources.cosmoReserved++,f=>f.record.time++,f=>f.record.source.classification="silver",f=>f.record.sustain.mode="once",f=>f.combat.round++,f=>f.combat.flags[ID].actionControl.epoch="other"]){const f=fixture(),a=f.request();let once=false;f.hooks.resolve=()=>{if(!once){once=true;mutate(f);}};await assert.rejects(payOwnedSustained(f.actor,"sustain1",a));assert.equal(f.writes.length,0);}
});
test("alvo/combatente/Actor/Combat real removido ou substitu\u00eddo recusa recarga",async()=>{
 for(const mutate of [f=>f.docs.delete(f.target.uuid),f=>f.docs.set(f.target.uuid,{uuid:f.target.uuid,type:"knight"}),f=>f.targetMember.actor={uuid:f.target.uuid,type:"knight"},f=>f.targetMember.id="replacement",f=>f.combat.combatants.contents.pop(),f=>f.combat.combatants.contents.push({id:"duplicate",actor:f.target}),f=>f.docs.set(f.actor.uuid,{...f.actor}),f=>f.member.actor={...f.actor},f=>f.docs.set(f.combat.uuid,{...f.combat}),f=>game.combat={...f.combat}]){const f=fixture(),a=f.request();mutate(f);await assert.rejects(payOwnedSustained(f.actor,"sustain1",a));assert.equal(f.writes.length,0);}
});
test("troca de alvo/combatente/GM/OWNER depois do journal impede d\u00e9bito",async()=>{
 for(const mutate of [f=>f.targetMember.id="other",f=>f.docs.delete(f.target.uuid),f=>f.denied.add(f.actor.uuid),f=>game.users.activeGM={id:"other",isGM:true,active:true},f=>game.users.get=()=>null]){const f=fixture();f.hooks.after=tag=>{if(tag==="journal")mutate(f);};await assert.rejects(f.pay());assert.equal(f.op().status,"prepared");assert.equal(ceWrites(f).length,0);}
});
test("guarda de inten\u00e7\u00e3o local ap\u00f3s journal n\u00e3o executa payload serializado",async()=>{
 const f=fixture();let valid=true;f.hooks.after=tag=>{if(tag==="journal")valid=false;};await assert.rejects(f.pay({intentGuard:()=>{if(!valid)throw Error("intent invalid");}}),/intent invalid/);assert.equal(ceWrites(f).length,0);const g=fixture();await assert.rejects(g.pay({intentGuard:"run"}),/local/);assert.equal(g.writes.length,0);
});
test("interrup\u00e7\u00e3o nova depois do journal preserva trava sem d\u00e9bito",async()=>{
 for(const kind of ["techniqueOperations","actionOperations","effectOperations","damageOperations","levelOperation"]){const f=fixture();f.hooks.after=tag=>{if(tag==="journal"){if(kind==="levelOperation")f.actor.flags[ID][kind]={status:"prepared"};else (f.actor.flags[ID][kind]??={}).other={status:kind==="damageOperations"?"repair":"prepared"};}};await assert.rejects(f.pay());assert.equal(ceWrites(f).length,0);assert.equal(f.op().status,"prepared");}
});
test("before recupera commit ausente sem repetir preparo ou cobrar duas vezes",async()=>{
 const f=fixture();f.faults.push({phase:"before",tag:"commit"});await assert.rejects(f.pay());const n=f.writes.length;await f.recover();assert.equal(f.writes.length,n+1);assert.equal(ceWrites(f).length,1);assert.equal(f.op().status,"applied");
});
test("after recupera s\u00f3 status sem alvo/encontro e preserva notas",async()=>{
 const f=fixture();await f.pay();const op=f.op();op.status="prepared";f.docs.delete(f.target.uuid);f.docs.delete(f.combat.uuid);game.combat=null;game.combats.contents=[];f.record.reason="Tardia";f.record.sustain.payments.intent1.reason="tardia no pagamento";const before=resources(f),n=f.writes.length;await f.recover();assert.equal(f.op().status,"applied");assert.deepEqual(resources(f),before);assert.equal(f.record.reason,"Tardia");assert.equal(f.record.sustain.payments.intent1.reason,"tardia no pagamento");assert.deepEqual(Object.keys(f.writes[n].data),[`flags.${ID}.effectOperations.intent1.status`]);
});
test("before n\u00e3o recupera recarga em outra rodada/epoch/alvo",async()=>{
 for(const mutate of [f=>f.advance(),f=>f.combat.flags[ID].actionControl.epoch="other",f=>f.targetMember.id="other",f=>f.docs.delete(f.target.uuid)]){const f=fixture();f.faults.push({phase:"before",tag:"commit"});await assert.rejects(f.pay());mutate(f);await assert.rejects(f.recover());assert.equal(ceWrites(f).length,0);const before=resources(f);await f.recover({close:true});assert.deepEqual(resources(f),before);assert.equal(f.op().status,"reviewed");}
});
test("diverg\u00eancia/mixture libera apenas journal pr\u00f3prio preservando ajustes",async()=>{
 for(const mutate of [f=>f.actor.system.resources.cosmo.value=5,f=>f.record.sustain.paidUntilRound=4,f=>f.record.status="ended",f=>f.record.time++,f=>f.op().after.resources.current=999]){const f=fixture();f.faults.push({phase:"before",tag:"commit"});await assert.rejects(f.pay());mutate(f);const r=copy(f.record),before=resources(f);await assert.rejects(f.recover());await f.recover({close:true,reason:"Opcional"});assert.equal(f.op().status,"reviewed");assert.deepEqual(resources(f),before);assert.deepEqual(f.record,r);}
});
test("c\u00f3pia ou recordId adulterado no journal nunca encerra outro registro",async()=>{
 for(const mutate of [f=>f.op().actorUuid="Actor.foreign",f=>f.op().recordId="other",f=>f.record.actorUuid="Actor.foreign"]){const f=fixture();f.faults.push({phase:"before",tag:"commit"});await assert.rejects(f.pay());f.actor.flags[ID].persistentEffects.other={kind:"manual",status:"active"};mutate(f);const before=resources(f),record=copy(f.record);await assert.rejects(f.recover());await f.recover({close:true});assert.equal(f.actor.flags[ID].persistentEffects.other.status,"active");assert.deepEqual(f.record,record);assert.deepEqual(resources(f),before);}
});
test("close cancelado/inv\u00e1lido e journal trocado durante await n\u00e3o libera lock",async()=>{
 const f=fixture();f.faults.push({phase:"before",tag:"commit"});await assert.rejects(f.pay());await assert.rejects(f.recover({close:"yes"}));await assert.rejects(f.recover({close:true,reason:1}));let count=0;f.hooks.resolve=()=>{if(++count===2)f.op().time++;};await assert.rejects(f.recover({close:true}),/mudou/);assert.equal(f.op().status,"prepared");assert.equal(ceWrites(f).length,0);
});
test("End n\u00e3o depende de alvo/encontro/saldo e conserva pagamentos sem refund",async()=>{
 const f=fixture();await f.pay();f.docs.delete(f.target.uuid);f.docs.delete(f.combat.uuid);game.combat=null;game.combats.contents=[];f.actor.system.resources.cosmo.value=NaN;const n=f.writes.length,payments=copy(f.record.sustain.payments);await f.end({reason:"Encerrada"});assert.equal(f.record.status,"ended");assert.deepEqual(f.record.sustain.payments,payments);assert.equal(Number.isNaN(f.actor.system.resources.cosmo.value),true);assert.equal(f.writes.slice(n).some(w=>Object.keys(w.data).some(k=>k.startsWith("system."))),false);assert.equal(f.record.end.reason,"Encerrada");
});
test("End interrompido recupera sem encontro e mant\u00e9m notas/recursos",async()=>{
 const f=fixture();f.faults.push({phase:"before",tag:"commit"});await assert.rejects(f.end());game.combat=null;game.combats.contents=[];f.docs.delete(f.target.uuid);f.record.reason="Tardia";const before=resources(f);await f.recover();assert.equal(f.record.status,"ended");assert.equal(f.record.reason,"Tardia");assert.deepEqual(resources(f),before);assert.equal(ceWrites(f).length,0);
});
test("End revalidado n\u00e3o substitui hist\u00f3rico alterado nem encerra c\u00f3pia",async()=>{
 for(const mutate of [f=>f.record.actorUuid="Actor.other",f=>f.record.time++,f=>f.record.sustain.mode="once"]){const f=fixture(),a={expectedState:sustainEndState(f.actor,"sustain1"),operationId:"end1",requester:f.owner};mutate(f);await assert.rejects(endOwnedSustained(f.actor,"sustain1",a));assert.equal(f.writes.length,0);assert.equal(f.record.status,"active");}
});
test("legacy preparado bloqueia novo pagamento e n\u00e3o \u00e9 convertido pelo recuperador novo",async()=>{
 const f=fixture();f.actor.flags[ID].effectOperations={old:{kind:"sustainPayment",actorUuid:f.actor.uuid,effectId:"sustain1",round:4,status:"prepared"}};await assert.rejects(f.pay(),/interrompida/);await assert.rejects(recoverOwnedSustained(f.actor,"old",{requester:f.owner}),/outro tipo/);assert.equal(f.writes.length,0);
});
test("legacy aplicado da rodada ainda bloqueia registro sem hist\u00f3rico de pagamento",async()=>{
 const f=fixture();f.actor.flags[ID].effectOperations={old:{kind:"sustainPayment",actorUuid:f.actor.uuid,effectId:"sustain1",round:4,status:"applied"}};await assert.rejects(f.pay(),/anterior/);assert.equal(ceWrites(f).length,0);assert.equal(f.operations().old.status,"applied");
});
test("payload extra com snapshot/patch/papel n\u00e3o altera o plano ou recursos",async()=>{
 const f=fixture();await f.pay({options:{useExtra:false,cost:0,patch:{"system.resources.cosmo.value":999},snapshot:{},requester:{isGM:true}},patch:{"system.resources.health.value":0},cost:0});assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.actor.system.resources.health.value,90);assert.equal(Object.hasOwn(f.op(),"patch"),false);assert.equal(Object.hasOwn(f.op().options,"patch"),false);
});
test("recibo hist\u00f3rico n\u00e3o exige registro presente mesmo sob outro lock",async()=>{
 const f=fixture(),a=f.request();await payOwnedSustained(f.actor,"sustain1",a);delete f.actor.flags[ID].persistentEffects.sustain1;f.actor.flags[ID].effectOperations.lock={status:"prepared"};const n=f.writes.length;assert.equal((await payOwnedSustained(f.actor,"sustain1",a)).replayed,true);assert.equal((await recoverOwnedSustained(f.actor,"intent1",{requester:f.owner})).replayed,true);assert.equal(f.writes.length,n);
});
test("mestre/OWNER perdidos na recupera\u00e7\u00e3o recusam status e d\u00e9bito",async()=>{
 for(const mutate of [f=>f.denied.add(f.actor.uuid),f=>game.users.activeGM={id:"other",isGM:true,active:true}]){const f=fixture();f.faults.push({phase:"before",tag:"commit"});await assert.rejects(f.pay());let once=false;f.hooks.resolve=()=>{if(!once){once=true;mutate(f);}};await assert.rejects(f.recover());assert.equal(f.op().status,"prepared");assert.equal(ceWrites(f).length,0);}
});
test("contexto n\u00e3o usa epoch de a\u00e7\u00f5es como prazo do efeito",async()=>{
 const f=fixture();f.combat.flags[ID].actionControl.epoch="changed";assert.equal(ownedSustainContext(f.actor,"sustain1").epoch,"changed");await f.pay();f.advance();await f.pay({operationId:"two"});assert.equal(f.record.lastRound,3);assert.equal(f.record.sustain.paidUntilRound,5);assert.equal(f.actor.system.resources.cosmo.value,6);
});
test("validador recusa jornal/ID/assinatura/custo e snapshot adulterados",async()=>{
 const f=fixture();await f.pay();for(const mutate of [o=>o.id="other",o=>o.recordId="other",o=>o.userId="",o=>o.time=NaN,o=>o.payment.cost=0,o=>o.after.resources.extra=999,o=>o.context.epoch="other",o=>o.status="failed"]){const op=copy(f.op());mutate(op);assert.throws(()=>validateOwnedSustainJournal(op));}
});

test("cada leitura ass\u00edncrona revalida CE/OWNER/rodada sem cobran\u00e7a",async()=>{
 for(const at of [1,2,3,4,5,6,7,8,9,10])for(const mutate of [f=>f.actor.system.resources.cosmo.value=5,f=>f.denied.add(f.actor.uuid),f=>f.combat.round++]){const f=fixture(),a=f.request();let reads=0;f.hooks.resolve=()=>{if(++reads===at)mutate(f);};await assert.rejects(payOwnedSustained(f.actor,"sustain1",a));assert.equal(ceWrites(f).length,0);}
});
test("falha antes/depois de recuperar status e close n\u00e3o duplica CE",async()=>{
 for(const close of [false,true])for(const phase of ["before","after"]){const f=fixture();if(close){f.faults.push({phase:"before",tag:"commit"});await assert.rejects(f.pay());f.actor.system.resources.cosmo.value=5;}else{await f.pay();f.op().status="prepared";}const before=resources(f),n=ceWrites(f).length;f.faults.push({tag:close?"close":"status",phase});await assert.rejects(f.recover({close}));await f.recover({close});assert.deepEqual(resources(f),before);assert.equal(ceWrites(f).length,n);assert.equal(f.op().status,close?"reviewed":"applied");}
});
