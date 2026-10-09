import test from "node:test";
import assert from "node:assert/strict";
import {knight} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {retryControl,controlRetryView,controlRetryPlan,recoverControlRetry,canRetryControl} from "../module/control-retry.mjs";
import {effectSheetContext,effectOperationContext,recoverEffect} from "../module/effects.mjs";
import {assertNoTechniqueInterruption,runMasterOperation} from "../module/master-queue.mjs";
import {holdDecisionOutsideQueue} from "./held-dialog.mjs";
const ID="gods-battle-ss",clone=structuredClone;
function patch(obj,data){for(const [key,value] of Object.entries(data)){const parts=key.split(".");let o=obj;for(const p of parts.slice(0,-1))o=o[p]??={};const last=parts.at(-1);if(last.startsWith("-="))delete o[last.slice(2)];else o[last]=clone(last==="rolls"?value.map(r=>r.toJSON?r.toJSON():r):value);}}
function fixture(tier="silver"){
 const gm={id:"gm",isGM:true,active:true},player={id:"p",isGM:false},messages=new Map(),answers=[],stats={rolls:0,payments:0,published:0},controls={faces:[5,6],dialog:null,roll:null,render:null,write:null,message:null,create:null},renders=[];
 const s=knight();s.profile.level=5;for(const key of ["vig","vel","sen","cos"])s.attributes[key].value=2;prepareKnight(s);s.resources.health.value=90;s.resources.cosmo.value=8;s.resources.cosmoExtra=3;s.resources.cosmoReserved=2;s.conditions.afraid=true;
 const record={id:"controlA",actorUuid:"Actor.hero",kind:"manual",damage:0,label:"Controle de exercício",firstRound:2,lastRound:7,status:"active",rounds:6,ticks:{},combatUuid:"Combat.test",combatantId:"hero",time:1,controlOrigin:{rootMessageId:"initial",classification:tier,powerCosmic:20,nature:"mental",retryCost:tier==="gold"?2:1}};
 const actor={uuid:"Actor.hero",id:"hero",name:"Defensor",type:"knight",isOwner:true,system:s,items:{contents:[]},flags:{[ID]:{persistentEffects:{controlA:record},unrelated:"preservar"}},async update(data){if(controls.write)await controls.write(data,"before");patch(this,data);if(Object.hasOwn(data,`flags.${ID}.persistentEffects.controlA`))stats.payments++;if(controls.write)await controls.write(data,"after");return this;}};
 const combat={uuid:"Combat.test",started:true,round:3,combatants:{contents:[{id:"hero",actor}]}};
 globalThis.game={user:gm,users:{activeGM:gm},combat,combats:{contents:[combat]},messages:{get:id=>messages.get(id)},settings:{get:()=>"rank"}};globalThis.fromUuid=async uuid=>uuid===actor.uuid?actor:null;
 let n=0;foundry.utils={randomID:()=>`retry${++n}`};foundry.applications.api.DialogV2={wait:async opts=>controls.dialog?controls.dialog(opts):answers.shift()??null};foundry.applications.handlebars={renderTemplate:async(path,context)=>{renders.push({path,context});if(controls.render)await controls.render(path,context);return "<p>Controle</p>";}};
 foundry.dice={terms:{OperatorTerm:class{constructor(data){Object.assign(this,data);}}}};
 globalThis.Roll=class{constructor(formula){this.formula=formula;}async evaluate(){if(this.formula.includes("d10")){stats.rolls++;if(controls.roll)await controls.roll();this.dice=[{results:controls.faces.map(result=>({result}))}];this.terms=[{number:Math.max(...controls.faces)}];}else this.terms=[{number:Number(this.formula)}];return this;}static fromTerms(terms){const total=terms[0].number+(terms[1].operator==="+"?1:-1)*terms[2].number;return {total,toJSON:()=>({total,terms:clone(terms)})};}static fromData(data){return {...data,toJSON:()=>clone(data)};}};
 globalThis.ChatMessage={getSpeaker:({actor})=>({actor:actor.id,alias:actor.name}),applyRollMode:(data,mode)=>{assert.equal(mode,"publicroll");data.whisper=[];data.blind=false;},async create(data){if(controls.create)await controls.create(data,"before");const m={...clone(data),id:`message${messages.size+1}`,author:gm,async update(change){if(controls.message)await controls.message(this,change,"before");patch(this,change);if(change.rolls)stats.published++;if(controls.message)await controls.message(this,change,"after");return this;}};messages.set(m.id,m);if(controls.create)await controls.create(m,"after");return m;}};
 const answer={attribute:"sen",bonus:0,advantage:0,useExtra:false,onSuccess:"end",reason:""};
 return {actor,record,combat,gm,player,messages,answers,controls,stats,renders,answer,async retry(change={}){answers.push({...answer,...change});return retryControl(actor,"controlA");},operation(){return Object.entries(actor.flags[ID].effectOperations??{})[0];},async recover(close=false){answers.push({reason:"",close});return recoverEffect(actor,this.operation()[0]);}};
}
test("resistência paga custa 1/1/2 CE e publica uma vez em falha sem prolongar Controle",async()=>{
 for(const tier of ["bronze","silver","gold"]){const f=fixture(tier),before=clone(f.actor.system),r=await f.retry();assert.equal(r.success,false);assert.equal(r.cost,tier==="gold"?2:1);assert.equal(f.actor.system.resources.cosmo.value,8-r.cost);assert.equal(f.actor.system.resources.cosmoReserved,2);assert.equal(f.actor.system.resources.health.value,90);assert.equal(f.actor.system.conditions.afraid,true);assert.equal(f.actor.system.combat.asterismPenalty,before.combat.asterismPenalty);const record=f.actor.flags[ID].persistentEffects.controlA;assert.equal(record.status,"active");assert.equal(record.lastRound,7);assert.equal(record.firstRound,2);assert.equal(Object.keys(record.ticks).length,0);assert.equal(f.actor.flags[ID].unrelated,"preservar");assert.equal(f.stats.rolls,1);assert.equal(f.stats.payments,1);assert.equal(f.stats.published,1);await assert.rejects(f.retry(),/tentativa registrada/);assert.equal(f.stats.rolls,1);assert.equal(f.operation()[1].published,true);}
});
test("sucesso encerra só o registro escolhido e pode manter o prazo sem alterar condições",async()=>{
 for(const onSuccess of ["end","keep"]){const f=fixture();const r=await f.retry({bonus:20,onSuccess});assert.equal(r.success,true);assert.equal(r.end,onSuccess==="end");assert.equal(f.actor.flags[ID].persistentEffects.controlA.status,onSuccess==="end"?"ended":"active");assert.equal(f.actor.system.conditions.afraid,true);assert.equal(f.actor.system.resources.health.value,90);assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.actor.flags[ID].persistentEffects.controlA.lastRound,7);if(onSuccess==="keep"){f.combat.round++;await f.retry({onSuccess});assert.equal(f.stats.payments,2);}}
});
test("reserva, CE extra e CE ilimitada são preservadas com escolha explícita",async()=>{
 const f=fixture("gold");await f.retry({useExtra:true});assert.equal(f.actor.system.resources.cosmoExtra,1);assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(f.actor.system.resources.cosmoReserved,2);
 const g=fixture();g.actor.system.resources.cosmo.value=2;await assert.rejects(g.retry(),/insuficiente/);assert.equal(g.stats.rolls,0);assert.equal(g.operation(),undefined);await g.retry({useExtra:true});assert.equal(g.actor.system.resources.cosmo.value,2);
 const h=fixture();h.actor.system.resources.cosmo.unlimited=true;const before=clone(h.actor.system.resources);await h.retry();assert.deepEqual(h.actor.system.resources,before);assert.equal(h.stats.rolls,1);await assert.rejects(h.retry(),/tentativa registrada/);
});
test("modo de resistência, natureza, condições e ajustes usam parâmetros atuais",()=>{
 const f=fixture();f.record.controlOrigin.nature="physical";assert.equal(controlRetryView(f.actor,"controlA").defaultAttribute,"vig");for(const [nature,key]of [["natural","vel"],["mental","sen"],["manipulation","cos"]]){f.record.controlOrigin.nature=nature;assert.equal(controlRetryView(f.actor,"controlA").defaultAttribute,key);}delete f.record.controlOrigin.nature;assert.equal(controlRetryView(f.actor,"controlA").defaultAttribute,"");
 f.actor.system.automation.conditionModifier=-2;f.actor.system.automation.conditionDicePenalty=1;const p=controlRetryPlan(f.actor,"controlA",f.answer);assert.equal(p.pool.dice,1);assert.equal(p.pool.modifier,5);game.settings.get=()=>"modifier";const m=controlRetryPlan(f.actor,"controlA",f.answer);assert.notEqual(m.pool.modifier,p.pool.modifier);assert.equal(m.mode,"modifier");
});
test("cancelar e parâmetros inválidos não preparam, rolam nem gastam",async()=>{
 const f=fixture();await retryControl(f.actor,"controlA");assert.equal(f.operation(),undefined);
 for(const change of [{attribute:"for"},{attribute:""},{bonus:NaN},{bonus:10001},{advantage:2},{useExtra:"true"},{onSuccess:"undo"},{reason:123},{reason:"x".repeat(2001)}]){const g=fixture();await assert.rejects(g.retry(change));assert.equal(g.stats.rolls,0);assert.equal(g.stats.payments,0);assert.equal(g.operation(),undefined);}
});
test("somente mestre primário, ficha própria e prazo vigente no mesmo encontro",async()=>{
 for(const change of [f=>game.user=f.player,f=>game.users.activeGM={id:"other",active:true},f=>f.actor.isOwner=false,f=>f.actor.uuid="Actor.copy",f=>f.record.status="ended",f=>f.record.status="expired",f=>delete f.record.controlOrigin,f=>f.record.damage=1,f=>f.record.controlOrigin.classification="divine",f=>f.record.controlOrigin.powerCosmic=NaN,f=>f.combat.round=2,f=>f.combat.round=8,f=>f.combat.started=false,f=>game.combat={uuid:"Combat.other"},f=>f.combat.combatants.contents[0].id="replacement",f=>f.combat.combatants.contents.push({id:"duplicate",actor:f.actor})]){const g=fixture();change(g);assert.equal(canRetryControl(g.actor,"controlA"),false);await assert.rejects(g.retry());assert.equal(g.stats.rolls,0);}
});
test("rodada posterior permite nova tentativa; retrocesso não repete rodada já paga",async()=>{
 const f=fixture();await f.retry();f.combat.round=5;await f.retry();f.combat.round=4;await assert.rejects(f.retry(),/rodada posterior/);assert.equal(f.stats.payments,2);assert.equal(f.actor.system.resources.cosmo.value,6);
});
test("janelas de resistência e recuperação não ocupam a fila",async()=>{
 const f=fixture();await holdDecisionOutsideQueue(()=>retryControl(f.actor,"controlA"),{during:()=>assert.equal(f.stats.rolls,0)});assert.equal(f.operation(),undefined);
 f.controls.roll=async()=>{throw Error("Falha de rolagem");};await assert.rejects(f.retry());await holdDecisionOutsideQueue(()=>recoverControlRetry(f.actor,f.operation()[0]));assert.equal(f.operation()[1].status,"prepared");
});
test("estado alterado enquanto diálogo/render/roll aguarda invalida o gasto",async()=>{
 for(const stage of ["dialog","render","roll"]){for(const mutate of [f=>f.actor.system.resources.cosmo.value--,f=>f.record.controlOrigin.powerCosmic++,f=>f.combat.round++,f=>game.user=f.player,f=>f.actor.isOwner=false]){const f=fixture();if(stage==="dialog")f.controls.dialog=async()=>{mutate(f);return f.answer;};if(stage==="render")f.controls.render=async()=>mutate(f);if(stage==="roll")f.controls.roll=async()=>mutate(f);await assert.rejects(f.retry());assert.equal(f.stats.payments,0);}}
});
test("dois cliques concorrentes pagam e rolam uma única vez",async()=>{
 const f=fixture();const result=await Promise.allSettled([f.retry(),f.retry()]);assert.equal(result.filter(r=>r.status==="fulfilled").length,1);assert.equal(f.stats.payments,1);assert.equal(f.stats.rolls,1);assert.equal(f.stats.published,1);
});
test("operações interrompidas bloqueiam nova resistência e outros gastos",async()=>{
 for(const group of ["techniqueOperations","actionOperations","effectOperations","damageOperations"]){const f=fixture();f.actor.flags[ID][group]={pending:{status:"prepared"}};await assert.rejects(f.retry(),/interrompid/);assert.equal(f.stats.rolls,0);}
 const f=fixture();f.controls.roll=async()=>{throw Error("Falha");};await assert.rejects(f.retry());assert.throws(()=>assertNoTechniqueInterruption(f.actor),/efeito interrompida/);assert.equal(effectOperationContext(f.actor).length,1);
});
test("falha antes de pagar conserva CE e recuperação encerra sem repetir teste",async()=>{
 for(const point of ["roll","create","payment"]){const f=fixture();if(point==="roll")f.controls.roll=async()=>{throw Error("Falha");};if(point==="create")f.controls.create=async()=>{throw Error("Falha");};if(point==="payment")f.controls.write=async(data,phase)=>{if(phase==="before"&&Object.hasOwn(data,`flags.${ID}.persistentEffects.controlA`))throw Error("Falha");};await assert.rejects(f.retry());assert.equal(f.actor.system.resources.cosmo.value,8);const count=f.stats.rolls;f.controls.write=f.controls.roll=f.controls.create=null;await f.recover();assert.equal(f.operation()[1].status,"failed");assert.equal(f.stats.rolls,count);assert.equal(f.stats.payments,0);}
});
test("resposta perdida após pagamento recupera mesmo resultado mesmo se ficha mudar depois",async()=>{
 const f=fixture();f.controls.write=async(data,phase)=>{if(phase==="after"&&Object.hasOwn(data,`flags.${ID}.persistentEffects.controlA`))throw Error("Resposta perdida");};await assert.rejects(f.retry(),/perdida/);assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.operation()[1].status,"applied");assert.equal(effectOperationContext(f.actor).length,1);f.actor.system.resources.health.value=77;f.controls.write=null;await f.recover();assert.equal(f.stats.rolls,1);assert.equal(f.stats.payments,1);assert.equal(f.stats.published,1);assert.equal(f.actor.system.resources.health.value,77);assert.equal(f.operation()[1].published,true);await f.recover();assert.equal(f.stats.published,1);
});
test("falha de publicação e resposta perdida depois de publicar são idempotentes",async()=>{
 for(const phase of ["before","after"]){const f=fixture();f.controls.message=async(_m,data,p)=>{if(data.rolls&&p===phase)throw Error("Publicação perdida");};await assert.rejects(f.retry());const count=f.stats.published;assert.equal(f.stats.payments,1);f.controls.message=null;await f.recover();assert.equal(f.stats.published,phase==="after"?count:1);assert.equal(f.stats.rolls,1);assert.equal(f.stats.payments,1);assert.equal(f.operation()[1].published,true);}
});
test("cartão preparado alterado ou apagado não repete cobrança; encerrar conserva recursos",async()=>{
 for(const kind of ["edited","deleted","author"]){const f=fixture();f.controls.message=async()=>{throw Error("Falha");};await assert.rejects(f.retry());f.controls.message=null;const op=f.operation()[1],m=f.messages.get(op.messageId);if(kind==="edited")m.flags[ID].controlRetryPrepared.card.content="Editado";if(kind==="deleted")f.messages.delete(m.id);if(kind==="author")m.author={id:"other"};await assert.rejects(f.recover());const before=clone(f.actor.system);await f.recover(true);assert.deepEqual(f.actor.system,before);assert.equal(f.operation()[1].status,"reviewed");assert.equal(f.stats.rolls,1);assert.equal(f.stats.payments,1);}
});
test("recuperação preparada exige valores anteriores/posteriores ou encerramento explícito",async()=>{
 const f=fixture();f.controls.roll=async()=>{throw Error("Falha");};await assert.rejects(f.retry());f.actor.system.resources.cosmo.value=5;f.controls.roll=null;await assert.rejects(f.recover(),/divergentes/);assert.equal(f.actor.system.resources.cosmo.value,5);await f.recover(true);assert.equal(f.actor.system.resources.cosmo.value,5);assert.equal(f.operation()[1].status,"reviewed");
 const g=fixture();g.controls.roll=async()=>{throw Error("Falha");};await assert.rejects(g.retry());g.actor.uuid="Actor.copy";await assert.rejects(g.recover(),/outra ficha/);await g.recover(true);assert.equal(g.actor.system.resources.cosmo.value,8);
});
test("recuperação desatualizada preserva alterações e cancelamento preserva pendência",async()=>{
 const f=fixture();f.controls.roll=async()=>{throw Error("Falha");};await assert.rejects(f.retry());const id=f.operation()[0];await recoverControlRetry(f.actor,id);assert.equal(f.operation()[1].status,"prepared");await assert.rejects(holdDecisionOutsideQueue(()=>recoverControlRetry(f.actor,id),{answer:{reason:"",close:true},during:async()=>runMasterOperation(()=>{f.actor.system.resources.cosmo.value=4;})}),/mudou/);assert.equal(f.operation()[1].status,"prepared");assert.equal(f.actor.system.resources.cosmo.value,4);
});
test("assistência publica explicitamente resultado público sem dados de outras rolagens",async()=>{
 const f=fixture();game.settings.get=(scope,key)=>scope==="core"?"blindroll":"rank";await f.retry();const m=[...f.messages.values()][0];assert.deepEqual(m.whisper,[]);assert.equal(m.blind,false);assert.equal(m.flags[ID].controlRetryPrepared,undefined);assert.equal(m.flags[ID].controlRetryResolution.actorUuid,f.actor.uuid);assert.equal(m.rolls[0].total,f.actor.flags[ID].persistentEffects.controlA.controlRetries[f.operation()[0]].total);assert.equal(m.flags[ID].attack,undefined);assert.equal(m.flags[ID].resolvedDamage,undefined);
});
test("ficha expõe botão apenas enquanto tentativa é válida e recupera pagamento pendente",async()=>{
 const f=fixture();assert.equal(effectSheetContext(f.actor)[0].canRetryControl,true);await f.retry();assert.equal(effectSheetContext(f.actor)[0].canRetryControl,false);assert.equal(effectSheetContext(f.actor)[0].controlRetries.length,1);f.combat.round++;assert.equal(effectSheetContext(f.actor)[0].canRetryControl,true);
 const g=fixture();g.controls.message=async()=>{throw Error("Falha");};await assert.rejects(g.retry());g.combat.round++;assert.equal(effectSheetContext(g.actor)[0].canRetryControl,false);assert.equal(effectOperationContext(g.actor)[0].canReview,true);
});

test("interrupção de preparação e estado posterior reconhecido não repetem pagamento",async()=>{
 for(const phase of ["before","after"]){const f=fixture();f.controls.write=async(data,p)=>{if(p===phase&&Object.keys(data).length===1&&Object.keys(data)[0].includes("effectOperations"))throw Error("Preparação perdida");};await assert.rejects(f.retry());assert.equal(f.stats.payments,0);assert.equal(f.stats.rolls,0);f.controls.write=null;if(f.operation()){await f.recover();assert.equal(f.operation()[1].status,"failed");}else assert.equal(f.actor.system.resources.cosmo.value,8);}
 const g=fixture();g.controls.message=async()=>{throw Error("Falha de publicação");};await assert.rejects(g.retry());g.controls.message=null;g.operation()[1].status="prepared";await g.recover();assert.equal(g.operation()[1].status,"applied");assert.equal(g.stats.payments,1);assert.equal(g.stats.rolls,1);assert.equal(g.stats.published,1);
});
test("resultado adulterado antes do débito e ficha removida nunca gastam CE",async()=>{
 const f=fixture();f.controls.create=async(m,phase)=>{if(phase==="after")m.flags[ID].controlRetryPrepared.card.content="Editado";};await assert.rejects(f.retry(),/alterados/);assert.equal(f.stats.payments,0);assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(f.operation()[1].status,"prepared");f.controls.create=null;await f.recover();assert.equal(f.operation()[1].status,"failed");
 const g=fixture();g.controls.roll=async()=>{globalThis.fromUuid=async()=>null;};await assert.rejects(g.retry(),/mudou/);assert.equal(g.stats.payments,0);
});
