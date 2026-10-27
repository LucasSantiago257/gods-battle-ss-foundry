import {readFile} from "node:fs/promises";
import {knight} from "./foundry-stub.mjs";
import {drainRegistrationState,drainRecordState,drainRecord} from "../module/drain-records.mjs";
import {registerDrain,applyDrain,undoDrain,endDrain,recoverDrain} from "../module/drain.mjs";
const ID="gods-battle-ss",copy=structuredClone;
const raw=JSON.parse(await readFile(new URL("../data/catalog/techniques.json",import.meta.url),"utf8")).find(x=>x._id==="7cb8218fa35989f1");
export function patch(doc,data){for(const [path,value]of Object.entries(data)){let o=doc;const parts=path.split(".");for(const key of parts.slice(0,-1))o=o[key]??={};o[parts.at(-1)]=copy(value);}}
export function fixture({synthetic=false,same=false}={}){
 const gm={id:"gm",isGM:true,active:true},owner={id:"owner",isGM:false,active:true},observer={id:"observer",isGM:false},users=new Map([gm,owner,observer].map(u=>[u.id,u])),denied=new Set(),docs=new Map(),hooks={},faults=[],writes=[];let n=0,recordId;
 async function event(phase,tag,doc,data){await hooks[phase]?.(tag,doc,data);const i=faults.findIndex(f=>f.phase===phase&&f.tag===tag);if(i>=0){faults.splice(i,1);throw Error(`fault ${phase} ${tag}`);}}
 function actor(uuid){const a={uuid,type:"knight",name:"NPC oculto",system:knight(),flags:{[ID]:{unrelated:"keep"}},testUserPermission:u=>!!u.isGM||u===owner&&!denied.has(uuid),async update(data){const entries=Object.entries(data),record=entries.find(([k])=>k.includes("persistentEffects"))?.[1],tag=entries.some(([k,v])=>k.endsWith(".status")&&v==="reviewed")?"close":entries.some(([k,v])=>v?.kind==="cosmoDrain"&&k.includes("effectOperations"))?"journal":entries.some(([k,v])=>k.endsWith(".status")&&v==="applied")?"commit":record?.status==="ended"?"end":record?.revision===0?"register":"other";await event("before",tag,a,data);patch(a,data);writes.push({uuid:a.uuid,tag,data:copy(data)});await event("after",tag,a,data);return a;}};
  a.system.resources.cosmo.value=12;a.system.resources.cosmo.unlimited=false;a.system.resources.cosmoExtra=4;a.system.resources.cosmoReserved=2;a.system.resources.cosmoOverload=3;a.system.resources.health.value=80;docs.set(uuid,a);return a;}
 const source=actor("Actor.source"),target=same?source:actor(synthetic?"Scene.arena.Token.target.Actor.target":"Actor.target"),item={...copy(raw),id:"drain",uuid:`${source.uuid}.Item.drain`,parent:source,name:"Técnica secreta",system:{...copy(raw.system),effectKind:"sustained",classification:"silver"}};
 source.items={get:id=>id===item.id?item:null,contents:[item]};docs.set(item.uuid,item);
 const combat={uuid:"Combat.arena",started:true,round:2,flags:{[ID]:{actionControl:{epoch:"epoch1"}}}},member={id:"member",actor:target};combat.combatants={contents:[member]};docs.set(combat.uuid,combat);
 globalThis.game={user:gm,users:{activeGM:gm,get:id=>users.get(id)},combats:{contents:[combat]},combat};globalThis.fromUuid=async uuid=>{await hooks.resolve?.(uuid);return docs.get(uuid)??null;};foundry.utils={randomID:()=>`drain${++n}`};
 const record=()=>drainRecord(target,recordId),operations=()=>target.flags[ID].effectOperations??{},pending=()=>Object.values(operations()).find(o=>o.status==="prepared"),view=()=>({expectedRevision:record().revision,expectedState:drainRecordState(target,record()),requester:owner});
 return {gm,owner,observer,users,denied,docs,hooks,faults,writes,source,target,item,combat,member,record,operations,pending,view,async register(options={}){const r=await registerDrain(item,target,{combatUuid:combat.uuid,rounds:3,firstOffset:0,expectedState:drainRegistrationState(item,target,combat.uuid),requester:owner,...options});recordId=r.recordId;return r;},apply:o=>applyDrain(target,recordId,{...view(),...o}),undo:o=>undoDrain(target,recordId,{expectedRevision:record().revision,requester:owner,...o}),end:o=>endDrain(target,recordId,{expectedRevision:record().revision,requester:owner,...o}),recover:(o=pending(),options={})=>recoverDrain(target,o.id,{requester:owner,...options})};
}
export const resources=f=>copy({source:f.source.system,target:f.target.system,sourceFlags:f.source===f.target?undefined:f.source.flags});
export const ce=f=>({current:f.target.system.resources.cosmo.value,extra:f.target.system.resources.cosmoExtra,reserved:f.target.system.resources.cosmoReserved});
export const commits=f=>f.writes.filter(w=>w.tag==="commit");
export const losses=f=>commits(f).filter(w=>Object.keys(w.data).some(k=>k.startsWith("system.resources.")));
