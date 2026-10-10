import test from "node:test";
import assert from "node:assert/strict";
import {knight,content} from "./foundry-stub.mjs";
import {holdDecisionOutsideQueue} from "./held-dialog.mjs";
import {sustainedSource,sustainedDefinition,sustainedView,sustainedPaymentPlan} from "../module/sustained-rules.mjs";
import {registerSustained,paySustained,recoverSustained} from "../module/sustained.mjs";
import {effectSheetContext,endEffect,recoverEffect,effectOperationContext,resolveEffect} from "../module/effects.mjs";
import {assertNoTechniqueInterruption,runMasterOperation} from "../module/master-queue.mjs";
const ID="gods-battle-ss",clone=structuredClone;
function patch(obj,data){for(const [path,value] of Object.entries(data)){let o=obj;const parts=path.split(".");for(const p of parts.slice(0,-1))o=o[p]??={};o[parts.at(-1)]=clone(value);}}
function fixture(tier="bronze"){
 const gm={id:"gm",isGM:true,active:true},player={id:"p",isGM:false},answers=[],hooks={},stats={payments:0};let n=0;
 const actor={uuid:"Actor.payer",name:"Pagador",type:"knight",isOwner:true,system:knight(),flags:{[ID]:{unrelated:"conservar"}},items:{contents:[],get:id=>actor.items.contents.find(i=>i.id===id)},updates:[],async update(data){await hooks.write?.(data,"before");this.updates.push(clone(data));patch(this,data);if(Object.hasOwn(data,`flags.${ID}.persistentEffects.effect1`)&&Object.keys(data).some(k=>k.includes("effectOperations")))stats.payments++;await hooks.write?.(data,"after");}};
 const target={uuid:"Actor.target",name:"Alvo",type:"knight",isOwner:true,system:knight(),flags:{},items:{contents:[]}};
 actor.system.resources.cosmo.value=8;actor.system.resources.cosmoReserved=2;actor.system.resources.cosmoExtra=3;actor.system.resources.health.value=90;actor.system.conditions.afraid=true;
 const item={id:"tech",uuid:"Actor.payer.Item.tech",parent:actor,type:"technique",name:"Sustentada de exercício",system:{...content(),effectKind:"sustained",classification:tier},flags:{}};actor.items.contents.push(item);
 const combat={uuid:"Combat.example",started:true,round:2,combatants:{contents:[{id:"payerMember",actor},{id:"targetMember",actor:target}]}};
 globalThis.game={user:gm,users:{activeGM:gm},combat,combats:{contents:[combat]},actors:{contents:[actor,target]}};
 globalThis.fromUuid=async uuid=>{await hooks.read?.(uuid);return [actor,target,item].find(d=>d.uuid===uuid)??null;};
 foundry.utils={randomID:()=>`effect${++n}`};foundry.applications.handlebars={renderTemplate:async()=>{await hooks.render?.();return "template";}};foundry.applications.api.DialogV2={wait:async()=>{const a=answers.shift();return typeof a==="function"?a():a??null;}};
 const definition={itemUuid:item.uuid,targetUuid:target.uuid,firstRound:2,rounds:null,reason:""};
 return {actor,target,item,combat,gm,player,answers,hooks,stats,definition,record:()=>actor.flags[ID].persistentEffects?.effect1,operation:()=>Object.entries(actor.flags[ID].effectOperations??{}).at(-1),async create(overrides={}){answers.push({...definition,...overrides});return registerSustained(actor);},async pay(overrides={}){answers.push({useExtra:false,reason:"",...overrides});return paySustained(actor,"effect1");},async recover(close=false){answers.push({close,reason:""});return recoverEffect(actor,this.operation()[0]);}};
}
test("duração inicial por classe inclui ativação e permite ajuste final sem custo",async()=>{
 for(const [tier,rounds]of [["bronze",2],["silver",3],["gold",4]]){const f=fixture(tier),before=clone(f.actor.system),target=clone(f.target);const r=await f.create();assert.equal(r.rounds,rounds);assert.equal(r.firstRound,2);assert.equal(r.lastRound,2+rounds-1);assert.deepEqual(f.actor.system,before);assert.deepEqual(f.target,target);assert.equal(r.sustain.cost,1);assert.equal(r.source.actorUuid,f.actor.uuid);assert.equal(f.actor.flags[ID].unrelated,"conservar");assert.equal(sustainedView(f.actor,r).phase,"initial");await assert.rejects(f.pay(),/coberta/);assert.equal(f.operation(),undefined);}
 const f=fixture();const r=await f.create({rounds:6});assert.equal(r.lastRound,7);
});
test("cada manutenção debita o usuário uma vez e preserva alvo, reservas, PV e condições",async()=>{
 const f=fixture("gold");await f.create();const target=clone(f.target),before=clone(f.actor.system);f.combat.round=6;const payment=await f.pay();assert.equal(payment.cost,1);assert.equal(payment.round,6);assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.record().lastRound,5);assert.equal(f.record().sustain.paidUntilRound,6);assert.equal(f.record().status,"active");assert.equal(f.operation()[1].status,"applied");assert.equal(f.actor.system.resources.health.value,90);assert.equal(f.actor.system.resources.cosmoReserved,2);assert.equal(f.actor.system.conditions.afraid,true);assert.deepEqual(f.target,target);assert.deepEqual(f.actor.system.combat,before.combat);await assert.rejects(f.pay(),/coberta/);f.combat.round=7;await f.pay();assert.equal(f.actor.system.resources.cosmo.value,6);assert.equal(f.stats.payments,2);f.combat.round=6;await assert.rejects(f.pay(),/coberta/);
});
test("CE extra é selecionável mesmo sem CE atual livre; ilimitada ainda registra cobrança única",async()=>{
 const f=fixture();await f.create();f.combat.round=4;f.actor.system.resources.cosmo.value=2;await assert.rejects(f.pay(),/insuficiente/);assert.equal(f.operation(),undefined);await f.pay({useExtra:true});assert.equal(f.actor.system.resources.cosmoExtra,2);assert.equal(f.actor.system.resources.cosmo.value,2);assert.equal(f.actor.system.resources.health.value,90);
 const g=fixture();await g.create();g.combat.round=4;g.actor.system.resources.cosmo.unlimited=true;const before=clone(g.actor.system.resources);await g.pay();assert.deepEqual(g.actor.system.resources,before);assert.equal(g.record().sustain.payments[g.operation()[0]].unlimited,true);await assert.rejects(g.pay());
});
test("avançar não cobra; lacuna paga só rodada atual com histórico explícito",async()=>{
 const f=fixture();await f.create();f.combat.round=7;assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(sustainedView(f.actor,f.record()).overdue,true);const r=await f.pay();assert.deepEqual(r.gap,{first:4,last:6});assert.equal(r.round,7);assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(Object.keys(f.record().sustain.payments).length,1);f.combat.round=8;assert.equal(sustainedView(f.actor,f.record()).overdue,false);
});
test("fonte pronta, participantes próprios e parâmetros numéricos são necessários",async()=>{
 for(const change of [f=>f.item.system.effectKind="damage",f=>f.item.system.classification="divine",f=>f.item.flags[ID]={techniqueDraft:{}},f=>f.item.flags[ID]={source:{reference:{manualOnly:true}}},f=>f.item.parent=f.target]){const f=fixture();change(f);assert.throws(()=>sustainedSource(f.actor,f.item));await assert.rejects(f.create());}
 for(const change of [{rounds:0},{rounds:1001},{rounds:1.5},{firstRound:0},{firstRound:3},{firstRound:NaN},{reason:123},{reason:"x".repeat(2001)},{targetUuid:"Actor.missing"},{itemUuid:"Item.foreign"}]){const f=fixture();await assert.rejects(f.create(change));assert.equal(f.record(),undefined);}
 const f=fixture();f.combat.round=10;await assert.rejects(f.create(),/primeira rodada/);
});
test("cancelar e duplicar registro conservam recursos; tipo não entra no resolvedor de dano",async()=>{
 const f=fixture();await registerSustained(f.actor);assert.equal(f.actor.updates.length,0);await f.create();await assert.rejects(f.create(),/Já há/);f.combat.round=4;await paySustained(f.actor,"effect1");assert.equal(f.operation(),undefined);await assert.rejects(resolveEffect(f.actor,"effect1"));assert.equal(f.actor.system.resources.health.value,90);
});
test("permissões, encontros, cópias e alvos substituídos recusam pagamento",async()=>{
 for(const mutate of [f=>game.user=f.player,f=>game.users.activeGM={id:"other",active:true},f=>f.actor.isOwner=false,f=>f.target.isOwner=false,f=>f.actor.uuid="Actor.copy",f=>f.record().actorUuid="Actor.foreign",f=>f.record().status="ended",f=>f.record().sustain.cost=2,f=>f.record().damage=10,f=>f.combat.started=false,f=>game.combat={uuid:"Combat.other"},f=>f.combat.combatants.contents[1].id="replacement",f=>f.combat.combatants.contents.push({id:"duplicate",actor:f.target}),f=>f.record().sustain.paidUntilRound=NaN]){const f=fixture();await f.create();f.combat.round=4;mutate(f);await assert.rejects(f.pay());assert.equal(f.operation(),undefined);assert.equal(f.actor.system.resources.cosmo.value,8);}
});
test("diálogos e recuperação ficam fora da fila de gravação",async()=>{
 const f=fixture();await holdDecisionOutsideQueue(()=>registerSustained(f.actor));await f.create();f.combat.round=4;await holdDecisionOutsideQueue(()=>paySustained(f.actor,"effect1"));f.hooks.write=async(d,p)=>{if(p==="before"&&Object.hasOwn(d,`flags.${ID}.persistentEffects.effect1`))throw Error("Falha");};await assert.rejects(f.pay());await holdDecisionOutsideQueue(()=>recoverSustained(f.actor,f.operation()[0]));assert.equal(f.operation()[1].status,"prepared");
});
test("alteração durante render, diálogo ou leitura/preparo invalida custo",async()=>{
 for(const stage of ["render","dialog","prepare"]){for(const mutate of [f=>f.actor.system.resources.cosmo.value=5,f=>f.target.system.resources.health.value=1,f=>f.combat.round++,f=>game.user=f.player,f=>f.actor.isOwner=false,f=>f.target.isOwner=false]){const f=fixture();await f.create();f.combat.round=4;if(stage==="render")f.hooks.render=async()=>mutate(f);if(stage==="dialog"){f.answers.push(()=>{mutate(f);return {useExtra:false,reason:""};});await assert.rejects(paySustained(f.actor,"effect1"));}else{if(stage==="prepare")f.hooks.write=async(d,p)=>{if(p==="after"&&Object.keys(d).length===1)mutate(f);};await assert.rejects(f.pay());}assert.equal(f.stats.payments,0);}}
});
test("edição e remoção da fonte ou alvo durante registro não criam efeito",async()=>{
 for(const mutate of [f=>f.item.system.cost++,f=>f.actor.items.contents=[],f=>f.target.system.resources.health.value++,f=>f.combat.round++]){const f=fixture();f.answers.push(()=>{mutate(f);return f.definition;});await assert.rejects(registerSustained(f.actor));assert.equal(f.record(),undefined);}
});
test("dois cliques concorrentes debitam exatamente uma recarga",async()=>{
 const f=fixture();await f.create();f.combat.round=4;const r=await Promise.allSettled([f.pay(),f.pay()]);assert.equal(r.filter(r=>r.status==="fulfilled").length,1);assert.equal(f.stats.payments,1);assert.equal(f.actor.system.resources.cosmo.value,7);
});
test("interrupção antes do débito bloqueia gastos e recupera sem repetir pagamento",async()=>{
 const f=fixture();await f.create();f.combat.round=4;f.hooks.write=async(d,p)=>{if(p==="before"&&Object.hasOwn(d,`flags.${ID}.persistentEffects.effect1`))throw Error("Falha de gravação");};await assert.rejects(f.pay());assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(f.operation()[1].status,"prepared");assert.throws(()=>assertNoTechniqueInterruption(f.actor),/efeito interrompida/);assert.equal(effectOperationContext(f.actor).length,1);f.hooks.write=null;await f.recover();assert.equal(f.operation()[1].status,"failed");assert.equal(f.actor.system.resources.cosmo.value,8);await f.pay();assert.equal(f.actor.system.resources.cosmo.value,7);
});
test("resposta perdida após débito mantém pagamento; recuperação de after não debita novamente",async()=>{
 const f=fixture();await f.create();f.combat.round=4;f.hooks.write=async(d,p)=>{if(p==="after"&&Object.hasOwn(d,`flags.${ID}.persistentEffects.effect1`))throw Error("Resposta perdida");};await assert.rejects(f.pay());assert.equal(f.operation()[1].status,"applied");assert.equal(f.actor.system.resources.cosmo.value,7);f.hooks.write=null;await assert.rejects(f.pay(),/coberta/);f.operation()[1].status="prepared";await f.recover();assert.equal(f.operation()[1].status,"applied");assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.stats.payments,1);
});
test("recuperação divergente, cópia, cancelamento e alterações tardias preservam recursos",async()=>{
 const f=fixture();await f.create();f.combat.round=4;f.hooks.write=async(d,p)=>{if(p==="before"&&Object.hasOwn(d,`flags.${ID}.persistentEffects.effect1`))throw Error("Falha");};await assert.rejects(f.pay());f.hooks.write=null;await recoverSustained(f.actor,f.operation()[0]);assert.equal(f.operation()[1].status,"prepared");f.actor.system.resources.cosmo.value=5;await assert.rejects(f.recover(),/divergentes/);await f.recover(true);assert.equal(f.operation()[1].status,"reviewed");assert.equal(f.actor.system.resources.cosmo.value,5);
 const g=fixture();await g.create();g.combat.round=4;g.hooks.write=f.hooks.write=async(d,p)=>{if(p==="before"&&Object.hasOwn(d,`flags.${ID}.persistentEffects.effect1`))throw Error("Falha");};await assert.rejects(g.pay());g.hooks.write=null;await assert.rejects(holdDecisionOutsideQueue(()=>recoverSustained(g.actor,g.operation()[0]),{answer:{close:true,reason:""},during:()=>runMasterOperation(()=>{g.actor.system.resources.cosmo.value=4;})}),/mudou/);assert.equal(g.operation()[1].status,"prepared");g.actor.uuid="Actor.copy";await assert.rejects(g.recover(),/outra ficha/);await g.recover(true);assert.equal(g.actor.system.resources.cosmo.value,4);
});
test("encerrar conserva pagamentos/condições e ficha distingue manutenção de dano",async()=>{
 const f=fixture();await f.create();assert.equal(effectSheetContext(f.actor)[0].isSustained,true);assert.equal(effectSheetContext(f.actor)[0].canPay,false);f.combat.round=4;assert.equal(effectSheetContext(f.actor)[0].canPay,true);await f.pay();assert.equal(effectSheetContext(f.actor)[0].sustainPayments.length,1);const before=clone(f.actor.system);f.answers.push("");await endEffect(f.actor,"effect1");assert.equal(f.record().status,"ended");assert.deepEqual(f.actor.system,before);assert.equal(Object.keys(f.record().sustain.payments).length,1);await assert.rejects(f.pay());
});
test("autossustentação reconhece preparação na mesma ficha sem cobrar o alvo duas vezes",async()=>{
 const f=fixture();await f.create({targetUuid:f.actor.uuid});f.combat.round=4;await f.pay();assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.stats.payments,1);
});


test("uma técnica tem um registro pagador; múltiplos alvos não duplicam cobrança",async()=>{
 const f=fixture();await f.create();await assert.rejects(f.create({targetUuid:f.actor.uuid}),/Já há/);assert.equal(Object.keys(f.actor.flags[ID].persistentEffects).length,1);
});
test("pendências de técnicas, ações, dano e evolução bloqueiam a recarga",async()=>{
 for(const group of ["techniqueOperations","actionOperations","effectOperations","damageOperations","levelOperation"]){const f=fixture();await f.create();f.combat.round=4;f.actor.flags[ID][group]=group==="levelOperation"?{status:"prepared"}:{pending:{status:"prepared"}};await assert.rejects(f.pay(),/interrompid/);assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(f.stats.payments,0);}
});
test("histórico adulterado e alteração na última leitura após preparo não cobram",async()=>{
 for(const mutate of [f=>f.record().sustain.paidUntilRound=8,f=>f.record().sustain.payments.forged={operationId:"forged",round:4,cost:2},f=>f.record().lastRound=Number.MAX_SAFE_INTEGER+1]){const f=fixture();await f.create();f.combat.round=4;mutate(f);await assert.rejects(f.pay(),/inválid/);assert.equal(f.stats.payments,0);}
 const f=fixture();await f.create();f.combat.round=4;f.hooks.read=async uuid=>{if(uuid===f.target.uuid&&f.operation()?.[1].status==="prepared")f.actor.system.resources.cosmo.value=5;};await assert.rejects(f.pay(),/mudou/);assert.equal(f.stats.payments,0);assert.equal(f.actor.system.resources.cosmo.value,5);
});


test("perfil de recarga única não cobra novamente em rodadas posteriores",async()=>{
 const f=fixture();await f.create({maintenanceMode:"once"});f.combat.round=4;await f.pay();assert.equal(f.record().sustain.mode,"once");f.combat.round=9;assert.equal(sustainedView(f.actor,f.record()).canPay,false);assert.equal(sustainedView(f.actor,f.record()).oneOff,true);assert.equal(sustainedView(f.actor,f.record()).nextRound,null);await assert.rejects(f.pay(),/coberta/);assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.stats.payments,1);
});
test("perfil inválido não registra nem debita e política fica congelada no registro",async()=>{
 const f=fixture();await assert.rejects(f.create({maintenanceMode:"invented"}),/perfil/);assert.equal(f.record(),undefined);await f.create({maintenanceMode:"round"});f.combat.round=4;f.record().sustain.mode="invented";await assert.rejects(f.pay(),/inválid/);assert.equal(f.actor.system.resources.cosmo.value,8);
});
