import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {primaryGM,isPrimaryGM} from "./master-queue.mjs";
import {payOwnedSustained,endOwnedSustained,recoverOwnedSustained} from "./sustained-payment-owned.mjs";
import {sustainPaymentKey} from "./sustained-payment-rules.mjs";
import {optionalNote} from "./form-values.mjs";
const busy=new Set(),actions=new Set(["pay","end","recover","close"]);
const raw=m=>m.flags?.[SYSTEM_ID]?.sustainPaymentRequest,response=m=>m.flags?.[SYSTEM_ID]?.sustainPaymentResponse;
const own=(o,k)=>Object.hasOwn(o,k)?o[k]:undefined;
function plain(o){if(!o||typeof o!=="object"||![Object.prototype,null].includes(Object.getPrototypeOf(o)))throw Error("Parâmetros de Sustentada inválidos.");return o;}
function text(v){if(typeof v!=="string"||!v||v.length>256)throw Error("Identidade/prévia de Sustentada inválida.");return v;}
export function sustainPaymentRequest(value){
 const r=plain(value),action=own(r,"action");if(!actions.has(action))throw Error("Ação de Sustentada inválida.");
 const result={action,actorUuid:text(own(r,"actorUuid"))};
 if(!/^(Actor\.|Scene\.)/.test(result.actorUuid))throw Error("Escolha uma ficha ou token.");
 if(action==="pay"||action==="end"){
  result.recordId=sustainPaymentKey(own(r,"recordId"));result.expectedState=text(own(r,"expectedState"));
  if(action==="pay"){const input=plain(own(r,"options")),useExtra=own(input,"useExtra");if(typeof useExtra!=="boolean")throw Error("Escolha a prefer\u00eancia de CE extra.");result.options={useExtra,reason:optionalNote(own(input,"reason"))};}
  else result.reason=optionalNote(own(r,"reason"));
 }else{result.operationId=sustainPaymentKey(own(r,"operationId"));result.reason=optionalNote(own(r,"reason"));}
 return result;
}
export function sustainPaymentPrivateMessage(message,userId){
 const author=message.author?.id??message.user?.id,user=game.users?.get?.(userId),whisper=message.whisper?.map?.(u=>typeof u==="string"?u:u.id);
 if(!user||author!==userId||game.messages?.get?.(message.id)!==message||message.blind||message.isContentVisible===false||!Array.isArray(whisper)||!whisper.includes(userId)||whisper.some(id=>id!==userId&&!game.users.get(id)?.isGM)||!whisper.some(id=>game.users.get(id)?.isGM))throw Error("Mensagem privada de Sustentada sem autoria/acesso válido.");
 sustainPaymentKey(message.id);return user;
}
function guard(message,userId,signature){
 if(!isPrimaryGM())throw Error("O mestre responsável mudou.");sustainPaymentPrivateMessage(message,userId);
 if(response(message)||actionHash(sustainPaymentRequest(raw(message)))!==signature)throw Error("A intenção de Sustentada mudou ou já foi respondida.");
}
export async function submitSustainPaymentRequest(value){
 const request=sustainPaymentRequest(value),gm=primaryGM();
 if(!gm?.active||!gm.isGM||game.users?.get?.(gm.id)!==gm||game.users?.get?.(game.user?.id)!==game.user)throw Error("Mestre offline.");
 return ChatMessage.create({content:'<span aria-hidden="true"></span>',whisper:[...new Set([game.user.id,gm.id])],flags:{[SYSTEM_ID]:{sustainPaymentRequest:request}}});
}
async function execute(message,userId){
 if(!isPrimaryGM()||response(message))return;let completed=false;
 try{
  const requester=sustainPaymentPrivateMessage(message,userId),request=sustainPaymentRequest(raw(message)),signature=actionHash(request),intentGuard=()=>guard(message,userId,signature);
  const actor=await fromUuid(request.actorUuid);intentGuard();const common={requester,intentGuard};let result;
  if(request.action==="pay")result=await payOwnedSustained(actor,request.recordId,{...common,expectedState:request.expectedState,options:request.options,operationId:message.id});
  else if(request.action==="end")result=await endOwnedSustained(actor,request.recordId,{...common,expectedState:request.expectedState,reason:request.reason,operationId:message.id});
  else result=await recoverOwnedSustained(actor,request.operationId,{...common,close:request.action==="close",reason:request.reason});
  intentGuard();completed=true;
  await message.update({[`flags.${SYSTEM_ID}.sustainPaymentResponse`]:{ok:true,action:request.action,status:result.status,recordId:result.recordId??request.recordId??null,operationId:result.operationId??request.operationId??null,replayed:result.replayed===true}});
 }catch(error){
  // Never write a response to a now-public, removed, hidden or differently authored message.
  if(!completed&&isPrimaryGM()&&!response(message))try{sustainPaymentPrivateMessage(message,userId);await message.update({[`flags.${SYSTEM_ID}.sustainPaymentResponse`]:{ok:false,error:String(error.message??"Sustentada indisponível.").slice(0,500)}});}catch{}
 }
}
export async function enqueueSustainPaymentRequest(message,_options,userId){
 if(!isPrimaryGM()||!raw(message)||response(message)||busy.has(message.id))return;
 if((message.author?.id??message.user?.id)!==userId||!game.users?.get?.(userId)||game.messages?.get?.(message.id)!==message)return;
 busy.add(message.id);try{return await execute(message,userId);}finally{busy.delete(message.id);}
}
export async function resumeSustainPaymentRequests(){if(!isPrimaryGM())return;for(const m of game.messages?.contents??[])if(raw(m)&&!response(m))await enqueueSustainPaymentRequest(m,{},m.author?.id??m.user?.id);}
export function renderSustainPaymentRequest(message,html){if(raw(message)){const wrapper=html.closest?.(".message")??html;if(html.dataset)html.dataset.godsBattleInternalSustainPayment="";wrapper.hidden=true;wrapper.setAttribute?.("aria-hidden","true");}}
export function notifySustainPaymentResponse(message,changes){
 if(changes&&!Object.hasOwn(changes,`flags.${SYSTEM_ID}.sustainPaymentResponse`)&&!changes.flags?.[SYSTEM_ID]?.sustainPaymentResponse)return;
 const r=response(message);if(!r||(message.author?.id??message.user?.id)!==game.user.id)return;
 if(!r.ok)ui.notifications.error(r.error);else ui.notifications.info(r.replayed?"Operação já registrada.":({pay:"Recarga registrada.",end:"Sustentada encerrada.",recover:"Recarga recuperada.",close:"Operação encerrada."}[r.action]??"Sustentada atualizada."));
}
