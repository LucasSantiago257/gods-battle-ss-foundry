import {areaProgressRow} from "../module/area-progress-rules.mjs";
import {registerArmorBreak} from "../module/armor-effects.mjs";
import {resolveEffect} from "../module/effects.mjs";
// Integration rehearsal using the shipped exercise Actors. This runtime is not the Foundry core.
import test from "node:test";
import {readFile} from "node:fs/promises";
import assert from "node:assert/strict";
import {knight,content} from "./foundry-stub.mjs";
import {NATURES} from "../module/config.mjs";
import {TEST_ACTORS} from "../module/combat-examples.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {attackTarget,defendAttack,defensePreview} from "../module/combat.mjs";
import {enqueueActionRequest} from "../module/actions.mjs";
import {actionView} from "../module/action-rules.mjs";
import {requestDamage,enqueueDamageRequest,damageCardState} from "../module/damage.mjs";
import {activationState,submitTechniqueActivation,enqueueTechniqueRequest,recoverTechniqueOperation} from "../module/technique-activation.mjs";
import {techniqueParameters,cosmoPayment} from "../module/technique-rules.mjs";
import {createPersonalTechnique,addTechniqueComponent,finishTechniqueBuilder,techniqueBuilderContext,discardTechniqueBuilder,beginTechniqueBuilder} from "../module/technique-builder.mjs";
import {setupTechnique} from "../module/technique-setup.mjs";
import {useTechnique} from "../module/techniques.mjs";
import {areaAttackFor} from "../module/area-rules.mjs";
import {rangeScene} from "./distance-stub.mjs";
import {techniqueWithComponents} from "../module/technique-components.mjs";
import {rollTest} from "../module/rolls.mjs";
import {registerControl} from "../module/control.mjs";
import {registerSustained,sustainedPaymentPreview,paySustained} from "../module/sustained.mjs";
import {effectSheetContext,effectPanelContext,endEffect} from "../module/effects.mjs";
const ID="gods-battle-ss",clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const componentCatalog=[...JSON.parse(await readFile("data/catalog/bigbangs.json","utf8")),...JSON.parse(await readFile("data/catalog/increments.json","utf8"))];
function merge(to,from){for(const[key,value]of Object.entries(from))if(value&&typeof value==="object"&&!Array.isArray(value))merge(to[key]??={},value);else to[key]=clone(value);return to;}
function patch(doc,changes){for(const[path,value]of Object.entries(changes)){const parts=path.split(".");let at=doc;for(const key of parts.slice(0,-1))at=at[key]??={};const key=parts.at(-1);if(key.startsWith("-="))delete at[key.slice(2)];else if(value&&typeof value==="object"&&!Array.isArray(value)&&at[key])merge(at[key],value);else at[key]=clone(value);}}
function collection(docs=[]){const result=new Map(docs.map(d=>[d.id,d]));Object.defineProperty(result,"contents",{get:()=>[...result.values()]});return result;}
function rehearsal({synthetic=false}={}){
 const gm={id:"gm",isGM:true,active:true},attacker={id:"attacker",isGM:false,active:true},defender={id:"defender",isGM:false,active:true},observer={id:"observer",isGM:false,active:true};
 const users=collection([gm,attacker,defender,observer]);users.activeGM=gm;
 const messages=collection(),documents=new Map(),updates=[],notices=[],dialogs=[],renders=[],dice=[];
 const controls={answer:null,publicationFailure:false};let serial=0,rolls=0;
 globalThis.game={user:gm,users,messages,actors:collection(),settings:{get:(scope,key)=>scope==="core"?"publicroll":"rank"},combats:collection()};
 globalThis.ui={notifications:{warn:t=>notices.push(t),error:t=>notices.push(t),info:t=>notices.push(t)}};
 foundry.utils={randomID:()=>`rehearsal${++serial}`};
 foundry.applications.api.DialogV2={confirm:async()=>true,wait:async options=>{dialogs.push(options);return typeof controls.answer==="function"?controls.answer(options):controls.answer;}};
 foundry.applications.handlebars={renderTemplate:async(path,context)=>{renders.push({path,context});return "<p>Ensaio</p>";}};
 foundry.dice={terms:{OperatorTerm:class{constructor(data){Object.assign(this,data);}}}};
 const rollData=total=>({total,toJSON:()=>({total,evaluated:true})});
 globalThis.Roll=class{
  constructor(formula){this.formula=formula;}
  async evaluate(){if(this.formula.includes("d10")){const values=dice.shift();assert.ok(values,"Provide deterministic dice for each test pool");assert.equal(values.length,Number(this.formula.split("d10")[0]));rolls++;this.dice=[{results:values.map(result=>({result}))}];this.terms=[{number:Math.max(...values)}];}else this.terms=[{number:Number(this.formula)}];return this;}
  static fromTerms(terms){return rollData(terms[0].number+(terms[1].operator==="+"?1:-1)*terms[2].number);}
  static fromData(data){return rollData(data.total);}
 };
 globalThis.ChatMessage={getSpeaker:({actor})=>({actor:actor.id,alias:actor.name}),applyRollMode:(data,mode)=>{data.whisper=mode==="publicroll"?[]:mode==="selfroll"?[game.user.id]:[gm.id];data.blind=mode==="blindroll";},create:async data=>{
  const message={...data,id:`message${++serial}`,author:game.user,isContentVisible:true,async update(changes){if(changes.rolls&&controls.publicationFailure)throw Error("Publication lost in rehearsal");patch(this,changes);return this;}};messages.set(message.id,message);return message;
 }};
 function actorFor(source,owner,uuid=`Actor.${source._id}`){
  const actor={id:source._id,uuid,name:source.name,type:source.type,system:merge(knight(),source.system),flags:clone(source.flags),get isOwner(){return game.user.isGM||game.user.id===owner.id;},testUserPermission:user=>!!user&&(user.isGM||user.id===owner.id),async update(changes){updates.push({uuid:this.uuid,changes:clone(changes)});patch(this,changes);prepareKnight(this.system,this.items.contents,"rank",{actorUuid:this.uuid,flags:this.flags});return this;}};
  actor.items=collection();
  actor.createEmbeddedDocuments=async(_type,sources)=>sources.map(makeItem);
  function makeItem(source){
   const id=source._id??`custom${++serial}`,item={id,uuid:`${uuid}.Item.${id}`,name:source.name,type:source.type,system:merge(content(),source.system),flags:clone(source.flags??{}),parent:actor,sheet:{render:()=>{}},get isOwner(){return actor.isOwner;},async update(changes){updates.push({uuid:this.uuid,changes:clone(changes)});patch(this,changes);prepareKnight(actor.system,actor.items.contents,"rank",{actorUuid:actor.uuid,flags:actor.flags});return this;}};
   actor.items.set(id,item);documents.set(item.uuid,item);return item;
  }
  for(const item of source.items)makeItem(item);
  prepareKnight(actor.system,actor.items.contents,"rank",{actorUuid:actor.uuid,flags:actor.flags});documents.set(uuid,actor);for(const item of actor.items.values())documents.set(item.uuid,item);return actor;
 }
 const aster=actorFor(TEST_ACTORS[0],attacker),worldDoran=actorFor(TEST_ACTORS[1],defender),lyra=actorFor(TEST_ACTORS[2],attacker);
 const doran=synthetic?actorFor(TEST_ACTORS[1],defender,`Scene.arena.Token.doran.Actor.${TEST_ACTORS[1]._id}`):worldDoran;
 game.actors=collection([aster,worldDoran,lyra]);
 const combat={id:"arena",uuid:"Combat.arena",started:true,round:1,flags:{[ID]:{actionControl:{enabled:true,epoch:"round1"}}},combatants:collection([aster,doran,lyra].map((actor,index)=>({id:`combatant${index}`,actor})))};game.combat=combat;game.combats.set(combat.id,combat);
 const componentDocs=collection(componentCatalog.map(source=>({...clone(source),id:source._id,uuid:`Compendium.${ID}.componentes-tecnicas.Item.${source._id}`,toObject:()=>clone(source)})));
 for(const component of componentDocs.values())documents.set(component.uuid,component);
 game.packs=new Map([[`${ID}.componentes-tecnicas`,{testUserPermission:()=>true,getIndex:async()=>({contents:componentCatalog}),getDocument:async id=>componentDocs.get(id)}]]);
 globalThis.fromUuid=async uuid=>documents.get(uuid);globalThis.canvas={tokens:{placeables:[]}};
 const round=n=>{combat.round=n;combat.flags[ID].actionControl.epoch=`round${n}`;};
 const coordinate=async(message,enqueue)=>{game.user=gm;await enqueue(message,{},message.author.id);};
 async function activate(item,{faces=[8,7],options={}}={}){
  options={extra:0,elevate:0,condense:0,bonus:0,advantage:0,useExtra:true,allowOverload:false,...options};
  game.user=attacker;const parameters=techniqueParameters(lyra.system,techniqueWithComponents(item),options),payment=cosmoPayment(lyra.system,parameters.cost,options);dice.push(faces);
  const message=await submitTechniqueActivation(lyra,item,{baseline:activationState(lyra,item),options:{...options,actionPool:"attack"},payment,target:doran,rollMode:"publicroll"});await coordinate(message,enqueueTechniqueRequest);assert.notEqual(message.flags[ID].techniqueResponse?.status,"failed",JSON.stringify(message.flags[ID].techniqueResponse));return message;
 }
 async function resist(root,faces=[5,4,3]){game.user=defender;dice.push(faces);return rollTest(doran,"resistance",NATURES[root.flags[ID].attack.nature].resistance,{quick:true,difficulty:root.flags[ID].attack.powerCosmic,resistanceAttack:{...root.flags[ID].attack,messageId:root.id}});}
 async function damage(source,action="apply",options={}){game.user=defender;const request=await requestDamage(source,action,options);const message=messages.contents.at(-1);await coordinate(message,enqueueDamageRequest);return {request,message};}
 function scene(){
  const f=rangeScene(lyra,doran);for(const token of [f.source,f.target])documents.set(token.uuid,token);game.scenes=collection([f.scene]);
  const object=doc=>({actor:doc.actor,document:doc,isVisible:true,get center(){return doc.getCenterPoint();}}),source=object(f.source),target=object(f.target);
  globalThis.canvas={ready:true,scene:f.scene,grid:f.scene.grid,tokens:{placeables:[source,target],controlled:[source]}};attacker.targets=new Set([target]);return {...f,sourceObject:source,targetObject:target};
 }
 return {gm,attacker,defender,observer,aster,doran,worldDoran,lyra,combat,controls,dialogs,renders,notices,dice,messages,updates,round,coordinate,activate,resist,damage,scene,get rolls(){return rolls;}};
}
for(const synthetic of [false,true])test(`ensaio físico → defesa rápida → dono aplica/ajusta/desfaz (${synthetic?"token sintético":"Actor vinculado"})`,async()=>{
 const r=rehearsal({synthetic}),health=r.doran.system.resources.health.value,armor=r.doran.items.get("demoArmor0000001"),original=clone(r.worldDoran.system.resources);
 game.user=r.attacker;r.attacker.targets=new Set([{actor:r.doran}]);r.controls.answer={kind:"punch",amount:1,bonus:0};r.dice.push([8,7]);const attack=await attackTarget(r.aster);await r.coordinate(attack,enqueueActionRequest);
 assert.equal(attack.flags[ID].actionResponse.status,"published",JSON.stringify(attack.flags[ID].actionResponse));assert.equal(attack.flags[ID].fight.targetUuid,r.doran.uuid);assert.equal(actionView(r.aster).spent.attack,1);
 game.user=r.defender;const preview=await defensePreview(attack);assert.ok(preview);const dialogCount=r.dialogs.length;r.dice.push([4,3]);const defense=await defendAttack(attack,{quick:true,expectedState:preview.state,expectedFight:preview.fightHash});assert.equal(r.dialogs.length,dialogCount);await r.coordinate(defense,enqueueActionRequest);
 const resolved=defense.flags[ID].resolvedDamage;assert.equal(resolved.body,8);assert.equal(resolved.armor,0);assert.equal(actionView(r.doran).spent.defense,1);
 game.user=r.observer;assert.equal((await damageCardState(defense)).authorized,false);await assert.rejects(()=>requestDamage(defense),/proprietário/);
 await r.damage(defense);assert.equal(r.doran.system.resources.health.value,health-resolved.body);assert.equal(armor.system.health.value,30);assert.equal((await damageCardState(defense)).state,"applied");
 const rolls=r.rolls;await r.damage(defense);assert.equal(r.doran.system.resources.health.value,health-resolved.body);assert.equal(r.rolls,rolls);
 await r.damage(defense,"undo");assert.equal(r.doran.system.resources.health.value,health);assert.equal((await damageCardState(defense)).state,"undone");
 r.controls.answer={body:1.5,armor:0,reason:""};await r.damage(defense,"apply",{adjust:true});assert.equal(r.doran.system.resources.health.value,health-1.5);await r.damage(defense,"undo");assert.equal(r.doran.system.resources.health.value,health);
 assert.equal(r.rolls,2);assert.equal(r.dice.length,0);if(synthetic)assert.deepEqual(r.worldDoran.system.resources,original);assert.deepEqual(r.notices,[]);
});
for(const synthetic of [false,true])test(`ensaio técnica → resistência → dano corporal/armadura → desfazer (${synthetic?"sintético":"vinculado"})`,async()=>{
 const r=rehearsal({synthetic}),technique=r.lyra.items.get("demoTech00000001"),health=r.doran.system.resources.health.value,ce=r.lyra.system.resources.cosmo.value;
 const root=await r.activate(technique);assert.equal(root.flags[ID].techniqueResponse.status,"published");assert.equal(root.flags[ID].attack.targetUuid,r.doran.uuid);assert.equal(r.lyra.system.resources.cosmo.value,ce-2);assert.equal(actionView(r.lyra).remaining.attack,0);
 const resistance=await r.resist(root);assert.ok(resistance.flags[ID].resolvedDamage);const resolved=resistance.flags[ID].resolvedDamage;assert.equal(resolved.body,21);assert.equal(resolved.armor,10);
 await r.damage(resistance);assert.equal(r.doran.system.resources.health.value,health-resolved.body);assert.equal(r.doran.items.get(resolved.armorId).system.health.value,20);
 await r.damage(resistance,"undo");assert.equal(r.doran.system.resources.health.value,health);assert.equal(r.doran.items.get(resolved.armorId).system.health.value,30);assert.equal(r.lyra.system.resources.cosmo.value,ce-2);assert.equal(actionView(r.lyra).remaining.attack,0);
 assert.equal(r.rolls,2);assert.equal(r.dice.length,0);assert.deepEqual(r.notices,[]);
});

test("ensaio Controle acompanha prazo/histórico e Sustentada recarrega uma vez, sem novas condições",async()=>{
 const r=rehearsal(),health=r.doran.system.resources.health.value,ce=r.lyra.system.resources.cosmo.value;
 const root=await r.activate(r.lyra.items.get("demoControl00001")),resistance=await r.resist(root,[3,2,2]);assert.equal(resistance.flags[ID].resolvedDamage,undefined);
 game.user=r.gm;r.controls.answer={rounds:resistance.flags[ID].controlResolution.rounds,description:"Prazo de treino",reason:""};const control=await registerControl(resistance);assert.equal(control.firstRound,1);assert.equal(control.lastRound,control.rounds);assert.equal(control.damage,0);
 assert.ok(effectPanelContext(effectSheetContext(r.doran)).active.some(row=>row.id===control.id));
 r.controls.answer="";await endEffect(r.doran,control.id);assert.ok(effectPanelContext(effectSheetContext(r.doran)).history.some(row=>row.id===control.id));
 r.round(2);const sustained=r.lyra.items.get("demoSustain00001"),activation=await r.activate(sustained);assert.equal(activation.flags[ID].technique.success,true);
 game.user=r.gm;r.controls.answer={itemUuid:sustained.uuid,targetUuid:r.doran.uuid,maintenanceMode:"round",firstRound:2,rounds:null,reason:""};const record=await registerSustained(r.lyra);
 assert.equal(record.lastRound,3);assert.equal(r.lyra.system.resources.cosmo.value,ce-4);r.round(4);
 const rows=effectPanelContext(effectSheetContext(r.lyra));assert.equal(rows.pendingMaintenance,1);assert.equal(r.lyra.system.resources.cosmo.value,ce-4);
 const preview=sustainedPaymentPreview(r.lyra,record.id);await paySustained(r.lyra,record.id,{quick:true,expectedRound:preview.round,expectedState:preview.signature});assert.equal(r.lyra.system.resources.cosmo.value,ce-5);
 await assert.rejects(()=>paySustained(r.lyra,record.id,{quick:true,expectedRound:preview.round,expectedState:preview.signature}),/coberta/);
 r.controls.answer="";await endEffect(r.lyra,record.id);assert.equal(effectPanelContext(effectSheetContext(r.lyra)).history.length,1);assert.equal(r.doran.system.resources.health.value,health);assert.equal(r.doran.flags[ID].conditionEffects,undefined);assert.equal(r.rolls,3);assert.deepEqual(r.notices,[]);
});

test("ensaio de resposta perdida recupera a técnica paga e segue até dano, sem repetir dados/CE/ações",async()=>{
 const r=rehearsal({synthetic:true}),ce=r.lyra.system.resources.cosmo.value;r.controls.publicationFailure=true;
 const root=await r.activate(r.lyra.items.get("demoTech00000001"));assert.equal(r.lyra.system.resources.cosmo.value,ce-2);assert.equal(actionView(r.lyra).remaining.attack,0);assert.equal(root.flags[ID].techniqueResponse.status,"paid");
 r.controls.publicationFailure=false;await recoverTechniqueOperation(r.lyra,root.id);assert.equal(root.flags[ID].techniqueResponse.status,"published");assert.equal(r.rolls,1);assert.equal(r.lyra.system.resources.cosmo.value,ce-2);
 const resistance=await r.resist(root);await r.damage(resistance);await r.damage(resistance,"undo");assert.equal(r.rolls,2);assert.equal(r.lyra.system.resources.cosmo.value,ce-2);assert.equal(actionView(r.lyra).remaining.attack,0);assert.equal(r.doran.system.resources.health.value,28);assert.deepEqual(r.notices,[]);
});


test("Atacar abre com habilidade treinada e não oferece graduações nulas",async()=>{
 const r=rehearsal();game.user=r.defender;r.defender.targets=new Set([{actor:r.aster}]);await attackTarget(r.doran);
 assert.match(r.dialogs.at(-1).content,/<option value="weapons" selected>/);assert.doesNotMatch(r.dialogs.at(-1).content,/<option value="punch"/);
 r.doran.system.fighting.punch=2;await attackTarget(r.doran);assert.match(r.dialogs.at(-1).content,/<option value="punch" selected>/);
 r.doran.system.fighting.punch=0;r.doran.system.fighting.weapons=0;const dialogs=r.dialogs.length;await attackTarget(r.doran);
 assert.equal(r.dialogs.length,dialogs);assert.match(r.notices.at(-1),/Configure uma habilidade de ataque/);assert.equal(r.rolls,0);assert.equal(r.messages.size,0);
});


// Exercise the actual dialog render/submit callbacks. DOM layout is verified separately in Edge.
function activationDialog(r,{values={},beforeSubmit=()=>{}}={}){
 let form,context;
 r.controls.answer=options=>{
  assert.equal(options.window.title,"Ativar técnica");context=r.renders.at(-1).context;
  const fields={extra:0,elevate:0,condense:0,bonus:0,advantage:0,useExtra:true,allowOverload:false,applyDistance:false,...(context.hasExhaust?{exhaust:0}:{}),actionPool:context.actions.techniqueChoices.find(c=>c.selected)?.key??"attack",...values};
  const output=Object.fromEntries(["cost","difficulty","powerCosmic","damage","criticalDamage","error","distance","distanceReduction","range"].map(key=>[key,{dataset:{techniquePreview:key},textContent:""}])),buttons={activate:{disabled:false},measureTechnique:{addEventListener:()=>{}}};
  form={elements:Object.fromEntries(Object.entries(fields).map(([key,value])=>[key,typeof value==="boolean"?{checked:value}:{value:String(value)}])),querySelectorAll:selector=>selector==="[data-technique-preview]"?Object.values(output):[],querySelector:selector=>buttons[selector.match(/data-action="([^"]+)"/)?.[1]]??null,addEventListener:()=>{},output};
  options.render(null,{form});beforeSubmit(form,context);return options.buttons.find(b=>b.action==="activate").callback(null,{form});
 };
 return {get form(){return form;},get context(){return context;}};
}

test("construir → adicionar Esgotar do catálogo → configurar → prévia com distância → ativar → resistir/desfazer",async()=>{
 const r=rehearsal({synthetic:true}),scene=r.scene(),ce=r.lyra.system.resources.cosmo.value;game.user=r.attacker;
 const item=await createPersonalTechnique(r.lyra);assert.ok(item);await item.update({"system.notes":"Minha nota"});
 // Editing notes invalidates the draft as intended; restart with a current baseline.
 await discardTechniqueBuilder(item);await beginTechniqueBuilder(item);
 const extra=componentCatalog.find(d=>d.flags[ID].source.key==="bigbang:extra:Esgotar");r.controls.answer=extra._id;await addTechniqueComponent(item);
 await item.update({[`flags.${ID}.techniqueDraft.name`]:"Pulso composto do ensaio"});const draft=await techniqueBuilderContext(item);assert.equal(draft.totalCost,3);assert.equal(draft.preview.parameters.difficulty,13);assert.equal(draft.support.activation,1);
 await finishTechniqueBuilder(item);assert.equal(item.flags[ID].techniqueDraft,undefined);assert.equal(item.system.notes,"Minha nota");assert.equal(r.lyra.system.resources.cosmo.value,ce);
 r.controls.answer=options=>options.buttons.find(b=>b.action==="configure").callback(null,{form:{elements:Object.fromEntries(Object.entries({classification:"bronze",nature:"mental",effectKind:"damage",techniqueMode:"status",cost:3,costExtra:0,range:3,controlRounds:0,power:10,damageLevel:2,movementMode:"standard",componentAutomation:true}).map(([key,value])=>[key,typeof value==="boolean"?{checked:value}:{value:String(value)}]))}});
 await setupTechnique(item);assert.equal(item.flags[ID].componentAutomation,true);
 const dialog=activationDialog(r,{values:{exhaust:1,applyDistance:true}});r.dice.push([8,7]);const root=await useTechnique(r.lyra,item);
 assert.equal(dialog.form.output.cost.textContent,"5 CE");assert.equal(dialog.form.output.difficulty.textContent,"15");assert.equal(dialog.form.output.damage.textContent,"11");assert.match(dialog.form.output.distanceReduction.textContent,/−2 ND/);assert.equal(r.lyra.system.resources.cosmo.value,ce);
 await r.coordinate(root,enqueueTechniqueRequest);assert.equal(root.flags[ID].techniqueResponse.status,"published",JSON.stringify(root.flags[ID].techniqueResponse));assert.equal(r.lyra.system.resources.cosmo.value,ce-5);assert.equal(root.flags[ID].attack.damage,11);assert.equal(item.system.notes,"Minha nota");
 const result=await r.resist(root);await r.damage(result);await r.damage(result,"undo");assert.equal(r.doran.system.resources.health.value,28);assert.equal(r.worldDoran.system.resources.health.value,28);assert.equal(r.rolls,2);assert.deepEqual(r.notices,[]);assert.equal(scene.target.actor,r.doran);
});

test("técnica após ataque abre com defesa intacta e paga somente essa reserva",async()=>{
 const r=rehearsal();game.user=r.attacker;r.attacker.targets=new Set([{actor:r.doran}]);r.controls.answer={kind:"psychic",amount:1,bonus:0};r.dice.push([8,7]);const attack=await attackTarget(r.lyra);await r.coordinate(attack,enqueueActionRequest);
 assert.equal(actionView(r.lyra).remaining.attack,0);game.user=r.attacker;const dialog=activationDialog(r);r.dice.push([8,7]);const root=await useTechnique(r.lyra,r.lyra.items.get("demoTech00000001"));
 const choices=dialog.context.actions.techniqueChoices;assert.equal(choices.find(c=>c.key==="attack").available,false);assert.equal(dialog.form.elements.actionPool.value,"defense");assert.equal(dialog.form.output.error.textContent,"");
 await r.coordinate(root,enqueueTechniqueRequest);assert.equal(root.flags[ID].techniqueResponse.status,"published");assert.equal(actionView(r.lyra).spent.attack,1);assert.equal(actionView(r.lyra).spent.defense,1);assert.equal(r.lyra.system.resources.cosmo.value,5);assert.equal(r.rolls,2);assert.deepEqual(r.notices,[]);
});

test("movimento após a prévia bloqueia a técnica sem dados/CE e reabrir usa a medida atual",async()=>{
 const r=rehearsal(),scene=r.scene(),item=r.lyra.items.get("demoTech00000001"),ce=r.lyra.system.resources.cosmo.value;scene.target.x=200;item.system.range=3;game.user=r.attacker;
 activationDialog(r,{values:{applyDistance:true},beforeSubmit:()=>{scene.target.x=250;}});const stale=await useTechnique(r.lyra,item);await r.coordinate(stale,enqueueTechniqueRequest);
 assert.equal(stale.flags[ID].techniqueResponse.status,"failed");assert.match(stale.flags[ID].techniqueResponse.text,/mudaram/);assert.equal(r.rolls,0);assert.equal(r.lyra.system.resources.cosmo.value,ce);assert.equal(actionView(r.lyra).spent.attack,0);
 game.user=r.attacker;const next=activationDialog(r,{values:{applyDistance:true}});r.dice.push([8,7]);const fresh=await useTechnique(r.lyra,item);assert.match(next.form.output.distance.textContent,/3,75 m/);await r.coordinate(fresh,enqueueTechniqueRequest);
 assert.equal(fresh.flags[ID].techniqueResponse.status,"published");assert.equal(r.lyra.system.resources.cosmo.value,ce-2);assert.equal(fresh.flags[ID].attack.damage,11);assert.equal(r.rolls,1);assert.deepEqual(r.notices,[]);
});


for(const synthetic of [false,true])test(`ensaio em área acompanha resistência/dano/desfazer por alvo (${synthetic?"sintético":"vinculado"})`,async()=>{
 const r=rehearsal({synthetic}),scene=r.scene(),other={...scene.target,id:"aster",uuid:"Scene.range.Token.aster",actor:r.aster,x:100};scene.scene.tokens.set(other.id,other);
 const object={actor:r.aster,document:other,isVisible:true,get center(){return other.getCenterPoint();}};canvas.tokens.placeables.push(object);
 const priorLookup=globalThis.fromUuid;globalThis.fromUuid=async uuid=>uuid===other.uuid?other:priorLookup(uuid);
 r.lyra.system.skills.asterism.value=3;prepareKnight(r.lyra.system,r.lyra.items.contents);game.user=r.attacker;r.attacker.targets=new Set([scene.targetObject,object]);
 const dialog=activationDialog(r);r.dice.push([8,7,6]);const root=await useTechnique(r.lyra,r.lyra.items.get("demoTech00000001"));
 assert.equal(dialog.form.output.cost.textContent,"4 CE");assert.equal(dialog.form.output.difficulty.textContent,"16");assert.equal(dialog.form.output.damage.textContent,"10.5");await r.coordinate(root,enqueueTechniqueRequest);
 assert.equal(root.flags[ID].techniqueResponse.status,"published");assert.equal(r.lyra.system.resources.cosmo.value,3);assert.equal(actionView(r.lyra).spent.attack,1);assert.equal(actionView(r.lyra).spent.defense,1);
 const state=(actor,user=r.gm)=>areaProgressRow(root,actor.uuid,actor,{user,users:game.users,messages:r.messages.contents}).state;
 assert.equal(state(r.doran),"waiting");assert.equal(state(r.aster),"waiting");assert.equal(state(r.doran,r.attacker),"restricted");assert.equal(state(r.aster,r.observer),"restricted");
 game.user=r.defender;r.dice.push([5,4,3]);const a=await rollTest(r.doran,"resistance","sen",{quick:true,difficulty:root.flags[ID].attack.powerCosmic,resistanceAttack:{...areaAttackFor(root.flags[ID].attack,r.doran.uuid),messageId:root.id}});
 game.user=r.attacker;r.dice.push([5,4]);const b=await rollTest(r.aster,"resistance","sen",{quick:true,difficulty:root.flags[ID].attack.powerCosmic,resistanceAttack:{...areaAttackFor(root.flags[ID].attack,r.aster.uuid),messageId:root.id}});
 assert.equal(a.flags[ID].resolvedDamage.body,10.5);assert.equal(b.flags[ID].resolvedDamage.body,10.5);assert.equal(a.flags[ID].resolvedDamage.armor,10);assert.equal(b.flags[ID].resolvedDamage.armor,10);
 assert.equal(state(r.doran,r.defender),"pending");assert.equal(state(r.aster,r.attacker),"pending");
 await r.damage(a);game.user=r.gm;await requestDamage(b);await r.coordinate(r.messages.contents.at(-1),enqueueDamageRequest);
 assert.equal(r.doran.system.resources.health.value,17.5);assert.equal(r.aster.system.resources.health.value,12.5);assert.equal(state(r.doran),"applied");assert.equal(state(r.aster),"applied");
 await r.damage(a,"undo");assert.equal(r.doran.system.resources.health.value,28);assert.equal(r.doran.items.get("demoArmor0000001").system.health.value,30);assert.equal(r.aster.system.resources.health.value,12.5);assert.equal(r.aster.items.get("demoArmor0000001").system.health.value,20);
 assert.equal(state(r.doran),"undone");assert.equal(state(r.aster),"applied"); assert.equal(r.lyra.system.resources.cosmo.value,3);assert.equal(r.rolls,3);assert.deepEqual(r.notices,[]);
});


test("painel usa prazo preciso e conserva aviso real quando o alvo da Sustentada some",async()=>{
 const r=rehearsal(),item=r.lyra.items.get("demoSustain00001");game.user=r.gm;
 r.controls.answer={itemUuid:item.uuid,targetUuid:r.doran.uuid,maintenanceMode:"round",firstRound:1,rounds:null,reason:""};const record=await registerSustained(r.lyra);r.round(3);
 let row=effectSheetContext(r.lyra).find(row=>row.id===record.id);assert.equal(row.displayState,"Recarga de 1 CE pendente · rodada 3");assert.equal(row.canPay,true);
 r.combat.combatants.delete("combatant1");const before=clone({resources:r.lyra.system.resources,flags:r.lyra.flags});row=effectSheetContext(r.lyra).find(row=>row.id===record.id);
 assert.match(row.displayState,/Alvo\/combatente indisponível/);assert.equal(row.canPay,false);assert.equal(row.quickSustain,null);assert.deepEqual({resources:r.lyra.system.resources,flags:r.lyra.flags},before);
});

for(const synthetic of [false,true])test(`construir Sustentada + Quebrar → ativar → prazo e parcela no alvo (${synthetic?"sintético":"vinculado"})`,async()=>{
 const r=rehearsal({synthetic});game.user=r.attacker;const ce=r.lyra.system.resources.cosmo.value,health=r.doran.system.resources.health.value,item=await createPersonalTechnique(r.lyra);
 await item.update({[`flags.${ID}.techniqueDraft.primary`]:"sustained",[`flags.${ID}.techniqueDraft.name`]:"Quebra de exercício"});const extra=componentCatalog.find(d=>d.flags[ID].source.key==="bigbang:extra:Quebrar Armadura");r.controls.answer=extra._id;await addTechniqueComponent(item);
 const draft=await techniqueBuilderContext(item);assert.equal(draft.support.rounds,1);assert.equal(draft.totalCost,3);assert.equal(draft.preview.parameters.difficulty,13);await finishTechniqueBuilder(item);assert.equal(item.flags[ID].techniqueDraft,undefined);assert.equal(item.system.effectKind,"sustained");
 const root=await r.activate(item);assert.equal(root.flags[ID].techniqueResponse.status,"published");assert.equal(root.flags[ID].attack,undefined);assert.equal(r.lyra.system.resources.cosmo.value,ce-3);assert.equal(r.doran.system.resources.health.value,health);game.user=r.gm;r.controls.answer={itemUuid:item.uuid,targetUuid:r.doran.uuid,maintenanceMode:"round",firstRound:1,rounds:null,reason:""};const sustained=await registerSustained(r.lyra);assert.equal(sustained.source.itemUuid,item.uuid);
 r.controls.answer={sourceUuid:item.uuid,rounds:2,firstOffset:0,reason:""};const record=await registerArmorBreak(r.doran),row=effectSheetContext(r.doran).find(row=>row.id===record.id);assert.equal(row.quickDamage,1);const rolls=r.rolls;await resolveEffect(r.doran,record.id,{quick:true,expectedRound:row.nextRound,expectedState:row.quickSignature});assert.equal(r.doran.items.get(record.armor.id).system.health.value,29);assert.equal(r.doran.system.resources.health.value,health);assert.equal(r.lyra.system.resources.cosmo.value,ce-3);assert.equal(r.rolls,rolls);if(synthetic)assert.equal(r.worldDoran.items.get(record.armor.id).system.health.value,30);assert.deepEqual(r.notices,[]);
});
