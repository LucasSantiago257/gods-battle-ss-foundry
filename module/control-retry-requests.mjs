import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {primaryGM,isPrimaryGM} from "./master-queue.mjs";
import {retryOwnedControl,recoverOwnedControlRetry} from "./control-retry-owned.mjs";
import {controlRetryKey,controlRetryOptions} from "./control-retry-rules.mjs";
import {optionalNote} from "./form-values.mjs";
const busy=new Set(),actions=new Set(["retry","recover","close"]);
const raw=m=>m.flags?.[SYSTEM_ID]?.controlRetryRequest,response=m=>m.flags?.[SYSTEM_ID]?.controlRetryResponse;
const own=(o,k)=>Object.hasOwn(o,k)?o[k]:undefined;
function plain(o){if(!o||typeof o!=="object"||![Object.prototype,null].includes(Object.getPrototypeOf(o)))throw Error("Parâmetros de Controle inválidos.");return o;}
function text(v){if(typeof v!=="string"||!v||v.length>256)throw Error("Identidade/prévia de Controle inválida.");return v;}
export function controlRetryRequest(value){
 const r=plain(value),action=own(r,"action");if(!actions.has(action))throw Error("Ação de Controle inválida.");
 const result={action,actorUuid:text(own(r,"actorUuid"))};
 if(!/^(Actor\.|Scene\.)/.test(result.actorUuid))throw Error("Escolha uma ficha ou token.");
 if(action==="retry"){
  result.recordId=controlRetryKey(own(r,"recordId"));result.expectedState=text(own(r,"expectedState"));
  const input=plain(own(r,"options")),{resistanceMode,...options}=controlRetryOptions({attribute:own(input,"attribute"),bonus:own(input,"bonus"),advantage:own(input,"advantage"),useExtra:own(input,"useExtra"),onSuccess:own(input,"onSuccess"),reason:own(input,"reason"),resistanceMode:"rank"});result.options=options;
 }else{result.operationId=controlRetryKey(own(r,"operationId"));result.reason=optionalNote(own(r,"reason"));}
 return result;
}
export function controlRetryPrivateMessage(message,userId){
 const author=message.author?.id??message.user?.id,user=game.users?.get?.(userId),whisper=message.whisper?.map?.(u=>typeof u==="string"?u:u.id);
 if(!user||author!==userId||game.messages?.get?.(message.id)!==message||message.blind||message.isContentVisible===false||!Array.isArray(whisper)||!whisper.includes(userId)||whisper.some(id=>id!==userId&&!game.users.get(id)?.isGM)||!whisper.some(id=>game.users.get(id)?.isGM))throw Error("Mensagem privada de Controle sem autoria/acesso válido.");
 controlRetryKey(message.id);return user;
}
function guard(message,userId,signature){
 if(!isPrimaryGM())throw Error("O mestre responsável mudou.");controlRetryPrivateMessage(message,userId);
 if(response(message)||actionHash(controlRetryRequest(raw(message)))!==signature)throw Error("A intenção de Controle mudou ou já foi respondida.");
}
export async function submitControlRetryRequest(value){
 const request=controlRetryRequest(value),gm=primaryGM();
 if(!gm?.active||!gm.isGM||game.users?.get?.(gm.id)!==gm||game.users?.get?.(game.user?.id)!==game.user)throw Error("Mestre offline.");
 return ChatMessage.create({content:'<span aria-hidden="true"></span>',whisper:[...new Set([game.user.id,gm.id])],flags:{[SYSTEM_ID]:{controlRetryRequest:request}}});
}
async function execute(message,userId){
 if(!isPrimaryGM()||response(message))return;let completed=false;
 try{
  const requester=controlRetryPrivateMessage(message,userId),request=controlRetryRequest(raw(message)),signature=actionHash(request),intentGuard=()=>guard(message,userId,signature);
  const actor=await fromUuid(request.actorUuid);intentGuard();const common={requester,intentGuard};let result;
  if(request.action==="retry")result=await retryOwnedControl(actor,request.recordId,{...common,expectedState:request.expectedState,options:request.options,operationId:message.id});
  else result=await recoverOwnedControlRetry(actor,request.operationId,{...common,close:request.action==="close",reason:request.reason});
  intentGuard();completed=true;
  await message.update({[`flags.${SYSTEM_ID}.controlRetryResponse`]:{ok:true,action:request.action,status:result.status,recordId:result.recordId??request.recordId??null,operationId:result.operationId??request.operationId??null,replayed:result.replayed===true}});
 }catch(error){
  // Never write a response to a now-public, removed, hidden or differently authored message.
  if(!completed&&isPrimaryGM()&&!response(message))try{controlRetryPrivateMessage(message,userId);await message.update({[`flags.${SYSTEM_ID}.controlRetryResponse`]:{ok:false,error:String(error.message??"Controle indisponível.").slice(0,500)}});}catch{}
 }
}
export async function enqueueControlRetryRequest(message,_options,userId){
 if(!isPrimaryGM()||!raw(message)||response(message)||busy.has(message.id))return;
 if((message.author?.id??message.user?.id)!==userId||!game.users?.get?.(userId)||game.messages?.get?.(message.id)!==message)return;
 busy.add(message.id);try{return await execute(message,userId);}finally{busy.delete(message.id);}
}
export async function resumeControlRetryRequests(){if(!isPrimaryGM())return;for(const m of game.messages?.contents??[])if(raw(m)&&!response(m))await enqueueControlRetryRequest(m,{},m.author?.id??m.user?.id);}
export function renderControlRetryRequest(message,html){if(raw(message)){const wrapper=html.closest?.(".message")??html;if(html.dataset)html.dataset.godsBattleInternalControlRetry="";wrapper.hidden=true;wrapper.setAttribute?.("aria-hidden","true");}}
export function notifyControlRetryResponse(message,changes){
 if(changes&&!Object.hasOwn(changes,`flags.${SYSTEM_ID}.controlRetryResponse`)&&!changes.flags?.[SYSTEM_ID]?.controlRetryResponse)return;
 const r=response(message);if(!r||(message.author?.id??message.user?.id)!==game.user.id)return;
 if(!r.ok)ui.notifications.error(r.error);else ui.notifications.info(r.replayed?"Operação já registrada.":({retry:"Resistência registrada.",recover:"Resistência recuperada.",close:"Operação encerrada."}[r.action]??"Controle atualizado."));
}
