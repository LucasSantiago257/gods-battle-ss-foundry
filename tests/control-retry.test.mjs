import test from "node:test";
import assert from "node:assert/strict";
import {retryControl,controlRetryView,controlRetryPlan,recoverControlRetry,canRetryControl} from "../module/control-retry.mjs";
import {effectSheetContext,effectOperationContext,recoverEffect} from "../module/effects.mjs";
import {controlRetryContextForSheet} from "../module/control-retry-ui.mjs";
import {recoverOwnedControlRetry} from "../module/control-retry-owned.mjs";
import {enqueueControlRetryRequest} from "../module/control-retry-requests.mjs";
import {controlMessages} from "./control-retry-message-fixture.mjs";
import {actionHash} from "../module/action-rules.mjs";
import {assertNoTechniqueInterruption} from "../module/master-queue.mjs";
import {holdDecisionOutsideQueue} from "./held-dialog.mjs";
const ID="gods-battle-ss",clone=structuredClone;
function fixture(tier="silver"){
 const f=controlMessages({tier}),answers=[],controls={dialog:null,render:null},renders=[];game.user=f.gm;
 const render=foundry.applications.handlebars.renderTemplate;foundry.applications.handlebars.renderTemplate=async(path,ctx)=>{renders.push({path,ctx});await controls.render?.(path,ctx);return path.endsWith("-dialog.hbs")?"<p>Controle</p>":render(path,ctx);};
 foundry.applications.api={DialogV2:{wait:async c=>{const answer=controls.dialog?await controls.dialog(c):answers.shift()??null;if(answer===null)return null;
  const form={elements:Object.fromEntries(Object.entries({attribute:"sen",bonus:0,advantage:0,useExtra:false,onSuccess:"end",reason:"",...answer}).map(([k,v])=>[k,k==="useExtra"?{checked:v}:{value:["bonus","advantage"].includes(k)?String(v):v}]))};
  const action=c.buttons.some(b=>b.action==="retry")?"retry":answer.close?"close":c.buttons.some(b=>b.action==="recover")?"recover":"close";return c.buttons.find(b=>b.action===action).callback(null,{form});
 }}};
 const process=async m=>{if(!m)return;const user=game.user;game.user=f.gm;try{await enqueueControlRetryRequest(m,{},m.author.id);}finally{game.user=user;}const r=f.response(m);if(!r?.ok)throw Error(r?.error??"Resposta ausente; mestre ou mensagem mudou.");return f.operations()[m.id]?.plan?.attempt??r;};
 return {...f,answers,controls,renders,answer:{attribute:"sen",bonus:0,advantage:0,useExtra:false,onSuccess:"end",reason:""},async retry(change={}){answers.push({attribute:"sen",bonus:0,advantage:0,useExtra:false,onSuccess:"end",reason:"",...change});return process(await retryControl(f.actor,"controlA"));},operation(){return Object.entries(f.operations()).find(([,o])=>o.kind==="controlRetryOwned");},async recover(close=false){const [id,op]=this.operation();if(op.status==="applied"&&op.published&&!close)return recoverOwnedControlRetry(f.actor,id,{requester:game.user});answers.push({reason:"",close});return process(await recoverEffect(f.actor,id));}};
}
const ceWrites=f=>f.writes.filter(w=>Object.keys(w.data).some(k=>k.startsWith("system.resources."))),card=f=>[...f.messages.values()].find(m=>m.flags?.[ID]?.controlRetryOwnedResolution);
test("resistência paga custa 1/1/2 CE e publica uma vez em falha sem prolongar Controle",async()=>{
 for(const tier of ["bronze","silver","gold"]){const f=fixture(tier),before=clone(f.actor.system),r=await f.retry();assert.equal(r.success,false);assert.equal(r.cost,tier==="gold"?2:1);assert.equal(f.actor.system.resources.cosmo.value,8-r.cost);assert.equal(f.actor.system.resources.cosmoReserved,2);assert.equal(f.actor.system.resources.health.value,90);assert.deepEqual(f.actor.system.conditions,before.conditions);assert.equal(f.record.status,"active");assert.equal(f.record.lastRound,6);assert.equal(Object.keys(f.record.ticks).length,0);assert.equal(f.stats.rolls,1);assert.equal(ceWrites(f).length,1);assert.equal(f.stats.cards,1);await assert.rejects(f.retry(),/registrada/);assert.equal(f.operation()[1].published,true);}
});
test("sucesso encerra só o registro escolhido e pode manter o prazo sem alterar condições",async()=>{
 for(const onSuccess of ["end","keep"]){const f=fixture(),before=clone(f.actor.system.conditions),r=await f.retry({bonus:20,onSuccess});assert.equal(r.success,true);assert.equal(f.record.status,onSuccess==="end"?"ended":"active");assert.deepEqual(f.actor.system.conditions,before);assert.equal(f.actor.system.resources.health.value,90);assert.equal(f.record.lastRound,6);if(onSuccess==="keep"){f.combat.round++;await f.retry({onSuccess});assert.equal(ceWrites(f).length,2);}}
});
test("reserva, CE extra e CE ilimitada são preservadas com escolha explícita",async()=>{
 const f=fixture("gold");await f.retry({useExtra:true});assert.equal(f.actor.system.resources.cosmoExtra,1);assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(f.actor.system.resources.cosmoReserved,2);
 const g=fixture();g.actor.system.resources.cosmo.value=2;await assert.rejects(g.retry(),/insuficiente/);assert.equal(g.stats.rolls,0);assert.equal(g.operation(),undefined);await g.retry({useExtra:true});assert.equal(g.actor.system.resources.cosmo.value,2);
 const h=fixture();h.actor.system.resources.cosmo.unlimited=true;const before=clone(h.actor.system.resources);await h.retry();assert.deepEqual(h.actor.system.resources,before);await assert.rejects(h.retry(),/registrada/);
});
test("modo de resistência, natureza, condições e ajustes usam parâmetros atuais",()=>{
 const f=fixture();for(const [nature,key]of [["physical","vig"],["natural","vel"],["mental","sen"],["manipulation","cos"]]){f.record.controlOrigin.nature=nature;assert.equal(controlRetryView(f.actor,"controlA").defaultAttribute,key);}delete f.record.controlOrigin.nature;assert.equal(controlRetryView(f.actor,"controlA").defaultAttribute,"");f.actor.system.automation.conditionModifier=-2;f.actor.system.automation.conditionDicePenalty=1;const p=controlRetryPlan(f.actor,"controlA",f.answer);assert.equal(p.pool.dice,1);assert.equal(p.pool.modifier,5);game.settings.get=()=>"modifier";assert.notEqual(controlRetryPlan(f.actor,"controlA",f.answer).pool.modifier,p.pool.modifier);
});
test("cancelar e parâmetros inválidos não preparam, rolam nem gastam",async()=>{
 const f=fixture();await retryControl(f.actor,"controlA");assert.equal(f.operation(),undefined);
 for(const change of [{attribute:"for"},{attribute:""},{bonus:NaN},{bonus:10001},{advantage:2},{onSuccess:"undo"},{reason:123},{reason:"x".repeat(2001)}]){const g=fixture();await assert.rejects(g.retry(change));assert.equal(g.stats.rolls,0);assert.equal(g.operation(),undefined);}const g=fixture();assert.throws(()=>controlRetryPlan(g.actor,"controlA",{...g.answer,useExtra:"true"}));
});
test("OWNER real, mestre responsável ativo e prazo vigente são obrigatórios",async()=>{
 for(const change of [f=>game.user=f.observer,f=>game.users.activeGM={id:"other",active:true},f=>f.actor.testUserPermission=()=>false,f=>f.actor.uuid="Actor.copy",f=>f.record.status="ended",f=>f.record.status="expired",f=>delete f.record.controlOrigin,f=>f.record.damage=1,f=>f.record.controlOrigin.classification="divine",f=>f.record.controlOrigin.powerCosmic=NaN,f=>f.combat.round=2,f=>f.combat.round=8,f=>f.combat.started=false,f=>game.combat={uuid:"Combat.other"},f=>f.member.id="replacement",f=>f.combat.combatants.contents.push({id:"duplicate",actor:f.actor})]){const f=fixture();change(f);assert.equal(canRetryControl(f.actor,"controlA"),false);await assert.rejects(f.retry());assert.equal(f.stats.rolls,0);}
 const f=fixture();game.user=f.owner;assert.equal(canRetryControl(f.actor,"controlA"),true);await f.retry();assert.equal(f.actor.system.resources.cosmo.value,7);
});
test("rodada posterior permite nova tentativa; retrocesso não repete rodada já paga",async()=>{
 const f=fixture();await f.retry();f.combat.round=5;await f.retry();f.combat.round=4;await assert.rejects(f.retry(),/registrada/);assert.equal(ceWrites(f).length,2);assert.equal(f.actor.system.resources.cosmo.value,6);
});
test("janelas de resistência e recuperação não ocupam a fila",async()=>{
 const f=fixture();await holdDecisionOutsideQueue(()=>retryControl(f.actor,"controlA"),{during:()=>assert.equal(f.stats.rolls,0)});assert.equal(f.operation(),undefined);f.faults.push({tag:"roll",phase:"before"});await assert.rejects(f.retry());await holdDecisionOutsideQueue(()=>recoverControlRetry(f.actor,f.operation()[0]));assert.equal(f.operation()[1].status,"prepared");
});
test("estado alterado enquanto diálogo/render/roll aguarda invalida o gasto",async()=>{
 for(const stage of ["dialog","render","roll"])for(const mutate of [f=>f.actor.system.resources.cosmo.value--,f=>f.record.controlOrigin.powerCosmic++,f=>f.combat.round++,f=>game.user=f.owner,f=>f.actor.testUserPermission=()=>false]){const f=fixture();if(stage==="dialog")f.controls.dialog=async()=>{mutate(f);return f.answer;};if(stage==="render")f.controls.render=async()=>mutate(f);if(stage==="roll")f.hooks.after=tag=>{if(tag==="roll")mutate(f);};await assert.rejects(f.retry());assert.equal(ceWrites(f).length,0);}
});
test("dois cliques concorrentes pagam e rolam uma única vez",async()=>{
 const f=fixture(),r=await Promise.allSettled([f.retry(),f.retry()]);assert.equal(r.filter(x=>x.status==="fulfilled").length,1);assert.equal(ceWrites(f).length,1);assert.equal(f.stats.rolls,1);assert.equal(f.stats.cards,1);
});
test("operações interrompidas bloqueiam nova resistência e outros gastos",async()=>{
 for(const group of ["techniqueOperations","actionOperations","effectOperations","damageOperations"]){const f=fixture();f.actor.flags[ID][group]={pending:{status:"prepared"}};await assert.rejects(f.retry(),/interrompid|indisponível/);assert.equal(f.stats.rolls,0);}
 const f=fixture();f.faults.push({tag:"roll",phase:"before"});await assert.rejects(f.retry());assert.throws(()=>assertNoTechniqueInterruption(f.actor),/efeito interrompida/);assert.equal(effectOperationContext(f.actor).length,0);assert.equal(controlRetryContextForSheet(f.actor).interruptions.length,1);
});
test("falha antes de pagar conserva CE e recuperação não repete teste",async()=>{
 for(const point of ["roll","ready","commit"]){const f=fixture();f.faults.push({tag:point,phase:"before"});await assert.rejects(f.retry());assert.equal(f.actor.system.resources.cosmo.value,8);const count=f.stats.rolls,ready=f.operation()[1].phase==="ready";await f.recover();assert.equal(f.operation()[1].status,ready?"applied":"reviewed");assert.equal(f.stats.rolls,count);assert.equal(ceWrites(f).length,ready?1:0);}
});
test("resposta perdida após pagamento recupera mesmo resultado mesmo se ficha mudar depois",async()=>{
 const f=fixture();f.faults.push({tag:"commit",phase:"after"});await assert.rejects(f.retry());assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.operation()[1].status,"applied");f.actor.system.resources.health.value=77;await f.recover();assert.equal(f.stats.rolls,1);assert.equal(ceWrites(f).length,1);assert.equal(f.stats.cards,1);assert.equal(f.actor.system.resources.health.value,77);await f.recover();assert.equal(f.stats.cards,1);
});
test("falha de publicação e resposta perdida depois de publicar são idempotentes",async()=>{
 for(const phase of ["before","after"]){const f=fixture();f.faults.push({tag:"card",phase});await assert.rejects(f.retry());assert.equal(ceWrites(f).length,1);await f.recover();assert.equal(f.stats.cards,1);assert.equal(f.stats.rolls,1);assert.equal(f.operation()[1].published,true);}
});
test("cartão alterado ou apagado não repete cobrança; encerrar conserva recursos",async()=>{
 for(const kind of ["edited","deleted","author"]){const f=fixture();f.faults.push({tag:"published",phase:"after"});await assert.rejects(f.retry());const op=f.operation()[1],m=f.messages.get(op.messageId);op.published=false;if(kind==="edited")m.flags[ID].controlRetryOwnedResolution.total++;if(kind==="deleted")f.messages.delete(m.id);if(kind==="author")m.author=f.observer;await assert.rejects(f.recover());const before=clone(f.actor.system);await f.recover(true);assert.deepEqual(f.actor.system,before);assert.equal(op.status,"reviewed");assert.equal(f.stats.rolls,1);}
});
test("recuperação preparada exige snapshot compatível ou encerramento explícito",async()=>{
 const f=fixture();f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.retry());f.actor.system.resources.cosmo.value=5;await assert.rejects(recoverOwnedControlRetry(f.actor,f.operation()[0],{requester:f.gm}),/prévia/);await f.recover(true);assert.equal(f.actor.system.resources.cosmo.value,5);assert.equal(f.operation()[1].status,"reviewed");
 const g=fixture();g.faults.push({tag:"commit",phase:"before"});await assert.rejects(g.retry());g.actor.uuid="Actor.copy";g.docs.set(g.actor.uuid,g.actor);await assert.rejects(recoverOwnedControlRetry(g.actor,g.operation()[0],{requester:g.gm}),/outra ficha/);await g.recover(true);assert.equal(g.actor.system.resources.cosmo.value,8);
});
test("recuperação desatualizada preserva alterações e cancelamento preserva pendência",async()=>{
 const f=fixture();f.faults.push({tag:"roll",phase:"before"});await assert.rejects(f.retry());const id=f.operation()[0];await recoverControlRetry(f.actor,id);assert.equal(f.operation()[1].status,"prepared");await assert.rejects(holdDecisionOutsideQueue(()=>recoverControlRetry(f.actor,id),{answer:{action:"close",reason:""},during:async()=>{f.operation()[1].time++;f.actor.system.resources.cosmo.value=4;}}),/Journal/);assert.equal(f.operation()[1].status,"prepared");assert.equal(f.actor.system.resources.cosmo.value,4);
});
test("assistência publica explicitamente resultado público sem dados de outras rolagens",async()=>{
 const f=fixture();game.settings.get=(scope)=>scope==="core"?"blindroll":"rank";await f.retry();const m=card(f);assert.deepEqual(m.whisper,[]);assert.equal(m.blind,false);assert.equal(m.flags[ID].controlRetryOwnedResolution.actorUuid,f.actor.uuid);assert.equal(m.rolls[0].total,f.operation()[1].plan.result.total);assert.equal(m.flags[ID].attack,undefined);assert.equal(m.flags[ID].resolvedDamage,undefined);
});
test("ficha expõe botão só enquanto válido e recuperação própria para pagamento pendente",async()=>{
 const f=fixture();assert.equal(effectSheetContext(f.actor).length,0);assert.equal(controlRetryContextForSheet(f.actor).rows[0].canRetry,true);await f.retry();assert.equal(controlRetryContextForSheet(f.actor).rows[0].canRetry,undefined);assert.equal(controlRetryContextForSheet(f.actor).rows[0].history.length,1);f.combat.round++;assert.equal(controlRetryContextForSheet(f.actor).rows[0].canRetry,true);
 const g=fixture();g.faults.push({tag:"card",phase:"before"});await assert.rejects(g.retry());g.combat.round++;assert.equal(controlRetryContextForSheet(g.actor).rows[0].canRetry,undefined);assert.equal(controlRetryContextForSheet(g.actor).interruptions[0].canReview,true);
});
test("interrupção de preparação e estado posterior reconhecido não repetem pagamento",async()=>{
 for(const phase of ["before","after"]){const f=fixture();f.faults.push({tag:"rolling",phase});await assert.rejects(f.retry());assert.equal(ceWrites(f).length,0);assert.equal(f.stats.rolls,0);if(f.operation()){await f.recover();assert.equal(f.operation()[1].status,"reviewed");}}
 const g=fixture();g.faults.push({tag:"card",phase:"before"});await assert.rejects(g.retry());g.operation()[1].status="prepared";await g.recover();assert.equal(g.operation()[1].status,"applied");assert.equal(ceWrites(g).length,1);assert.equal(g.stats.rolls,1);assert.equal(g.stats.cards,1);
});
test("resultado adulterado antes do débito e ficha removida nunca gastam CE",async()=>{
 const f=fixture();f.hooks.after=tag=>{if(tag==="ready")f.operation()[1].plan.result.total++;};await assert.rejects(f.retry(),/mudou/);assert.equal(ceWrites(f).length,0);assert.equal(f.actor.system.resources.cosmo.value,8);f.hooks.after=null;await f.recover(true);assert.equal(f.operation()[1].status,"reviewed");
 const g=fixture();g.hooks.after=tag=>{if(tag==="roll")g.docs.delete(g.actor.uuid);};await assert.rejects(g.retry(),/removida/);assert.equal(ceWrites(g).length,0);
});
function legacy(f,status="prepared"){
 const resources={health:f.actor.system.resources.health.value,cosmo:f.actor.system.resources.cosmo.value,cosmoExtra:f.actor.system.resources.cosmoExtra,cosmoReserved:f.actor.system.resources.cosmoReserved,cosmoOverload:f.actor.system.resources.cosmoOverload,unlimited:f.actor.system.resources.cosmo.unlimited};const op={kind:"controlRetry",status,actorUuid:f.actor.uuid,effectId:"controlA",round:3,userId:f.gm.id,time:1,before:{resources,record:clone(f.record)}};f.actor.flags[ID].effectOperations={legacy:op};return op;
}
test("journal legado before/before conserva recuperaçãoGM sem dado ou gasto",async()=>{
 const f=fixture(),op=legacy(f);f.answers.push({reason:"",close:false});await recoverEffect(f.actor,"legacy");assert.equal(op.status,"failed");assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(f.stats.rolls,0);assert.equal(f.stats.cards,0);
});
test("journal legado applied publica cartão já salvo sem rolar ou debitar",async()=>{
 const f=fixture(),op=legacy(f,"applied"),data={total:11,terms:[{number:6,results:[{result:5},{result:6}]},{operator:"+"},{number:5}]},saved={card:{content:"Resultado legado",rolls:[data],whisper:[],blind:false,flags:{[ID]:{controlRetry:{effectId:"controlA"}}}}};const m={id:"legacyCard",author:f.gm,flags:{[ID]:{controlRetryPrepared:saved}},async update(change){const {patch}=await import("./control-retry-owned-fixture.mjs");patch(m,{...change,rolls:change.rolls.map(r=>r.toJSON())});}};f.messages.set(m.id,m);op.messageId=m.id;op.cardHash=actionHash(saved);f.answers.push({reason:"",close:false});await recoverControlRetry(f.actor,"legacy");assert.equal(op.published,true);assert.equal(m.flags[ID].controlRetryResolution.operationId,"legacy");assert.equal(f.stats.rolls,0);assert.equal(ceWrites(f).length,0);
});
test("journal legado divergente/copiado sófecha operação local preservando recursos",async()=>{
 const f=fixture(),op=legacy(f);op.actorUuid="Actor.original";f.actor.system.resources.cosmo.value=4;f.answers.push({reason:"",close:true});await recoverControlRetry(f.actor,"legacy");assert.equal(op.status,"reviewed");assert.equal(f.actor.system.resources.cosmo.value,4);assert.equal(f.record.status,"active");
});
test("dono inicia fluxo novo mas recuperação legada permaneceGM",async()=>{
 const f=fixture();legacy(f);game.user=f.owner;await assert.rejects(recoverControlRetry(f.actor,"legacy"),/mestre/);assert.equal(f.stats.rolls,0);
});
