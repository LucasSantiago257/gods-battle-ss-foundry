import test from "node:test";
import assert from "node:assert/strict";
import {knight,content} from "./foundry-stub.mjs";
import {holdDecisionOutsideQueue} from "./held-dialog.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {DEPOSIT_RULES,depositSource,depositPlan,depositCapacity,validDeposit,returnDepositPlan} from "../module/cosmo-deposit-rules.mjs";
import {depositCosmo,returnCosmo,cosmoDepositContext} from "../module/cosmo-deposits.mjs";
import {recoverEffect,effectOperationContext,endEffect} from "../module/effects.mjs";
import {assertNoTechniqueInterruption} from "../module/master-queue.mjs";
import {cosmoPayment} from "../module/technique-rules.mjs";
import {planLevel} from "../module/level-rules.mjs";
const ID="gods-battle-ss",clone=structuredClone;
function patch(obj,data){for(const [path,value] of Object.entries(data)){let o=obj;const parts=path.split(".");for(const p of parts.slice(0,-1))o=o[p]??={};o[parts.at(-1)]=clone(value);}}
function fixture(contract="roses"){
 const gm={id:"gm",isGM:true,active:true},player={id:"p",isGM:false},answers=[],hooks={},stats={payments:0};let n=0;
 const actor={uuid:"Actor.payer",name:"Pagador",type:"knight",isOwner:true,system:knight(),flags:{[ID]:{unrelated:"conservar"}},items:{contents:[],get:id=>actor.items.contents.find(i=>i.id===id)},updates:[],async update(data){await hooks.write?.(data,"before");this.updates.push(clone(data));patch(this,data);prepareKnight(this.system,this.items.contents,"rank",{actorUuid:this.uuid,flags:this.flags});if(Object.keys(data).some(k=>k.startsWith(`flags.${ID}.cosmoDeposits.`)))stats.payments++;await hooks.write?.(data,"after");}};
 actor.system.attributes.cos.value=5;actor.system.resources.cosmo.bonus=10;actor.system.resources.cosmo.value=12;actor.system.resources.cosmoReserved=2;actor.system.resources.cosmoExtra=3;actor.system.resources.health.value=90;actor.system.conditions.afraid=true;
 const rule=DEPOSIT_RULES[contract],item={id:"tech",uuid:actor.uuid+".Item.tech",parent:actor,type:rule.type,name:"Origem de exercício",system:content(),flags:{[ID]:{source:{key:rule.key}}}};actor.items.contents.push(item);prepareKnight(actor.system,actor.items.contents,"rank",{actorUuid:actor.uuid,flags:actor.flags});
 globalThis.game={user:gm,users:{activeGM:gm},combat:null,combats:{contents:[]},actors:{contents:[actor]},settings:{get:()=>"rank"}};
 globalThis.fromUuid=async uuid=>{await hooks.read?.(uuid);return [actor,item].find(d=>d.uuid===uuid)??null;};
 foundry.utils={randomID:()=>`dep${++n}`};foundry.applications.handlebars={renderTemplate:async(_p,c)=>{hooks.context=c;await hooks.render?.();return "template";}};foundry.applications.api.DialogV2={wait:async()=>{const a=answers.shift();return typeof a==="function"?a():a??null;}};
 const definition={itemUuid:item.uuid,object:"Objeto A",mode:"capacity",reason:""};
 return {actor,item,gm,player,answers,hooks,stats,definition,record:key=>actor.flags[ID].cosmoDeposits?.[key??"dep1"],operation:()=>Object.entries(actor.flags[ID].effectOperations??{}).at(-1),async create(change={}){answers.push({...definition,...change});return depositCosmo(actor);},async giveBack(change={}){answers.push({event:rule.event,reason:"",...change});return returnCosmo(actor,"dep1");},async recover(close=false){answers.push({close,reason:""});return recoverEffect(actor,this.operation()[0]);}};
}
test("três contratos têm quantidades/gatilhos fixos e não cobram ativação",async()=>{
 for(const [c,amount,event]of [["roses",5,"Técnica cessou"],["coffin",1,"Ataúde se quebrou"],["fruit",5,"Fruta consumida"]]){const f=fixture(c),before=clone(f.actor.system);const r=await f.create();assert.equal(r.amount,amount);assert.equal(r.source.event,event);assert.equal(f.actor.system.resources.cosmo.value,12-amount);assert.equal(f.actor.system.resources.cosmo.max,15-amount);assert.equal(f.actor.system.resources.cosmoReserved,2);assert.equal(f.actor.system.resources.cosmoExtra,3);assert.equal(f.actor.system.resources.health.value,90);assert.deepEqual(f.actor.system.attributes,before.attributes);assert.deepEqual(f.actor.system.conditions,before.conditions);assert.deepEqual(f.actor.system.combat,before.combat);assert.equal(f.actor.flags[ID].unrelated,"conservar");assert.equal(f.operation()[1].status,"applied");assert.equal(cosmoDepositContext(f.actor)[0].canReturn,true);}
});
test("perfil saldo mantém máximo; perfil capacidade é parcela derivada sem tocar bônus/manualMax",async()=>{
 const f=fixture();f.actor.system.resources.cosmo.manualMax=22;await f.create({mode:"current"});assert.equal(f.actor.system.resources.cosmo.max,15);assert.equal(f.actor.system.resources.cosmo.bonus,10);assert.equal(f.actor.system.resources.cosmo.manualMax,22);assert.equal(depositCapacity(f.actor.uuid,f.actor.flags),0);await f.giveBack();assert.equal(f.actor.system.resources.cosmo.value,12);assert.equal(f.actor.system.resources.cosmo.max,15);
 const g=fixture();await g.create();g.actor.system.resources.cosmo.bonus+=2;prepareKnight(g.actor.system,g.actor.items.contents,"rank",{actorUuid:g.actor.uuid,flags:g.actor.flags});assert.equal(g.actor.system.resources.cosmo.max,12);assert.equal(g.actor.system.resources.cosmo.bonus,12);await g.giveBack();assert.equal(g.actor.system.resources.cosmo.max,17);assert.equal(g.actor.system.resources.cosmo.bonus,12);
});
test("devolução uma vez soma à CE atual preservando gastos/ajustes posteriores e pode superar máximo",async()=>{
 const f=fixture();await f.create();f.actor.system.resources.cosmo.value=14;f.actor.system.resources.health.value=2;await f.giveBack();assert.equal(f.actor.system.resources.cosmo.value,19);assert.equal(f.actor.system.resources.health.value,2);assert.equal(f.record().status,"returned");assert.equal(f.record().return.event,"Técnica cessou");assert.equal(cosmoDepositContext(f.actor)[0].canReturn,false);await assert.rejects(f.giveBack());assert.equal(f.stats.payments,2);
});
test("fontes removidas depois do depósito não impedem devolução pelo contrato congelado",async()=>{
 const f=fixture("fruit");await f.create();f.actor.items.contents=[];await f.giveBack();assert.equal(f.actor.system.resources.cosmo.value,12);assert.equal(f.record().source.key,DEPOSIT_RULES.fruit.key);
});
test("objetos independentes somam capacidade e retornam separadamente; identidade duplica só após devolução",async()=>{
 const f=fixture();await f.create();await assert.rejects(f.create({object:"  OBJETO A  "}),/Já há/);await f.create({object:"Objeto B"});assert.equal(f.actor.system.resources.cosmo.value,2);assert.equal(f.actor.system.resources.cosmo.max,5);assert.equal(depositCapacity(f.actor.uuid,f.actor.flags),10);await f.giveBack();assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.actor.system.resources.cosmo.max,10);assert.equal(f.record("dep3").status,"active");await f.create();assert.equal(f.actor.system.resources.cosmo.value,2);
});
test("depósito não altera reservas/extra/PV/sobrecarga nem usa ilimitada",async()=>{
 for(const mutate of [f=>f.actor.system.resources.cosmo.value=6,f=>f.actor.system.resources.cosmo.value=-1,f=>f.actor.system.resources.cosmo.value=7.5,f=>f.actor.system.resources.cosmoReserved=-1,f=>f.actor.system.resources.cosmo.max=4,f=>f.actor.system.resources.cosmo.unlimited=true]){const f=fixture();mutate(f);const before=clone(f.actor.system.resources);await assert.rejects(f.create());assert.equal(f.operation(),undefined);assert.deepEqual(f.actor.system.resources,before);}
 const f=fixture();await f.create();const p=cosmoPayment(f.actor.system,5,{useExtra:false});assert.equal(p.fromCurrent,5);assert.equal(p.updates["system.resources.cosmo.value"],2);
});
test("campos/tipos/chaves herdadas e evento inválidos não gravam",async()=>{
 for(const change of [{mode:""},{mode:"constructor"},{mode:"toString"},{mode:"invalid"},{object:" "},{object:1},{object:"x".repeat(121)},{reason:2},{reason:"x".repeat(2001)},{itemUuid:"Item.other"}]){const f=fixture();await assert.rejects(f.create(change));assert.equal(f.operation(),undefined);assert.equal(f.actor.system.resources.cosmo.value,12);}
 const f=fixture();await f.create();await assert.rejects(f.giveBack({event:"Outro evento"}));assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(validDeposit(undefined,{contract:"roses"}),false);f.actor.flags[ID].cosmoDeposits.nullRecord=null;assert.equal(cosmoDepositContext(f.actor).length,2);assert.equal(depositCapacity(f.actor.uuid,f.actor.flags),5);
});
test("catálogo próprio exato e fonte sem rascunho exigidos; nome similar não identifica regra",async()=>{
 for(const mutate of [f=>delete f.item.flags[ID].source,f=>f.item.flags[ID].source.key="invalid",f=>f.item.parent={uuid:"Actor.other"},f=>f.item.type="virtue",f=>f.item.flags[ID].techniqueDraft={},f=>f.item.flags[ID].techniqueBuilder={status:"draft"},f=>f.actor.items.contents=[]]){const f=fixture();mutate(f);assert.throws(()=>depositSource(f.actor,f.item));await assert.rejects(f.create());assert.equal(f.stats.payments,0);}
});
test("mestre/propriedade/pendências de técnicas/ações/efeitos/dano/evolução bloqueiam",async()=>{
 for(const mutate of [f=>game.user=f.player,f=>game.users.activeGM={id:"other",active:true},f=>f.actor.isOwner=false,...["techniqueOperations","actionOperations","effectOperations","damageOperations","levelOperation"].map(g=>f=>f.actor.flags[ID][g]=g==="levelOperation"?{status:"prepared"}:{pending:{status:"prepared"}})]){const f=fixture();mutate(f);await assert.rejects(f.create());assert.equal(f.stats.payments,0);}
});
test("cópia não recebe redução de máximo nem devolução; registros inconsistentes não normalizados",async()=>{
 const f=fixture();await f.create();f.actor.uuid="Actor.copy";prepareKnight(f.actor.system,f.actor.items.contents,"rank",{actorUuid:f.actor.uuid,flags:f.actor.flags});assert.equal(f.actor.system.resources.cosmo.max,15);assert.equal(f.actor.system.resources.cosmo.value,7);await assert.rejects(f.giveBack());assert.equal(cosmoDepositContext(f.actor)[0].canReturn,false);
 for(const mutate of [f=>f.record().amount=50,f=>f.record().mode="constructor",f=>f.record().contract="constructor",f=>delete f.record().source,f=>f.record().return={event:"fake"}]){const f=fixture();await f.create();mutate(f);await assert.rejects(f.giveBack());f.answers.length=0;await assert.rejects(f.create({object:"B"}),/inconsistente/);}
});
test("cancelamento e diálogos fora da fila deixam saldo intacto",async()=>{
 const f=fixture();await holdDecisionOutsideQueue(()=>depositCosmo(f.actor));await depositCosmo(f.actor);assert.equal(f.actor.updates.length,0);await f.create();await holdDecisionOutsideQueue(()=>returnCosmo(f.actor,"dep1"));await returnCosmo(f.actor,"dep1");assert.equal(f.record().status,"active");assert.equal(f.actor.system.resources.cosmo.value,7);
});
test("duplo clique de depósito/devolução só grava uma vez",async()=>{
 const f=fixture();let r=await Promise.allSettled([f.create(),f.create()]);assert.equal(r.filter(x=>x.status==="fulfilled").length,1);assert.equal(f.stats.payments,1);r=await Promise.allSettled([f.giveBack(),f.giveBack()]);assert.equal(r.filter(x=>x.status==="fulfilled").length,1);assert.equal(f.stats.payments,2);assert.equal(f.actor.system.resources.cosmo.value,12);
});
test("alterações durante render/diálogo/preparo/última leitura impedem gravação",async()=>{
 for(const stage of ["render","dialog","prepare","lastRead"]){for(const mutate of [f=>f.actor.system.resources.cosmo.value=5,f=>f.actor.isOwner=false,f=>game.user=f.player,f=>{const gm={id:"gm2",isGM:true,active:true};game.user=gm;game.users.activeGM=gm;},f=>f.item.flags[ID].source.key="other",f=>f.actor.items.contents=[]]){const f=fixture();if(stage==="render")f.hooks.render=async()=>mutate(f);if(stage==="dialog")f.answers.push(()=>{mutate(f);return f.definition;});if(stage==="prepare")f.hooks.write=async(_d,p)=>{if(p==="after")mutate(f);};if(stage==="lastRead")f.hooks.read=async uuid=>{if(uuid===f.actor.uuid&&f.operation()?.[1].status==="prepared")mutate(f);};await assert.rejects(stage==="dialog"?depositCosmo(f.actor):f.create());assert.equal(f.stats.payments,0);}}
});
test("interrupção antes do depósito/devolução conserva saldo e recuperação anterior não repete",async()=>{
 for(const direction of ["deposit","return"]){const f=fixture();if(direction==="return")await f.create();const before=f.actor.system.resources.cosmo.value;f.hooks.write=async(d,p)=>{if(p==="before"&&Object.keys(d).some(k=>k.startsWith(`flags.${ID}.cosmoDeposits.`)))throw Error("Falha");};await assert.rejects(direction==="deposit"?f.create():f.giveBack());assert.equal(f.actor.system.resources.cosmo.value,before);assert.equal(f.operation()[1].status,"prepared");assert.throws(()=>assertNoTechniqueInterruption(f.actor),/interrompida/);assert.equal(effectOperationContext(f.actor).length,1);f.hooks.write=null;await f.recover();assert.equal(f.operation()[1].status,"failed");assert.equal(f.actor.system.resources.cosmo.value,before);}
});
test("resposta perdida depois da gravação já contém status aplicado; reconhecer after não repete",async()=>{
 for(const direction of ["deposit","return"]){const f=fixture();if(direction==="return")await f.create();f.hooks.write=async(d,p)=>{if(p==="after"&&Object.keys(d).some(k=>k.startsWith(`flags.${ID}.cosmoDeposits.`)))throw Error("Resposta perdida");};await assert.rejects(direction==="deposit"?f.create():f.giveBack());assert.equal(f.operation()[1].status,"applied");const value=f.actor.system.resources.cosmo.value,payments=f.stats.payments;f.hooks.write=null;f.operation()[1].status="prepared";await f.recover();assert.equal(f.operation()[1].status,"applied");assert.equal(f.actor.system.resources.cosmo.value,value);assert.equal(f.stats.payments,payments);}
});
test("recuperação divergente/cópia/cancelada preserva ajustes e encerra apenas pendência",async()=>{
 const f=fixture();f.hooks.write=async(d,p)=>{if(p==="before"&&Object.keys(d).some(k=>k.startsWith(`flags.${ID}.cosmoDeposits.`)))throw Error("Falha");};await assert.rejects(f.create());f.hooks.write=null;await recoverEffect(f.actor,f.operation()[0]);assert.equal(f.operation()[1].status,"prepared");await holdDecisionOutsideQueue(()=>recoverEffect(f.actor,f.operation()[0]));f.actor.system.resources.cosmo.value=4;await assert.rejects(f.recover(),/divergentes/);await f.recover(true);assert.equal(f.operation()[1].status,"reviewed");assert.equal(f.actor.system.resources.cosmo.value,4);assert.equal(f.record(),undefined);
 const g=fixture();g.hooks.write=async(d,p)=>{if(p==="before"&&Object.keys(d).some(k=>k.startsWith(`flags.${ID}.cosmoDeposits.`)))throw Error("Falha");};await assert.rejects(g.create());g.hooks.write=null;g.actor.uuid="Actor.copy";await assert.rejects(g.recover(),/outra ficha/);await g.recover(true);assert.equal(g.actor.system.resources.cosmo.value,12);
});
test("encerrar Residual/avançar rodada não devolve depósito e não escreve em alvo",async()=>{
 const f=fixture();await f.create();f.actor.flags[ID].persistentEffects={res:{kind:"residual",actorUuid:f.actor.uuid,status:"active",label:"Teste",residual:{value:50}}};f.answers.push("");await endEffect(f.actor,"res");assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.record().status,"active");game.combat={uuid:"Combat.example",round:99};assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.record().status,"active");
});
test("mudança de nível/armadura recalcula capacidade e não repõe depósito ou modifica saldo",async()=>{
 const f=fixture();await f.create();f.actor.system.profile.level=2;prepareKnight(f.actor.system,f.actor.items.contents,"rank",{actorUuid:f.actor.uuid,flags:f.actor.flags});assert.equal(f.actor.system.resources.cosmo.max,11);assert.equal(f.actor.system.resources.cosmo.value,7);f.actor.system.resources.cosmo.bonus=-4;prepareKnight(f.actor.system,f.actor.items.contents,"rank",{actorUuid:f.actor.uuid,flags:f.actor.flags});assert.equal(f.actor.system.resources.cosmo.max,0);await f.giveBack();assert.equal(f.actor.system.resources.cosmo.value,12);assert.equal(f.actor.system.resources.cosmo.max,2);
});

test("devolver preserva saldo negativo ajustado e recusa limites técnicos sem crédito parcial",async()=>{
 const f=fixture();await f.create();f.actor.system.resources.cosmo.value=-10;await f.giveBack();assert.equal(f.actor.system.resources.cosmo.value,-5);
 for(const value of [NaN,Infinity,1.5,1000000,-100001]){const g=fixture();await g.create();g.actor.system.resources.cosmo.value=value;await assert.rejects(g.giveBack());assert.equal(g.record().status,"active");assert.equal(g.stats.payments,1);}
});
test("prévia de evolução conserva parcela do depósito e não concede CE retroativa",async()=>{
 const f=fixture();await f.create();const draft={id:"abcdefghijklmnop",from:1,to:2,attributes:{},skills:{},fighting:{}};
 const p=planLevel(f.actor.system,[],draft,{},"rank",{actorUuid:f.actor.uuid,flags:f.actor.flags});assert.equal(p.projected.resources.cosmo.max,11);assert.equal(p.projected.resources.cosmo.value,7);assert.equal(p.projected.automation.cosmoDeposit,5);assert.equal(f.actor.system.profile.level,1);
});
