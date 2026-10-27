import {readFile} from "node:fs/promises";
import {knight,content} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {armorRepairState} from "../module/armor-repair-rules.mjs";
import {registerArmorRepair,applyArmorRepair,undoArmorRepair,endArmorRepair,recoverArmorRepair} from "../module/armor-repair.mjs";
const ID="gods-battle-ss",copy=structuredClone;
const source=JSON.parse(await readFile(new URL("../data/catalog/techniques.json",import.meta.url),"utf8")).find(x=>x._id==="16ffa8dcf4d1e1d8");
export function patch(obj,data){for(const [path,value]of Object.entries(data)){let o=obj;const parts=path.split(".");for(const key of parts.slice(0,-1))o=o[key]??={};o[parts.at(-1)]=copy(value);}}
export function fixture({same=false,synthetic=false}={}){
 const gm={id:"gm",isGM:true,active:true},owner={id:"owner",isGM:false},observer={id:"observer",isGM:false},users=new Map([gm,owner,observer].map(x=>[x.id,x])),denied=new Set(),docs=new Map(),writes=[],faults=[],hooks={};let n=0;
 function tag(actor,data){const entries=Object.entries(data);if(entries.some(([k])=>k.startsWith("system.resources.")))return "payment";
  for(const [k,v]of entries){if(k.endsWith(".status")&&k.includes("effectOperations"))return actor===caster?"originRelease":"targetRelease";if(k.includes("effectOperations")&&v?.kind)return v.kind==="armorRepair"?"originJournal":"targetLock";if(k.includes("armorRepairs")&&v?.kind)return v.revision===0?"register":"record";}return "other";}
 async function event(phase,who,label,data){await hooks[phase]?.(who,label,data);const index=faults.findIndex(f=>f.phase===phase&&f.tag===label);if(index>=0){faults.splice(index,1);throw Error(`fault ${phase} ${label}`);}}
 function actor(uuid){const a={uuid,type:"knight",name:uuid,system:knight(),flags:{[ID]:{unrelated:"keep"}},isOwner:true,testUserPermission(user){return !!user.isGM||user===owner&&!denied.has(uuid);},async update(data){const label=tag(a,data);await event("before",a,label,data);patch(a,data);prepare();writes.push({uuid:a.uuid,label,data:copy(data)});await event("after",a,label,data);return a;}};docs.set(uuid,a);return a;}
 const caster=actor("Actor.caster"),target=same?caster:actor(synthetic?"Scene.arena.Token.target.Actor.target":"Actor.target");
 caster.system.profile.level=11;caster.system.resources.cosmo.value=10;caster.system.resources.cosmoExtra=0;caster.system.resources.cosmoReserved=0;caster.system.resources.cosmoOverload=0;caster.system.resources.cosmo.unlimited=false;caster.system.resources.health.value=100;
 const item={...copy(source),id:"repair",uuid:`${caster.uuid}.Item.repair`,parent:caster};
 const armor={id:"armor",uuid:`${target.uuid}.Item.armor`,name:"Armadura",type:"armor",parent:target,system:{...content(),equipped:false,state:"alive",health:{...content().health,value:19}},async update(data){await event("before",armor,"repair",data);patch(armor,data);prepare();writes.push({uuid:armor.uuid,label:"repair",data:copy(data)});await event("after",armor,"repair",data);return armor;}};
 caster.items={contents:[item],get:id=>caster.items.contents.find(x=>x.id===id)};if(same)caster.items.contents.push(armor);else target.items={contents:[armor],get:id=>target.items.contents.find(x=>x.id===id)};docs.set(item.uuid,item);docs.set(armor.uuid,armor);
 function prepare(){for(const a of new Set([caster,target]))if(a.items)prepareKnight(a.system,a.items.contents,"rank",{actorUuid:a.uuid,flags:a.flags});}
 prepare();globalThis.game={user:gm,users:{get:id=>users.get(id),activeGM:gm}};globalThis.fromUuid=async uuid=>{await hooks.resolve?.(uuid);return docs.get(uuid)??null;};foundry.utils={randomID:()=>`repair${++n}`};
 let record;
 const saved=()=>caster.flags[ID].armorRepairs?.[record?.id],operations=()=>caster.flags[ID].effectOperations??{},pending=()=>Object.values(operations()).find(x=>x.kind==="armorRepair"&&x.status==="prepared"),last=()=>Object.values(operations()).at(-1);
 const view=()=>({expectedRevision:saved().revision,expectedState:armorRepairState(item,armor),requester:owner});
 return {caster,target,item,armor,gm,owner,observer,users,denied,docs,writes,faults,hooks,prepare,saved,operations,pending,last,view,async register(options={}){record=await registerArmorRepair(item,armor,{expectedState:armorRepairState(item,armor),requester:owner,...options});return record;},apply(options={}){return applyArmorRepair(caster,record.id,{...view(),...options});},undo(options={}){return undoArmorRepair(caster,record.id,{expectedRevision:saved().revision,requester:owner,...options});},end(options={}){return endArmorRepair(caster,record.id,{expectedRevision:saved().revision,requester:owner,...options});},recover(op=pending(),options={}){return recoverArmorRepair(caster,op.id,{requester:owner,...options});}};
}
export const resources=f=>({ce:f.caster.system.resources.cosmo.value,extra:f.caster.system.resources.cosmoExtra,health:f.caster.system.resources.health.value,armor:f.armor.system.health.value});
export const counts=f=>Object.fromEntries(["payment","repair"].map(k=>[k,f.writes.filter(x=>x.label===k).length]));

