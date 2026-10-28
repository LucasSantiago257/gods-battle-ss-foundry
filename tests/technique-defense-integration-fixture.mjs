import {fixture,patch} from "./technique-defense-fixture.mjs";
import {rollTest} from "../module/rolls.mjs";
import {enqueueDamageRequest} from "../module/damage.mjs";
import {defenseState} from "../module/technique-defense-records.mjs";
import {submitTechniqueDefenseRequest,enqueueTechniqueDefenseRequest} from "../module/technique-defense-requests.mjs";
const ID="gods-battle-ss";
export function integration(options={}){
 const f=fixture(options),notices=[],renders=[];let n=0;
 Object.defineProperty(f.actor,"isOwner",{get:()=>f.actor.testUserPermission(game.user,"OWNER")});
 game.settings={get:(namespace,key)=>namespace==="core"&&key==="rollMode"?"publicroll":"rank"};
 globalThis.ui={notifications:{warn:t=>notices.push(t),error:t=>notices.push(t),info:t=>notices.push(t)}};
 foundry.applications.api.DialogV2={wait:async()=>f.hooks.dialog?f.hooks.dialog():{difficulty:20,bonus:0,advantage:0},confirm:async()=>true};
 foundry.applications.handlebars={renderTemplate:async(path,context)=>{renders.push({path,context});await f.hooks.render?.();return "<p>Teste</p>";}};
 function makeMessage(data){return {...data,async update(change){if(f.hooks.message)await f.hooks.message(this,change);patch(this,change);return this;}};}
 globalThis.ChatMessage={getSpeaker:({actor})=>({actor:actor.uuid}),applyRollMode:(data,mode)=>{data.whisper=mode==="publicroll"?[]:mode==="selfroll"?[game.user.id]:[f.gm.id];data.blind=mode==="blindroll";},async create(data){const message=makeMessage({id:`message${++n}`,author:game.user,isContentVisible:true,blind:false,whisper:[],...data});f.messages.set(message.id,message);return message;}};
 const armor={id:"armor",uuid:`${f.actor.uuid}.Item.armor`,parent:f.actor,type:"armor",system:{equipped:true,state:"active",health:{value:30,max:30}},async update(data){patch(armor,data);await f.hooks.armor?.();return armor;}};
 if(options.armor!==false){f.actor.items.contents.push(armor);f.docs.set(armor.uuid,armor);}
 const request=(mode="paid")=>({action:"apply",mode,actorUuid:f.actor.uuid,rootId:f.message.id,...(mode==="paid"?{itemId:f.item.id,options:f.options}:{resolved:{outcome:"success",defense:30}}),expectedState:defenseState(f.actor,f.message,f.owner,{mode,item:f.item,options:f.options}),expectedRevision:f.record()?.revision??0});
 return {...f,armor,notices,renders,request,async resolved(...args){game.user=f.gm;return f.resolved(...args);},async submit(value=request()){game.user=f.owner;return submitTechniqueDefenseRequest(value);},async process(message,userId=message.author.id){game.user=f.gm;return enqueueTechniqueDefenseRequest(message,{},userId);},async resist(more={}){game.user=f.owner;return rollTest(f.actor,"resistance","sen",{difficulty:20,quick:true,resistanceAttack:{...structuredClone(f.attack),messageId:f.message.id},...more});},async damage(card,action="apply",override=null){game.user=f.owner;const r=card.flags[ID].resolvedDamage,request=await ChatMessage.create({flags:{[ID]:{damageRequest:{messageId:card.id,action,expected:{health:f.actor.system.resources.health.value,armor:r.armorId?armor.system.health.value:null},override}}}});game.user=f.gm;await enqueueDamageRequest(request,{},f.owner.id);return request;}};
}
