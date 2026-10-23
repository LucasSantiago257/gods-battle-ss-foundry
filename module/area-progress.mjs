import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {canReadChat} from "./combat-rules.mjs";
import {areaProgressRow} from "./area-progress-rules.mjs";

const bindings=new WeakMap();
const rowsOf=root=>[...root.querySelectorAll("[data-area-member]")];
function clear(root){
 for(const row of rowsOf(root)){
  const badge=row.querySelector("[data-area-status]");
  if(badge){badge.textContent="";badge.hidden=true;delete badge.dataset.state;}
  for(const button of row.querySelectorAll("[data-area-target]")){button.hidden=true;button.disabled=true;}
 }
}
// Read only. Epochs invalidate every pending lookup, including on removal or lost visibility.
async function update(root){
 const binding=bindings.get(root);if(!binding)return;
 const epoch=++binding.epoch,user=game.user,message=binding.message;clear(root);
 const current=()=>{
  // Chat rendering can begin before insertion. Once seen connected, a detached card is obsolete.
  if(root.isConnected===true)binding.wasConnected=true;
  return !!user&&bindings.get(root)===binding&&binding.epoch===epoch&&(!binding.wasConnected||root.isConnected!==false)
   &&game.user===user&&game.users?.get?.(user.id)===user&&game.messages?.get?.(message.id)===message&&message.isContentVisible===true
   &&canReadChat(user,message)&&actionHash(message.flags?.[SYSTEM_ID]?.attack)===binding.attackHash;
 };
 if(!current())return;
 const rows=rowsOf(root);
 const resolve=async row=>{try{return await fromUuid(row.dataset.areaMember);}catch{return null;}};
 const actors=await Promise.all(rows.map(resolve));if(!current())return;
 // A document replaced/deleted while another lookup was pending must not inherit its old state.
 const latest=await Promise.all(rows.map(resolve));if(!current())return;
 for(let i=0;i<rows.length;i++){
  const row=rows[i],actor=actors[i]===latest[i]?latest[i]:null;
  const state=areaProgressRow(message,row.dataset.areaMember,actor,{user,users:game.users,messages:game.messages.contents??[]});
  if(!state)continue;
  const badge=row.querySelector("[data-area-status]");
  if(badge){badge.textContent=state.label;badge.dataset.state=state.state;badge.hidden=!state.label;}
  for(const button of row.querySelectorAll("[data-area-target]")){
   button.hidden=!state.canResist;button.disabled=!state.canResist||binding.busy();
  }
 }
}
export function installAreaProgress(message,html,{busy=()=>false}={}){
 const root=html.querySelector?.("[data-area-progress]");if(!root)return;
 clear(root);
 // Never read a hidden root's attack flags just to decorate its card.
 if(!game.user||message.isContentVisible!==true||!canReadChat(game.user,message))return;
 root.dataset.areaProgressId=message.id;
 bindings.set(root,{message,attackHash:actionHash(message.flags?.[SYSTEM_ID]?.attack),epoch:0,busy,wasConnected:root.isConnected===true});
 return update(root);
}
export function updateAreaProgress(html){
 const root=html.querySelector?.("[data-area-progress]");return root?update(root):undefined;
}
export async function refreshAreaProgress(){
 const roots=globalThis.document?.querySelectorAll?.("[data-area-progress-id]")??[];
 await Promise.allSettled([...roots].map(update));
}
