import test from "node:test";
import assert from "node:assert/strict";
import {knight,content} from "./foundry-stub.mjs";
import {sustainedDefinition,sustainedPaymentPlan as publishedPlan} from "../module/sustained-rules.mjs";
import {sustainPaymentKey,sustainPaymentRecordMath,sustainPaymentSnapshot,sustainPaymentState,sustainEndState,sustainPaymentContext,sustainPaymentPreview,sustainPaymentPlan,sustainEndPlan,validateSustainPaymentPlan} from "../module/sustained-payment-rules.mjs";
const ID="gods-battle-ss",copy=structuredClone;
function fixture({tier="bronze",mode="round",synthetic=false,self=false}={}){
 const actor={uuid:synthetic?"Scene.arena.Token.payer.Actor.payer":"Actor.payer",type:"knight",isOwner:true,name:"Pagador",system:knight(),flags:{[ID]:{persistentEffects:{}}}};
 actor.system.resources.cosmo.value=8;actor.system.resources.cosmoExtra=3;actor.system.resources.cosmoReserved=2;actor.system.resources.cosmoOverload=6;actor.system.resources.health.value=90;
 const target=self?actor:{uuid:"Actor.hidden",type:"knight",isOwner:true,system:knight(),name:"Fonte privada"};
 const item={type:"technique",id:"tech",uuid:`${actor.uuid}.Item.tech`,parent:actor,name:"Sustentada de exerc\u00edcio",system:{...content(),effectKind:"sustained",classification:tier},flags:{}};
 const combat={uuid:"Combat.arena",started:true,round:2,combatants:{contents:[{id:"payerMember",actor},...(!self?[{id:"targetMember",actor:target}]:[])]}};
 globalThis.game={combat,combats:{contents:[combat]}};
 const r={...sustainedDefinition(actor,item,target,{maintenanceMode:mode,firstRound:2,rounds:null,reason:""}),id:"sustain1",actorUuid:actor.uuid,status:"active",ticks:{},userId:"gm",time:123};
 actor.flags[ID].persistentEffects.sustain1=r;combat.round=r.lastRound+1;
 const context={combatUuid:combat.uuid,combatantId:"payerMember",targetUuid:target.uuid,targetCombatantId:self?"payerMember":"targetMember",round:combat.round,epoch:`epoch${combat.round}`};
 const options={useExtra:false,reason:""};
 return {actor,target,item,combat,record:r,context,options,preview(o={}){return sustainPaymentPreview(actor,"sustain1",{...options,...o},context);},plan(o={},operationId="intent1"){return sustainPaymentPlan(actor,"sustain1",{...options,...o},context,{operationId});},accept(p){const a=p.after;actor.system.resources.cosmo.value=a.resources.current;actor.system.resources.cosmoExtra=a.resources.extra;r.sustain.paidUntilRound=a.record.paidUntilRound;r.sustain.payments[p.operationId]=copy(p.entry);r.sustain.lastOperation=copy(a.record.lastOperation);}};
}
test("recarga preserva custo1 em Bronze/Prata/Ouro e perfis publicados sem mutar fichas",()=>{
 for(const tier of ["bronze","silver","gold"])for(const mode of ["round","once"]){const f=fixture({tier,mode}),before=copy(f.actor),target=copy(f.target),p=f.plan(),old=publishedPlan(f.actor,"sustain1",f.options);assert.equal(p.payment.cost,1);assert.deepEqual(p.payment,{version:1,...Object.fromEntries(["cost","fromExtra","fromCurrent","overload","lifeDamage","unlimited"].map(k=>[k,old.payment[k]]))});assert.equal(p.entry.round,old.round);assert.deepEqual(p.entry.gap,old.gap);assert.equal(p.after.record.mode,mode);assert.deepEqual(validateSustainPaymentPlan(p),p);assert.deepEqual(f.actor,before);assert.deepEqual(f.target,target);}
});
test("fase inicial e rodada coberta n\u00e3o cobram, retrocesso n\u00e3o reutiliza inten\u00e7\u00e3o",()=>{
 const f=fixture();f.context.round=f.record.lastRound;assert.throws(()=>f.plan(),/coberta/);f.context.round++;const p=f.plan();f.accept(p);assert.throws(()=>f.plan({},"intent2"),/coberta/);f.context.round--;assert.throws(()=>f.preview(),/coberta/);f.context.round=p.context.round+1;assert.throws(()=>f.plan(),/registrada/);assert.equal(f.plan({},"intent2").entry.round,p.context.round+1);
});
test("perfil \u00fanico aceita uma recarga e conserva pagamentos com avan\u00e7o",()=>{
 const f=fixture({mode:"once"}),p=f.plan();f.accept(p);f.context.round+=20;assert.throws(()=>f.plan({},"intent2"),/coberta/);assert.equal(sustainPaymentRecordMath(f.actor,"sustain1").payments.length,1);assert.equal(f.actor.system.resources.cosmo.value,7);
});
test("lacuna paga somente rodada atual, registra intervalo sem saldo retroativo",()=>{
 const f=fixture();f.context.round+=4;const p=f.plan();assert.equal(p.payment.cost,1);assert.deepEqual(p.gap,{first:4,last:7});assert.equal(p.entry.round,8);f.accept(p);f.context.round=10;const next=f.plan({},"intent2");assert.deepEqual(next.gap,{first:9,last:9});assert.equal(next.after.resources.current,6);assert.equal(next.after.record.lastRound,3);
});
test("extra expl\u00edcita preserva CE reservada e recusa pagamento sem livre",()=>{
 const f=fixture();f.actor.system.resources.cosmo.value=2;assert.throws(()=>f.plan(),/insuficiente/);const p=f.plan({useExtra:true});assert.equal(p.payment.fromExtra,1);assert.equal(p.after.resources.current,2);assert.equal(p.after.resources.extra,2);assert.equal(p.after.resources.reserved,2);f.actor.system.resources.cosmo.value=1;assert.equal(f.plan({useExtra:true}).after.resources.current,1);f.actor.system.resources.cosmoExtra=0;assert.throws(()=>f.plan({useExtra:true}),/insuficiente/);
});
test("ilimitada registra custo sem alterar recursos e sem autorizar segunda parcela",()=>{
 const f=fixture();f.actor.system.resources.cosmo.unlimited=true;f.actor.system.resources.cosmo.value=0;f.actor.system.resources.cosmoExtra=0;const p=f.plan();assert.equal(p.payment.unlimited,true);assert.deepEqual(p.after.resources,p.before.resources);f.accept(p);assert.throws(()=>f.plan({},"intent2"),/coberta/);assert.equal(p.entry.cost,1);
});
test("snapshot n\u00e3o inclui PV, excesso, a\u00e7\u00f5es, m\u00e1ximos ou recursos advers\u00e1rios",()=>{
 const f=fixture(),before=sustainPaymentState(f.actor,"sustain1"),signature=f.preview().signature;
 Object.defineProperty(f.target,"system",{get(){throw Error("alvo oculto lido");}});Object.defineProperty(f.target,"flags",{get(){throw Error("flags ocultas lidas");}});Object.defineProperty(f.target,"name",{get(){throw Error("nome privado lido");}});
 f.actor.system.resources.health.value=17;f.actor.system.resources.cosmoOverload=99;f.actor.system.resources.cosmo.max=1000;f.actor.system.combat.asterismPenalty=99;f.actor.system.conditions.afraid=true;
 assert.equal(sustainPaymentState(f.actor,"sustain1"),before);assert.equal(f.preview().signature,signature);const p=f.plan();assert.deepEqual(Object.keys(p.after.resources).sort(),["current","extra","reserved","unlimited"]);assert.equal(p.payment.lifeDamage,0);assert.equal(p.payment.overload,0);
});
test("nomes/notas/descri\u00e7\u00f5es e oposi\u00e7\u00e3o sem mudar status n\u00e3o criam conflito",()=>{
 const f=fixture(),signature=f.preview().signature;f.record.label="Outro nome";f.record.reason="Notas tardias";f.record.description="Anota\u00e7\u00e3o";f.record.source.name="Renomeada";f.record.sustain.targetName="Nome oculto";f.record.sustain.oppositions={manual:{winner:"payer",reason:"Sem automa\u00e7\u00e3o"}};f.options.reason="Opcional";
 assert.equal(f.preview().signature,signature);assert.equal(JSON.stringify(f.plan()).includes("Nome oculto"),false);assert.equal(JSON.stringify(f.plan()).includes("Renomeada"),false);assert.equal(f.plan().options.reason,"Opcional");
});
test("identidades, perfil, tempo, CE e prazo alterados exigem nova pr\u00e9via",()=>{
 for(const mutate of [f=>f.actor.system.resources.cosmo.value--,f=>f.actor.system.resources.cosmoExtra--,f=>f.actor.system.resources.cosmoReserved++,f=>f.actor.system.resources.cosmo.unlimited=true,f=>f.record.source.classification="silver",f=>f.record.source.itemUuid=`${f.actor.uuid}.Item.other`,f=>f.record.time++,f=>f.record.userId="other",f=>f.record.firstRound--,f=>f.record.sustain.mode="once"]){const f=fixture(),s=f.preview().signature;mutate(f);if(f.record.firstRound===1)f.record.rounds++;assert.notEqual(f.preview().signature,s);}
});
test("encontro/pagador/alvo/combatentes/epoch prendem a inten\u00e7\u00e3o sem dados privados",()=>{
 const f=fixture(),signature=f.preview().signature;f.context.epoch="newEpoch";assert.notEqual(f.preview().signature,signature);f.context.targetResources={secret:99};assert.equal(Object.hasOwn(f.preview().context,"targetResources"),false);
 for(const field of ["combatUuid","combatantId","targetUuid","targetCombatantId"]){const g=fixture();g.context[field]="replaced";assert.throws(()=>g.preview(),/participante/);}
 for(const round of [0,1.5,NaN,Infinity]){const g=fixture();g.context.round=round;assert.throws(()=>g.preview());}
});
test("fichas vinculadas/sint\u00e9ticas e autossustenta\u00e7\u00e3o mant\u00eam identidade",()=>{
 for(const synthetic of [false,true])for(const self of [false,true]){const f=fixture({synthetic,self}),p=f.plan();assert.equal(p.before.record.actorUuid,f.actor.uuid);assert.equal(p.context.targetUuid,f.target.uuid);assert.deepEqual(validateSustainPaymentPlan(p),p);f.actor.uuid="Actor.copy";assert.throws(()=>f.plan(),/outra ficha/);}
});
test("Item editado/removido depois do registro n\u00e3o recalcula fonte congelada",()=>{
 const f=fixture(),p=f.plan();f.item.system.effectKind="damage";f.item.system.classification="divine";f.actor.items={contents:[]};globalThis.fromUuid=()=>{throw Error("fonte n\u00e3o deve ser consultada");};assert.deepEqual(f.plan(),p);assert.equal(p.after.record.source.classification,"bronze");
});
test("hist\u00f3rico publicado aceita notas tardias sem devolver record como comando",()=>{
 const f=fixture(),p=f.plan();f.accept(p);const baseline=sustainPaymentState(f.actor,"sustain1");Object.assign(f.record.sustain.payments.intent1,{reason:"tardia",userId:"gm",time:1000,description:"livre"});assert.equal(sustainPaymentState(f.actor,"sustain1"),baseline);f.context.round++;assert.deepEqual(validateSustainPaymentPlan(f.plan({},"intent2")),f.plan({},"intent2"));
});
test("hist\u00f3ricos adulterados recusam custo/aloca\u00e7\u00e3o/gap/modo/rodada",()=>{
 for(const mutate of [f=>f.record.sustain.payments.intent1.cost=2,f=>f.record.sustain.payments.intent1.fromCurrent=0,f=>f.record.sustain.payments.intent1.fromExtra=-1,f=>f.record.sustain.payments.intent1.mode="once",f=>f.record.sustain.payments.intent1.round=2,f=>f.record.sustain.payments.intent1.operationId="other",f=>f.record.sustain.payments.intent1.gap={first:3,last:3},f=>f.record.sustain.paidUntilRound++,f=>f.record.sustain.payments.duplicate=copy(f.record.sustain.payments.intent1)]){const f=fixture();f.accept(f.plan());mutate(f);assert.throws(()=>sustainPaymentRecordMath(f.actor,"sustain1"));}
});
test("plano validado reconstitui matem\u00e1tica e recusa snapshots/comandos adulterados",()=>{
 const f=fixture(),plan=f.plan();for(const mutate of [p=>p.after.resources.current=8,p=>p.payment.cost=0,p=>p.entry.fromCurrent=0,p=>p.after.record.mode="once",p=>p.operationId="other",p=>p.before.record.source.actorUuid="Actor.foreign",p=>p.after.record.targetUuid="Actor.foreign",p=>p.context.targetCombatantId="other",p=>p.signature="forged",p=>p.options.useExtra=true]){const p=copy(plan);mutate(p);assert.throws(()=>validateSustainPaymentPlan(p));}
 const forged={...copy(plan),patch:{"system.resources.cosmo.value":999},requester:{isGM:true},intentGuard:"execute"},clean=validateSustainPaymentPlan(forged);assert.deepEqual(clean,plan);assert.equal(Object.hasOwn(clean,"patch"),false);
});
test("encerrar n\u00e3o debita/refunda e sobrevive a recursos/encontro/fonte ausentes",()=>{
 const f=fixture(),p=f.plan();f.accept(p);const before=copy(f.actor.system.resources),state=sustainEndState(f.actor,"sustain1");f.actor.system.resources=null;globalThis.game={};globalThis.fromUuid=()=>{throw Error("nenhuma busca no encerramento");};assert.equal(sustainEndState(f.actor,"sustain1"),state);const end=sustainEndPlan(f.actor,"sustain1",{operationId:"end1",reason:"Opcional"});assert.equal(end.after.record.status,"ended");assert.deepEqual(end.after.record.payments,end.before.record.payments);assert.equal(Object.hasOwn(end,"payment"),false);assert.equal(Object.hasOwn(end.before,"resources"),false);assert.deepEqual(validateSustainPaymentPlan(end),end);assert.equal(before.cosmo.value,7);assert.equal(f.record.status,"active");assert.throws(()=>sustainEndPlan(f.actor,"sustain1",{operationId:"intent1"}),/registrada/);
});
test("encerramento j\u00e1 resolvido/registro estrangeiro e plano de fim adulterado recusados",()=>{
 const f=fixture(),p=sustainEndPlan(f.actor,"sustain1",{operationId:"end1"});const tampered=copy(p);tampered.after.record.payments.push({operationId:"fake"});assert.throws(()=>validateSustainPaymentPlan(tampered));f.record.status="ended";assert.throws(()=>sustainEndPlan(f.actor,"sustain1",{operationId:"end2"}),/encerrada/);assert.throws(()=>f.plan(),/encerrada/);f.record.actorUuid="Actor.other";assert.throws(()=>sustainEndState(f.actor,"sustain1"),/outra ficha/);
});
test("valores inv\u00e1lidos n\u00e3o recebem clamp, custo livre ou aloca\u00e7\u00e3o impl\u00edcita",()=>{
 for(const mutate of [f=>f.actor.system.resources.cosmo.value=-1,f=>f.actor.system.resources.cosmoExtra=NaN,f=>f.actor.system.resources.cosmoReserved=1.5,f=>f.actor.system.resources.cosmo.unlimited="yes",f=>f.record.firstRound=0,f=>f.record.rounds=999,f=>f.record.sustain.cost=2,f=>f.record.source.classification="divine",f=>f.record.sustain.mode="automatic",f=>f.record.sustain.lastOperation={id:"fake",action:"pay"}]){const f=fixture();mutate(f);assert.throws(()=>f.plan());}
 const f=fixture();assert.throws(()=>sustainPaymentPreview(f.actor,"sustain1",{},f.context));for(const key of ["bad.key","__proto__","",null,1])assert.throws(()=>sustainPaymentKey(key));assert.throws(()=>f.plan({reason:"x".repeat(2001)}));
});
