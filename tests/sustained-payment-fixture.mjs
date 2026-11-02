import {knight} from "./foundry-stub.mjs";
import {ownedSustainPreview} from "../module/sustained-payment-records.mjs";
import {sustainEndState} from "../module/sustained-payment-rules.mjs";
import {payOwnedSustained,endOwnedSustained,recoverOwnedSustained} from "../module/sustained-payment-owned.mjs";
const ID="gods-battle-ss";export const copy=structuredClone;
export function patch(doc,data){for(const [path,value]of Object.entries(data)){const p=path.split(".");let at=doc;for(const k of p.slice(0,-1))at=at[k]??={};at[p.at(-1)]=copy(value);}}
export function fixture({tier="bronze",mode="round",synthetic=false,self=false}={}){
 const gm={id:"gm",isGM:true,active:true},owner={id:"owner",isGM:false,active:true},observer={id:"observer",isGM:false,active:true},users=new Map([gm,owner,observer].map(u=>[u.id,u])),docs=new Map(),denied=new Set(),hooks={},faults=[],writes=[],reads=[];let n=0;
 const event=async(phase,tag,data)=>{await hooks[phase]?.(tag,data);const i=faults.findIndex(f=>f.phase===phase&&f.tag===tag);if(i>=0){faults.splice(i,1);throw Error(`fault ${phase} ${tag}`);}};
 const system=knight();system.resources.cosmo.value=8;system.resources.cosmoExtra=3;system.resources.cosmoReserved=2;system.resources.cosmoOverload=7;system.resources.health.value=90;
 const actor={uuid:synthetic?"Scene.arena.Token.payer.Actor.payer":"Actor.payer",type:"knight",name:"Pagador",isOwner:true,system,flags:{[ID]:{persistentEffects:{},untouched:"keep"}},testUserPermission:u=>u===gm||u===owner&&!denied.has(actor.uuid),async update(data){const whole=Object.values(data).find(v=>v?.kind==="sustainPaymentOwned"),tag=Object.keys(data).some(k=>k.includes("persistentEffects"))?"commit":whole?"journal":Object.entries(data).some(([k,v])=>k.endsWith(".status")&&v==="reviewed")?"close":"status";await event("before",tag,data);patch(actor,data);writes.push({tag,data:copy(data)});await event("after",tag,data);return actor;}};
 const target=self?actor:{uuid:"Actor.hidden",type:"knight",isOwner:false,update(){throw Error("target write");},testUserPermission(){throw Error("target permission must not be demanded");}};
 if(!self)for(const key of ["system","flags","name"])Object.defineProperty(target,key,{configurable:true,get(){throw Error(`private target ${key}`);}});
 const member={id:"payerMember",actor},targetMember=self?member:{id:"targetMember",actor:target};
 const combat={uuid:"Combat.arena",started:true,round:4,turn:0,flags:{[ID]:{actionControl:{enabled:false,epoch:"epoch4"}}},combatants:{contents:self?[member]:[member,targetMember]}};
 const rounds={bronze:2,silver:3,gold:4}[tier];combat.round=2+rounds;
 const record={id:"sustain1",actorUuid:actor.uuid,kind:"sustained",damage:0,label:"Sustentada local",reason:"Nota inicial",description:"Descri\u00e7\u00e3o privada",userId:gm.id,time:123,status:"active",combatUuid:combat.uuid,combatantId:member.id,firstRound:2,lastRound:1+rounds,rounds,ticks:{},source:{actorUuid:actor.uuid,itemUuid:`${actor.uuid}.Item.removed`,classification:tier,name:"Nome da fonte"},sustain:{cost:1,mode,targetUuid:target.uuid,targetName:"Nome privado do alvo",targetCombatantId:targetMember.id,paidUntilRound:1+rounds,payments:{}}};actor.flags[ID].persistentEffects.sustain1=record;
 docs.set(actor.uuid,actor);docs.set(target.uuid,target);docs.set(combat.uuid,combat);
 globalThis.game={user:gm,users:{activeGM:gm,get:id=>users.get(id)},combat,combats:{contents:[combat]}};
 globalThis.fromUuid=async uuid=>{reads.push(uuid);if(uuid.includes(".Item."))throw Error("current source lookup");await hooks.resolve?.(uuid);return docs.get(uuid)??null;};foundry.utils={randomID:()=>`auto${++n}`};
 const options={useExtra:false,reason:""},f={actor,target,record,member,targetMember,combat,gm,owner,observer,users,docs,denied,hooks,faults,writes,reads,options,preview:o=>ownedSustainPreview(actor,"sustain1",{...options,...o}),operations:()=>actor.flags[ID].effectOperations??{},op:()=>Object.values(actor.flags[ID].effectOperations??{}).at(-1)};
 f.request=(o={},id="intent1")=>({options:{...options,...o},expectedState:f.preview(o).signature,operationId:id,requester:owner});
 f.pay=async(o={})=>payOwnedSustained(actor,"sustain1",{...f.request(o.options??{},o.operationId??"intent1"),...o});
 f.end=async(o={})=>endOwnedSustained(actor,"sustain1",{expectedState:sustainEndState(actor,"sustain1"),operationId:"end1",requester:owner,...o});
 f.recover=(o={})=>recoverOwnedSustained(actor,o.id??f.op().id,{requester:owner,...o});
 f.advance=()=>{combat.round++;combat.flags[ID].actionControl.epoch=`epoch${combat.round}`;};return f;
}
export const ceWrites=f=>f.writes.filter(w=>Object.keys(w.data).some(k=>k==="system.resources.cosmo.value"||k==="system.resources.cosmoExtra"));
export const resources=f=>copy(f.actor.system.resources);
