import {holdDecisionOutsideQueue} from "./held-dialog.mjs";
import {runMasterOperation} from "../module/master-queue.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {knight,content} from "./foundry-stub.mjs";
import {BRASAS,brasasSource,effectDefinition,effectView,effectTickPlan,effectRecords,nextEffectRound,effectState} from "../module/effect-rules.mjs";
import {registerEffect,resolveEffect as resolveRoute,endEffect as endRoute,recoverEffect as recoverRoute,effectSheetContext as genericContext,effectPanelContext,effectSources} from "../module/effects.mjs";
import {assertNoTechniqueInterruption} from "../module/master-queue.mjs";
import {componentUuid} from "../module/technique-builder-rules.mjs";
import {brasasContext} from "../module/brasas-ui.mjs";
import {enqueueBrasasRequest} from "../module/brasas-requests.mjs";
// Exercise both the routed action and its real authenticated GM processing.
const effectSheetContext=actor=>[...genericContext(actor),...brasasContext(actor).rows];
async function settle(actor,value){if(!value?.flags?.["gods-battle-ss"]?.brasasRequest)return value;const previous=game.user;game.user=game.users.activeGM;try{await enqueueBrasasRequest(value,{},value.author.id);}finally{game.user=previous;}const response=value.flags["gods-battle-ss"].brasasResponse;if(!response?.ok)throw Error(response?.error??"Resposta ausente");return actor.flags["gods-battle-ss"].effectOperations?.[value.id]?.tick??response;}
const resolveEffect=async(actor,...args)=>settle(actor,await resolveRoute(actor,...args));
const endEffect=async(actor,...args)=>settle(actor,await endRoute(actor,...args));
const recoverEffect=async(actor,...args)=>settle(actor,await recoverRoute(actor,...args));
const ID="gods-battle-ss";
function patch(obj,data){for(const [path,value] of Object.entries(data)){let o=obj;const parts=path.split(".");for(const p of parts.slice(0,-1))o=o[p]??={};const last=parts.at(-1);if(last.startsWith("-="))delete o[last.slice(2)];else o[last]=structuredClone(value);}}
function fixture(){
 const gm={id:"gm",isGM:true,active:true},player={id:"p",isGM:false},actor={uuid:"Actor.target",name:"Alvo de exercício",type:"knight",isOwner:true,system:knight(),flags:{[ID]:{unrelated:"conservar"}},items:{contents:[]},testUserPermission:user=>actor.isOwner&&(user===gm||user===player),async update(data){this.updates.push(data);patch(this,data);},updates:[]};actor.system.resources.health.value=100;actor.system.resources.cosmo.value=9;actor.system.conditions.afraid=true;
 const caster={uuid:"Actor.caster",name:"Usuário de exercício",type:"knight",system:knight(),items:{contents:[],get:id=>caster.items.contents.find(i=>i.id===id)}};
 const item={id:"fire",uuid:"Actor.caster.Item.fire",parent:caster,type:"technique",name:"Chamas de exercício",system:{...content(),effectKind:"damage",classification:"silver"},flags:{[ID]:{techniqueConstructionId:"saved",techniqueConstructionHistory:{saved:{primary:{uuid:componentUuid("13841831d802c5be")},components:[{uuid:componentUuid(BRASAS.id),key:BRASAS.key,type:"bigbang",rank:1}]}}}}};caster.items.contents.push(item);
 const combat={uuid:"Combat.example",started:true,round:2,turn:0,combatants:{contents:[{id:"targetMember",actor}]}};
 const answers=[];let n=0;
 globalThis.game={user:gm,users:{activeGM:gm,get:id=>id===gm.id?gm:id===player.id?player:null},actors:{contents:[actor,caster]},combat,combats:{contents:[combat]}};
 globalThis.canvas={tokens:{placeables:[]}};globalThis.fromUuid=async uuid=>uuid===actor.uuid?actor:uuid===item.uuid?item:uuid===combat.uuid?combat:null;
 const messages=new Map();game.messages={get:id=>messages.get(id),get contents(){return [...messages.values()];}};globalThis.ChatMessage={async create(data){const m={id:`effect${++n}`,author:game.user,blind:false,isContentVisible:true,...structuredClone(data),async update(change){patch(m,change);}};messages.set(m.id,m);return m;}};
 foundry.utils={randomID:()=>`effect${++n}`};foundry.applications.handlebars={renderTemplate:async()=>"template"};foundry.applications.api.DialogV2={wait:async config=>{const raw=answers.shift(),a=typeof raw==="function"?await raw():raw;if(config.window?.title==="Brasas interrompidas"&&a&&Object.hasOwn(a,"repaired"))return {action:a.repaired?"close":"recover",reason:a.reason};return a??null;}};
 const definition={kind:"brasas",sourceUuid:item.uuid,rounds:2,firstOffset:1,reason:"Ativação e resistência conferidas; duração final de duas rodadas.",description:"Efeito aplicado pelo mestre.",checked:true};
 const resolution={checked:true,skip:false,reason:"Rodada e dano conferidos."};
 return {actor,caster,item,combat,gm,player,answers,definition,resolution,async create(overrides={}){answers.push({...definition,...overrides});return registerEffect(actor);}};
}
test("Brasas exige identidade canônica e classificação, nunca apenas o nome",async()=>{
 const f=fixture(),catalog=JSON.parse(await readFile("data/catalog/bigbangs.json","utf8")),entry=catalog.find(e=>e._id===BRASAS.id);assert.equal(entry.flags[ID].source.key,BRASAS.key);
 for(const [tier,damage] of Object.entries(BRASAS.damage)){f.item.system.classification=tier;assert.equal(brasasSource(f.item).damage,damage);}
 f.item.flags[ID].techniqueConstructionHistory.saved.components[0].uuid=componentUuid("notBrasas");assert.throws(()=>brasasSource(f.item),/canônico/);assert.equal(effectSources().length,0);
});
test("composição mista, duplicata, rascunho e graduação inválida ficam manuais",()=>{
 for(const change of [c=>c.rank=2,c=>c.key="forged",c=>c.type="increment"]){const f=fixture();change(f.item.flags[ID].techniqueConstructionHistory.saved.components[0]);assert.throws(()=>brasasSource(f.item));}
 const f=fixture(),components=f.item.flags[ID].techniqueConstructionHistory.saved.components;components.push({...components[0]});assert.throws(()=>brasasSource(f.item));components.pop();components.push({key:"bigbang:primordial:Controle"});assert.throws(()=>brasasSource(f.item));components.pop();f.item.flags[ID].techniqueDraft={};assert.throws(()=>brasasSource(f.item));
});
test("duração, início e revisão são explícitos e não interpretados pelo texto",()=>{
 const f=fixture(),source=brasasSource(f.item);for(const invalid of [{rounds:0},{rounds:1.5},{rounds:1001},{firstOffset:2},{reason:42},{reason:"x".repeat(2001)},{kind:"invalid"}])assert.throws(()=>effectDefinition({...f.definition,...invalid},source));
 const d=effectDefinition({...f.definition,kind:"manual",label:"Paralisia conferida",page:"regra de campanha"});assert.equal(d.damage,0);assert.equal(d.source,null);
});
test("registro preserva recursos, condições, flags antigas e duração final",async()=>{
 const f=fixture(),before=structuredClone(f.actor.system),record=await f.create();assert.deepEqual(f.actor.system,before);assert.equal(f.actor.flags[ID].unrelated,"conservar");assert.equal(record.firstRound,3);assert.equal(record.lastRound,4);assert.equal(record.damage,10);assert.equal(record.source.itemUuid,f.item.uuid);
 assert.equal(effectView(f.actor,record).canResolve,false);f.combat.turn=1;assert.equal(effectView(f.actor,record).canResolve,false);f.combat.round=3;assert.equal(effectView(f.actor,record).canResolve,true);assert.equal(f.actor.system.resources.health.value,100);
});
test("rodadas aplicadas uma vez; avançar/voltar a rodada não repete dano",async()=>{
 const f=fixture(),record=await f.create();f.combat.round=3;f.answers.push(f.resolution);const tick=await resolveEffect(f.actor,record.id);assert.equal(tick.damage,10);assert.equal(f.actor.system.resources.health.value,90);assert.equal(f.actor.updates.at(-1)[`flags.${ID}.persistentEffects.${record.id}.ticks.round3`].after,90);
 await assert.rejects(resolveEffect(f.actor,record.id),/próxima/);f.combat.round=2;assert.equal(effectView(f.actor,effectRecords(f.actor)[record.id]).canResolve,false);f.combat.round=4;f.answers.push(f.resolution);await resolveEffect(f.actor,record.id);assert.equal(f.actor.system.resources.health.value,80);assert.equal(effectRecords(f.actor)[record.id].status,"expired");await assert.rejects(resolveEffect(f.actor,record.id),/concluída/);
});
test("cancelamento de criação, rodada ou encerramento não muda a ficha",async()=>{
 const f=fixture();f.answers.push(null);await registerEffect(f.actor);assert.equal(f.actor.updates.length,0);const record=await f.create({kind:"manual",label:"Anotação",firstOffset:0});const before=structuredClone({flags:f.actor.flags,system:f.actor.system});f.answers.push(null);await resolveEffect(f.actor,record.id);f.answers.push(null);await endEffect(f.actor,record.id);assert.deepEqual(f.actor.flags,before.flags);assert.deepEqual(f.actor.system,before.system);
});
test("rodadas atrasadas exigem conferência e podem ser dispensadas com motivo",async()=>{
 const f=fixture(),record=await f.create();f.combat.round=7;assert.equal(effectView(f.actor,record).overdue,true);assert.equal(f.actor.system.resources.health.value,100);f.answers.push({...f.resolution,skip:true,reason:"Conferido: alvo apagou as chamas nesta rodada."});await resolveEffect(f.actor,record.id);assert.equal(f.actor.system.resources.health.value,100);assert.equal(nextEffectRound(effectRecords(f.actor)[record.id]),4);f.answers.push({...f.resolution,skip:true});await resolveEffect(f.actor,record.id);assert.equal(effectRecords(f.actor)[record.id].status,"expired");assert.equal(f.actor.system.conditions.afraid,true);
});
test("dano final ajustado conserva base e motivo; anotações nunca causam dano",async()=>{
 const f=fixture(),record=await f.create({firstOffset:0});f.answers.push({...f.resolution,damage:2.5,reason:"Redução final conferida pelo mestre."});const tick=await resolveEffect(f.actor,record.id);assert.equal(tick.baseDamage,10);assert.equal(tick.damage,2.5);assert.equal(f.actor.system.resources.health.value,97.5);const manual=await f.create({kind:"manual",label:"Estado conferido",firstOffset:0,rounds:1});f.answers.push({...f.resolution,damage:999});await resolveEffect(f.actor,manual.id);assert.equal(f.actor.system.resources.health.value,97.5);assert.equal(effectRecords(f.actor)[manual.id].status,"expired");
});
test("edições de PV, registro, rodada, mestre e propriedade durante confirmação recusam gasto",async()=>{
 for(const change of [f=>f.actor.system.resources.health.value=77,f=>f.combat.round=3,f=>effectRecords(f.actor).effect1.time++,f=>game.user=f.player,f=>f.actor.isOwner=false]){
  const f=fixture(),record=await f.create({firstOffset:0});f.answers.push(()=>{change(f);return f.resolution;});await assert.rejects(resolveEffect(f.actor,record.id));assert.equal(Object.keys(effectRecords(f.actor)[record.id].ticks).length,0);
 }
});
test("técnica editada/removida na confirmação não cria registro",async()=>{
 for(const change of [f=>f.item.system.classification="gold",f=>f.caster.items.contents=[]]){const f=fixture();f.answers.push(()=>{change(f);return f.definition;});await assert.rejects(registerEffect(f.actor));assert.equal(Object.keys(effectRecords(f.actor)).length,0);}
});
test("mestre primário, encontro, combatente e cópias são conferidos",async()=>{
 const f=fixture();game.user=f.player;await assert.rejects(registerEffect(f.actor),/mestre responsável/);game.user=f.gm;const record=await f.create({firstOffset:0});f.combat.combatants.contents.push({id:"duplicate",actor:f.actor});assert.equal(effectView(f.actor,record).canResolve,false);f.combat.combatants.contents.pop();f.combat.combatants.contents[0].id="replacement";assert.equal(effectView(f.actor,record).canResolve,false);f.combat.combatants.contents[0].id="targetMember";f.combat.started=false;assert.equal(effectView(f.actor,record).canResolve,false);f.combat.started=true;f.actor.uuid="Actor.copy";assert.equal(effectView(f.actor,record).foreign,true);await assert.rejects(resolveEffect(f.actor,record.id),/outra ficha/);await assert.rejects(endEffect(f.actor,record.id));assert.equal(effectRecords(f.actor)[record.id].status,"active");assert.equal(f.actor.system.resources.health.value,100);
});
test("encerramento e repetição conservam histórico sem presumir cumulatividade",async()=>{
 const f=fixture(),record=await f.create();await assert.rejects(f.create(),/Já há Brasas/);effectRecords(f.actor)[record.id].reason="Resistência posterior conferida";await endEffect(f.actor,record.id);assert.equal(effectRecords(f.actor)[record.id].reason,"Resistência posterior conferida");assert.equal(Object.values(effectRecords(f.actor)[record.id].brasasHistory).at(-1).action,"end");const second=await f.create();assert.notEqual(second.id,record.id);assert.equal(effectSheetContext(f.actor).length,2);assert.equal(f.actor.system.resources.health.value,100);
});
test("falha antes da gravação não gasta; falha após gravação não duplica rodada",async()=>{
 for(const persist of [false,true]){const f=fixture(),record=await f.create({firstOffset:0,rounds:1}),update=f.actor.update.bind(f.actor);let fail=true;f.actor.update=async data=>{if(fail&&Object.hasOwn(data,"system.resources.health.value")){fail=false;if(persist)await update(data);throw Error("gravação interrompida");}await update(data);};f.answers.push(f.resolution);await assert.rejects(resolveEffect(f.actor,record.id),/interrompida/);assert.equal(f.actor.system.resources.health.value,persist?90:100);if(persist)await assert.rejects(resolveEffect(f.actor,record.id),/concluída/);else{await assert.rejects(resolveEffect(f.actor,record.id),/interrompida/);f.answers.push({reason:"Conferência do estado anterior intacto.",repaired:false});await recoverEffect(f.actor,"effect2");assert.equal(effectRecords(f.actor)[record.id].status,"expired");}assert.equal(f.actor.system.resources.health.value,90);assert.equal(Object.keys(effectRecords(f.actor)[record.id].ticks).length,1);}
});
test("operações interrompidas e dados adulterados não geram gasto",async()=>{
 const f=fixture(),record=await f.create({firstOffset:0});for(const flag of ["actionOperations","techniqueOperations","damageOperations"]){f.actor.flags[ID][flag]={pending:{status:"prepared"}};await assert.rejects(resolveEffect(f.actor,record.id),/interrompid/);delete f.actor.flags[ID][flag];}
 record.damage=999;assert.throws(()=>effectTickPlan(f.actor,record,{...f.resolution}),/alterada/);record.damage=10;assert.throws(()=>effectTickPlan(f.actor,record,{...f.resolution,damage:NaN}),/inválido/);assert.equal(effectTickPlan(f.actor,record,{...f.resolution,reason:""}).tick.reason,"");record.firstRound=0;assert.equal(effectView(f.actor,record).canResolve,false);assert.equal(f.actor.system.resources.health.value,100);
});
test("duas confirmações concorrentes não pagam duas vezes a mesma rodada",async()=>{
 const f=fixture(),record=await f.create({firstOffset:0,rounds:1});f.answers.push(f.resolution,f.resolution);const results=await Promise.allSettled([resolveEffect(f.actor,record.id),resolveEffect(f.actor,record.id)]);assert.equal(results.filter(r=>r.status==="fulfilled").length,1);assert.equal(f.actor.system.resources.health.value,90);assert.equal(Object.keys(effectRecords(f.actor)[record.id].ticks).length,1);
});
test("journal preparado bloqueia recursos e recuperação reconhece o posterior sem cobrar",async()=>{
 const f=fixture(),record=await f.create({firstOffset:0,rounds:1});f.answers.push(f.resolution);await resolveEffect(f.actor,record.id);const operation=f.actor.flags[ID].effectOperations.effect2;operation.status="prepared";assert.throws(()=>assertNoTechniqueInterruption(f.actor),/efeito interrompida/);f.answers.push({reason:"Posterior completo conferido.",repaired:false});await recoverEffect(f.actor,"effect2");assert.equal(operation.status,"applied");assert.equal(f.actor.system.resources.health.value,90);assert.equal(Object.keys(effectRecords(f.actor)[record.id].ticks).length,1);
});
test("recuperação divergente/copias requer reparo expresso e conserva PV atuais",async()=>{
 const f=fixture(),record=await f.create({firstOffset:0,rounds:1});f.answers.push(f.resolution);await resolveEffect(f.actor,record.id);const operation=f.actor.flags[ID].effectOperations.effect2;operation.status="prepared";f.actor.system.resources.health.value=77;f.answers.push({reason:"Conferência inicial.",repaired:false});await assert.rejects(recoverEffect(f.actor,"effect2"),/divergentes/);f.actor.uuid="Actor.copy";f.answers.push({reason:"Reparo manual somente na cópia, valores conservados.",repaired:true});await recoverEffect(f.actor,"effect2");assert.equal(operation.status,"reviewed");assert.equal(f.actor.system.resources.health.value,77);
});
test("alterações após awaits da fonte ou do journal preparado impedem concluir",async()=>{
 const f=fixture();let sourceResolved=false;fromUuid=async uuid=>{if(uuid===f.item.uuid){sourceResolved=true;return f.item;}if(sourceResolved)f.item.system.classification="gold";return f.actor;};await assert.rejects(f.create(),/alterada/);assert.equal(f.actor.updates.length,0);
 const g=fixture(),record=await g.create({firstOffset:0}),update=g.actor.update.bind(g.actor);g.actor.update=async data=>{await update(data);if(Object.keys(data).some(p=>p.startsWith(`flags.${ID}.effectOperations.`)))g.actor.system.resources.health.value=77;};g.answers.push(g.resolution);await assert.rejects(resolveEffect(g.actor,record.id),/mud/);assert.equal(g.actor.system.resources.health.value,77);assert.equal(Object.keys(effectRecords(g.actor)[record.id].ticks).length,0);assert.throws(()=>assertNoTechniqueInterruption(g.actor),/efeito interrompida/);
});
test("efeito e rodada aceitam notas vazias sem aceite e aplicam uma vez",async()=>{
 const f=fixture(),r=await f.create({reason:"",checked:false,firstOffset:0,rounds:2});f.answers.push({skip:false,damage:2.5});const tick=await resolveEffect(f.actor,r.id);assert.equal(tick.reason,"");assert.equal(f.actor.system.resources.health.value,97.5);await assert.rejects(resolveEffect(f.actor,r.id),/próxima/);await endEffect(f.actor,r.id);assert.equal(f.actor.system.resources.health.value,97.5);assert.equal(Object.values(effectRecords(f.actor)[r.id].brasasHistory).at(-1).reason,"");
});

test("registro, rodada, encerramento e recuperação de efeito deixam fila livre no diálogo",async()=>{
 const f=fixture();await holdDecisionOutsideQueue(()=>registerEffect(f.actor));const record=await f.create({kind:"manual",label:"Prazo de exercício",firstOffset:0});await holdDecisionOutsideQueue(()=>resolveEffect(f.actor,record.id));await holdDecisionOutsideQueue(()=>endEffect(f.actor,record.id));f.answers.push({});await resolveEffect(f.actor,record.id);const [id,op]=Object.entries(f.actor.flags[ID].effectOperations)[0];op.status="prepared";const before=structuredClone(f.actor.system);await holdDecisionOutsideQueue(()=>recoverEffect(f.actor,id));assert.deepEqual(f.actor.system,before);assert.equal(op.status,"prepared");
});
test("rodada confirmada depois de mudança na ficha não aplica dano antigo",async()=>{
 const f=fixture(),record=await f.create({firstOffset:0});await assert.rejects(holdDecisionOutsideQueue(()=>resolveEffect(f.actor,record.id),{answer:{},during:async()=>{await runMasterOperation(()=>{f.actor.system.resources.health.value=77;});}}),/mudou/);assert.equal(f.actor.system.resources.health.value,77);assert.equal(Object.keys(effectRecords(f.actor)[record.id].ticks).length,0);
});


test("painel conserva registros e destaca pausados, copias e estados desconhecidos",()=>{
 const rows=[{id:'active',status:'active'},{id:'ended',status:'ended'},{id:'paused',status:'active',state:'Pausado'},{id:'expired',status:'expired'},{id:'failed',status:'failed'},{id:'copy',status:'ended',foreign:true},{id:'unknown',status:'newStatus'}];
 const before=structuredClone(rows),panel=effectPanelContext(rows);
 assert.deepEqual(panel.active.map(r=>r.id),['active','paused','copy','unknown']);assert.deepEqual(panel.history.map(r=>r.id),['ended','expired','failed']);assert.deepEqual(rows,before);
 assert.equal(new Set([...panel.active,...panel.history]).size,rows.length);
});

test("painel renderiza ativos antes do historico recolhido e conserva acoes e detalhes",async()=>{
 const {default:Handlebars}=await import('handlebars'),h=Handlebars.create();
 h.registerPartial('systems/gods-battle-ss/templates/effect-record.hbs',await readFile('templates/effect-record.hbs','utf8'));
 const render=h.compile(await readFile('templates/effects-panel.hbs','utf8'));
 const active={id:'active',label:'Brasas <teste>',status:'active',state:'Aguardando',firstRound:2,lastRound:3,nextRound:2,canResolve:true,canEnd:true,ticks:[{round:1,damage:5,before:100,after:95}]};
 const ended={id:'ended',label:'Residual antigo',status:'ended',state:'Encerrado',reason:'nota preservada',end:{reason:'terminou'}};
 const html=render({isGM:true,persistentEffectsPanel:effectPanelContext([active,ended])});
 const split=html.indexOf('class="calculation-ledger effect-history"');assert.ok(split>0);
 assert.match(html.slice(0,split),/Brasas &lt;teste&gt;/);assert.doesNotMatch(html.slice(0,split),/Residual antigo/);assert.match(html.slice(split),/Residual antigo/);
 assert.match(html,/<details class="calculation-ledger effect-history"><summary>Histórico de efeitos \(1\)/);
 assert.match(html,/data-action="resolveEffect" data-effect="active"/);assert.match(html,/data-action="endEffect" data-effect="active"/);
 assert.match(html,/nota preservada/);assert.match(html,/100 → 95/);assert.doesNotMatch(html,/<p>Notas: <\/p>/);
 const empty=render({persistentEffectsPanel:effectPanelContext([])});assert.match(empty,/Nenhum efeito ativo/);assert.match(empty,/Nenhum efeito concluído/);assert.doesNotMatch(empty,/data-action="registerEffect"/);
});

test("prazos da ficha acompanham rodada para mestre e jogador sem gravar recursos ou flags",async()=>{const f=fixture(),record=await f.create(),before=structuredClone({system:f.actor.system,flags:f.actor.flags}),updates=f.actor.updates.length;f.combat.round=4;let rows=effectSheetContext(f.actor);assert.equal(rows[0].pendingRounds,2);assert.equal(effectPanelContext(rows).pendingRounds,2);game.user=f.player;rows=effectSheetContext(f.actor);assert.equal(rows[0].pendingRounds,2);assert.equal(rows[0].canApply,true);assert.deepEqual({system:f.actor.system,flags:f.actor.flags},before);assert.equal(f.actor.updates.length,updates);assert.equal(effectRecords(f.actor)[record.id].status,"active");});

function quickOptions(f,id){const row=effectSheetContext(f.actor).find(r=>r.id===id);return {quick:true,expectedRound:row.nextRound,expectedState:row.isBrasas?row.applySignature:row.quickSignature};}
test("rodada rápida aplica valor exibido sem diálogo, nova CE ou condições",async()=>{const f=fixture(),record=await f.create({firstOffset:0,rounds:1}),ce=f.actor.system.resources.cosmo.value,conditions=structuredClone(f.actor.system.conditions);foundry.applications.api.DialogV2.wait=async()=>{throw Error('diálogo não esperado');};const tick=await resolveEffect(f.actor,record.id,quickOptions(f,record.id));assert.equal(tick.damage,10);assert.equal(tick.reason,'');assert.equal(f.actor.system.resources.health.value,90);assert.equal(f.actor.system.resources.cosmo.value,ce);assert.deepEqual(f.actor.system.conditions,conditions);assert.equal(effectRecords(f.actor)[record.id].status,'expired');});
test("anotação rápida registra só a rodada e conserva PV",async()=>{const f=fixture(),record=await f.create({kind:'manual',label:'Anotação',firstOffset:0,rounds:1});const tick=await resolveEffect(f.actor,record.id,quickOptions(f,record.id));assert.equal(tick.damage,0);assert.equal(f.actor.system.resources.health.value,100);assert.equal(effectRecords(f.actor)[record.id].status,'expired');});
test("botão antigo não aplica outra rodada ou valores após mudança da ficha",async()=>{for(const mutate of [f=>f.actor.system.resources.health.value=77,f=>f.combat.round++,f=>effectRecords(f.actor).effect1.time++,f=>f.actor.isOwner=false,f=>game.user={id:'observer',isGM:false}]){const f=fixture(),record=await f.create({firstOffset:0}),options=quickOptions(f,record.id);mutate(f);await assert.rejects(resolveEffect(f.actor,record.id,options));assert.equal(Object.keys(effectRecords(f.actor)[record.id].ticks).length,0);}const f=fixture(),record=await f.create({firstOffset:0});for(const options of [{quick:true},{...quickOptions(f,record.id),expectedRound:99},{...quickOptions(f,record.id),expectedState:'other'}])await assert.rejects(resolveEffect(f.actor,record.id,options),/prévia/);});
test("cliques rápidos simultâneos não aplicam a próxima parcela atrasada",async()=>{const f=fixture(),record=await f.create();f.combat.round=8;const options=quickOptions(f,record.id),results=await Promise.allSettled([resolveEffect(f.actor,record.id,options),resolveEffect(f.actor,record.id,options)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(f.actor.system.resources.health.value,90);assert.equal(Object.keys(effectRecords(f.actor)[record.id].ticks).length,1);await assert.rejects(resolveEffect(f.actor,record.id,options),/prévia/);assert.equal(nextEffectRound(effectRecords(f.actor)[record.id]),4);});
test("rápido ignora valor/dispensa externos e usa somente a parcela do registro",async()=>{const f=fixture(),record=await f.create({firstOffset:0});await resolveEffect(f.actor,record.id,{...quickOptions(f,record.id),damage:999,skip:true});assert.equal(f.actor.system.resources.health.value,90);assert.equal(effectRecords(f.actor)[record.id].ticks.round2.status,'applied');});
test("rodada rápida interrompida usa recuperação existente sem repetir PV",async()=>{const f=fixture(),record=await f.create({firstOffset:0,rounds:1}),options=quickOptions(f,record.id),update=f.actor.update.bind(f.actor);let fail=true;f.actor.update=async data=>{await update(data);if(fail&&Object.hasOwn(data,'system.resources.health.value')){fail=false;throw Error('resposta perdida');}};await assert.rejects(resolveEffect(f.actor,record.id,options),/resposta perdida/);assert.equal(f.actor.system.resources.health.value,90);const operation=f.actor.flags[ID].effectOperations.effect2;operation.status='prepared';f.answers.push({reason:'',repaired:false});await recoverEffect(f.actor,'effect2');assert.equal(operation.status,'applied');assert.equal(f.actor.system.resources.health.value,90);assert.equal(Object.keys(effectRecords(f.actor)[record.id].ticks).length,1);});
test("painel oferece Aplicar e Ajustar ao mestre e dono, sem duplicar Brasas genéricas",async()=>{const f=fixture();await f.create({firstOffset:0});const row=effectSheetContext(f.actor)[0];assert.equal(row.canApply,true);assert.equal(genericContext(f.actor).length,0);const {default:H}=await import('handlebars'),h=H.create();h.registerPartial('systems/gods-battle-ss/templates/brasas-record.hbs',await readFile('templates/brasas-record.hbs','utf8'));const render=h.compile(await readFile('templates/effect-record.hbs','utf8')),html=render(row);assert.match(html,/data-action="applyBrasas"/);assert.match(html,/data-action="adjustBrasas"/);assert.match(html,/Aplicar 10 PV · rodada 2/);game.user=f.player;assert.equal(effectSheetContext(f.actor)[0].canApply,true);game.user={id:'observer',isGM:false};assert.equal(effectSheetContext(f.actor).length,0);});

test("parcela adulterada, coordenação offline e interrupções não oferecem aplicação",async()=>{const f=fixture(),created=await f.create({firstOffset:0}),record=effectRecords(f.actor)[created.id];record.damage=999;assert.equal(!!effectSheetContext(f.actor)[0].canApply,false);record.damage=10;game.users.activeGM={id:'other',isGM:true};for(const key of ['canApply','canAdjust','canEnd'])assert.equal(!!effectSheetContext(f.actor)[0][key],false,key);game.users.activeGM=f.gm;f.actor.flags[ID].effectOperations={pending:{status:'prepared'}};for(const key of ['canApply','canAdjust','canEnd'])assert.equal(!!effectSheetContext(f.actor)[0][key],false,key);f.actor.flags[ID].effectOperations={};assert.equal(effectSheetContext(f.actor)[0].canAdjust,true);assert.equal(effectSheetContext(f.actor)[0].canEnd,true);f.actor.isOwner=false;assert.equal(effectSheetContext(f.actor).length,0);assert.equal(f.actor.system.resources.health.value,100);});

test("ação instalada usa rodada/assinatura do botão e libera o botão ao terminar",async()=>{const {KnightSheet}=await import('../module/sheets.mjs'),f=fixture(),record=await f.create({firstOffset:0}),row=effectSheetContext(f.actor)[0],button={disabled:false,dataset:{effect:record.id,round:String(row.nextRound),signature:row.applySignature}};assert.equal(KnightSheet.DEFAULT_OPTIONS.actions.applyBrasas,KnightSheet.applyBrasas);const m=await KnightSheet.applyBrasas.call({actor:f.actor},null,button);assert.equal(button.disabled,false);await settle(f.actor,m);assert.equal(f.actor.system.resources.health.value,90);assert.equal(Object.keys(effectRecords(f.actor)[record.id].ticks).length,1);});
