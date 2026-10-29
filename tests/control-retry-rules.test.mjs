import test from "node:test";
import assert from "node:assert/strict";
import {knight} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {controlRetryPlan as legacyPlan} from "../module/control-retry.mjs";
import {controlRetryKey,controlRetryRecordMath,controlRetrySnapshot,controlRetryOptions,controlRetryPreview,controlRetryState,controlRetryResultPlan,validateControlRetryPlan} from "../module/control-retry-rules.mjs";
const ID="gods-battle-ss",copy=structuredClone;
function fixture({tier="silver",synthetic=false}={}){
 const system=knight();system.profile.level=5;for(const k of ["vig","vel","sen","cos"])system.attributes[k].value=2;prepareKnight(system);system.resources.cosmo.value=8;system.resources.cosmoExtra=3;system.resources.cosmoReserved=2;system.resources.health.value=90;
 const actor={uuid:synthetic?"Scene.arena.Token.target.Actor.target":"Actor.target",type:"knight",system,flags:{[ID]:{persistentEffects:{}}}};
 const record={id:"controlA",kind:"manual",actorUuid:actor.uuid,status:"active",damage:0,label:"Nome privado do efeito",description:"Texto privado",reason:"Nota",time:123,userId:"gm",firstRound:2,lastRound:6,ticks:{},combatUuid:"Combat.arena",combatantId:"target",controlOrigin:{rootMessageId:"initial",resistanceMessageId:"resisted",attackerUuid:"Actor.hidden",itemUuid:"Actor.hidden.Item.secret",classification:tier,nature:"mental",powerCosmic:20,retryCost:999}};
 actor.flags[ID].persistentEffects.controlA=record;
 const options={attribute:"sen",bonus:0,advantage:0,useExtra:false,onSuccess:"end",resistanceMode:"rank",reason:""},context={combatUuid:"Combat.arena",combatantId:"target",round:3,epoch:"epoch3"};
 return {actor,record,options,context,preview(o={}){return controlRetryPreview(actor,"controlA",{...options,...o},context);},plan(o={},faces){const p=this.preview(o);return controlRetryResultPlan(p,faces??Array(p.pool.dice).fill(5),{operationId:"intent1"});},accept(plan){const r=plan.after.resources;system.resources.cosmo.value=r.current;system.resources.cosmoExtra=r.extra;record.controlRetries??={};record.controlRetries[plan.operationId]=copy(plan.attempt);record.status=plan.after.record.status;}};
}
test("classe capturada define 1/1/2 CE e plano não altera Actor",()=>{
 for(const tier of ["bronze","silver","gold"]){const f=fixture({tier}),before=copy(f.actor),p=f.plan();assert.equal(p.payment.cost,tier==="gold"?2:1);assert.equal(p.payment.overload,0);assert.equal(p.payment.lifeDamage,0);assert.equal(p.after.resources.current,8-p.payment.cost);assert.deepEqual(f.actor,before);assert.deepEqual(validateControlRetryPlan(p),p);assert.equal(p.after.record.origin.classification,tier);}
});
test("parada e pagamento mantêm contrato publicado de condições/modo/ajustes",()=>{
 for(const resistanceMode of ["rank","modifier"])for(const advantage of [-1,0,1])for(const useExtra of [false,true]){
  const f=fixture();f.actor.system.automation.conditionDicePenalty=1;f.actor.system.automation.conditionModifier=-2;f.options={...f.options,resistanceMode,advantage,useExtra,bonus:1.5};
  globalThis.game={combat:{uuid:f.context.combatUuid},combats:{contents:[{uuid:f.context.combatUuid,started:true,round:f.context.round,combatants:{contents:[{id:f.context.combatantId,actor:f.actor}]}}]},settings:{get:()=>resistanceMode}};
  const published=legacyPlan(f.actor,"controlA",f.options),p=f.preview(f.options);assert.deepEqual(p.pool,published.pool);assert.equal(p.payment.cost,published.payment.cost);assert.equal(p.payment.fromCurrent,published.payment.fromCurrent);assert.equal(p.payment.fromExtra,published.payment.fromExtra);
 }
});
test("CE extra é escolha explícita e reserva/excesso/PV não são consumidos",()=>{
 const f=fixture({tier:"gold"}),p=f.plan({useExtra:true});assert.equal(p.payment.fromExtra,2);assert.equal(p.payment.fromCurrent,0);assert.equal(p.after.resources.extra,1);assert.equal(p.after.resources.current,8);assert.equal(p.after.resources.reserved,2);assert.equal(p.after.resources.overload,0);assert.equal(Object.hasOwn(p.after.resources,"health"),false);assert.equal(f.actor.system.resources.health.value,90);
});
test("saldo reservado insuficiente recusa antes de resultado e não cria excesso",()=>{
 const f=fixture();f.actor.system.resources.cosmo.value=2;assert.throws(()=>f.preview(),/insuficiente/);assert.equal(f.preview({useExtra:true}).payment.fromExtra,1);f.actor.system.resources.cosmo.value=1;assert.throws(()=>f.preview(),/insuficiente/);assert.equal(f.preview({useExtra:true}).payment.fromCurrent,0);f.actor.system.resources.cosmoExtra=0;assert.throws(()=>f.preview({useExtra:true}),/insuficiente/);
});
test("CE ilimitada conserva saldos e ainda registra tentativa única",()=>{
 const f=fixture();f.actor.system.resources.cosmo.unlimited=true;f.actor.system.resources.cosmo.value=0;f.actor.system.resources.cosmoExtra=0;const p=f.plan();assert.equal(p.payment.unlimited,true);assert.deepEqual(p.after.resources,p.before.resources);f.accept(p);assert.throws(()=>f.preview(),/registrada/);
});
test("falha e falha crítica preservam prazo/condições sem penalidade nova",()=>{
 for(const bonus of [0,-100]){const f=fixture(),p=f.plan({bonus});assert.equal(p.attempt.success,false);assert.equal(p.attempt.end,false);assert.equal(p.after.record.status,"active");assert.equal(p.after.record.lastRound,6);assert.equal(p.after.record.firstRound,2);assert.deepEqual(p.after.record.ticks,[]);assert.equal(Object.hasOwn(p,"condition"),false);assert.equal(Object.hasOwn(p,"nextPenalty"),false);}
});
test("sucesso encerra só o registro ou mantém prazo conforme opção explícita",()=>{
 for(const onSuccess of ["end","keep"]){const f=fixture(),p=f.plan({bonus:30,onSuccess});assert.equal(p.attempt.success,true);assert.equal(p.attempt.end,onSuccess==="end");assert.equal(p.after.record.status,onSuccess==="end"?"ended":"active");assert.equal(p.after.record.lastRound,p.before.record.lastRound);assert.equal(p.after.record.retries.length,1);assert.equal(p.attempt.operationId,"intent1");}
});
test("estado financeiro ignora nomes/notas/PV e recursos que não participam",()=>{
 const f=fixture(),before=f.preview().signature;f.record.label="Outro nome";f.record.description="Outra descrição";f.record.reason="Nota tardia";f.actor.name="Personalizado";f.actor.system.resources.health.value=17;f.actor.system.resources.cosmo.max=999;f.actor.system.combat.attack=99;f.actor.flags[ID].unrelated={note:"Livre"};assert.equal(f.preview().signature,before);
});
test("assinatura muda com CE/reserva/extra/excesso/ilimitada/perfil/tempo/identidade",()=>{
 const changes=[f=>f.actor.system.resources.cosmo.value--,f=>f.actor.system.resources.cosmoExtra++,f=>f.actor.system.resources.cosmoReserved++,f=>f.actor.system.resources.cosmoOverload++,f=>f.actor.system.resources.cosmo.unlimited=true,f=>f.record.controlOrigin.powerCosmic++,f=>f.record.controlOrigin.classification="gold",f=>f.record.controlOrigin.rootMessageId="another",f=>f.record.controlOrigin.attackerUuid="Actor.another",f=>f.record.time++,f=>f.record.lastRound++];
 for(const change of changes){const f=fixture(),state=f.preview().signature;change(f);assert.notEqual(f.preview().signature,state);}
});
test("parâmetros de atributo/modificador/condições/decisão integram prévia",()=>{
 for(const change of [f=>f.actor.system.combat.resistanceBonus++,f=>f.actor.system.automation.conditionModifier=-2,f=>f.actor.system.automation.conditionDicePenalty=1]){const f=fixture(),state=f.preview().signature;change(f);assert.notEqual(f.preview().signature,state);}
 const f=fixture(),s=f.preview().signature;for(const o of [{bonus:1},{advantage:1},{useExtra:true},{onSuccess:"keep"},{resistanceMode:"modifier"}])assert.notEqual(f.preview(o).signature,s);assert.equal(f.preview({reason:"Nota opcional"}).signature,s);
});
test("contexto da intenção muda por rodada/epoch sem redefinir prazo",()=>{
 const f=fixture(),s=f.preview().signature;f.context.epoch="epoch4";assert.notEqual(f.preview().signature,s);f.context.round++;assert.notEqual(f.preview().signature,s);assert.equal(f.preview().before.record.lastRound,6);
 for(const c of [{round:2},{round:7},{combatUuid:"Combat.other"},{combatantId:"other"},{epoch:""}]){const g=fixture();Object.assign(g.context,c);assert.throws(()=>g.preview());}
});
test("uma tentativa por rodada e retrocesso não recriam resultado pago",()=>{
 const f=fixture();const first=f.plan({onSuccess:"keep"});f.accept(first);assert.throws(()=>f.preview(),/registrada/);f.context.round=4;const next=controlRetryResultPlan(f.preview(),Array(f.preview().pool.dice).fill(6),{operationId:"intent2"});f.accept(next);f.context.round=3;assert.throws(()=>f.preview(),/registrada/);f.context.round=5;assert.equal(f.preview().before.record.retries.length,2);
});
test("origem oculta/removida e natureza legada não exigem lookup ou aquisição",()=>{
 const f=fixture();globalThis.fromUuid=()=>{throw Error("private source lookup");};assert.equal(f.preview().defaultAttribute,"sen");delete f.record.controlOrigin.nature;assert.equal(f.preview().defaultAttribute,"");for(const attribute of ["vig","vel","sen","cos"])assert.equal(f.preview({attribute}).options.attribute,attribute);assert.equal(Object.hasOwn(f.preview(),"name"),false);assert.equal(Object.hasOwn(f.preview().before.record,"description"),false);
});
test("vinculado e sintético usam identidade própria; cópia estrangeira não opera",()=>{
 for(const synthetic of [false,true]){const f=fixture({synthetic});assert.equal(f.plan().before.record.actorUuid,f.actor.uuid);f.actor.uuid="Actor.copy";assert.throws(()=>f.preview(),/desta ficha/);}
});
test("recursos/registro/atributos inválidos recusam sem reduzir silenciosamente",()=>{
 for(const change of [f=>f.actor.system.resources.cosmo.value=-1,f=>f.actor.system.resources.cosmoExtra=1.5,f=>f.actor.system.resources.cosmoReserved=NaN,f=>f.actor.system.resources.cosmo.unlimited="true",f=>f.record.damage=1,f=>f.record.status="ended",f=>f.record.controlOrigin.classification="divine",f=>f.record.controlOrigin.powerCosmic=Infinity,f=>f.record.firstRound=0,f=>f.record.lastRound=1002,f=>f.record.time=-1,f=>f.record.controlOrigin=null]){const f=fixture();change(f);assert.throws(()=>f.preview());}
 for(const o of [{attribute:""},{attribute:"for"},{bonus:NaN},{bonus:10001},{advantage:2},{useExtra:"true"},{onSuccess:"undo"},{resistanceMode:"unknown"},{reason:123},{reason:"x".repeat(2001)}])assert.throws(()=>fixture().preview(o));
});
test("rodadas manuais e tentativas legadas são preservadas, inclusive notas tardias",()=>{
 const f=fixture();f.record.ticks={round2:{round:2,status:"applied",damage:0,before:90,after:90,reason:"Conferido"}};const p=f.plan({onSuccess:"keep"});f.accept(p);const s=controlRetrySnapshot(f.actor,"controlA");f.record.ticks.round2.reason="Editada";f.record.controlRetries.intent1.reason="Outra nota";assert.deepEqual(controlRetrySnapshot(f.actor,"controlA"),s);f.context.round=4;assert.equal(f.plan().before.record.ticks.length,1);f.record.ticks.round2.damage=5;assert.throws(()=>f.preview(),/histórica/);
});
test("dados salvos precisam corresponder à parada, sem aceitar total fabricado",()=>{
 const f=fixture(),preview=f.preview();assert.throws(()=>controlRetryResultPlan(preview,[],{operationId:"intent1"}));assert.throws(()=>controlRetryResultPlan(preview,Array(preview.pool.dice).fill(11),{operationId:"intent1"}));assert.throws(()=>f.plan({},[1]),/parada/);const p=f.plan();p.result.total++;assert.throws(()=>validateControlRetryPlan(p),/incompatível/);
});
test("validador reconstrói débito/status/tentativa e rejeita snapshot adulterado",()=>{
 for(const change of [p=>p.after.resources.current--,p=>p.after.resources.reserved--,p=>p.after.resources.overload++,p=>p.payment.cost++,p=>p.payment.updates={evil:true},p=>p.attempt.success=!p.attempt.success,p=>p.after.record.lastRound++,p=>p.before.record.actorUuid="Actor.copy",p=>p.operationId="another",p=>p.result.modifier++,p=>p.reason="Outra"]){const p=fixture().plan();change(p);assert.throws(()=>validateControlRetryPlan(p));}
 const p=fixture().plan();p.patches={"system.resources.health.value":0};assert.equal(validateControlRetryPlan(p).patches,undefined);assert.equal(Object.hasOwn(validateControlRetryPlan(p).after.resources,"health"),false);
});
test("identidades e opções rejeitam comando/objeto em lugar de valores",()=>{
 for(const v of [null,"",123,"x.y","__proto__","x".repeat(33)])assert.throws(()=>controlRetryKey(v));const f=fixture();assert.throws(()=>f.preview({reason:()=>0}));assert.throws(()=>controlRetryOptions({}));const s=f.plan();s.before.record.retries.push(copy(s.attempt));assert.throws(()=>validateControlRetryPlan(s));assert.equal(controlRetryState(f.actor,"controlA",f.options,f.context),f.preview().signature);
});
