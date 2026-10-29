import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import H from "handlebars";
import {controlMessages} from "./control-retry-message-fixture.mjs";
import {controlRetryContextForSheet,controlRetryDialogState,controlRetryWaiting,openOwnedControlRetry,openOwnedControlRecovery,installControlRetryPreview,sanitizeControlRetrySheet,refreshControlRetrySheets} from "../module/control-retry-ui.mjs";
import {runMasterOperation} from "../module/master-queue.mjs";
const ID="gods-battle-ss",copy=structuredClone,dialogTemplate=H.compile(await readFile("templates/control-retry-dialog.hbs","utf8"));
function setup(opts){const f=controlMessages(opts),render=foundry.applications.handlebars.renderTemplate;foundry.applications.handlebars.renderTemplate=(name,ctx)=>name.endsWith("/control-retry-dialog.hbs")?Promise.resolve(dialogTemplate(ctx)):render(name,ctx);foundry.applications.api={DialogV2:{wait:async()=>null}};game.user=f.owner;return f;}
const row=f=>controlRetryContextForSheet(f.actor).rows[0];
const open=(f,r=row(f))=>openOwnedControlRetry(f.actor,"controlA",{signature:r.signature});
function form(values={}){const f={elements:{attribute:{value:"sen"},bonus:{value:"0"},advantage:{value:"0"},useExtra:{checked:false},onSuccess:{value:"keep"},reason:{value:""}},listeners:{},output:{textContent:""},button:{disabled:false},querySelector:q=>q.includes("preview")?f.output:f.button,addEventListener(n,fn){f.listeners[n]=fn;},removeEventListener(n,fn){if(f.listeners[n]===fn)delete f.listeners[n];}};for(const [k,v]of Object.entries(values))Object.assign(f.elements[k],v);return f;}
const answer=(f,el=form())=>{foundry.applications.api.DialogV2.wait=async c=>{c.render?.(null,{form:el});return c.buttons.find(b=>b.action==="retry").callback(null,{form:el});};};
test("dono recebe contexto mínimo e fonte oculta nunca é lida",()=>{
 const f=setup({synthetic:true});for(const k of ["label","description"])Object.defineProperty(f.record,k,{get(){throw Error("private source label");}});Object.defineProperty(f.record.controlOrigin,"name",{get(){throw Error("private name");}});const ctx=controlRetryContextForSheet(f.actor);assert.equal(ctx.rows.length,1);assert.equal(ctx.rows[0].canRetry,true);assert.equal(ctx.rows[0].cost,1);assert.equal(ctx.rows[0].difficulty,20);assert.doesNotMatch(JSON.stringify(ctx),/Actor.hidden|secret|Nome privado/);assert.equal(ctx.rows[0].canResolveGM,undefined);
});
test("observador ou token oculto não lê flags nem recebe contexto",()=>{
 const f=setup();game.user=f.observer;Object.defineProperty(f.actor,"flags",{get(){throw Error("private flags");}});assert.equal(controlRetryContextForSheet(f.actor).visible,false);assert.equal(controlRetryWaiting(f.actor),false);assert.throws(()=>controlRetryDialogState(f.actor,"controlA"),/indisponível/);
 const g=setup({synthetic:true});g.actor.isToken=true;g.actor.token={hidden:true};assert.equal(controlRetryContextForSheet(g.actor).visible,false);
});
test("prévia/callback envia opções concretas pelo transporte, sem gasto ao abrir",async()=>{
 const f=setup(),el=form({bonus:{value:"1.5"},useExtra:{checked:true},reason:{value:"Nota opcional"}});answer(f,el);const m=await open(f);assert.equal(f.writes.length,0);assert.equal(f.stats.rolls,0);assert.equal(f.req(m).options.bonus,1.5);assert.equal(f.req(m).options.useExtra,true);await f.process(m);assert.equal(f.response(m).ok,true);assert.equal(f.actor.system.resources.cosmoExtra,2);assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(f.stats.rolls,1);
});
test("cancelar não envia nem ocupa fila; saldo insuficiente permite escolher extra",async()=>{
 const f=setup();let release,entered;const shown=new Promise(r=>entered=r);foundry.applications.api.DialogV2.wait=async()=>{entered();return new Promise(r=>release=r);};const pending=open(f);await shown;assert.equal(await runMasterOperation(async()=>42),42);release(null);await pending;assert.equal(f.messages.size,0);assert.equal(f.writes.length,0);
 const g=setup();g.actor.system.resources.cosmo.value=2;assert.equal(row(g).canRetry,true);const el=form();installControlRetryPreview(el,g.actor,"controlA",{signature:row(g).signature});assert.equal(el.button.disabled,true);el.elements.useExtra.checked=true;el.listeners.change();assert.equal(el.button.disabled,false);assert.match(el.output.textContent,/extra 3 → 2/);answer(g,el);const m=await open(g);await g.process(m);assert.equal(g.response(m).ok,true);
});
test("prévia rejeita valores vazios/inválidos e listener duplicado é substituído",()=>{
 const f=setup(),el=form(),s=row(f).signature;installControlRetryPreview(el,f.actor,"controlA",{signature:s});const first=el.listeners.input;installControlRetryPreview(el,f.actor,"controlA",{signature:s});assert.notEqual(first,el.listeners.input);assert.match(el.output.textContent,/2d10/);assert.equal(el.button.disabled,false);for(const v of ["","no","10001"]){el.elements.bonus.value=v;el.listeners.input();assert.equal(el.button.disabled,true);}el.elements.bonus.value="0";el.listeners.change();assert.equal(el.button.disabled,false);f.actor.system.combat.resistanceBonus++;el.listeners.input();assert.equal(el.button.disabled,true);
});
test("mudança financeira/contextual/OWNER durante diálogo recusa envio antigo",async()=>{
 for(const change of [f=>f.actor.system.resources.cosmo.value++,f=>f.combat.round++,f=>f.combat.flags[ID].actionControl.epoch="new",f=>f.record.controlOrigin.powerCosmic++,f=>f.denied.add(f.actor.uuid),f=>game.user=f.gm,f=>f.docs.set(f.actor.uuid,{...f.actor})]){const f=setup();foundry.applications.api.DialogV2.wait=async c=>{const result=c.buttons.find(b=>b.action==="retry").callback(null,{form:form()});change(f);return result;};await assert.rejects(open(f));assert.equal(f.messages.size,0);assert.equal(f.writes.length,0);}
});
test("perdaOWNER antes do callback é checada antes de flags",async()=>{
 const f=setup();foundry.applications.api.DialogV2.wait=async c=>{f.denied.add(f.actor.uuid);Object.defineProperty(f.actor,"flags",{get(){throw Error("private flags read");}});return c.buttons.find(b=>b.action==="retry").callback(null,{form:form()});};await assert.rejects(open(f),/indisponível/);assert.equal(f.messages.size,0);
});
test("nomes/notas/PV tardios não invalidam diálogo ou são sobrescritos",async()=>{
 const f=setup();foundry.applications.api.DialogV2.wait=async c=>{const result=c.buttons.find(b=>b.action==="retry").callback(null,{form:form()});f.record.label="Editado";f.record.reason="Tardia";f.actor.system.resources.health.value=44;return result;};const m=await open(f);await f.process(m);assert.equal(f.response(m).ok,true);assert.equal(f.record.reason,"Tardia");assert.equal(f.actor.system.resources.health.value,44);
});
test("prazo/rodada registrada/foreign/offline mostram estado sem ação financeira",async()=>{
 const f=setup();answer(f);const m=await open(f);await f.process(m);game.user=f.owner;assert.equal(row(f).canRetry,undefined);assert.match(row(f).warning,/registrada/);f.combat.round=4;assert.equal(row(f).canRetry,true);f.record.status="ended";assert.equal(row(f).displayState,"Encerrado");assert.equal(row(f).canRetry,undefined);
 const g=setup();game.users.activeGM=null;assert.equal(controlRetryContextForSheet(g.actor).offline,true);assert.equal(row(g).canRetry,false);g.record.actorUuid="Actor.other";assert.match(row(g).displayState,/inválido/);
});
test("waiting não prende journal prepared/applied/reviewed sem resposta",async()=>{
 const f=setup();answer(f);const m=await open(f);assert.equal(controlRetryWaiting(f.actor),true);f.faults.push({tag:"commit",phase:"before"});await f.process(m);delete m.flags[ID].controlRetryResponse;game.user=f.owner;assert.equal(controlRetryWaiting(f.actor),false);assert.equal(controlRetryContextForSheet(f.actor).interruptions[0].canReview,true);
});
test("recuperação do dono conclui só commit ausente e mantém dado salvo no histórico",async()=>{
 const f=setup();answer(f);const m=await open(f);f.faults.push({tag:"commit",phase:"before"});await f.process(m);game.user=f.owner;assert.equal(controlRetryContextForSheet(f.actor).interruptions[0].canComplete,true);foundry.applications.api.DialogV2.wait=async c=>c.buttons.find(b=>b.action==="recover").callback(null,{form:form()});const recover=await openOwnedControlRecovery(f.actor,m.id);await f.process(recover);game.user=f.owner;assert.equal(f.stats.rolls,1);assert.equal(row(f).history[0].dice.results.length,2);assert.equal(controlRetryContextForSheet(f.actor).interruptions.length,0);
});
test("divergência/rolling só oferecem encerrar operação preservando recursos",async()=>{
 for(const tag of ["rolling","commit"]){const f=setup();answer(f);const m=await open(f);f.faults.push({tag,phase:"after"});await f.process(m);if(tag==="commit"){f.operations()[m.id].status="prepared";f.actor.system.resources.cosmo.value=4;}game.user=f.owner;const before=copy(f.actor.system.resources),record=copy(f.record);foundry.applications.api.DialogV2.wait=async c=>{assert.equal(c.buttons.some(b=>b.action==="recover"),false);return c.buttons.find(b=>b.action==="close").callback(null,{form:form()});};const close=await openOwnedControlRecovery(f.actor,m.id);await f.process(close);assert.deepEqual(f.actor.system.resources,before);assert.deepEqual(f.record,record);assert.equal(f.operations()[m.id].status,"reviewed");}
});
test("publicação pendente recupera mesmo resultado com registro/encontro removidos",async()=>{
 const f=setup();answer(f);const m=await open(f);f.faults.push({tag:"card",phase:"after"});await f.process(m);delete f.actor.flags[ID].persistentEffects.controlA;f.docs.delete(f.combat.uuid);game.combats.contents=[];game.combat=null;game.user=f.owner;const ctx=controlRetryContextForSheet(f.actor);assert.equal(ctx.visible,true);assert.equal(ctx.rows.length,0);assert.equal(ctx.interruptions[0].canComplete,true);foundry.applications.api.DialogV2.wait=async c=>c.buttons.find(b=>b.action==="recover").callback(null,{form:form()});const request=await openOwnedControlRecovery(f.actor,m.id);await f.process(request);assert.equal(f.stats.cards,1);assert.equal(f.stats.rolls,1);
});
test("recovery cancelado ou mudado apósawait não envia",async()=>{
 const f=setup();answer(f);const m=await open(f);f.faults.push({tag:"commit",phase:"before"});await f.process(m);game.user=f.owner;foundry.applications.api.DialogV2.wait=async()=>null;await openOwnedControlRecovery(f.actor,m.id);assert.equal(f.messages.size,1);foundry.applications.api.DialogV2.wait=async c=>{const a=c.buttons.find(b=>b.action==="recover").callback(null,{form:form()});f.operations()[m.id].time++;return a;};await assert.rejects(openOwnedControlRecovery(f.actor,m.id),/Journal/);assert.equal(f.messages.size,1);
});
test("interrupção offline sem registro continua visível e observador limpa DOM",async()=>{
 const f=setup();answer(f);const m=await open(f);f.faults.push({tag:"commit",phase:"before"});await f.process(m);delete f.actor.flags[ID].persistentEffects.controlA;game.user=f.owner;game.users.activeGM=null;const ctx=controlRetryContextForSheet(f.actor);assert.equal(ctx.visible,true);assert.equal(ctx.offline,true);assert.equal(ctx.interruptions[0].canReview,false);let removed=0,rendered=0;const root={querySelectorAll:()=>[{remove(){removed++;}}]};f.actor.apps={qa:{rendered:true,element:root,render(){rendered++;}}};game.actors={contents:[f.actor]};game.user=f.observer;Object.defineProperty(f.actor,"flags",{get(){throw Error("private flags");}});sanitizeControlRetrySheet(root,f.actor);refreshControlRetrySheets();assert.ok(removed>=2);assert.equal(rendered,1);
});
test("templates escapam notas/dados e não reintroduzem regras gerais",async()=>{
 const f=setup();answer(f,form({reason:{value:'<img src=x onerror="evil">'}}));const m=await open(f);await f.process(m);game.user=f.owner;const template=H.compile(await readFile("templates/control-retry-record.hbs","utf8")),html=template(row(f));assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);assert.match(html,/Resistências e dados/);assert.doesNotMatch(html,/<details open/);const dialog=await readFile("templates/control-retry-dialog.hbs","utf8"),chat=await readFile("templates/control-retry-chat.hbs","utf8");assert.doesNotMatch(dialog+chat,/mestre rola|p\.206|p\.394|Estados manuais|condições assistidas são conferidos/);assert.match(chat,/<summary>Dados<\/summary>/);const css=await readFile("styles/sheets.css","utf8");assert.match(css,/\.message:has\(\[data-gods-battle-internal-control-retry\]\)/);
});
test("somenteGM conserva ações genéricas de prazo sem mudar fluxo do dono",()=>{
 const f=setup();game.user=f.gm;const r=row(f);assert.equal(r.canRetry,true);assert.equal(r.canResolveGM,true);assert.equal(r.canEndGM,true);assert.equal(typeof r.quickSignature,"string");game.user=f.owner;assert.equal(row(f).canResolveGM,undefined);assert.equal(row(f).canEndGM,undefined);
});

test("dados nativos incompatíveis não oferecem Concluir na recuperação",async()=>{
 const f=setup();answer(f);const m=await open(f);f.faults.push({tag:"commit",phase:"before"});await f.process(m);f.operations()[m.id].roll.terms[0].results[0].result=10;game.user=f.owner;assert.equal(controlRetryContextForSheet(f.actor).interruptions[0].canComplete,false);foundry.applications.api.DialogV2.wait=async c=>{assert.equal(c.buttons.some(b=>b.action==="recover"),false);return null;};await openOwnedControlRecovery(f.actor,m.id);assert.equal(f.actor.system.resources.cosmo.value,8);
});
test("perda de OWNER no await do template impede abrir diálogo ou ler flags",async()=>{
 const f=setup();foundry.applications.handlebars.renderTemplate=async()=>{f.denied.add(f.actor.uuid);Object.defineProperty(f.actor,"flags",{get(){throw Error("private flags");}});return "<p>Controle</p>";};foundry.applications.api.DialogV2.wait=async()=>{throw Error("dialog should not open");};await assert.rejects(open(f),/indisponível/);assert.equal(f.messages.size,0);
});
test("CE ilimitada aparece como estado real sem prometer retirar CE",async()=>{
 const f=setup();f.actor.system.resources.cosmo.unlimited=true;assert.equal(row(f).unlimited,true);foundry.applications.api.DialogV2.wait=async c=>{assert.match(c.buttons.find(b=>b.action==="retry").label,/CE ilimitada/);assert.doesNotMatch(c.buttons.find(b=>b.action==="retry").label,/1 CE/);return c.buttons.find(b=>b.action==="retry").callback(null,{form:form()});};const m=await open(f);await f.process(m);assert.equal(f.response(m).ok,true);assert.equal(f.actor.system.resources.cosmo.value,8);
});
