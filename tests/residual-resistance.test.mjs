import test from "node:test";
import assert from "node:assert/strict";
import {knight,content} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {depositResidual} from "../module/residual.mjs";
import {residualResistanceView,residualResistancePlan,resistResidual,recoverResidualResistance,canResistResidual} from "../module/residual-resistance.mjs";
import {effectSheetContext,effectOperationContext,recoverEffect} from "../module/effects.mjs";
import {assertNoTechniqueInterruption} from "../module/master-queue.mjs";
import {holdDecisionOutsideQueue} from "./held-dialog.mjs";
const ID="gods-battle-ss",clone=structuredClone;
function patch(obj,data){for(const [key,value]of Object.entries(data)){const parts=key.split(".");let o=obj;for(const p of parts.slice(0,-1))o=o[p]??={};const last=parts.at(-1);if(last.startsWith("-="))delete o[last.slice(2)];else o[last]=clone(last==="rolls"?value.map(r=>r.toJSON?r.toJSON():r):value);}}
function fixture(){
 const gm={id:"gm",isGM:true,active:true},player={id:"p",isGM:false},messages=new Map(),answers=[],stats={rolls:0,records:0,published:0},controls={faces:[8,6,4],roll:null,render:null,write:null,message:null,create:null,read:null},renders=[];
 const system=()=>{const s=knight();s.profile.level=5;for(const key of Object.keys(s.attributes))s.attributes[key].value=2;s.skills.asterism.value=3;s.skills.combat.value=1;prepareKnight(s);s.resources.health.value=90;s.resources.cosmo.value=7;s.resources.cosmoExtra=3;s.resources.cosmoReserved=2;s.conditions.afraid=true;return s;};
 const actor={uuid:"Actor.payer",id:"payer",name:"Usuário",type:"knight",isOwner:true,system:system(),flags:{[ID]:{unrelated:"conservar"}},async update(data){await controls.write?.(data,"before");patch(this,data);if(Object.keys(data).some(k=>k.startsWith(`flags.${ID}.persistentEffects.`)))stats.records++;await controls.write?.(data,"after");return this;}};
 const item={uuid:"Actor.payer.Item.tech",id:"tech",name:"Ataúde de exercício",type:"technique",parent:actor,isOwner:true,system:{...content(),effectKind:"residual",nature:"physical",classification:"gold"},flags:{}};actor.items={contents:[item],get:id=>actor.items.contents.find(i=>i.id===id)};
 const initial={id:"initial",actorUuid:"Actor.target",kind:"manual",damage:0,label:"Prisão de exercício",firstRound:2,lastRound:5,status:"active",rounds:4,ticks:{},combatUuid:"Combat.test",combatantId:"target",time:1};
 const target={uuid:"Actor.target",id:"target",name:"Alvo",type:"knight",isOwner:true,system:system(),items:{contents:[]},flags:{[ID]:{persistentEffects:{initial},unrelated:"target"}}};
 const combat={uuid:"Combat.test",started:true,round:3,combatants:{contents:[{id:"payer",actor},{id:"target",actor:target}]}};
 globalThis.game={user:gm,users:{activeGM:gm},combat,combats:{contents:[combat]},messages:{get:id=>messages.get(id)},settings:{get:()=>"rank"}};globalThis.fromUuid=async uuid=>{await controls.read?.(uuid);return uuid===actor.uuid?actor:uuid===target.uuid?target:uuid===item.uuid?item:null;};
 let n=0;foundry.utils={randomID:()=>`res${++n}`};foundry.applications.api.DialogV2={wait:async()=>{const a=answers.shift();return typeof a==="function"?a():a??null;}};foundry.applications.handlebars={renderTemplate:async(path,context)=>{renders.push({path,context});await controls.render?.(path,context);return "<p>Residual</p>";}};foundry.dice={terms:{OperatorTerm:class{constructor(data){Object.assign(this,data);}}}};
 globalThis.Roll=class{constructor(formula){this.formula=formula;}async evaluate(){if(this.formula.includes("d10")){stats.rolls++;await controls.roll?.(stats.rolls);this.dice=[{results:controls.faces.map(result=>({result}))}];this.terms=[{number:Math.max(...controls.faces)}];}else this.terms=[{number:Number(this.formula)}];return this;}static fromTerms(terms){const total=terms[0].number+(terms[1].operator==="+"?1:-1)*terms[2].number;return {total,toJSON:()=>({total,terms:clone(terms)})};}static fromData(data){return {...data,toJSON:()=>clone(data)};}};
 globalThis.ChatMessage={getSpeaker:({actor})=>({actor:actor.id,alias:actor.name}),applyRollMode:(data,mode)=>{assert.equal(mode,"publicroll");data.whisper=[];data.blind=false;},async create(data){await controls.create?.(data,"before");const m={...clone(data),id:`message${messages.size+1}`,author:gm,async update(change){await controls.message?.(this,change,"before");patch(this,change);if(change.rolls)stats.published++;await controls.message?.(this,change,"after");return this;}};messages.set(m.id,m);await controls.create?.(m,"after");return m;}};
 const answer={itemUuid:item.uuid,selection:`${target.uuid}|initial`,difficulty:13,powerCosmic:41,bonus:7,reason:""};
 return {actor,target,item,initial,combat,gm,player,answers,messages,controls,stats,renders,answer,record:()=>Object.values(actor.flags[ID].persistentEffects??{}).at(-1),operation:()=>Object.entries(actor.flags[ID].effectOperations??{}).at(-1),async deposit(change={}){answers.push({...answer,...change});return depositResidual(actor);},async recover(close=false){answers.push({reason:"",close});return recoverEffect(actor,this.operation()[0]);}};
}
function resistanceFixture(){
 const f=fixture();game.actors={contents:[f.actor,f.target]};
 f.actor.flags[ID].persistentEffects={residualA:{id:"residualA",kind:"residual",actorUuid:f.actor.uuid,status:"active",damage:0,label:"Ataúde de exercício",source:{actorUuid:f.actor.uuid,itemUuid:f.item.uuid,nature:"physical",classification:"gold",name:f.item.name},firstRound:3,combatUuid:f.combat.uuid,combatantId:"payer",time:1,residual:{success:true,value:50,total:22,difficulty:13,powerCosmic:41,excess:9,targetUuid:f.target.uuid,targetName:f.target.name,initialEffectId:"initial"}}};
 f.answer={profile:"day",day:100,attribute:"vig",bonus:0,advantage:0,cumulativeBonus:0,reason:""};
 f.resist=async(change={})=>{f.answers.push({...f.answer,...change});return resistResidual(f.actor,"residualA");};return f;
}
test("Residual usa resistência do alvo contraCD fixa e conserva recursos/condições/ativação",async()=>{
 const f=resistanceFixture(),before=clone(f.actor.system),other=clone(f.target.system),flags=clone(f.target.flags);const r=await f.resist();assert.equal(r.total,15);assert.equal(r.difficulty,50);assert.equal(r.resisted,false);assert.equal(r.cumulativeBonus,0);assert.deepEqual(f.actor.system,before);assert.deepEqual(f.target.system,other);assert.deepEqual(f.target.flags,flags);assert.equal(f.record().status,"active");assert.equal(f.record().residual.value,50);assert.equal(f.stats.rolls,1);assert.equal(f.stats.published,1);assert.equal(f.renders[0].context.day,1);assert.equal(f.renders[0].context.attributes.find(x=>x.selected).value,"vig");
});
test("perfil dias ancora primeiro teste, dias sem teste contam; repetição no mesmo dia conserva bônus",async()=>{
 const f=resistanceFixture();await f.resist();let r=await f.resist();assert.equal(r.attempt,2);assert.equal(r.cumulativeBonus,0);r=await f.resist({day:103});assert.equal(r.cumulativeBonus,3);assert.equal(r.total,18);assert.equal(f.record().residual.resistance.firstDay,100);assert.equal(f.record().residual.resistance.lastDay,103);assert.equal(f.record().residual.value,50);assert.equal(f.stats.rolls,3);assert.equal(f.stats.records,3);
});
test("perfil tentativas soma uma por tentativa anterior mesmo dia ou após lacuna",async()=>{
 const f=resistanceFixture();await f.resist({profile:"attempt"});let r=await f.resist({profile:"attempt"});assert.equal(r.cumulativeBonus,1);r=await f.resist({profile:"attempt",day:110});assert.equal(r.cumulativeBonus,2);assert.equal(r.total,17);assert.equal(f.record().residual.resistance.profile,"attempt");
});
test("perfil manual usa cumulativo declarado inclusive no primeiro teste sem inferir tempo",async()=>{
 const f=resistanceFixture();let r=await f.resist({profile:"manual",cumulativeBonus:12});assert.equal(r.cumulativeBonus,12);assert.equal(r.total,27);r=await f.resist({profile:"manual",day:111,cumulativeBonus:4});assert.equal(r.cumulativeBonus,4);assert.equal(r.total,19);assert.equal(f.record().residual.value,50);
});
test("perfil congela após primeiro resultado, dia retrocedido recusa e cancela sem novos dados",async()=>{
 const f=resistanceFixture();await f.resist();for(const change of [{profile:"attempt"},{profile:"manual"},{day:99}]){await assert.rejects(f.resist(change));}assert.equal(f.stats.rolls,1);assert.equal(f.record().residual.resistance.profile,"day");f.answers.length=0;await resistResidual(f.actor,"residualA");assert.equal(f.stats.rolls,1);
});
test("igualar50 encerra só o registro no usuário e não permite novas resistências",async()=>{
 const f=resistanceFixture(),target=clone(f.target.flags),s=clone(f.target.system),caster=clone(f.actor.system);const r=await f.resist({bonus:35});assert.equal(r.total,50);assert.equal(r.resisted,true);assert.equal(f.record().status,"ended");assert.equal(f.record().end.residualResistanceId,r.operationId);assert.deepEqual(f.target.flags,target);assert.deepEqual(f.target.system,s);assert.deepEqual(f.actor.system,caster);assert.equal(canResistResidual(f.actor,"residualA"),false);await assert.rejects(f.resist());assert.equal(f.stats.rolls,1);assert.equal(effectSheetContext(f.actor)[0].residualResistances.length,1);
});
test("fora de combate e sem fonte presente continua usando o valor congelado",async()=>{
 const f=resistanceFixture();game.combat=null;game.combats.contents=[];f.actor.items.contents=[];f.actor.system.combat.cosmicPower=999;await f.resist();assert.equal(f.record().residual.value,50);assert.equal(f.stats.rolls,1);assert.equal(f.record().status,"active");
});
test("modo de resistência, vantagem e condições do alvo aplicados uma vez",async()=>{
 const f=resistanceFixture();f.target.system.automation.conditionDicePenalty=1;f.target.system.automation.conditionModifier=-3;let p=residualResistancePlan(f.actor,"residualA",{...f.answer,bonus:2,advantage:1});assert.equal(p.pool.dice,2);assert.equal(p.pool.modifier,8);assert.equal(p.pool.base,7);game.settings.get=()=>"modifier";p=residualResistancePlan(f.actor,"residualA",{...f.answer,bonus:2,advantage:1});assert.equal(p.pool.modifier,10);assert.equal(p.pool.base,9);await f.resist({bonus:2,advantage:1});assert.equal(f.record().residual.resistance.attempts[f.operation()[0]].mode,"modifier");
});
test("campos numéricos, perfil/atributo/nota e modo inválidos não preparam nem rolam",async()=>{
 for(const change of [{day:NaN},{day:-1},{day:1.5},{day:1000001},{profile:"invalid"},{attribute:"for"},{bonus:NaN},{bonus:10001},{advantage:2},{cumulativeBonus:1.5},{cumulativeBonus:-1},{cumulativeBonus:1000001},{reason:1},{reason:"x".repeat(2001)}]){const f=resistanceFixture();await assert.rejects(f.resist(change));assert.equal(f.stats.rolls,0);assert.equal(f.operation(),undefined);}const f=resistanceFixture();game.settings.get=()=>"invalid";await assert.rejects(f.resist());assert.equal(f.stats.rolls,0);
});
test("mestre, UUID/copias, propriedade, alvo e operações interrompidas protegidos",async()=>{
 for(const mutate of [f=>game.user=f.player,f=>game.users.activeGM={id:"other",active:true},f=>f.actor.isOwner=false,f=>f.target.isOwner=false,f=>f.actor.uuid="Actor.copy",f=>f.target.uuid="Actor.copy",f=>f.record().residual.value=NaN,f=>f.record().source.actorUuid="Actor.other",f=>f.record().residual.success=false,f=>f.actor.flags[ID].levelOperation={status:"prepared"},f=>f.target.flags[ID].damageOperations={pending:{status:"repair"}},f=>f.target.flags[ID].actionOperations={pending:{status:"prepared"}}]){const f=resistanceFixture();mutate(f);assert.equal(canResistResidual(f.actor,"residualA"),false);await assert.rejects(f.resist());assert.equal(f.stats.rolls,0);}
});
test("históricos inconsistentes e limite de tentativas não são normalizados silenciosamente",async()=>{
 for(const mutate of [f=>f.record().residual.resistance.firstDay=99,f=>f.record().residual.resistance.lastDay=99,f=>f.record().residual.resistance.profile="other",f=>Object.values(f.record().residual.resistance.attempts)[0].attempt=2,f=>Object.values(f.record().residual.resistance.attempts)[0].resisted=true,f=>Object.values(f.record().residual.resistance.attempts)[0].cumulativeBonus=-1,f=>Object.values(f.record().residual.resistance.attempts)[0].cumulativeBonus=1,f=>Object.values(f.record().residual.resistance.attempts)[0].difficulty=51,f=>Object.values(f.record().residual.resistance.attempts)[0].total=50]){const f=resistanceFixture();await f.resist();mutate(f);assert.throws(()=>residualResistanceView(f.actor,"residualA"));}
 const f=resistanceFixture();f.record().residual.resistance={profile:"day",firstDay:1,lastDay:1,attempts:Object.fromEntries(Array.from({length:1000},(_,i)=>["test"+i,{attempt:i+1,profile:"day",day:1,resisted:false,total:0,cumulativeBonus:0,difficulty:50}]))};assert.throws(()=>residualResistanceView(f.actor,"residualA"),/1000/);
});
test("rodadas e relógio não avançam dias nem limitam repetição após falha",async()=>{
 const f=resistanceFixture();await f.resist();f.combat.round=1000;let r=await f.resist();assert.equal(r.day,100);assert.equal(r.cumulativeBonus,0);f.combat.round=1;r=await f.resist({day:102});assert.equal(r.cumulativeBonus,2);assert.equal(f.stats.rolls,3);
});
test("duplo clique com a mesma prévia resulta em uma rolagem/registro/publicação",async()=>{
 const f=resistanceFixture(),r=await Promise.allSettled([f.resist(),f.resist()]);assert.equal(r.filter(x=>x.status==="fulfilled").length,1);assert.equal(f.stats.rolls,1);assert.equal(f.stats.records,1);assert.equal(f.stats.published,1);
});
test("diálogo e recuperação não ocupam a fila enquanto aguardam escolha",async()=>{
 const f=resistanceFixture();await holdDecisionOutsideQueue(()=>resistResidual(f.actor,"residualA"));f.controls.roll=async()=>{throw Error("Falha");};await assert.rejects(f.resist());await holdDecisionOutsideQueue(()=>recoverResidualResistance(f.actor,f.operation()[0]));assert.equal(f.operation()[1].status,"prepared");
});
test("render, diálogo, rolagem e última leitura protegem alterações de estado",async()=>{
 for(const point of ["render","dialog","roll","lastRead"]){for(const mutate of [f=>f.actor.system.resources.health.value=5,f=>f.record().residual.value=99,f=>f.target.system.resources.cosmo.value=2,f=>f.target.isOwner=false,f=>game.user=f.player,f=>f.combat.round++]){const f=resistanceFixture();if(point==="render")f.controls.render=async()=>mutate(f);if(point==="dialog")f.answers.push(()=>{mutate(f);return f.answer;});if(point==="roll")f.controls.roll=async()=>mutate(f);if(point==="lastRead")f.controls.read=async uuid=>{if(f.stats.rolls&&uuid===f.target.uuid)mutate(f);};await assert.rejects(point==="dialog"?resistResidual(f.actor,"residualA"):f.resist());assert.equal(f.stats.records,0);assert.equal(f.stats.published,0);}}
});
test("interrupção incompleta bloqueia outras ações e recupera sem refazer teste",async()=>{
 for(const point of ["roll","create"]){const f=resistanceFixture();f.controls[point]=async()=>{throw Error("Falha");};await assert.rejects(f.resist());assert.equal(effectOperationContext(f.actor).length,1);assert.throws(()=>assertNoTechniqueInterruption(f.actor),/interrompida/);const count=f.stats.rolls;f.controls[point]=null;await f.recover();assert.equal(f.operation()[1].status,"failed");assert.equal(f.stats.rolls,count);assert.equal(f.record().residual.resistance,undefined);assert.equal(f.stats.records,0);}
});
test("resultado completo anterior recupera mesmo resultado/cartão e contador uma vez",async()=>{
 const f=resistanceFixture();f.controls.write=async(data,p)=>{if(p==="before"&&Object.keys(data).some(k=>k.startsWith(`flags.${ID}.persistentEffects.`)))throw Error("Falha aplicar");};await assert.rejects(f.resist());assert.ok(f.operation()[1].after);f.controls.write=null;await f.recover();assert.equal(f.stats.rolls,1);assert.equal(f.stats.records,1);assert.equal(f.stats.published,1);assert.equal(Object.keys(f.record().residual.resistance.attempts).length,1);assert.equal(f.record().residual.resistance.lastDay,100);
});
test("recuperação anterior divergente preserva ajustes e encerra somente pendência",async()=>{
 for(const mutate of [f=>f.actor.system.resources.cosmo.value=4,f=>f.target.system.resources.health.value=1,f=>f.record().residual.value=60,f=>f.combat.round++]){const f=resistanceFixture();f.controls.write=async(data,p)=>{if(p==="before"&&Object.keys(data).some(k=>k.startsWith(`flags.${ID}.persistentEffects.`)))throw Error("Falha");};await assert.rejects(f.resist());f.controls.write=null;mutate(f);await assert.rejects(f.recover());await f.recover(true);assert.equal(f.operation()[1].status,"reviewed");assert.equal(f.stats.rolls,1);assert.equal(f.stats.records,0);}
});
test("aplicado com publicação/resposta perdida recupera sem mudar ajustes posteriores",async()=>{
 for(const phase of ["before","after"]){const f=resistanceFixture();f.controls.message=async(_m,data,p)=>{if(data.rolls&&p===phase)throw Error("Falha publicação");};await assert.rejects(f.resist());assert.equal(f.operation()[1].status,"applied");f.controls.message=null;f.target.system.resources.health.value=2;f.actor.system.resources.cosmo.value=4;f.combat.round++;await f.recover();assert.equal(f.stats.rolls,1);assert.equal(f.stats.published,1);assert.equal(f.actor.system.resources.cosmo.value,4);assert.equal(f.target.system.resources.health.value,2);assert.equal(effectOperationContext(f.actor).length,0);}
 const f=resistanceFixture();f.controls.write=async(data,p)=>{if(p==="after"&&Object.keys(data).some(k=>k.startsWith(`flags.${ID}.persistentEffects.`)))throw Error("Resposta perdida");};await assert.rejects(f.resist({bonus:35}));f.controls.write=null;await f.recover();assert.equal(f.record().status,"ended");assert.equal(f.stats.rolls,1);assert.equal(f.stats.records,1);assert.equal(f.stats.published,1);
});
test("cartão removido/editado/autoria inválida/cópia impedem publicação e repetição",async()=>{
 for(const kind of ["edited","removed","author","copy"]){const f=resistanceFixture();f.controls.message=async()=>{throw Error("Falha");};await assert.rejects(f.resist());f.controls.message=null;const m=f.messages.get(f.operation()[1].messageId);if(kind==="edited")m.flags[ID].residualResistancePrepared.card.content="Changed";if(kind==="removed")f.messages.delete(m.id);if(kind==="author")m.author={id:"other"};if(kind==="copy")f.actor.uuid="Actor.copy";await assert.rejects(f.recover());await f.recover(true);assert.equal(f.operation()[1].status,"reviewed");assert.equal(f.stats.rolls,1);assert.equal(f.actor.system.resources.cosmo.value,7);}
});
test("resultado preparado alterado antes da aplicação não grava nem publica",async()=>{
 for(const kind of ["edited","removed","author"]){const f=resistanceFixture();f.controls.create=async(m,p)=>{if(p==="after"){if(kind==="edited")m.flags[ID].residualResistancePrepared.card.content="Changed";if(kind==="removed")f.messages.delete(m.id);if(kind==="author")m.author={id:"other"};}};await assert.rejects(f.resist());assert.equal(f.stats.records,0);assert.equal(f.stats.published,0);}
});
test("resultado explicitamente público fala pelo alvo e não gera flags/botões de dano",async()=>{
 const f=resistanceFixture();game.settings.get=(_scope,key)=>key==="resistanceMode"?"rank":"blindroll";await f.resist();const m=[...f.messages.values()][0];assert.deepEqual(m.whisper,[]);assert.equal(m.blind,false);assert.equal(m.rolls.length,1);assert.equal(m.speaker.actor,f.target.id);assert.equal(m.flags[ID].residualResistancePrepared,undefined);assert.equal(m.flags[ID].residualResistanceResolution.actorUuid,f.actor.uuid);assert.equal(m.flags[ID].attack,undefined);assert.equal(m.flags[ID].resolvedDamage,undefined);assert.equal(effectSheetContext(f.actor)[0].canResistResidual,true);
});
test("recuperação cancelada ou desatualizada conserva pendência",async()=>{
 const f=resistanceFixture();f.controls.roll=async()=>{throw Error("Falha");};await assert.rejects(f.resist());f.controls.roll=null;await recoverResidualResistance(f.actor,f.operation()[0]);assert.equal(f.operation()[1].status,"prepared");await assert.rejects(holdDecisionOutsideQueue(()=>recoverResidualResistance(f.actor,f.operation()[0]),{answer:{reason:"",close:true},during:()=>{f.actor.system.resources.cosmo.value=5;}}),/mudou/);assert.equal(f.operation()[1].status,"prepared");assert.equal(f.stats.rolls,1);
});
test("depósito aplicado não publicado impede resistência até recuperar cartão inicial",async()=>{
 const f=resistanceFixture();f.actor.flags[ID].effectOperations={initialPending:{kind:"residualDeposit",status:"applied",actorUuid:f.actor.uuid,effectId:"residualA",published:false}};assert.equal(canResistResidual(f.actor,"residualA"),false);await assert.rejects(f.resist(),/publicação/);assert.equal(f.stats.rolls,0);
});
