import test from "node:test";
import assert from "node:assert/strict";
import {knight,content} from "./foundry-stub.mjs";
import {physicalDamage,damageSnapshot,snapshotMatches,canReadChat} from "../module/combat-rules.mjs";
import {executeDamageRequest,enqueueDamageRequest} from "../module/damage.mjs";
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
