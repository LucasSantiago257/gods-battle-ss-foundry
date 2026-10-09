import test from "node:test";
import assert from "node:assert/strict";
import {knight} from "./foundry-stub.mjs";
import {resolvePool} from "../module/rules.mjs";
import {actionHash} from "../module/action-rules.mjs";
import {controlDuration,controlResistance,controlStart,sameControlAttack} from "../module/control-rules.mjs";
import {controlSource,registerControl,renderControlChat} from "../module/control.mjs";
import {effectView,effectRecords} from "../module/effect-rules.mjs";
import {resolveEffect,endEffect} from "../module/effects.mjs";
const ID="gods-battle-ss";
function patch(obj,data){for(const [path,value] of Object.entries(data)){let o=obj;const parts=path.split(".");for(const p of parts.slice(0,-1))o=o[p]??={};o[parts.at(-1)]=structuredClone(value);}}
function fixture({critical=false,tier="silver"}={}){
 const gm={id:"gm",isGM:true,active:true},player={id:"p",isGM:false},users=new Map([gm,player].map(u=>[u.id,u]));
 const actor={uuid:"Actor.target",name:"Alvo",type:"knight",isOwner:true,system:knight(),flags:{[ID]:{unrelated:"preservar"}},items:{contents:[]},testUserPermission:u=>u===player||u===gm,updates:[],async update(data){this.updates.push(data);patch(this,data);}};
 actor.system.resources.health.value=100;actor.system.resources.cosmo.value=9;actor.system.conditions.afraid=true;
 const caster={uuid:"Actor.caster",type:"knight",system:knight(),flags:{[ID]:{}},testUserPermission:u=>u===player||u===gm};
 const combat={uuid:"Combat.example",started:true,round:2,combatants:{contents:[{id:"targetMember",actor},{id:"casterMember",actor:caster}]}};
 const messages=new Map(),answers=[],renders=[];let n=0;
 globalThis.game={user:gm,users:{activeGM:gm,get:id=>users.get(id)},combat,combats:{contents:[combat]},messages:{get:id=>messages.get(id)}};
 globalThis.fromUuid=async uuid=>uuid===actor.uuid?actor:uuid===caster.uuid?caster:null;
 foundry.utils={randomID:()=>`control${++n}`};foundry.applications.handlebars={renderTemplate:async(path,context)=>{renders.push({path,context});return "template";}};foundry.applications.api.DialogV2={wait:async()=>{const a=answers.shift();return typeof a==="function"?a():a??null;}};
 const attack={name:"Ilusão",effectKind:"control",nature:"mental",damage:0,armorDamage:0,powerCosmic:20,attackerUuid:caster.uuid,targetUuid:actor.uuid,itemUuid:"Actor.caster.Item.tech",control:{...controlDuration({effectKind:"control",classification:tier}),start:controlStart()}};
 const root={id:"activation",isContentVisible:true,blind:false,whisper:[],author:player,flags:{[ID]:{attack,technique:{success:true},techniqueResponse:{status:"published"},techniqueResolution:{operationId:"activation",actorUuid:caster.uuid}}}};
 caster.flags[ID].techniqueOperations={activation:{actorUuid:caster.uuid,status:"paid",controlAttackSignature:actionHash(attack)}};
 const result=resolvePool([5],critical?0:10),control=controlResistance(attack,result.total);
 const resistance={id:"resistance",isContentVisible:true,blind:false,whisper:[],author:player,rolls:[{total:result.total}],flags:{[ID]:{test:result,difficulty:20,attack:{...attack,messageId:root.id},controlResolution:{actorUuid:actor.uuid,rootMessageId:root.id,...control}}}};
 messages.set(root.id,root);messages.set(resistance.id,resistance);
 return {actor,caster,combat,root,resistance,attack,gm,player,answers,renders,async create(answer={rounds:control.rounds}){answers.push(answer);return registerControl(resistance);}};
}
test("Controle usa 2/3/4 rodadas incluindo ativação; customização e limite são explícitos",()=>{
 for(const [classification,baseRounds]of [["bronze",2],["silver",3],["gold",4]])assert.equal(controlDuration({effectKind:"control",classification}).baseRounds,baseRounds);
 assert.equal(controlDuration({effectKind:"damage"}),null);assert.equal(controlDuration({effectKind:"control",classification:"gold",controlRounds:7}).baseRounds,7);
 for(const controlRounds of [-1,0.5,501,NaN,"3"])assert.throws(()=>controlDuration({effectKind:"control",classification:"bronze",controlRounds}));
 assert.throws(()=>controlDuration({effectKind:"control",classification:"divine"}));
});
test("resistência elimina Controle em DC; falha crítica estrita dobra duração, sem dano",()=>{
 const f=fixture();for(const [total,rounds,doubleDuration]of [[20,0,false],[30,0,false],[19,3,false],[10,3,false],[9,6,true]]){const r=controlResistance(f.attack,total);assert.equal(r.rounds,rounds);assert.equal(r.doubleDuration,doubleDuration);assert.equal(r.resisted,total>=20);}
 assert.equal(controlResistance(f.attack,5).retryCost,1);const g=fixture({tier:"gold"});assert.equal(controlResistance(g.attack,5).retryCost,2);
 assert.equal(controlResistance({effectKind:"control"},5),null);f.attack.control.baseRounds=4;assert.throws(()=>controlResistance(f.attack,5));
});
test("vínculo é canônico mesmo se ordem dos campos mudar",()=>{assert.equal(sameControlAttack({a:1,b:{c:2}},{b:{c:2},a:1}),true);assert.equal(sameControlAttack({a:1},{a:2}),false);});
test("registro sem notas ou aceite preserva ficha e congela rodada da ativação",async()=>{
 const f=fixture({critical:true}),before=structuredClone(f.actor.system);f.combat.round=4;const record=await f.create();assert.deepEqual(f.actor.system,before);assert.equal(f.actor.flags[ID].unrelated,"preservar");assert.equal(record.rounds,6);assert.equal(record.firstRound,2);assert.equal(record.lastRound,7);assert.equal(record.damage,0);assert.equal(record.reason,"");assert.equal(record.controlOrigin.doubleDuration,true);assert.equal(record.controlOrigin.rootMessageId,f.root.id);assert.equal(effectView(f.actor,record).overdue,true);
 assert.equal(f.renders[0].context.rounds,6);assert.equal(f.actor.updates.length,1);
});
test("duração ajustável não reinicia prazo; rodadas históricas não causam dano ou estados",async()=>{
 const f=fixture(),before=structuredClone(f.actor.system);f.combat.round=8;const record=await f.create({rounds:2});for(let i=0;i<2;i++){f.answers.push({});await resolveEffect(f.actor,record.id);}assert.equal(effectRecords(f.actor)[record.id].status,"expired");assert.deepEqual(f.actor.system,before);assert.equal(Object.keys(effectRecords(f.actor)[record.id].ticks).length,2);await assert.rejects(f.create(),/já foi registrado/);
});
test("cancelar ou encerrar conserva recursos; histórico encerrado impede reaplicação",async()=>{
 const f=fixture();await f.create(null);assert.equal(f.actor.updates.length,0);const record=await f.create(),before=structuredClone(f.actor.system);f.answers.push("");await endEffect(f.actor,record.id);assert.deepEqual(f.actor.system,before);await assert.rejects(f.create(),/já foi registrado/);
});
test("cartões privados e origens incompletas ficam no registro manual",async()=>{
 for(const change of [f=>f.root.whisper=["gm"],f=>f.resistance.whisper=["p"],f=>f.root.blind=true,f=>f.resistance.isContentVisible=false]){const f=fixture();change(f);await assert.rejects(f.create(),/públicos/);assert.equal(f.actor.updates.length,0);}
 for(const change of [f=>f.root.flags[ID].techniqueResponse.status="paid",f=>f.root.flags[ID].technique.success=false,f=>delete f.caster.flags[ID].techniqueOperations,f=>delete f.attack.control]){const f=fixture();change(f);await assert.rejects(f.create());assert.equal(f.actor.updates.length,0);}
});
test("alvo, autoria, pagamento e resistência adulterados recusam vínculo",async()=>{
 for(const change of [f=>f.attack.targetUuid="Actor.other",f=>f.resistance.author={id:"stranger"},f=>f.caster.testUserPermission=()=>false,f=>f.actor.testUserPermission=()=>false,f=>f.caster.flags[ID].techniqueOperations.activation.status="prepared",f=>f.attack.name="Editado",f=>f.resistance.rolls[0].total++,f=>f.resistance.flags[ID].test.results=[8],f=>f.resistance.flags[ID].difficulty++,f=>f.resistance.flags[ID].controlResolution.rounds++,f=>f.resistance.flags[ID].attack.messageId="other"]){const f=fixture();change(f);await assert.rejects(f.create());assert.equal(f.actor.updates.length,0);}
});
test("sucesso de resistência nunca permite registro",async()=>{const f=fixture(),r=f.resistance.flags[ID];r.test=resolvePool([8],12);f.resistance.rolls[0].total=r.test.total;r.controlResolution={...r.controlResolution,...controlResistance(f.attack,r.test.total)};await assert.rejects(f.create(),/resistido/);});
test("mestre primário, encontro, combatente original e cópias são obrigatórios",async()=>{
 for(const change of [f=>game.user=f.player,f=>game.users.activeGM={id:"other",active:true},f=>f.actor.isOwner=false,f=>f.combat.started=false,f=>f.combat.round=1,f=>game.combat={uuid:"Combat.other"},f=>f.combat.combatants.contents[0].id="new",f=>f.combat.combatants.contents.push({id:"duplicate",actor:f.actor}),f=>f.actor.uuid="Actor.copy"]){const f=fixture();change(f);await assert.rejects(f.create());assert.equal(f.actor.updates.length,0);}
});
test("mudanças durante diálogo ou render invalidam cálculo antes de gravar",async()=>{
 for(const change of [f=>f.actor.system.resources.health.value=77,f=>f.combat.round++,f=>f.resistance.flags[ID].test.modifier++,f=>f.attack.name="Novo",f=>game.user=f.player,f=>f.actor.testUserPermission=()=>false]){const f=fixture();await assert.rejects(f.create(()=>{change(f);return {rounds:3};}));assert.equal(f.actor.updates.length,0);}
 const f=fixture();foundry.applications.handlebars.renderTemplate=async()=>{f.combat.round++;return "template";};await assert.rejects(f.create(),/mudou/);assert.equal(f.actor.updates.length,0);
});
test("mudança após await da origem e operações preparadas recusam registro",async()=>{
 const f=fixture();fromUuid=async uuid=>{if(uuid===f.caster.uuid)f.actor.system.resources.health.value=77;return uuid===f.actor.uuid?f.actor:f.caster;};await assert.rejects(f.create(),/mudou/);assert.equal(f.actor.updates.length,0);
 for(const flag of ["actionOperations","techniqueOperations","effectOperations","damageOperations"]){const g=fixture();g.actor.flags[ID][flag]={pending:{status:"prepared"}};await assert.rejects(g.create(),/interrompid/);}
});
test("limites e tipos inválidos não gravam; notas opcionais têm limite",async()=>{
 for(const answer of [{rounds:0},{rounds:1.5},{rounds:1001},{rounds:NaN},{rounds:3,reason:42},{rounds:3,description:"x".repeat(2001)}]){const f=fixture();await assert.rejects(f.create(answer));assert.equal(f.actor.updates.length,0);}
});
test("fila e resposta perdida após gravação impedem duplicação",async()=>{
 const f=fixture();f.answers.push({rounds:3},{rounds:3});const result=await Promise.allSettled([registerControl(f.resistance),registerControl(f.resistance)]);assert.equal(result.filter(r=>r.status==="fulfilled").length,1);assert.equal(Object.keys(effectRecords(f.actor)).length,1);
 for(const persisted of [false,true]){const g=fixture(),update=g.actor.update.bind(g.actor);g.actor.update=async data=>{if(persisted)await update(data);throw Error("Resposta perdida");};await assert.rejects(g.create(),/perdida/);g.actor.update=update;if(persisted)await assert.rejects(g.create(),/já foi registrado/);else await g.create();assert.equal(Object.keys(effectRecords(g.actor)).length,1);}
});
test("edição posterior da técnica não reescreve duração histórica",async()=>{const f=fixture();f.caster.items={contents:[]};const source=await controlSource(f.resistance,f.actor);assert.equal(source.control.rounds,3);const record=await f.create();assert.equal(record.controlOrigin.itemUuid,f.attack.itemUuid);});
test("botão de registro é oculto em cartões privados e para jogadores",()=>{
 for(const change of [f=>game.user=f.player,f=>f.root.whisper=["gm"],f=>f.resistance.blind=true]){const f=fixture();change(f);let removed=false;renderControlChat(f.resistance,{querySelector:()=>({remove(){removed=true;},addEventListener(){throw Error("Não pode registrar");}})});assert.equal(removed,true);}
});
