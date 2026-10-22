// Integration rehearsal using the shipped exercise Actors. This runtime is not the Foundry core.
import test from "node:test";
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
import {techniqueWithComponents} from "../module/technique-components.mjs";
import {rollTest} from "../module/rolls.mjs";
import {registerControl} from "../module/control.mjs";
import {registerSustained,sustainedPaymentPreview,paySustained} from "../module/sustained.mjs";
import {effectSheetContext,effectPanelContext,endEffect} from "../module/effects.mjs";
const ID="gods-battle-ss",clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
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
  actor.items=collection(source.items.map(item=>({id:item._id,uuid:`${uuid}.Item.${item._id}`,name:item.name,type:item.type,system:merge(content(),item.system),flags:clone(item.flags??{}),parent:actor,get isOwner(){return actor.isOwner;},async update(changes){updates.push({uuid:this.uuid,changes:clone(changes)});patch(this,changes);prepareKnight(actor.system,actor.items.contents,"rank",{actorUuid:actor.uuid,flags:actor.flags});return this;}})));
  prepareKnight(actor.system,actor.items.contents,"rank",{actorUuid:actor.uuid,flags:actor.flags});documents.set(uuid,actor);for(const item of actor.items.values())documents.set(item.uuid,item);return actor;
 }
 const aster=actorFor(TEST_ACTORS[0],attacker),worldDoran=actorFor(TEST_ACTORS[1],defender),lyra=actorFor(TEST_ACTORS[2],attacker);
 const doran=synthetic?actorFor(TEST_ACTORS[1],defender,`Scene.arena.Token.doran.Actor.${TEST_ACTORS[1]._id}`):worldDoran;
 game.actors=collection([aster,worldDoran,lyra]);
 const combat={id:"arena",uuid:"Combat.arena",started:true,round:1,flags:{[ID]:{actionControl:{enabled:true,epoch:"round1"}}},combatants:collection([aster,doran,lyra].map((actor,index)=>({id:`combatant${index}`,actor})))};game.combat=combat;game.combats.set(combat.id,combat);
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
 return {gm,attacker,defender,observer,aster,doran,worldDoran,lyra,combat,controls,dialogs,renders,notices,dice,messages,updates,round,coordinate,activate,resist,damage,get rolls(){return rolls;}};
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
