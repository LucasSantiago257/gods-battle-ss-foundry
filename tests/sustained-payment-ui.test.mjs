import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import H from "handlebars";
import {sustainMessages} from "./sustained-payment-message-fixture.mjs";
import {canManageOwnedSustained,payerSustainContext,payerSustainPreview,sustainPaymentDialogState,sustainPaymentWaiting,ownedSustainSheetContext,paySustainedFromSheet,endSustainedFromSheet,openOwnedSustainRecovery,installSustainPaymentPreview,sanitizeOwnedSustainSheet,refreshOwnedSustainSheets} from "../module/sustained-payment-ui.mjs";
import {runMasterOperation} from "../module/master-queue.mjs";
const ID="gods-battle-ss",copy=structuredClone,dialog=H.compile(await readFile("templates/sustained-payment-dialog.hbs","utf8")),template=H.compile(await readFile("templates/sustained-owned-record.hbs","utf8"));
function setup(o){const f=sustainMessages(o);game.user=f.owner;foundry.applications.handlebars={renderTemplate:async(_name,ctx)=>dialog(ctx)};foundry.applications.api={DialogV2:{wait:async()=>null}};return f;}
const row=f=>ownedSustainSheetContext(f.actor).rows[0],opts=(r,adjust=false)=>({signature:adjust?r.dialogSignature:r.paySignature,round:r.round,adjust}),form=(checked=false,reason="")=>{const f={elements:{useExtra:{checked},reason:{value:reason}},listeners:{},output:{textContent:""},button:{disabled:false},querySelector:q=>q.includes("preview")?f.output:f.button,addEventListener(k,fn){f.listeners[k]=fn;},removeEventListener(k,fn){if(f.listeners[k]===fn)delete f.listeners[k];}};return f;};
function answer(f,el=form()){foundry.applications.api.DialogV2.wait=async c=>{c.render?.(null,{form:el});return c.buttons.find(b=>b.action==="pay").callback(null,{form:el});};}
const adjust=(f,r=row(f))=>paySustainedFromSheet(f.actor,"sustain1",opts(r,true));
test("dono recebe valores e refs pr\u00f3prios sem ler Actor inimigo ou nome privado",async()=>{
 const f=setup({synthetic:true});Object.defineProperty(f.targetMember,"actor",{get(){if(game.user===f.owner)throw Error("enemy actor lookup");return f.target;}});const r=row(f);assert.equal(r.canPay,true);assert.equal(r.canEnd,true);assert.equal(r.classification,"Bronze");assert.equal(r.round,4);assert.doesNotMatch(JSON.stringify(r),/Nome privado|Nome da fonte|Actor.hidden|Descri/);const m=await paySustainedFromSheet(f.actor,"sustain1",opts(r));assert.equal(f.reads.every(x=>x===f.actor.uuid),true);await f.process(m);assert.equal(f.actor.system.resources.cosmoExtra,2);assert.equal(f.actor.system.resources.cosmo.value,8);
});
test("observador/usu\u00e1rio forjado/token oculto n\u00e3o leem flags",()=>{
 const f=setup();for(const user of [f.observer,{...f.gm}]){game.user=user;const original=f.actor.flags;Object.defineProperty(f.actor,"flags",{configurable:true,get(){throw Error("private flags");}});assert.deepEqual(ownedSustainSheetContext(f.actor),{visible:false,rows:[],interruptions:[],waiting:false,offline:false});assert.equal(sustainPaymentWaiting(f.actor),false);Object.defineProperty(f.actor,"flags",{configurable:true,writable:true,value:original});}game.user=f.owner;f.actor.isToken=true;f.actor.token={hidden:true};assert.equal(canManageOwnedSustained(f.actor),false);
});
test("atalho usa extra primeiro sem di\u00e1logo e Ajustar conserva escolha expl\u00edcita",async()=>{
 const f=setup();foundry.applications.api.DialogV2.wait=()=>{throw Error("no dialog");};const r=row(f);assert.match(r.payLabel,/CE extra/);const m=await paySustainedFromSheet(f.actor,"sustain1",opts(r));assert.equal(f.req(m).options.useExtra,true);assert.equal(f.writes.length,0);await f.process(m);assert.equal(f.actor.system.resources.cosmoExtra,2);
 const g=setup();answer(g,form(false));const next=await adjust(g);assert.equal(g.req(next).options.useExtra,false);await g.process(next);assert.equal(g.actor.system.resources.cosmo.value,7);assert.equal(g.actor.system.resources.cosmoExtra,3);
});
test("Escape/cancelar n\u00e3o envia mensagem, grava ou ocupa fila",async()=>{
 const f=setup();let queueUsed=false;foundry.applications.api.DialogV2.wait=async()=>{await runMasterOperation(()=>{queueUsed=true;});return null;};await adjust(f);assert.equal(queueUsed,true);assert.equal(f.messages.size,0);assert.equal(f.writes.length,0);
});
test("saldo atual reservado permite abrir Ajustar e selecionar extra",async()=>{
 const f=setup();f.actor.system.resources.cosmo.value=2;let r=row(f);assert.equal(r.canPay,true);assert.equal(r.canAdjust,true);const el=form(false);installSustainPaymentPreview(el,f.actor,"sustain1",{signature:r.dialogSignature});assert.equal(el.button.disabled,true);el.elements.useExtra.checked=true;el.listeners.change();assert.equal(el.button.disabled,false);assert.match(el.output.textContent,/extra 3/);answer(f,el);const m=await adjust(f);await f.process(m);assert.equal(f.actor.system.resources.cosmo.value,2);assert.equal(f.actor.system.resources.cosmoExtra,2);
});
test("semCE real recusa confirma\u00e7\u00e3o e conserva End dispon\u00edvel",async()=>{
 const f=setup();f.actor.system.resources.cosmo.value=2;f.actor.system.resources.cosmoExtra=0;const r=row(f);assert.equal(r.canPay,undefined);assert.equal(r.canAdjust,true);assert.equal(r.canEnd,true);assert.match(r.warning,/insuficiente/);answer(f,form(true));await assert.rejects(adjust(f),/insuficiente/);assert.equal(f.messages.size,0);const m=await endSustainedFromSheet(f.actor,"sustain1",{signature:r.signature});await f.process(m);assert.equal(f.record.status,"ended");assert.equal(f.actor.system.resources.cosmo.value,2);
});
test("ilimitada mostra estado real e registra sem escrever recursos",async()=>{
 const f=setup();f.actor.system.resources.cosmo.unlimited=true;const r=row(f);assert.equal(r.unlimited,true);assert.match(r.payLabel,/ilimitada/);const before=copy(f.actor.system.resources),m=await paySustainedFromSheet(f.actor,"sustain1",opts(r));await f.process(m);assert.deepEqual(f.actor.system.resources,before);game.user=f.owner;assert.equal(row(f).history[0].unlimited,true);
});
test("assinaturas excluem notas/PV/recursos alheios e recusam mudan\u00e7a financeira/rodada",async()=>{
 const f=setup(),r=row(f);f.record.reason="Nota tardia";f.actor.system.resources.health.value=12;f.actor.system.resources.cosmoOverload=9;assert.equal(row(f).paySignature,r.paySignature);assert.equal(sustainPaymentDialogState(f.actor,"sustain1"),r.dialogSignature);f.actor.system.resources.cosmo.value--;await assert.rejects(paySustainedFromSheet(f.actor,"sustain1",opts(r)),/mudou/);assert.equal(f.messages.size,0);
 const g=setup(),old=row(g);g.advance();await assert.rejects(paySustainedFromSheet(g.actor,"sustain1",opts(old)),/mudou/);
});
test("OWNER/GM/Actor perdidos durante render ou di\u00e1logo impedem envio",async()=>{
 for(const stage of ["render","dialog","read"])for(const mutate of [f=>f.denied.add(f.actor.uuid),f=>game.users.activeGM=null,f=>f.docs.set(f.actor.uuid,{...f.actor})]){const f=setup();if(stage==="render")foundry.applications.handlebars.renderTemplate=async()=>{mutate(f);return "template";};if(stage==="read")f.hooks.resolve=()=>mutate(f);foundry.applications.api.DialogV2.wait=async c=>{if(stage==="dialog")mutate(f);return c.buttons.find(b=>b.action==="pay").callback(null,{form:form()});};await assert.rejects(adjust(f));assert.equal(f.messages.size,0);assert.equal(f.writes.length,0);}
});
test("listeners de pr\u00e9via n\u00e3o duplicam e desativam bot\u00e3o ap\u00f3s perdaOWNER",()=>{
 const f=setup(),r=row(f),el=form();installSustainPaymentPreview(el,f.actor,"sustain1",{signature:r.dialogSignature});const first=el.listeners.input;installSustainPaymentPreview(el,f.actor,"sustain1",{signature:r.dialogSignature});assert.notEqual(first,el.listeners.input);assert.equal(Object.keys(el.listeners).length,2);f.denied.add(f.actor.uuid);el.listeners.input();assert.equal(el.button.disabled,true);
});
test("prepared limpa espera e mant\u00e9m recupera\u00e7\u00e3o acess\u00edvel ao dono",async()=>{
 const f=setup(),m=await paySustainedFromSheet(f.actor,"sustain1",opts(row(f)));assert.equal(sustainPaymentWaiting(f.actor),true);assert.equal(row(f).canEnd,false);f.faults.push({phase:"before",tag:"commit"});await f.process(m);game.user=f.owner;assert.equal(sustainPaymentWaiting(f.actor),false);const ctx=ownedSustainSheetContext(f.actor);assert.equal(ctx.interruptions[0].canComplete,true);foundry.applications.api.DialogV2.wait=async c=>c.buttons.find(b=>b.action==="recover").callback(null,{form:form()});const next=await openOwnedSustainRecovery(f.actor,m.id);await f.process(next);assert.equal(f.actor.system.resources.cosmoExtra,2);
});
test("after recupera somente status sem encontro/alvo e preserva notas tardias",async()=>{
 const f=setup(),m=await paySustainedFromSheet(f.actor,"sustain1",opts(row(f)));await f.process(m);f.operations()[m.id].status="prepared";f.record.reason="Tardia";game.combat=null;game.combats.contents=[];f.docs.delete(f.target.uuid);game.user=f.owner;const ctx=ownedSustainSheetContext(f.actor);assert.equal(ctx.interruptions[0].canComplete,true);const before=copy(f.actor.system.resources);foundry.applications.api.DialogV2.wait=async c=>c.buttons.find(b=>b.action==="recover").callback(null,{form:form()});const next=await openOwnedSustainRecovery(f.actor,m.id);await f.process(next);assert.deepEqual(f.actor.system.resources,before);assert.equal(f.record.reason,"Tardia");
});
test("diverg\u00eancia s\u00f3 oferece close e preserva CE/registro",async()=>{
 const f=setup(),m=await paySustainedFromSheet(f.actor,"sustain1",opts(row(f)));f.faults.push({phase:"before",tag:"commit"});await f.process(m);f.actor.system.resources.cosmo.value=3;game.user=f.owner;const before=copy(f.actor.system.resources),record=copy(f.record);foundry.applications.api.DialogV2.wait=async c=>{assert.equal(c.buttons.some(b=>b.action==="recover"),false);return c.buttons.find(b=>b.action==="close").callback(null,{form:form()});};const next=await openOwnedSustainRecovery(f.actor,m.id);await f.process(next);assert.equal(f.operations()[m.id].status,"reviewed");assert.deepEqual(f.actor.system.resources,before);assert.deepEqual(f.record,record);
});
test("recovery cancelado ou modificado durante await n\u00e3o envia",async()=>{
 const f=setup(),m=await paySustainedFromSheet(f.actor,"sustain1",opts(row(f)));f.faults.push({phase:"before",tag:"commit"});await f.process(m);game.user=f.owner;await openOwnedSustainRecovery(f.actor,m.id);assert.equal(f.messages.size,1);foundry.applications.api.DialogV2.wait=async c=>{f.operations()[m.id].time++;return c.buttons.find(b=>b.action==="recover").callback(null,{form:form()});};await assert.rejects(openOwnedSustainRecovery(f.actor,m.id),/Journal/);assert.equal(f.messages.size,1);
});
test("interrup\u00e7\u00e3o offline sem registro continua vis\u00edvel e sanitiza DOM",async()=>{
 const f=setup(),m=await paySustainedFromSheet(f.actor,"sustain1",opts(row(f)));f.faults.push({phase:"before",tag:"commit"});await f.process(m);delete f.actor.flags[ID].persistentEffects.sustain1;game.user=f.owner;game.users.activeGM=null;const ctx=ownedSustainSheetContext(f.actor);assert.equal(ctx.visible,true);assert.equal(ctx.offline,true);assert.equal(ctx.interruptions[0].canReview,false);let removed=0,rendered=0;const root={querySelectorAll:()=>[{remove(){removed++;}}]};f.actor.apps={qa:{rendered:true,element:root,render(){rendered++;}}};game.actors={contents:[f.actor]};game.user=f.observer;Object.defineProperty(f.actor,"flags",{get(){throw Error("private flags");}});sanitizeOwnedSustainSheet(root,f.actor);refreshOwnedSustainSheets();assert.ok(removed>=2);assert.equal(rendered,1);
});
test("initial,perfil \u00fanico e lacuna mostram estados sem nova frequ\u00eancia",async()=>{
 const f=setup();f.combat.round=3;assert.match(row(f).displayState,/Inicial/);assert.equal(row(f).canPay,undefined);assert.equal(row(f).canEnd,true);f.combat.round=8;const r=row(f);assert.deepEqual(r.gap,{first:4,last:7});assert.equal(r.maintenancePending,true);assert.equal(r.pendingRounds,0);
 const g=setup({mode:"once"});const m=await paySustainedFromSheet(g.actor,"sustain1",opts(row(g)));await g.process(m);game.user=g.owner;g.advance();assert.match(row(g).displayState,/nica registrada/);assert.equal(row(g).canPay,undefined);assert.equal(row(g).canEnd,true);
});
test("End continua dispon\u00edvel sem encontro/CE v\u00e1lida e sem janela de aceite",async()=>{
 const f=setup();game.combat=null;game.combats.contents=[];f.actor.system.resources.cosmo.value=NaN;const r=row(f);assert.equal(r.canEnd,true);foundry.applications.api.DialogV2.wait=()=>{throw Error("unexpected acceptance");};const m=await endSustainedFromSheet(f.actor,"sustain1",{signature:r.signature});await f.process(m);assert.equal(f.record.status,"ended");assert.equal(Number.isNaN(f.actor.system.resources.cosmo.value),true);
});
test("templates escapam notas e usam detalhes opcionais sem textos gerais",async()=>{
 const f=setup();answer(f,form(false,'<img src=x onerror="evil">'));const m=await adjust(f);await f.process(m);game.user=f.owner;const html=template(row(f));assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);assert.match(html,/<summary>Pagamentos<\/summary>/);assert.doesNotMatch(html,/<details open|Nome privado/);const source=await readFile("templates/sustained-payment-dialog.hbs","utf8");assert.doesNotMatch(source,/duelo|aprision|confira na mesa|aprova|justifica/i);assert.match(source,/<summary>Notas<\/summary>/);const css=await readFile("styles/sheets.css","utf8");assert.match(css,/message:has\(\[data-gods-battle-internal-sustain-payment\]\)/);
});
test("journal adulterado/copiado n\u00e3o oferece concluir nem executa comando",async()=>{
 const f=setup(),m=await paySustainedFromSheet(f.actor,"sustain1",opts(row(f)));f.faults.push({phase:"before",tag:"commit"});await f.process(m);f.operations()[m.id].after.resources.current=999;game.user=f.owner;assert.equal(ownedSustainSheetContext(f.actor).interruptions[0].canComplete,false);foundry.applications.api.DialogV2.wait=async c=>{assert.equal(c.buttons.some(b=>b.action==="recover"),false);return null;};await openOwnedSustainRecovery(f.actor,m.id);assert.equal(f.messages.size,1);
});
test("perdaOWNER no End ou recovery ap\u00f3s await bloqueia callback sem ler flags",async()=>{
 const f=setup(),r=row(f);f.hooks.resolve=()=>f.denied.add(f.actor.uuid);await assert.rejects(endSustainedFromSheet(f.actor,"sustain1",{signature:r.signature}));assert.equal(f.messages.size,0);
 const g=setup(),m=await paySustainedFromSheet(g.actor,"sustain1",opts(row(g)));g.faults.push({phase:"before",tag:"commit"});await g.process(m);game.user=g.owner;foundry.applications.api.DialogV2.wait=async c=>{g.denied.add(g.actor.uuid);return c.buttons.find(b=>b.action==="close").callback(null,{form:form()});};await assert.rejects(openOwnedSustainRecovery(g.actor,m.id));assert.equal(g.messages.size,1);
});
