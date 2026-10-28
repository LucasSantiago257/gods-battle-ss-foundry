import {SYSTEM_ID as ID} from "../module/config.mjs";
import {BRASAS} from "../module/effect-rules.mjs";
import {componentUuid} from "../module/technique-builder-rules.mjs";
import {brasasState} from "../module/brasas-rules.mjs";
import {brasasApplicationState} from "../module/brasas-records.mjs";
import {applyBrasas,undoBrasas,endBrasas,recoverBrasas} from "../module/brasas.mjs";
export const copy=structuredClone;
export function patch(doc,data){for(const [path,value]of Object.entries(data)){const parts=path.split(".");let at=doc;for(const k of parts.slice(0,-1))at=at[k]??={};const key=parts.at(-1);if(key.startsWith("-="))delete at[key.slice(2)];else at[key]=copy(value);}}
export function fixture({synthetic=false,classification="silver",rounds=2}={}){
 const gm={id:"gm",active:true,isGM:true},owner={id:"owner",active:true,isGM:false},observer={id:"observer",active:true,isGM:false},users=new Map([gm,owner,observer].map(u=>[u.id,u])),docs=new Map(),denied=new Set(),hooks={},faults=[],writes=[];
 const event=async(phase,tag,data)=>{await hooks[phase]?.(tag,data);const i=faults.findIndex(f=>f.phase===phase&&f.tag===tag);if(i>=0){faults.splice(i,1);throw Error(`fault ${phase} ${tag}`);}};
 const actor={uuid:synthetic?"Scene.arena.Token.target.Actor.target":"Actor.target",type:"knight",name:"Alvo",system:{resources:{health:{value:100,max:100},cosmo:{value:12,max:20},cosmoExtra:4,cosmoReserved:3,cosmoOverload:2},conditions:{afraid:true},combat:{attack:3}},flags:{[ID]:{untouched:"keep"}},testUserPermission:u=>!!u?.isGM||u===owner&&!denied.has(actor.uuid),async update(data){const entries=Object.entries(data),tag=entries.some(([k])=>k.includes("persistentEffects"))?"commit":entries.some(([k,v])=>k.includes("effectOperations")&&v?.kind==="brasasParcel")?"journal":entries.some(([k,v])=>k.endsWith(".status")&&v==="reviewed")?"close":"status";await event("before",tag,data);patch(actor,data);writes.push({tag,data:copy(data)});await event("after",tag,data);return actor;}};
 const record={id:"fire",kind:"brasas",actorUuid:actor.uuid,status:"active",label:"Brasas",firstRound:3,lastRound:2+rounds,combatUuid:"Combat.arena",combatantId:"member",source:{actorUuid:"Actor.hidden",itemUuid:"Actor.hidden.Item.heat",componentUuid:componentUuid(BRASAS.id),classification,damage:BRASAS.damage[classification],constructionId:"source"},damage:BRASAS.damage[classification],ticks:{},reason:"Nota local",time:123,userId:gm.id};
 actor.flags[ID].persistentEffects={fire:record};const member={id:"member",actor},combat={uuid:"Combat.arena",started:true,round:3,turn:0,flags:{[ID]:{actionControl:{epoch:"epoch1",enabled:false}}},combatants:{contents:[member]}};
 docs.set(actor.uuid,actor);docs.set(combat.uuid,combat);globalThis.game={user:gm,users:{activeGM:gm,get:id=>users.get(id)},combats:{contents:[combat]},combat};
 globalThis.fromUuid=async uuid=>{if(uuid.startsWith("Actor.hidden"))throw Error("private attacker lookup");await hooks.resolve?.(uuid);return docs.get(uuid)??null;};
 let n=0;globalThis.foundry={utils:{randomID:()=>`auto${++n}`}};
 const f={actor,record:()=>actor.flags[ID].persistentEffects.fire,combat,member,gm,owner,observer,users,docs,denied,hooks,faults,writes,operations:()=>actor.flags[ID].effectOperations??{},pending:()=>Object.values(actor.flags[ID].effectOperations??{}).find(r=>r.status==="prepared")};
 f.view=()=>({expectedState:brasasApplicationState(actor,"fire"),expectedRound:record.firstRound+Object.keys(f.record().ticks).length});
 f.apply=options=>applyBrasas(actor,"fire",{...f.view(),requester:owner,...options});
 f.undo=options=>undoBrasas(actor,"fire",{expectedState:brasasState(actor,"fire"),requester:owner,...options});
 f.end=options=>endBrasas(actor,"fire",{expectedState:brasasState(actor,"fire"),requester:owner,...options});
 f.recover=(op=f.pending(),options={})=>recoverBrasas(actor,op.id,{requester:owner,...options});
 return f;
}
export const resources=f=>copy(f.actor.system);
export const healthWrites=f=>f.writes.filter(w=>Object.hasOwn(w.data,"system.resources.health.value"));
