import {holdDecisionOutsideQueue} from "./held-dialog.mjs";
import {runMasterOperation} from "../module/master-queue.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {knight,content} from "./foundry-stub.mjs";
import {physicalDamage,damageSnapshot,snapshotMatches,canReadChat} from "../module/combat-rules.mjs";
import {executeDamageRequest,enqueueDamageRequest,recoverDamageOperation,requestDamage} from "../module/damage.mjs";
const ID='gods-battle-ss';
function patch(obj,data) {for(const [path,value] of Object.entries(data)){const parts=path.split('.');let o=obj;for(const key of parts.slice(0,-1))o=o[key]??={};o[parts.at(-1)]=structuredClone(value);}}
function fixture() {
 const gm={id:'gm',isGM:true,active:true},player={id:'p',isGM:false};
 const armor={id:'armor',type:'armor',system:content(),async update(d){patch(this,d);}};armor.system.equipped=true;
 const actor={uuid:'Actor.a',id:'a',type:'knight',system:knight(),flags:{},items:new Map([['armor',armor]]),testUserPermission:u=>u.id==='p'||u.isGM,async update(d){patch(this,d);}};actor.system.resources.health.value=100;
 const source={id:'result',author:player,whisper:[],flags:{[ID]:{resolvedDamage:{actorUuid:actor.uuid,rootMessageId:'attack',body:10.5,armor:10,armorId:'armor'}}}};
 globalThis.game={user:gm,users:{activeGM:gm,get:id=>id==='gm'?gm:player},messages:new Map([['result',source]])};globalThis.fromUuid=async()=>actor;
 function request(id='request',action='apply'){return{id,author:player,flags:{[ID]:{damageRequest:{messageId:'result',action,expected:{health:actor.system.resources.health.value,armor:armor.system.health.value},override:null}}},async update(d){patch(this,d);}};}
 return {actor,armor,request,source,player,gm};
}
test('dano físico reproduz 3 × (10 + 7 − 10) = 21; não cura com PA superior',()=>{
 assert.equal(physicalDamage(13,10,{damageLevel:10,damageBonus:7,protection:10}).damage,21);
 assert.equal(physicalDamage(3,8,{damageLevel:3,protection:3}).damage,0);
 assert.equal(physicalDamage(8,3,{damageLevel:3,protection:10}).damage,0);
});
test('snapshot preserva frações e detecta alterações de PV e armadura',()=>{
 const {actor,armor}=fixture();const snapshot=damageSnapshot(actor,10.5,10,armor.id);
 assert.equal(snapshot.after.health,89.5);assert.ok(snapshotMatches(actor,snapshot,'before'));
 armor.system.health.value=29;assert.equal(snapshotMatches(actor,snapshot,'before'),false);
});
test('mensagens privadas e cegas não concedem acesso por solicitação forjada',()=>{
 const {player,gm}=fixture();assert.equal(canReadChat(player,{blind:true}),false);assert.equal(canReadChat(gm,{blind:true}),true);
 assert.equal(canReadChat(player,{whisper:['another'],author:{id:'another'}}),false);
});
test('mestre aplica uma vez, serializa solicitações simultâneas e permite desfazer',async()=>{
 const {actor,armor,request}=fixture();const a=request('one'),b=request('two');
 await Promise.all([enqueueDamageRequest(a,{},'p'),enqueueDamageRequest(b,{},'p')]);
 assert.equal(actor.system.resources.health.value,89.5);assert.equal(armor.system.health.value,20);
 assert.equal(a.flags[ID].damageResponse.ok,true);assert.equal(b.flags[ID].damageResponse.ok,false);
 const undo=request('undo','undo');await executeDamageRequest(undo,'p');assert.equal(actor.system.resources.health.value,100);assert.equal(armor.system.health.value,30);
 await executeDamageRequest(request('undo2','undo'),'p');assert.equal(actor.system.resources.health.value,100);
});
test('alteração posterior impede desfazer e confirmação desatualizada impede aplicar',async()=>{
 const {actor,request}=fixture();const old=request();actor.system.resources.health.value=99;await executeDamageRequest(old,'p');assert.equal(actor.system.resources.health.value,99);
 await executeDamageRequest(request('fresh'),'p');actor.system.resources.health.value=77;await executeDamageRequest(request('undo','undo'),'p');assert.equal(actor.system.resources.health.value,77);
});
test('erro após gravar armadura restaura sem gastar vida e mantém journal',async()=>{
 const {actor,armor,request}=fixture();const update=actor.update.bind(actor);let fail=true;
 actor.update=async d=>{if(fail&&Object.hasOwn(d,'system.resources.health.value')){fail=false;throw Error('falha de gravação');}await update(d);};
 const r=request();await executeDamageRequest(r,'p');assert.equal(actor.system.resources.health.value,100);assert.equal(armor.system.health.value,30);assert.equal(actor.flags[ID].damageOperations.attack.status,'failed');
});
test('observador, autor falso e cliente que não é mestre responsável não alteram PV',async()=>{
 const {actor,request}=fixture();actor.testUserPermission=()=>false;await executeDamageRequest(request(),'p');assert.equal(actor.system.resources.health.value,100);
 const forged=request();await executeDamageRequest(forged,'gm');assert.equal(actor.system.resources.health.value,100);
 game.user={id:'other'};await executeDamageRequest(request(),'p');assert.equal(actor.system.resources.health.value,100);
});
test('recuperação explícita reverte gravação parcial e recusa valores posteriores',async()=>{
 const {actor,armor}=fixture();const r={...damageSnapshot(actor,10.5,10,armor.id),status:'prepared',direction:'apply',previousKey:null};
 actor.flags[ID]={damageOperations:{attack:r}};armor.system.health.value=r.after.armor;
 foundry.applications.api.DialogV2={confirm:async()=>true};await recoverDamageOperation(actor,'attack');assert.equal(armor.system.health.value,30);assert.equal(actor.flags[ID].damageOperations.attack.status,'failed');
 actor.flags[ID].damageOperations.attack.status='prepared';actor.system.resources.health.value=77;
 await assert.rejects(recoverDamageOperation(actor,'attack'),/Recursos diferentes/);assert.equal(actor.system.resources.health.value,77);
});
test('mestre recusa aplicar resistência de outra ficha a técnica com alvo vinculado',async()=>{
 const {actor,armor,request}=fixture();game.messages.set('attack',{flags:{[ID]:{attack:{targetUuid:'Actor.other'}}}});
 const wrong=request();await executeDamageRequest(wrong,'p');assert.equal(actor.system.resources.health.value,100);assert.equal(armor.system.health.value,30);
 assert.match(wrong.flags[ID].damageResponse.error,/alvo marcado/);
 game.messages.get('attack').flags[ID].attack.targetUuid=actor.uuid;
 const correct=request('correct');await executeDamageRequest(correct,'p');assert.equal(correct.flags[ID].damageResponse.ok,true);assert.equal(actor.system.resources.health.value,89.5);
});

test("recuperação de dano não ocupa fila durante confirmação e conserva cancelamento",async()=>{
 const {actor,armor}=fixture(),r={...damageSnapshot(actor,10.5,10,armor.id),status:"prepared",direction:"apply",previousKey:null};actor.flags[ID]={damageOperations:{attack:r}};armor.system.health.value=r.after.armor;
 await holdDecisionOutsideQueue(()=>recoverDamageOperation(actor,"attack"),{confirm:true});assert.equal(actor.system.resources.health.value,100);assert.equal(armor.system.health.value,r.after.armor);assert.equal(r.status,"prepared");
});
test("recuperação de dano recusa mestre ou registro alterados enquanto aberta",async()=>{
 for(const change of [f=>game.user=f.player,f=>f.actor.flags[ID].damageOperations.attack.body=99,f=>f.actor.system.resources.health.value=77]){const f=fixture(),r={...damageSnapshot(f.actor,10.5,10,f.armor.id),status:"prepared",direction:"apply",previousKey:null};f.actor.flags[ID]={damageOperations:{attack:r}};await assert.rejects(holdDecisionOutsideQueue(()=>recoverDamageOperation(f.actor,"attack"),{confirm:true,answer:true,during:async()=>{await runMasterOperation(()=>change(f));}}),/mudou/);assert.equal(r.status,"prepared");assert.equal(f.armor.system.health.value,30);}
});

test('cartão legado de efeito ou origem sem dano não cria journal nem aceita substituição de PV',async()=>{
 for(const effectKind of ['control','sustained','manual']){for(const origin of ['source','root']){const f=fixture();if(origin==='source'){f.source.flags[ID].attack={effectKind};f.source.isContentVisible=true;await assert.rejects(requestDamage(f.source),/sem dano/);}else game.messages.set('attack',{flags:{[ID]:{attack:{effectKind,targetUuid:f.actor.uuid}}}});const req=f.request();req.flags[ID].damageRequest.override={body:30,armor:20,reason:''};await executeDamageRequest(req,'p');assert.equal(f.actor.system.resources.health.value,100);assert.equal(f.armor.system.health.value,30);assert.equal(f.actor.flags[ID]?.damageOperations,undefined);assert.equal(req.flags[ID].damageResponse.ok,false);}}
});
test('desfazer dano já aplicado antes da correção preserva o histórico legado de efeitos',async()=>{
 const f=fixture();await executeDamageRequest(f.request(),'p');assert.equal(f.actor.system.resources.health.value,89.5);f.source.flags[ID].attack={effectKind:'sustained'};game.messages.set('attack',{flags:{[ID]:{attack:{effectKind:'sustained',targetUuid:f.actor.uuid}}}});await executeDamageRequest(f.request('legacyUndo','undo'),'p');assert.equal(f.actor.system.resources.health.value,100);assert.equal(f.armor.system.health.value,30);assert.equal(f.actor.flags[ID].damageOperations.attack.status,'undone');await executeDamageRequest(f.request('again'),'p');assert.equal(f.actor.system.resources.health.value,100);
});
