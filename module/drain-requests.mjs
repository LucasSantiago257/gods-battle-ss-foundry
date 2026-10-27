import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {primaryGM,isPrimaryGM} from "./master-queue.mjs";
import {registerDrain,applyDrain,undoDrain,endDrain,recoverDrain} from "./drain.mjs";
import {drainKey} from "./drain-records.mjs";
import {optionalNote} from "./form-values.mjs";
const busy=new Set();
const actions=new Set(["register","apply","undo","end","recover","close"]);
const raw=m=>m.flags?.[SYSTEM_ID]?.drainRequest;
const response=m=>m.flags?.[SYSTEM_ID]?.drainResponse;
const own=(o,k)=>Object.hasOwn(o,k)?o[k]:undefined;
function text(value,label){if(typeof value!=="string"||!value||value.length>256)throw Error(`${label} inválido.`);return value;}
function plain(o){if(!o||typeof o!=="object"||![Object.prototype,null].includes(Object.getPrototypeOf(o)))throw Error("Solicitação de Dreno inválida.");return o;}
export function drainRequest(value){
 const r=plain(value),action=own(r,"action");if(!actions.has(action))throw Error("Ação de Dreno inválida.");
 const result={action,actorUuid:text(own(r,"actorUuid"),"Ficha")};
 if(action==="register"){
  for(const k of ["sourceUuid","combatUuid","expectedState"])result[k]=text(own(r,k),k);
  const rounds=own(r,"rounds"),firstOffset=own(r,"firstOffset");if(!Number.isSafeInteger(rounds)||rounds<1||rounds>1000||![0,1].includes(firstOffset))throw Error("Prazo de Dreno inválido.");Object.assign(result,{rounds,firstOffset});
 }
 else if(["apply","undo","end"].includes(action)){
  result.recordId=drainKey(own(r,"recordId"));const revision=own(r,"expectedRevision");if(!Number.isSafeInteger(revision)||revision<0)throw Error("Revisão de Dreno inválida.");result.expectedRevision=revision;
  if(action==="apply"){
   result.expectedState=text(own(r,"expectedState"),"Prévia");const options=own(r,"options")===undefined?{}:plain(own(r,"options"));result.options={};
   const skip=own(r,"skip")===undefined?false:own(r,"skip");if(typeof skip!=="boolean")throw Error("Dispensa de Dreno inválida.");result.skip=skip;
   for(const key of ["current","extra","reason"])if(Object.hasOwn(options,key))result.options[key]=structuredClone(options[key]);
  }
 }else result.operationId=drainKey(own(r,"operationId"));
 if(action!=="apply")result.reason=optionalNote(own(r,"reason"));return result;
}
function privateMessage(message,userId){
 const author=message.author?.id??message.user?.id,user=game.users?.get?.(userId),whisper=message.whisper?.map?.(u=>typeof u==="string"?u:u.id);
 if(!user||author!==userId||game.messages?.get?.(message.id)!==message||message.blind||!Array.isArray(whisper)||!whisper.includes(userId)||!whisper.length||whisper.some(id=>id!==userId&&!game.users.get(id)?.isGM)||!whisper.some(id=>game.users.get(id)?.isGM))throw Error("Solicitação privada de Dreno sem autoria/acesso válido.");
 drainKey(message.id);return user;
}
function guard(message,userId,signature){
 if(!isPrimaryGM())throw Error("O mestre responsável mudou.");privateMessage(message,userId);
 if(response(message)||actionHash(drainRequest(raw(message)))!==signature)throw Error("Solicitação de Dreno alterada ou já respondida.");
}
export async function submitDrainRequest(value){
 const request=drainRequest(value),gm=primaryGM();if(!gm?.active)throw Error("É necessário um mestre ativo para coordenar o Dreno.");
 return ChatMessage.create({content:'<span aria-hidden="true"></span>',whisper:[...new Set([game.user.id,gm.id])],flags:{[SYSTEM_ID]:{drainRequest:request}}});
}
async function execute(message,userId){
 if(!isPrimaryGM()||response(message))return;let completed=false;
 try{
  const requester=privateMessage(message,userId),request=drainRequest(raw(message)),signature=actionHash(request),intentGuard=()=>guard(message,userId,signature);
  const actor=await fromUuid(request.actorUuid);intentGuard();
  let result;
  const common={requester,intentGuard};
  if(request.action==="register"){
   const item=await fromUuid(request.sourceUuid);intentGuard();
   result=await registerDrain(item,actor,{...common,combatUuid:request.combatUuid,rounds:request.rounds,firstOffset:request.firstOffset,expectedState:request.expectedState,reason:request.reason,registrationId:message.id});
  }else if(request.action==="apply")result=await applyDrain(actor,request.recordId,{...common,expectedRevision:request.expectedRevision,expectedState:request.expectedState,options:request.options,skip:request.skip,operationId:message.id});
  else if(request.action==="undo")result=await undoDrain(actor,request.recordId,{...common,expectedRevision:request.expectedRevision,reason:request.reason,operationId:message.id});
  else if(request.action==="end")result=await endDrain(actor,request.recordId,{...common,expectedRevision:request.expectedRevision,reason:request.reason,operationId:message.id});
  else result=await recoverDrain(actor,request.operationId,{...common,close:request.action==="close",reason:request.reason});
  intentGuard();completed=true;await message.update({[`flags.${SYSTEM_ID}.drainResponse`]:{ok:true,action:request.action,status:result.status,recordId:request.recordId??result.recordId??result.record?.id,operationId:result.operationId??request.operationId??null,replayed:result.replayed===true}});
 }catch(error){
  // A lost/modified request never starts another intention. Journals stay recoverable.
  if(!completed&&isPrimaryGM()&&game.messages?.get?.(message.id)===message&&!response(message))await message.update({[`flags.${SYSTEM_ID}.drainResponse`]:{ok:false,error:error.message}});
 }
}
export async function enqueueDrainRequest(message,_options,userId){
 if(!isPrimaryGM()||!raw(message)||response(message)||busy.has(message.id))return;
 if((message.author?.id??message.user?.id)!==userId||!game.users?.get?.(userId)||game.messages?.get?.(message.id)!==message)return;
 busy.add(message.id);try{return await execute(message,userId);}finally{busy.delete(message.id);}
}
export async function resumeDrainRequests(){
 if(!isPrimaryGM())return;
 for(const message of game.messages?.contents??[])if(raw(message)&&!response(message))await enqueueDrainRequest(message,{},message.author?.id??message.user?.id);
}
export function renderDrainRequest(message,html){if(raw(message)){const root=html.closest?.(".message")??html;if(html.dataset)html.dataset.godsBattleInternalDrain="";root.hidden=true;root.setAttribute?.("aria-hidden","true");}}
export function notifyDrainResponse(message,changes){
 if(changes&&!Object.hasOwn(changes,`flags.${SYSTEM_ID}.drainResponse`)&&!changes.flags?.[SYSTEM_ID]?.drainResponse)return;
 const r=response(message);if(!r||(message.author?.id??message.user?.id)!==game.user.id)return;
 if(!r.ok)ui.notifications.error(r.error);else ui.notifications.info(r.replayed?"Operação já registrada.":({register:"Dreno registrado.",apply:"Parcela de Dreno registrada.",undo:"Parcela desfeita.",end:"Dreno encerrado.",recover:"Registro recuperado.",close:"Registro encerrado."}[r.action]??"Dreno atualizado."));
}
