import test from "node:test";
import assert from "node:assert/strict";
import {readFile,readdir} from "node:fs/promises";
import H from "handlebars";
import {SheetStub} from "./foundry-stub.mjs";
import {controlMessages} from "./control-retry-message-fixture.mjs";
import {controlRetryContextForSheet} from "../module/control-retry-ui.mjs";
import {effectSheetContext,effectOperationContext,recoverEffect,resolveEffect} from "../module/effects.mjs";
import {retryControl} from "../module/control-retry.mjs";
import {KnightSheet} from "../module/sheets.mjs";
const dialogTemplate=H.compile(await readFile("templates/control-retry-dialog.hbs","utf8"));
const ID="gods-battle-ss",api={...foundry.applications.api},hooks=new Map();globalThis.Hooks={on(n,fn){if(!hooks.has(n))hooks.set(n,[]);hooks.get(n).push(fn);},once(n,fn){this.on(n,fn);}};await import("../module/main.mjs");
async function dispatch(n,...args){for(const fn of hooks.get(n)??[])await fn(...args);}
function setup(options){const f=controlMessages(options),render=foundry.applications.handlebars.renderTemplate;foundry.applications.handlebars.renderTemplate=(name,ctx)=>name.endsWith("/control-retry-dialog.hbs")?Promise.resolve(dialogTemplate(ctx)):render(name,ctx);foundry.applications.api={...api,DialogV2:{wait:async()=>null}};f.actor.items={contents:[],get:()=>null};f.actor.apps={};game.settings.register=()=>{};game.actors={contents:[f.actor]};globalThis.canvas={tokens:{placeables:[]}};const create=ChatMessage.create;ChatMessage.create=async data=>{const m=await create(data);if(m.update){const update=m.update.bind(m);m.update=async change=>{await update(change);await dispatch("updateChatMessage",m,change,{},game.user.id);};}return m;};game.user=f.owner;return f;}
function answer(f){foundry.applications.api.DialogV2.wait=async c=>c.buttons.find(b=>b.action==="retry").callback(null,{form:{elements:{attribute:{value:"sen"},bonus:{value:"0"},advantage:{value:"0"},useExtra:{checked:false},onSuccess:{value:"keep"},reason:{value:""}}}});}
const button=f=>({disabled:false,dataset:{effect:"controlA",signature:controlRetryContextForSheet(f.actor).rows[0].signature}});
const call=f=>KnightSheet.retryOwnedControl.call({actor:f.actor},null,button(f));
const run=async(f,m)=>{game.user=f.gm;await dispatch("createChatMessage",m,{},m.author.id);game.user=f.owner;};
test("ficha instalada inclui Controle único e preserva Atacar/Técnicas",async()=>{
 const f=setup(),ctx=await new KnightSheet(f.actor)._prepareContext({});assert.equal(ctx.controlRetries.rows.length,1);assert.equal(ctx.persistentEffects.filter(r=>r.isOwnedControl).length,1);assert.equal(effectSheetContext(f.actor).length,0);for(const key of ["retryOwnedControl","recoverOwnedControlRetry","attackTarget","useTechnique"])assert.equal(typeof KnightSheet.DEFAULT_OPTIONS.actions[key],"function");
});
test("handler instalado envia sem gasto e hook aplica uma vez em sintético",async()=>{
 const f=setup({synthetic:true});answer(f);const b=button(f),m=await KnightSheet.retryOwnedControl.call({actor:f.actor},null,b);assert.equal(b.disabled,false);assert.equal(f.writes.length,0);await run(f,m);await run(f,m);assert.equal(f.response(m).ok,true);assert.equal(f.stats.rolls,1);assert.equal(f.stats.cards,1);assert.equal(f.actor.system.resources.cosmo.value,7);
});
test("entradaGM histórica também usa novo journal/transporte sem executor paralelo",async()=>{
 const f=setup();game.user=f.gm;answer(f);const m=await retryControl(f.actor,"controlA");assert.equal(f.writes.length,0);await run(f,m);assert.equal(f.operations()[m.id].kind,"controlRetryOwned");assert.equal(Object.values(f.operations()).some(o=>o.kind==="controlRetry"),false);
});
test("ready retoma resposta perdida sem dado/CE/cartão repetidos",async()=>{
 const f=setup();answer(f);const m=await call(f);f.loseResponse("before");await run(f,m);assert.equal(f.response(m),undefined);game.user=f.gm;await dispatch("ready");assert.equal(f.response(m).replayed,true);assert.equal(f.stats.rolls,1);assert.equal(f.stats.cards,1);assert.equal(f.actor.system.resources.cosmo.value,7);
});
test("recoverEffect encaminha recuperação nova ao dono e não ao resolvedorPV",async()=>{
 const f=setup();answer(f);const m=await call(f);f.faults.push({tag:"commit",phase:"before"});await run(f,m);assert.equal(controlRetryContextForSheet(f.actor).interruptions[0].canReview,true);assert.equal(effectOperationContext(f.actor).length,0);foundry.applications.api.DialogV2.wait=async c=>c.buttons.find(b=>b.action==="recover").callback(null,{form:{elements:{reason:{value:""}}}});const recovery=await recoverEffect(f.actor,m.id);await run(f,recovery);assert.equal(f.actor.system.resources.cosmo.value,7);assert.equal(f.stats.rolls,1);
});
test("perdaOWNER durante await do prepareContext remove dados e recuperação próprios",async()=>{
 const f=setup();answer(f);const m=await call(f);f.faults.push({tag:"commit",phase:"before"});await run(f,m);const sheet=new KnightSheet(f.actor),pending=sheet._prepareContext({});f.denied.add(f.actor.uuid);const ctx=await pending;assert.equal(ctx.controlRetries.rows.length,0);assert.equal(ctx.controlRetries.interruptions.length,0);assert.equal(ctx.persistentEffects.some(r=>r.isOwnedControl),false);
});
test("observador não lê flags em contextos genéricos nem recuperação própria",async()=>{
 const f=setup();game.user=f.observer;Object.defineProperty(f.actor,"flags",{get(){throw Error("private flags");}});assert.deepEqual(effectSheetContext(f.actor),[]);assert.deepEqual(effectOperationContext(f.actor),[]);assert.equal(controlRetryContextForSheet(f.actor).visible,false);await assert.rejects(recoverEffect(f.actor,"pending"),/indisponível/);
});
test("outro efeito manual mantém prazo genérico, sem virar Controle pelo nome",()=>{
 const f=setup();f.actor.flags[ID].persistentEffects.other={id:"other",kind:"manual",actorUuid:f.actor.uuid,label:"Controle pelo nome",damage:0,status:"active",firstRound:2,lastRound:6,ticks:{},combatUuid:f.combat.uuid,combatantId:f.member.id};const rows=effectSheetContext(f.actor);assert.equal(rows.length,1);assert.equal(rows[0].id,"other");assert.equal(controlRetryContextForSheet(f.actor).rows.length,1);
});
test("GM conserva conferência manual de rodada sem CE ou condição",async()=>{
 const f=setup();game.user=f.gm;const r=controlRetryContextForSheet(f.actor).rows[0];assert.equal(r.canResolveGM,true);await resolveEffect(f.actor,"controlA",{quick:true,expectedRound:r.nextRound,expectedState:r.quickSignature});assert.equal(f.actor.flags[ID].persistentEffects.controlA.ticks.round2.damage,0);assert.equal(f.actor.system.resources.cosmo.value,8);assert.equal(f.stats.rolls,0);assert.equal(f.record.status,"active");
});
test("journal legado continua no contextoGM e não é confundido com novo",async()=>{
 const f=setup();game.user=f.gm;const resources={health:90,cosmo:8,cosmoExtra:3,cosmoReserved:2,cosmoOverload:0,unlimited:false};f.actor.flags[ID].effectOperations={legacy:{kind:"controlRetry",status:"prepared",actorUuid:f.actor.uuid,effectId:"controlA",before:{resources,record:structuredClone(f.record)}}};assert.equal(effectOperationContext(f.actor)[0].canReview,true);assert.equal(controlRetryContextForSheet(f.actor).interruptions.length,0);foundry.applications.api.DialogV2.wait=async c=>c.buttons.find(b=>b.action==="recover").callback(null,{form:{elements:{reason:{value:""}}}});await recoverEffect(f.actor,"legacy");assert.equal(f.operations().legacy.status,"failed");assert.equal(f.actor.system.resources.cosmo.value,8);
});
test("troca de usuário sanitiza DOM próprio antes do render agendado",async()=>{
 const f=setup();let removed=0,rendered=0;f.actor.apps.qa={rendered:true,element:{querySelectorAll:()=>[{remove(){removed++;}}]},render(){rendered++;}};game.user=f.observer;await dispatch("updateUser",f.owner,{},{});assert.ok(removed>0);assert.ok(rendered>0);
});
test("_onRender reautoriza depois do await antes de conservar controles próprios",async()=>{
 const f=setup(),sheet=new KnightSheet(f.actor);let release,entered,removed=0;const started=new Promise(r=>entered=r),before=SheetStub.prototype._onRender;SheetStub.prototype._onRender=async()=>{entered();return new Promise(r=>release=r);};const body={addEventListener(){}};sheet.element={querySelector:q=>q===".sheet-body"?body:null,querySelectorAll:()=>[{remove(){removed++;}}]};try{const pending=sheet._onRender({},{});await started;f.denied.add(f.actor.uuid);release();await pending;assert.ok(removed>0);}finally{if(before)SheetStub.prototype._onRender=before;else delete SheetStub.prototype._onRender;}
});
test("render interno instalado oculta mensagem antes de wrapper",async()=>{
 const f=setup();answer(f);const m=await call(f),html={dataset:{},hidden:false,querySelector:()=>null,closest:()=>null,setAttribute(){}};await dispatch("renderChatMessageHTML",m,html);assert.equal(html.hidden,true);assert.equal(html.dataset.godsBattleInternalControlRetry,"");
});
test("preload registra partial e painel renderiza linha própria uma única vez",async()=>{
 const f=setup(),loaded=[];globalThis.CONFIG={Actor:{dataModels:{}},Item:{dataModels:{}}};foundry.applications.apps={DocumentSheetConfig:{registerSheet(){}}};foundry.applications.handlebars.loadTemplates=async p=>loaded.push(...p);await dispatch("init");assert.ok(loaded.includes(`systems/${ID}/templates/control-retry-record.hbs`));const h=H.create();for(const file of await readdir("templates"))if(file.endsWith(".hbs"))h.registerPartial(`systems/${ID}/templates/${file}`,await readFile(`templates/${file}`,"utf8"));const ctx=await new KnightSheet(f.actor)._prepareContext({}),html=h.compile(await readFile("templates/effects-panel.hbs","utf8"))(ctx);assert.equal((html.match(/class="calculation-ledger control-retry-record"/g)??[]).length,1);assert.doesNotMatch(html,/Nome privado|Actor.hidden|Texto privado|Nova resistência de Controle · mestre/);assert.match(html,/data-action="retryOwnedControl"/);
});
