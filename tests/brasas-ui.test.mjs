import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import Handlebars from "handlebars";
import {messages} from "./brasas-message-fixture.mjs";
import {healthWrites,copy} from "./brasas-fixture.mjs";
import {brasasContext,brasasWaiting,applyBrasasParcel,finishBrasas,openBrasasRecovery,installBrasasPreview} from "../module/brasas-ui.mjs";
import {runMasterOperation} from "../module/master-queue.mjs";
const ID="gods-battle-ss";
function setup(options){const f=messages(options);foundry.applications={api:{DialogV2:{wait:async()=>null,confirm:async()=>{throw Error("Unnecessary acceptance");}}}};game.user=f.owner;return f;}
const view=f=>brasasContext(f.actor).rows.find(r=>r.id==="fire");
function form(values={}){const elements={damage:{value:"10"},reason:{value:""},...Object.fromEntries(Object.entries(values).map(([k,value])=>[k,{value}]))},output={textContent:""},button={disabled:false},listeners={};return {elements,output,button,listeners,querySelector:q=>q.includes("preview")?output:button,addEventListener:(n,fn)=>listeners[n]=fn};}
const apply=(f,row=view(f),options={})=>applyBrasasParcel(f.actor,"fire",{signature:row.applySignature,round:row.nextRound,...options});
test("dono recebe valores e ações sem buscar fonte ou expor nome/descrição privada",()=>{
 const f=setup();Object.defineProperty(f.record().source,"name",{get(){throw Error("private source name");}});const row=view(f);assert.equal(row.amount,10);assert.equal(row.health,100);assert.equal(row.canApply,true);assert.equal(row.canUndo,false);assert.equal(row.pendingRounds,1);assert.equal(JSON.stringify(row).includes("Actor.hidden"),false);assert.equal(row.source,undefined);
});
test("observador e OWNER perdido não leem flags ou recebem controles",async()=>{
 const f=setup();game.user=f.observer;Object.defineProperty(f.actor,"flags",{get(){throw Error("private flags");}});assert.deepEqual(brasasContext(f.actor).rows,[]);assert.equal(brasasWaiting(f.actor),false);await assert.rejects(applyBrasasParcel(f.actor,"fire",{}));await assert.rejects(finishBrasas(f.actor,"fire",{}));await assert.rejects(openBrasasRecovery(f.actor,"one"));
});
test("cancelar ajuste não envia, grava ou ocupa filaGM",async()=>{
 const f=setup(),row=view(f);let release;foundry.applications.api.DialogV2.wait=()=>new Promise(r=>release=r);const pending=apply(f,row,{adjust:true});let progressed=false;await runMasterOperation(async()=>{progressed=true;});assert.equal(progressed,true);release(null);await pending;assert.equal(f.collection.size,0);assert.equal(f.writes.length,0);
});
test("callback real de Ajustar aceita fração e zero com prévia e nota opcional",async()=>{
 for(const damage of ["0","2.5"]){const f=setup();foundry.applications.api.DialogV2.wait=async config=>config.buttons.find(b=>b.action==="apply").callback(null,{form:form({damage,reason:""})});const m=await apply(f,view(f),{adjust:true});assert.equal(f.req(m).options.damage,Number(damage));assert.equal(f.writes.length,0);await f.process(m);assert.equal(f.actor.system.resources.health.value,100-Number(damage));}
});
test("prévia reage a números inválidos, mudança de PV e perda de permissão",()=>{
 const f=setup(),r=view(f),el=form();installBrasasPreview(el,f.actor,"fire",{signature:r.applySignature,round:r.nextRound});assert.match(el.output.textContent,/100 → 90/);assert.equal(el.button.disabled,false);
 for(const value of ["","-1","no","1000001"]){el.elements.damage.value=value;el.listeners.input();assert.equal(el.button.disabled,true);}
 el.elements.damage.value="2.5";el.listeners.input();assert.match(el.output.textContent,/97.5/);f.actor.system.resources.health.value++;el.listeners.change();assert.equal(el.button.disabled,true);f.denied.add(f.actor.uuid);el.listeners.input();assert.equal(el.button.disabled,true);
});
test("PV/rodada ou usuário mudados durante diálogo não enviam intenção velha",async()=>{
 for(const change of [f=>f.actor.system.resources.health.value++,f=>f.combat.round++,f=>f.denied.add(f.actor.uuid),f=>game.user=f.gm,f=>f.docs.set(f.actor.uuid,{...f.actor})]){const f=setup();foundry.applications.api.DialogV2.wait=async c=>{const result=c.buttons.find(b=>b.action==="apply").callback(null,{form:form()});change(f);return result;};await assert.rejects(apply(f,view(f),{adjust:true}));assert.equal(f.collection.size,0);}
});
test("atalho rejeita assinatura/rodada antiga e nunca reaplica próxima atrasada",async()=>{
 const f=setup(),r=view(f);f.combat.round=7;await assert.rejects(apply(f,r));assert.equal(f.collection.size,0);const current=view(f),m=await apply(f,current);await f.process(m);game.user=f.owner;await assert.rejects(apply(f,current));assert.equal(healthWrites(f).length,1);assert.equal(f.record().ticks.round4,undefined);
});
test("dispensar, Undo e encerrar usam ações separadas sem aceite extra",async()=>{
 const f=setup();let m=await apply(f,view(f),{skip:true});await f.process(m);game.user=f.owner;let r=view(f);assert.equal(r.canUndo,true);m=await finishBrasas(f.actor,"fire",{signature:r.signature,undo:true});await f.process(m);game.user=f.owner;r=view(f);m=await finishBrasas(f.actor,"fire",{signature:r.signature});await f.process(m);assert.equal(f.record().status,"ended");assert.equal(healthWrites(f).length,0);
});
test("última parcela concluída mantém Undo mesmo sem encontro",async()=>{
 const f=setup({rounds:1}),m=await apply(f);await f.process(m);game.user=f.owner;game.combats.contents=[];game.combat=null;f.docs.delete(f.combat.uuid);const r=view(f);assert.equal(r.status,"expired");assert.equal(r.canUndo,true);assert.equal(r.canEnd,true);const undo=await finishBrasas(f.actor,"fire",{signature:r.signature,undo:true});await f.process(undo);assert.equal(f.actor.system.resources.health.value,100);
});
test("resposta perdida deixa de bloquear ações assim que journal real conclui",async()=>{
 const f=setup(),m=await apply(f);assert.equal(brasasContext(f.actor).waiting,true);f.loseResponse("before");await f.process(m);game.user=f.owner;assert.equal(f.response(m),undefined);assert.equal(brasasContext(f.actor).waiting,false);assert.equal(view(f).canUndo,true);
});
test("prepared sem resposta oferece recuperação em vez de aguardar indefinidamente",async()=>{
 const f=setup(),m=await apply(f);f.faults.push({tag:"commit",phase:"before"});await f.process(m);delete m.flags[ID].brasasResponse;game.user=f.owner;const ctx=brasasContext(f.actor);assert.equal(ctx.waiting,false);assert.equal(ctx.rows[0].canApply,false);assert.equal(ctx.interruptions[0].canReview,true);
 foundry.applications.api.DialogV2.wait=async c=>c.buttons.find(b=>b.action==="recover").callback(null,{form:form()});const recovery=await openBrasasRecovery(f.actor,m.id);await f.process(recovery);assert.equal(f.actor.system.resources.health.value,90);
});
test("recuperação divergente oferece só encerrar operação preservando PV/notas",async()=>{
 const f=setup(),m=await apply(f);f.faults.push({tag:"commit",phase:"before"});await f.process(m);f.actor.system.resources.health.value=70;f.record().reason="Ajuste posterior";game.user=f.owner;const before=copy(f.record());foundry.applications.api.DialogV2.wait=async c=>{assert.equal(c.buttons.some(b=>b.action==="recover"),false);return c.buttons.find(b=>b.action==="close").callback(null,{form:form()});};const close=await openBrasasRecovery(f.actor,m.id);await f.process(close);assert.equal(f.actor.system.resources.health.value,70);assert.deepEqual(f.record(),before);
});
test("cancelar recuperação ou perder OWNER durante diálogo não envia",async()=>{
 for(const change of [false,true]){const f=setup(),m=await apply(f);f.faults.push({tag:"commit",phase:"before"});await f.process(m);game.user=f.owner;const n=f.collection.size;foundry.applications.api.DialogV2.wait=async c=>{if(!change)return null;const result=c.buttons.find(b=>b.action==="close").callback(null,{form:form()});f.denied.add(f.actor.uuid);return result;};if(change)await assert.rejects(openBrasasRecovery(f.actor,m.id));else await openBrasasRecovery(f.actor,m.id);assert.equal(f.collection.size,n);}
});
test("mestre offline, cópia e prazo futuro não oferecem aplicação inválida",()=>{
 const f=setup();f.combat.round=2;let r=view(f);assert.equal(r.canApply,undefined);assert.equal(r.canAdjust,false);assert.equal(r.warning,undefined);game.users.activeGM=null;assert.equal(brasasContext(f.actor).offline,true);assert.equal(view(f).canEnd,false);f.record().actorUuid="Actor.original";r=view(f);assert.equal(r.foreign,true);assert.equal(r.canUndo,undefined);
});
test("template conserva ações claras e detalhes recolhidos, escapando notas",async()=>{
 const f=setup();f.record().reason='<img src=x onerror="bad">';const source=await readFile("templates/brasas-record.hbs","utf8"),html=Handlebars.compile(source)(view(f));assert.match(html,/Aplicar 10 PV/);assert.match(html,/Ajustar/);assert.match(html,/Dispensar/);assert.match(html,/Encerrar Brasas/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img|Actor.hidden|solicitar|justificativa|aceite|mestre/);assert.match(html,/<details><summary>Notas<\/summary>/);
});

test("callback de ajuste reautoriza antes de ler flags após perdaOWNER",async()=>{const f=setup(),r=view(f);foundry.applications.api.DialogV2.wait=async c=>{f.denied.add(f.actor.uuid);Object.defineProperty(f.actor,"flags",{get(){throw Error("private flags read");}});return c.buttons.find(b=>b.action==="apply").callback(null,{form:form()});};await assert.rejects(apply(f,r,{adjust:true}),/indisponíveis/);assert.equal(f.collection.size,0);});

test("interrupção continua visível com mestre offline e registro removido",async()=>{const f=setup();game.user=f.gm;f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.apply({operationId:"pending"}));delete f.actor.flags[ID].persistentEffects.fire;game.user=f.owner;game.users.activeGM=null;const ctx=brasasContext(f.actor);assert.equal(ctx.visible,true);assert.equal(ctx.offline,true);assert.equal(ctx.interruptions.length,1);assert.equal(ctx.interruptions[0].canReview,false);assert.equal(f.actor.system.resources.health.value,100);});
