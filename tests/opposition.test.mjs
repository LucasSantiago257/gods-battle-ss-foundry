import test from "node:test";
import assert from "node:assert/strict";
import {knight} from "./foundry-stub.mjs";
import {prepareKnight,resolvePool} from "../module/rules.mjs";
import {oppositionPool,oppositionOutcome,oppositionPlan,oppositionView,opposeSustained,canOpposeSustained,recoverOpposition} from "../module/sustained-opposition.mjs";
import {effectSheetContext,effectOperationContext,recoverEffect} from "../module/effects.mjs";
import {assertNoTechniqueInterruption} from "../module/master-queue.mjs";
import {paySustained} from "../module/sustained.mjs";
import {holdDecisionOutsideQueue} from "./held-dialog.mjs";
const ID="gods-battle-ss",clone=structuredClone;
function patch(obj,data){for(const [key,value]of Object.entries(data)){const parts=key.split(".");let o=obj;for(const p of parts.slice(0,-1))o=o[p]??={};const last=parts.at(-1);if(last.startsWith("-="))delete o[last.slice(2)];else o[last]=clone(last==="rolls"?value.map(r=>r.toJSON?r.toJSON():r):value);}}
function fixture(){
 const gm={id:"gm",isGM:true,active:true},player={id:"p",isGM:false},messages=new Map(),answers=[],stats={rolls:0,records:0,published:0},controls={faces:[[8,6],[3,4]],roll:null,render:null,write:null,message:null,create:null,read:null},renders=[];
 const system=()=>{const s=knight();s.profile.level=5;for(const key of Object.keys(s.attributes))s.attributes[key].value=2;s.skills.cosmoUse.value=3;s.skills.combat.value=1;prepareKnight(s);s.resources.health.value=90;s.resources.cosmo.value=7;s.resources.cosmoExtra=3;s.resources.cosmoReserved=2;s.conditions.afraid=true;return s;};
 const record={id:"sustainA",actorUuid:"Actor.payer",kind:"sustained",damage:0,label:"Sustentada de exercício",firstRound:2,lastRound:3,status:"active",rounds:2,ticks:{},combatUuid:"Combat.test",combatantId:"payer",time:1,source:{actorUuid:"Actor.payer",itemUuid:"Actor.payer.Item.tech",name:"Técnica",classification:"bronze"},sustain:{cost:1,mode:"round",targetUuid:"Actor.target",targetName:"Alvo",targetCombatantId:"target",paidUntilRound:4,payments:{maintenance:{operationId:"maintenance",round:4,cost:1}}}};
 const actor={uuid:"Actor.payer",id:"payer",name:"Usuário",type:"knight",isOwner:true,system:system(),items:{contents:[]},flags:{[ID]:{persistentEffects:{sustainA:record},unrelated:"conservar"}},async update(data){await controls.write?.(data,"before");patch(this,data);if(Object.hasOwn(data,`flags.${ID}.persistentEffects.sustainA`))stats.records++;await controls.write?.(data,"after");return this;}};
 const target={uuid:"Actor.target",id:"target",name:"Alvo",type:"knight",isOwner:true,system:system(),items:{contents:[]},flags:{unrelated:"target"}};
 const combat={uuid:"Combat.test",started:true,round:4,combatants:{contents:[{id:"payer",actor},{id:"target",actor:target}]}};
 globalThis.game={user:gm,users:{activeGM:gm},combat,combats:{contents:[combat]},messages:{get:id=>messages.get(id)},settings:{get:()=>"rank"}};globalThis.fromUuid=async uuid=>{await controls.read?.(uuid);return uuid===actor.uuid?actor:uuid===target.uuid?target:null;};
 let n=0;foundry.utils={randomID:()=>`opp${++n}`};foundry.applications.api.DialogV2={wait:async()=>{const a=answers.shift();return typeof a==="function"?a():a??null;}};foundry.applications.handlebars={renderTemplate:async(path,context)=>{renders.push({path,context});await controls.render?.(path,context);return "<p>Oposição</p>";}};foundry.dice={terms:{OperatorTerm:class{constructor(data){Object.assign(this,data);}}}};
 globalThis.Roll=class{constructor(formula){this.formula=formula;}async evaluate(){if(this.formula.includes("d10")){stats.rolls++;await controls.roll?.(stats.rolls);const faces=controls.faces[(stats.rolls-1)%controls.faces.length];this.dice=[{results:faces.map(result=>({result}))}];this.terms=[{number:Math.max(...faces)}];}else this.terms=[{number:Number(this.formula)}];return this;}static fromTerms(terms){const total=terms[0].number+(terms[1].operator==="+"?1:-1)*terms[2].number;return {total,toJSON:()=>({total,terms:clone(terms)})};}static fromData(data){return {...data,toJSON:()=>clone(data)};}};
 globalThis.ChatMessage={getSpeaker:({actor})=>({actor:actor.id,alias:actor.name}),applyRollMode:(data,mode)=>{assert.equal(mode,"publicroll");data.whisper=[];data.blind=false;},async create(data){await controls.create?.(data,"before");const m={...clone(data),id:`message${messages.size+1}`,author:gm,async update(change){await controls.message?.(this,change,"before");patch(this,change);if(change.rolls)stats.published++;await controls.message?.(this,change,"after");return this;}};messages.set(m.id,m);await controls.create?.(m,"after");return m;}};
 const answer={profile:"attribute",attribute:"for",payerBonus:0,targetBonus:0,tie:"repeat",onLoss:"end",reason:""};
 return {actor,target,combat,gm,player,answers,messages,controls,stats,renders,answer,record:()=>actor.flags[ID].persistentEffects.sustainA,operation:()=>Object.entries(actor.flags[ID].effectOperations??{}).at(-1),async oppose(change={}){answers.push({...answer,...change});return opposeSustained(actor,"sustainA");},async recover(close=false){answers.push({reason:"",close});return recoverEffect(actor,this.operation()[0]);}};
}
test("oposição soma nível de cada participante e conserva CE, alvo e condições",async()=>{
 const f=fixture(),before=clone(f.actor.system),target=clone(f.target),r=await f.oppose();assert.equal(r.payerTotal,17);assert.equal(r.targetTotal,13);assert.equal(r.winner,"payer");assert.equal(r.end,false);assert.deepEqual(f.actor.system,before);assert.deepEqual(f.target,target);assert.equal(f.record().lastRound,3);assert.equal(f.record().sustain.paidUntilRound,4);assert.equal(f.stats.rolls,2);assert.equal(f.stats.published,1);assert.equal(f.record().status,"active");assert.equal(Object.keys(f.record().sustain.oppositions).length,1);assert.equal(f.actor.flags[ID].unrelated,"conservar");await assert.rejects(f.oppose(),/concluída/);assert.equal(f.stats.rolls,2);
});
test("Duelo de Cosmos ativo usa perícia mais nível; passivo usa7 mais perícia e nível",async()=>{
 const f=fixture(),p=oppositionPlan(f.actor,"sustainA",{...f.answer,profile:"cosmo"});assert.equal(p.payerPool.dice,3);assert.equal(p.payerPool.modifier,12);const r=await f.oppose({profile:"cosmo"});assert.equal(r.payerTotal,20);assert.equal(r.targetTotal,16);
 const g=fixture(),passive=oppositionPlan(g.actor,"sustainA",{...g.answer,profile:"passive",targetBonus:3});assert.equal(passive.targetPool.total,22);const s=await g.oppose({profile:"passive",targetBonus:3,onLoss:"keep"});assert.equal(s.targetTotal,22);assert.equal(s.winner,"target");assert.equal(g.stats.rolls,1);assert.equal([...g.messages.values()][0].rolls.length,1);
});
test("nível, ajustes e condições são atuais e incorporados uma vez",()=>{
 const f=fixture();f.actor.system.automation.conditionModifier=-2;f.actor.system.automation.conditionDicePenalty=1;const p=oppositionPool(f.actor.system,"attribute","for",3);assert.equal(p.dice,1);assert.equal(p.modifier,10);assert.equal(p.base,4);assert.equal(p.level,5);const s=oppositionPool(f.actor.system,"passive","for",3,{passive:true});assert.equal(s.total,20);assert.equal(s.dice,0);const rolled=resolvePool([10,1],p.modifier);assert.equal(rolled.total,20);
});
test("derrota pode encerrar só o registro ou conservá-lo sem alterar estados ou recarga",async()=>{
 for(const onLoss of ["end","keep"]){const f=fixture(),before=clone(f.actor.system);const r=await f.oppose({targetBonus:20,onLoss});assert.equal(r.winner,"target");assert.equal(r.end,onLoss==="end");assert.equal(f.record().status,onLoss==="end"?"ended":"active");assert.deepEqual(f.actor.system,before);assert.equal(Object.keys(f.record().sustain.payments).length,1);assert.equal(f.target.system.conditions.afraid,true);}
});
test("empate repete explicitamente, outros perfis encerram ou mantêm sem repetição",async()=>{
 for(const tie of ["repeat","keep","end"]){const f=fixture();f.controls.faces=[[7,6],[7,6]];const r=await f.oppose({tie});assert.equal(r.winner,"tie");assert.equal(r.repeat,tie==="repeat");assert.equal(r.end,tie==="end");if(tie==="repeat"){const s=await f.oppose({tie});assert.equal(s.attempt,2);assert.equal(f.stats.rolls,4);assert.equal(f.actor.system.resources.cosmo.value,7);}else await assert.rejects(f.oppose());}
});
test("oposição exige manutenção paga e retrocesso não repete resultado confirmado",async()=>{
 const f=fixture();f.combat.round=3;await assert.rejects(f.oppose(),/recarga/);f.combat.round=5;await assert.rejects(f.oppose(),/recarga/);f.combat.round=4;await f.oppose();f.combat.round=3;await assert.rejects(f.oppose());assert.equal(f.stats.rolls,2);
 const g=fixture();g.record().sustain.mode="once";g.combat.round=8;assert.equal(oppositionView(g.actor,"sustainA").round,8);await g.oppose();g.combat.round=7;await assert.rejects(g.oppose(),/posterior/);
});
test("recarga e oposição na rodada seguinte conservam custos separados",async()=>{
 const f=fixture();await f.oppose();f.combat.round=5;f.answers.push({useExtra:false,reason:""});await paySustained(f.actor,"sustainA");assert.equal(f.actor.system.resources.cosmo.value,6);await f.oppose();assert.equal(f.actor.system.resources.cosmo.value,6);assert.equal(Object.keys(f.record().sustain.oppositions).length,2);assert.equal(f.stats.rolls,4);
});
test("cancelamento, perfil/atributo/bônus inválidos e pré-requisito não rolam",async()=>{
 const f=fixture();await opposeSustained(f.actor,"sustainA");assert.equal(f.operation(),undefined);
 for(const change of [{profile:"invalid"},{attribute:"invalid"},{payerBonus:NaN},{targetBonus:10001},{tie:"invalid"},{onLoss:"invalid"},{reason:1},{reason:"x".repeat(2001)}]){const g=fixture();await assert.rejects(g.oppose(change));assert.equal(g.stats.rolls,0);assert.equal(g.operation(),undefined);}
 const g=fixture();g.actor.system.skills.combat.value=0;await assert.rejects(g.oppose({profile:"cosmo"}),/Combate1/);assert.equal(g.stats.rolls,0);await g.oppose();assert.equal(g.stats.rolls,2);
});
test("propriedade, mestre, encontro, alvo e pendências são revalidados",async()=>{
 for(const mutate of [f=>game.user=f.player,f=>game.users.activeGM={id:"other",active:true},f=>f.actor.isOwner=false,f=>f.target.isOwner=false,f=>f.actor.uuid="Actor.copy",f=>f.record().sustain.targetUuid=f.actor.uuid,f=>f.combat.started=false,f=>f.combat.combatants.contents[1].id="replacement",f=>game.combat={uuid:"Combat.other"},f=>f.target.flags[ID]={effectOperations:{pending:{status:"prepared"}}},f=>f.actor.flags[ID].levelOperation={status:"prepared"}]){const f=fixture();mutate(f);assert.equal(canOpposeSustained(f.actor,"sustainA"),false);await assert.rejects(f.oppose());assert.equal(f.stats.rolls,0);}
});
test("diálogo e recuperação não seguram a fila de outras fichas",async()=>{
 const f=fixture();await holdDecisionOutsideQueue(()=>opposeSustained(f.actor,"sustainA"));f.controls.roll=async()=>{throw Error("Falha");};await assert.rejects(f.oppose());await holdDecisionOutsideQueue(()=>recoverOpposition(f.actor,f.operation()[0]));assert.equal(f.operation()[1].status,"prepared");
});
test("alterações durante render, diálogo e ambos testes invalidam gravação",async()=>{
 for(const stage of ["render","dialog","first","second"]){for(const mutate of [f=>f.actor.system.resources.health.value=5,f=>f.target.system.resources.cosmo.value=4,f=>f.combat.round++,f=>game.user=f.player,f=>f.target.isOwner=false]){const f=fixture();if(stage==="render")f.controls.render=async()=>mutate(f);if(stage==="dialog"){f.answers.push(()=>{mutate(f);return f.answer;});await assert.rejects(opposeSustained(f.actor,"sustainA"));}else{if(stage==="first"||stage==="second")f.controls.roll=async n=>{if(n===(stage==="first"?1:2))mutate(f);};await assert.rejects(f.oppose());}assert.equal(f.stats.records,0);assert.equal(f.stats.published,0);}}
});
test("dois cliques geram só um resultado e um par de rolagens",async()=>{
 const f=fixture(),r=await Promise.allSettled([f.oppose(),f.oppose()]);assert.equal(r.filter(x=>x.status==="fulfilled").length,1);assert.equal(f.stats.rolls,2);assert.equal(f.stats.records,1);assert.equal(f.stats.published,1);
});
test("falha incompleta bloqueia operações e recuperação descarta sem novas rolagens",async()=>{
 for(const point of ["first","second","create"]){const f=fixture();if(point!=="create")f.controls.roll=async n=>{if(n===(point==="first"?1:2))throw Error("Falha");};else f.controls.create=async()=>{throw Error("Falha");};await assert.rejects(f.oppose());assert.equal(f.operation()[1].status,"prepared");assert.throws(()=>assertNoTechniqueInterruption(f.actor),/interrompida/);const n=f.stats.rolls;f.controls.roll=f.controls.create=null;await f.recover();assert.equal(f.operation()[1].status,"failed");assert.equal(f.stats.rolls,n);assert.equal(f.stats.records,0);assert.equal(f.actor.system.resources.cosmo.value,7);}
});
test("resultado completo anterior é recuperado e publicado sem repetir testes",async()=>{
 const f=fixture();f.controls.write=async(data,phase)=>{if(phase==="before"&&Object.hasOwn(data,`flags.${ID}.persistentEffects.sustainA`))throw Error("Falha antes de registrar");};await assert.rejects(f.oppose());assert.equal(f.operation()[1].status,"prepared");assert.ok(f.operation()[1].after);const n=f.stats.rolls;f.controls.write=null;await f.recover();assert.equal(f.operation()[1].status,"applied");assert.equal(f.operation()[1].published,true);assert.equal(f.stats.rolls,n);assert.equal(f.stats.records,1);assert.equal(f.stats.published,1);
});
test("recuperação completa recusa alvo/rodada/ficha alterados e não sobrescreve ajustes",async()=>{
 for(const mutate of [f=>f.target.system.resources.health.value=1,f=>f.combat.round++,f=>f.actor.system.resources.cosmo.value=5,f=>f.record().label="Alterado"]){const f=fixture();f.controls.write=async(data,p)=>{if(p==="before"&&Object.hasOwn(data,`flags.${ID}.persistentEffects.sustainA`))throw Error("Falha");};await assert.rejects(f.oppose());f.controls.write=null;mutate(f);await assert.rejects(f.recover(),/mudaram|divergente/);assert.equal(f.stats.records,0);await f.recover(true);assert.equal(f.operation()[1].status,"reviewed");assert.equal(f.stats.rolls,2);}
});
test("publicação e resposta perdida recuperam mesmo cartão mesmo após mudanças posteriores",async()=>{
 for(const phase of ["before","after"]){const f=fixture();f.controls.message=async(_m,data,p)=>{if(data.rolls&&p===phase)throw Error("Publicação perdida");};await assert.rejects(f.oppose());assert.equal(f.operation()[1].status,"applied");assert.equal(effectOperationContext(f.actor).length,1);f.target.system.resources.health.value=42;f.actor.system.resources.cosmo.value=4;f.controls.message=null;await f.recover();assert.equal(f.stats.published,1);assert.equal(f.stats.rolls,2);assert.equal(f.actor.system.resources.cosmo.value,4);assert.equal(f.operation()[1].published,true);await f.recover();assert.equal(f.stats.published,1);}
 const g=fixture();g.controls.write=async(data,p)=>{if(p==="after"&&Object.hasOwn(data,`flags.${ID}.persistentEffects.sustainA`))throw Error("Resposta perdida");};await assert.rejects(g.oppose());g.controls.write=null;await g.recover();assert.equal(g.stats.records,1);assert.equal(g.stats.rolls,2);assert.equal(g.stats.published,1);
});
test("cartão alterado/apagado ou cópia não rerrola e revisão preserva recursos",async()=>{
 for(const kind of ["edited","deleted","author","copy"]){const f=fixture();f.controls.message=async()=>{throw Error("Falha");};await assert.rejects(f.oppose());f.controls.message=null;const m=f.messages.get(f.operation()[1].messageId);if(kind==="edited")m.flags[ID].sustainOppositionPrepared.card.content="Alterado";if(kind==="deleted")f.messages.delete(m.id);if(kind==="author")m.author={id:"other"};if(kind==="copy")f.actor.uuid="Actor.copy";await assert.rejects(f.recover());await f.recover(true);assert.equal(f.operation()[1].status,"reviewed");assert.equal(f.stats.rolls,2);assert.equal(f.actor.system.resources.cosmo.value,7);}
});
test("resultado é explicitamente público, com dois Rolls e sem flags de dano",async()=>{
 const f=fixture();game.settings.get=()=>"blindroll";await f.oppose();const m=[...f.messages.values()][0];assert.deepEqual(m.whisper,[]);assert.equal(m.blind,false);assert.equal(m.rolls.length,2);assert.equal(m.flags[ID].sustainOppositionPrepared,undefined);assert.equal(m.flags[ID].sustainOppositionResolution.actorUuid,f.actor.uuid);assert.equal(m.flags[ID].resolvedDamage,undefined);assert.equal(m.flags[ID].attack,undefined);assert.equal(effectSheetContext(f.actor)[0].sustainOppositions.length,1);assert.equal(effectSheetContext(f.actor)[0].canOppose,false);
});


test("empate padrão depende do perfil: ativo repete e passivo exige superar",async()=>{
 const f=fixture();f.controls.faces=[[7,6],[7,6]];const r=await f.oppose({tie:"auto"});assert.equal(r.repeat,true);assert.equal(r.tie,"repeat");
 const g=fixture();const p=oppositionPlan(g.actor,"sustainA",{...g.answer,profile:"passive",tie:"auto",payerBonus:-1});assert.equal(p.tie,"defend");const s=await g.oppose({profile:"passive",tie:"auto",payerBonus:-1,onLoss:"keep"});assert.equal(s.payerTotal,s.targetTotal);assert.equal(s.winner,"target");assert.equal(s.repeat,false);assert.equal(s.end,false);assert.equal(g.stats.rolls,1);await assert.rejects(g.oppose());
});
test("alterações no cartão antes de registrar e leitura final inválida preservam efeito",async()=>{
 for(const kind of ["author","content","removed"]){const f=fixture();f.controls.create=async(m,p)=>{if(p==="after"){if(kind==="author")m.author={id:"other"};if(kind==="content")m.flags[ID].sustainOppositionPrepared.card.content="Alterado";if(kind==="removed")globalThis.fromUuid=async()=>null;}};await assert.rejects(f.oppose());assert.equal(f.stats.records,0);assert.equal(f.stats.published,0);assert.equal(f.actor.system.resources.cosmo.value,7);}
});
test("recuperação cancelada ou desatualizada conserva pendência sem novos testes",async()=>{
 const f=fixture();f.controls.roll=async()=>{throw Error("Falha");};await assert.rejects(f.oppose());f.controls.roll=null;await recoverOpposition(f.actor,f.operation()[0]);assert.equal(f.operation()[1].status,"prepared");await assert.rejects(holdDecisionOutsideQueue(()=>recoverOpposition(f.actor,f.operation()[0]),{answer:{reason:"",close:true},during:()=>{f.actor.system.resources.cosmo.value=5;}}),/mudou/);assert.equal(f.operation()[1].status,"prepared");assert.equal(f.stats.rolls,1);assert.equal(f.actor.system.resources.cosmo.value,5);
});
