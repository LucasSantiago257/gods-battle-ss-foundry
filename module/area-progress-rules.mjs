// Read-only draft contract. Not connected to a card until the UI/privacy milestone is complete.
import {SYSTEM_ID} from "./config.mjs";
import {areaAttackFor} from "./area-rules.mjs";
import {actionHash} from "./action-rules.mjs";
import {canReadChat} from "./combat-rules.mjs";
const owns=(actor,user)=>!!user&&(user.isGM||actor?.testUserPermission?.(user,"OWNER")===true);
const validId=id=>typeof id==="string"&&/^[a-zA-Z0-9_-]{1,64}$/.test(id);
const number=n=>Number.isFinite(n)&&n>=0&&n<=1000000;
// No game globals, DOM writes or Actor updates. Callers must revalidate after async lookups.
export function areaProgressRow(root,actorUuid,actor,{user,users,messages=[]}={}){
 if(!user||root?.isContentVisible!==true||!canReadChat(user,root)||!validId(root.id))return null;
 let expected;try{expected={...areaAttackFor(root.flags?.[SYSTEM_ID]?.attack,actorUuid),messageId:root.id};}catch{return null;}
 const row={actorUuid,state:"unavailable",label:"Alvo indisponível",canResist:false,resultCount:0};
 if(actor?.uuid!==actorUuid||actor.type!=="knight")return row;
 if(!owns(actor,user))return {...row,state:"restricted",label:""};
 const seen=new Set();let resultCount=0,invalid=false;
 for(const message of messages){
  if(message?.isContentVisible!==true||!canReadChat(user,message)||!validId(message.id)||seen.has(message.id))continue;
  const author=users?.get?.(message.author?.id??message.user?.id);if(!owns(actor,author))continue;
  const flags=message.flags?.[SYSTEM_ID],r=flags?.resolvedDamage;
  if(r?.rootMessageId!==root.id||r.actorUuid!==actorUuid)continue;
  seen.add(message.id);
  const result=flags.resistance;
  if(!number(r.body)||!number(r.armor)||result?.application!=="damage"||result.damage!==r.body||result.armorDamage!==r.armor||actionHash(flags.attack)!==actionHash(expected)){invalid=true;continue;}
  resultCount++;
 }
 const record=actor.flags?.[SYSTEM_ID]?.damageOperations?.[root.id],base={...row,canResist:true,resultCount};
 if(record){
  const states={applied:["applied","Aplicado"],undone:["undone","Desfeito"],prepared:["interrupted","Conferir aplicação"],repair:["interrupted","Conferir aplicação"],failed:["failed","Não aplicado"]};
  const [state,label]=Object.hasOwn(states,record.status)?states[record.status]:["review","Conferir registro"];
  return {...base,state,label};
 }
 if(invalid)return {...base,state:"review",label:"Conferir resultado"};
 return {...base,state:resultCount?"pending":"waiting",label:resultCount?"Dano pendente":"Aguardando resistência"};
}
