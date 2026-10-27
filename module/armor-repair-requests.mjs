import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {primaryGM,isPrimaryGM} from "./master-queue.mjs";
import {registerArmorRepair,applyArmorRepair,undoArmorRepair,endArmorRepair,recoverArmorRepair,releaseOrphanArmorRepair} from "./armor-repair.mjs";
import {repairKey} from "./armor-repair-journal.mjs";
import {optionalNote} from "./form-values.mjs";
const busy=new Set();
const actions=new Set(["register","apply","undo","end","recover","close","orphan"]);
const raw=m=>m.flags?.[SYSTEM_ID]?.armorRepairRequest;
const response=m=>m.flags?.[SYSTEM_ID]?.armorRepairResponse;
const own=(o,k)=>Object.hasOwn(o,k)?o[k]:undefined;
function text(value,label){if(typeof value!=="string"||!value||value.length>256)throw Error(`${label} inválido.`);return value;}
function plain(o){if(!o||typeof o!=="object"||![Object.prototype,null].includes(Object.getPrototypeOf(o)))throw Error("Solicitação de reparo inválida.");return o;}
export function armorRepairRequest(value){
 const r=plain(value),action=own(r,"action");if(!actions.has(action))throw Error("Ação de reparo inválida.");
 const result={action,actorUuid:text(own(r,"actorUuid"),"Ficha")};
 if(action==="register"){for(const k of ["sourceUuid","armorUuid","expectedState"])result[k]=text(own(r,k),k);}
 else if(["apply","undo","end"].includes(action)){
  result.recordId=repairKey(own(r,"recordId"));const revision=own(r,"expectedRevision");if(!Number.isSafeInteger(revision)||revision<0)throw Error("Revisão de reparo inválida.");result.expectedRevision=revision;
  if(action==="apply"){
   result.expectedState=text(own(r,"expectedState"),"Prévia");const options=own(r,"options")===undefined?{}:plain(own(r,"options"));result.options={};
   for(const key of ["repair","cost","useExtra","allowOverload","reason"])if(Object.hasOwn(options,key))result.options[key]=structuredClone(options[key]);
  }
 }else result.operationId=repairKey(own(r,"operationId"));
 if(action!=="apply")result.reason=optionalNote(own(r,"reason"));return result;
}
function privateMessage(message,userId){
 const author=message.author?.id??message.user?.id,user=game.users?.get?.(userId),whisper=message.whisper?.map?.(u=>typeof u==="string"?u:u.id);
 if(!user||author!==userId||game.messages?.get?.(message.id)!==message||message.blind||!Array.isArray(whisper)||!whisper.includes(userId)||!whisper.length||whisper.some(id=>id!==userId&&!game.users.get(id)?.isGM)||!whisper.some(id=>game.users.get(id)?.isGM))throw Error("Solicitação privada de reparo sem autoria/acesso válido.");
 repairKey(message.id);return user;
}
function guard(message,userId,signature){
 if(!isPrimaryGM())throw Error("O mestre responsável mudou.");privateMessage(message,userId);
 if(response(message)||actionHash(armorRepairRequest(raw(message)))!==signature)throw Error("Solicitação de reparo alterada ou já respondida.");
}
export async function submitArmorRepairRequest(value){
 const request=armorRepairRequest(value),gm=primaryGM();if(!gm?.active)throw Error("É necessário um mestre ativo para coordenar o reparo.");
 return ChatMessage.create({content:'<span aria-hidden="true"></span>',whisper:[...new Set([game.user.id,gm.id])],flags:{[SYSTEM_ID]:{armorRepairRequest:request}}});
}
async function execute(message,userId){
 if(!isPrimaryGM()||response(message))return;let completed=false;
 try{
  const requester=privateMessage(message,userId),request=armorRepairRequest(raw(message)),signature=actionHash(request),intentGuard=()=>guard(message,userId,signature);
  const actor=await fromUuid(request.actorUuid);intentGuard();
  let result;
  if(request.action==="register"){
   const item=await fromUuid(request.sourceUuid),armor=await fromUuid(request.armorUuid);intentGuard();if(item?.parent!==actor)throw Error("Técnica de outra ficha.");
   result=await registerArmorRepair(item,armor,{expectedState:request.expectedState,requester,reason:request.reason,intentGuard,registrationId:message.id});result={recordId:result.id,status:"registered"};
  }else{
   const common={requester,intentGuard};
   if(request.action==="apply")result=await applyArmorRepair(actor,request.recordId,{...common,expectedRevision:request.expectedRevision,expectedState:request.expectedState,options:request.options,operationId:message.id});
   else if(request.action==="undo")result=await undoArmorRepair(actor,request.recordId,{...common,expectedRevision:request.expectedRevision,reason:request.reason,operationId:message.id});
   else if(request.action==="end"){await endArmorRepair(actor,request.recordId,{...common,expectedRevision:request.expectedRevision,reason:request.reason});result={status:"ended"};}
   else if(request.action==="orphan")result=await releaseOrphanArmorRepair(actor,request.operationId,{...common,reason:request.reason});
   else result=await recoverArmorRepair(actor,request.operationId,{...common,close:request.action==="close",reason:request.reason});
  }
  intentGuard();completed=true;await message.update({[`flags.${SYSTEM_ID}.armorRepairResponse`]:{ok:true,action:request.action,status:result.status,recordId:request.recordId??result.recordId??result.record?.id,operationId:result.operationId??request.operationId??null,replayed:result.replayed===true}});
 }catch(error){
  // A lost/modified request never starts another intention. Journals stay recoverable.
  if(!completed&&isPrimaryGM()&&game.messages?.get?.(message.id)===message&&!response(message))await message.update({[`flags.${SYSTEM_ID}.armorRepairResponse`]:{ok:false,error:error.message}});
 }
}
export async function enqueueArmorRepairRequest(message,_options,userId){
 if(!isPrimaryGM()||!raw(message)||response(message)||busy.has(message.id))return;
 if((message.author?.id??message.user?.id)!==userId||!game.users?.get?.(userId)||game.messages?.get?.(message.id)!==message)return;
 busy.add(message.id);try{return await execute(message,userId);}finally{busy.delete(message.id);}
}
export async function resumeArmorRepairRequests(){
 if(!isPrimaryGM())return;
 for(const message of game.messages?.contents??[])if(raw(message)&&!response(message))await enqueueArmorRepairRequest(message,{},message.author?.id??message.user?.id);
}
export function renderArmorRepairRequest(message,html){if(raw(message)){const root=html.closest?.(".message")??html;if(html.dataset)html.dataset.godsBattleInternalRepair="";root.hidden=true;root.setAttribute?.("aria-hidden","true");}}
export function notifyArmorRepairResponse(message){
 const r=response(message);if(!r||(message.author?.id??message.user?.id)!==game.user.id)return;
 if(!r.ok)ui.notifications.error(r.error);else ui.notifications.info(r.replayed?"Operação já registrada.":({register:"Trabalho registrado.",apply:"Hora de reparo registrada.",undo:"Hora desfeita.",end:"Trabalho encerrado.",recover:"Registro recuperado.",close:"Registro encerrado.",orphan:"Vínculo encerrado."}[r.action]??"Reparo atualizado."));
}
