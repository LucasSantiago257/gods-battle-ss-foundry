import test from "node:test";
import assert from "node:assert/strict";
import {readFile,readdir} from "node:fs/promises";
import Handlebars from "handlebars";
import {knight,SheetStub} from "./foundry-stub.mjs";
import {messages} from "./brasas-message-fixture.mjs";
import {copy,healthWrites} from "./brasas-fixture.mjs";
import {brasasContext,sanitizeBrasasSheet,installBrasasPreview} from "../module/brasas-ui.mjs";
import {effectSheetContext,effectPanelContext,effectOperationContext,resolveEffect,recoverEffect} from "../module/effects.mjs";
import {KnightSheet} from "../module/sheets.mjs";
const ID="gods-battle-ss",baseFoundry=foundry,hooks=new Map();
globalThis.Hooks={on(n,fn){if(!hooks.has(n))hooks.set(n,[]);hooks.get(n).push(fn);},once(n,fn){this.on(n,fn);}};
await import("../module/main.mjs");
async function dispatch(name,...args){for(const fn of hooks.get(name)??[])await fn(...args);}
function setup(options){
 const f=messages(options),random=foundry.utils.randomID;globalThis.foundry=baseFoundry;foundry.utils={...foundry.utils,randomID:random};
 foundry.applications.api.DialogV2={wait:async()=>null};
 f.actor.system=knight();f.actor.system.resources.health.value=100;f.actor.items={contents:[],get:()=>null};f.actor.isOwner=true;f.actor.apps={};
 game.settings={get:()=>"rank",register(){}};game.actors={contents:[f.actor]};globalThis.canvas={tokens:{placeables:[]}};
 const create=ChatMessage.create;ChatMessage.create=async data=>{const m=await create(data),update=m.update.bind(m);m.update=async change=>{await update(change);await dispatch("updateChatMessage",m,change,{},game.user.id);};return m;};
 game.user=f.owner;return f;
}
const button=f=>{const r=brasasContext(f.actor).rows[0];return {disabled:false,dataset:{effect:"fire",round:String(r.nextRound),signature:r.applySignature}};};
test("ficha instalada inclui um único registro próprio e preserva Atacar/Técnicas",async()=>{
 const f=setup(),ctx=await new KnightSheet(f.actor)._prepareContext({});assert.equal(ctx.brasas.rows.length,1);assert.equal(ctx.persistentEffects.filter(r=>r.isBrasas).length,1);assert.equal(effectSheetContext(f.actor).length,0);assert.equal(typeof KnightSheet.DEFAULT_OPTIONS.actions.attackTarget,"function");assert.equal(typeof KnightSheet.DEFAULT_OPTIONS.actions.useTechnique,"function");for(const name of ["applyBrasas","adjustBrasas","skipBrasas","undoBrasas","endBrasas","recoverBrasas"])assert.equal(typeof KnightSheet.DEFAULT_OPTIONS.actions[name],"function");
});
test("handler instalado aplica pelo hook autenticado uma vez e libera botão",async()=>{
 const f=setup({synthetic:true}),b=button(f),m=await KnightSheet.applyBrasas.call({actor:f.actor},null,b);assert.equal(b.disabled,false);assert.equal(f.writes.length,0);game.user=f.gm;await dispatch("createChatMessage",m,{},f.owner.id);await dispatch("createChatMessage",m,{},f.owner.id);assert.equal(f.response(m).ok,true);assert.equal(healthWrites(f).length,1);assert.equal(f.actor.system.resources.health.value,90);
});
test("hook ready retoma resposta perdida sem repetir aplicação",async()=>{
 const f=setup(),m=await KnightSheet.applyBrasas.call({actor:f.actor},null,button(f));f.loseResponse("before");game.user=f.gm;await dispatch("createChatMessage",m,{},f.owner.id);assert.equal(f.response(m),undefined);await dispatch("ready");assert.equal(f.response(m).replayed,true);assert.equal(healthWrites(f).length,1);
});
test("recovery próprio aparece ao dono e some após perdaOWNER durante prepareContext",async()=>{
 const f=setup();game.user=f.gm;f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.apply({operationId:"pending"}));game.user=f.owner;const sheet=new KnightSheet(f.actor),ctx=await sheet._prepareContext({});assert.equal(ctx.brasas.interruptions[0].canReview,true);assert.equal(ctx.effectInterruptions.some(o=>o.kind==="brasasParcel"),false);const pending=sheet._prepareContext({});f.denied.add(f.actor.uuid);const lost=await pending;assert.equal(lost.brasas.rows.length,0);assert.equal(lost.brasas.interruptions.length,0);
});
test("última parcela expirada mantém Undo fora do histórico até deixar de ser válida",async()=>{
 const f=setup({rounds:1});game.user=f.gm;await f.apply();game.user=f.owner;let row=brasasContext(f.actor).rows[0],panel=effectPanelContext([row,{id:"manual",status:"ended"}]);assert.equal(panel.active[0].id,"fire");assert.equal(panel.history[0].id,"manual");f.actor.system.resources.health.value++;row=brasasContext(f.actor).rows[0];panel=effectPanelContext([row]);assert.equal(row.canUndo,false);assert.equal(panel.active.length,0);assert.equal(panel.history.length,1);
});
test("endereços genéricos de Brasas encaminham ao novo journal e nunca ao resolvedor antigo",async()=>{
 const f=setup();const row=brasasContext(f.actor).rows[0],m=await resolveEffect(f.actor,"fire",{quick:true,expectedRound:row.nextRound,expectedState:row.applySignature});assert.equal(f.writes.length,0);game.user=f.gm;await dispatch("createChatMessage",m,{},f.owner.id);assert.equal(f.operations()[m.id].kind,"brasasParcel");assert.ok(f.record().brasasLastOperation);assert.equal(effectOperationContext(f.actor).some(o=>o.kind==="brasasParcel"),false);
});
test("journal legado preparado conserva recuperaçãoGM anterior sem debitar",async()=>{
 const f=setup(),before=copy(f.record());f.actor.flags[ID].effectOperations={legacy:{status:"prepared",actorUuid:f.actor.uuid,effectId:"fire",round:3,before:{health:100,record:before},after:{health:90,record:{...copy(before),status:"expired",ticks:{round3:{round:3,damage:10}}}}}};game.user=f.gm;
 foundry.applications.api.DialogV2.wait=async c=>c.buttons.find(b=>b.action==="review").callback(null,{form:{elements:{reason:{value:""}}}});
 await recoverEffect(f.actor,"legacy");assert.equal(f.operations().legacy.status,"failed");assert.equal(f.actor.system.resources.health.value,100);assert.deepEqual(f.record(),before);assert.equal(brasasContext(f.actor).rows[0].canApply,true);
});
test("observador não lê flags pelas rotas de resolver/encerrar/recuperar Brasas",async()=>{
 const f=setup();game.user=f.observer;Object.defineProperty(f.actor,"flags",{get(){throw Error("private flags");}});await assert.rejects(resolveEffect(f.actor,"fire"),/indisponível/);await assert.rejects(recoverEffect(f.actor,"pending"),/indisponível/);assert.equal(brasasContext(f.actor).visible,false);
});
test("troca de usuário remove DOM próprio antes de render assíncrono",async()=>{
 const f=setup();let removed=0,rendered=0;const element={querySelectorAll:()=>[{remove(){removed++;}}]};f.actor.apps.sheet={rendered:true,element,render(){rendered++;}};f.denied.add(f.actor.uuid);await dispatch("updateUser",f.owner,{},{});assert.ok(removed>=1);assert.ok(rendered>=1);
 const flags=f.actor.flags;Object.defineProperty(f.actor,"flags",{get(){throw Error("private flags");}});sanitizeBrasasSheet(element,f.actor);assert.ok(removed>=2);Object.defineProperty(f.actor,"flags",{configurable:true,value:flags});
});
test("render interno instalado oculta mensagem antes de receber wrapper",async()=>{
 const f=setup(),m=await KnightSheet.applyBrasas.call({actor:f.actor},null,button(f)),html={dataset:{},hidden:false,querySelector:()=>null,closest:()=>null,setAttribute(){}};await dispatch("renderChatMessageHTML",m,html);assert.equal(html.hidden,true);assert.equal(html.dataset.godsBattleInternalBrasas,"");const css=await readFile("styles/sheets.css","utf8");assert.match(css,/\.message:has\(\[data-gods-battle-internal-brasas\]\)/);
});
test("preload instalado registra partial de Brasas e template delega sem duplicar texto antigo",async()=>{
 const f=setup(),loaded=[];globalThis.CONFIG={Actor:{dataModels:{}},Item:{dataModels:{}}};foundry.applications.apps={DocumentSheetConfig:{registerSheet(){}}};foundry.applications.handlebars={loadTemplates:async paths=>loaded.push(...paths)};await dispatch("init");assert.ok(loaded.includes(`systems/${ID}/templates/brasas-record.hbs`));const h=Handlebars.create();for(const file of await readdir("templates"))if(file.endsWith(".hbs"))h.registerPartial(`systems/${ID}/templates/${file}`,await readFile(`templates/${file}`,"utf8"));const ctx=await new KnightSheet(f.actor)._prepareContext({}),html=h.compile(await readFile("templates/effects-panel.hbs","utf8"))(ctx);assert.equal((html.match(/class="calculation-ledger brasas-record"/g)??[]).length,1);assert.doesNotMatch(html,/Origem:|Anotação manual|Actor.hidden/);
});
test("prévia reinstalada remove listeners anteriores",()=>{
 const f=setup(),events=new Map(),out={},control={},form={elements:{damage:{value:"10"},reason:{value:""}},querySelector:q=>q.includes("preview")?out:control,addEventListener(n,fn){if(!events.has(n))events.set(n,new Set());events.get(n).add(fn);},removeEventListener(n,fn){events.get(n)?.delete(fn);}};const r=brasasContext(f.actor).rows[0],options={signature:r.applySignature,round:r.nextRound};installBrasasPreview(form,f.actor,"fire",options);installBrasasPreview(form,f.actor,"fire",options);assert.equal(events.get("input").size,1);assert.equal(events.get("change").size,1);
});
