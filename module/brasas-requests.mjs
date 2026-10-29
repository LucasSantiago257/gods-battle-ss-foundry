import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {primaryGM,isPrimaryGM} from "./master-queue.mjs";
import {applyBrasas,undoBrasas,endBrasas,recoverBrasas} from "./brasas.mjs";
import {brasasKey} from "./brasas-rules.mjs";
import {optionalNote} from "./form-values.mjs";
const busy=new Set(),actions=new Set(["apply","undo","end","recover","close"]);
const raw=m=>m.flags?.[SYSTEM_ID]?.brasasRequest,response=m=>m.flags?.[SYSTEM_ID]?.brasasResponse;
const own=(o,k)=>Object.hasOwn(o,k)?o[k]:undefined;
function plain(o){if(!o||typeof o!=="object"||![Object.prototype,null].includes(Object.getPrototypeOf(o)))throw Error("Parâmetros de Brasas inválidos.");return o;}
function text(v){if(typeof v!=="string"||!v||v.length>256)throw Error("Identidade/prévia de Brasas inválida.");return v;}
export function brasasRequest(value){
 const r=plain(value),action=own(r,"action");if(!actions.has(action))throw Error("Ação de Brasas inválida.");
 const result={action,actorUuid:text(own(r,"actorUuid"))};
 if(!/^(Actor\.|Scene\.)/.test(result.actorUuid))throw Error("Escolha uma ficha ou token.");
 if(["apply","undo","end"].includes(action)){
  result.recordId=brasasKey(own(r,"recordId"));result.expectedState=text(own(r,"expectedState"));
  if(action==="apply"){
   const round=own(r,"expectedRound");if(!Number.isSafeInteger(round)||round<1)throw Error("Rodada de Brasas inválida.");result.expectedRound=round;
   const o=own(r,"options")===undefined?{}:plain(own(r,"options"));result.options={};
   if(Object.hasOwn(o,"damage")){const d=own(o,"damage");if(!Number.isFinite(d)||d<0||d>1000000)throw Error("Dano de Brasas inválido.");result.options.damage=d;}
   if(Object.hasOwn(o,"skip")){if(typeof o.skip!=="boolean")throw Error("Dispensa de Brasas inválida.");result.options.skip=o.skip;}
   if(Object.hasOwn(o,"reason"))result.options.reason=optionalNote(own(o,"reason"));
  }else result.reason=optionalNote(own(r,"reason"));
 }else{result.operationId=brasasKey(own(r,"operationId"));result.reason=optionalNote(own(r,"reason"));}
 return result;
}
export function brasasPrivateMessage(message,userId){
 const author=message.author?.id??message.user?.id,user=game.users?.get?.(userId),whisper=message.whisper?.map?.(u=>typeof u==="string"?u:u.id);
 if(!user||author!==userId||game.messages?.get?.(message.id)!==message||message.blind||message.isContentVisible===false||!Array.isArray(whisper)||!whisper.includes(userId)||whisper.some(id=>id!==userId&&!game.users.get(id)?.isGM)||!whisper.some(id=>game.users.get(id)?.isGM))throw Error("Mensagem privada de Brasas sem autoria/acesso válido.");
 brasasKey(message.id);return user;
}
function guard(message,userId,signature){
 if(!isPrimaryGM())throw Error("O mestre responsável mudou.");brasasPrivateMessage(message,userId);
 if(response(message)||actionHash(brasasRequest(raw(message)))!==signature)throw Error("A intenção de Brasas mudou ou já foi respondida.");
}
export async function submitBrasasRequest(value){
 const request=brasasRequest(value),gm=primaryGM();
 if(!gm?.active||!gm.isGM||game.users?.get?.(gm.id)!==gm||game.users?.get?.(game.user?.id)!==game.user)throw Error("Mestre offline.");
 return ChatMessage.create({content:'<span aria-hidden="true"></span>',whisper:[...new Set([game.user.id,gm.id])],flags:{[SYSTEM_ID]:{brasasRequest:request}}});
}
async function execute(message,userId){
 if(!isPrimaryGM()||response(message))return;let completed=false;
 try{
  const requester=brasasPrivateMessage(message,userId),request=brasasRequest(raw(message)),signature=actionHash(request),intentGuard=()=>guard(message,userId,signature);
  const actor=await fromUuid(request.actorUuid);intentGuard();const common={requester,intentGuard};let result;
  if(request.action==="apply")result=await applyBrasas(actor,request.recordId,{...common,expectedState:request.expectedState,expectedRound:request.expectedRound,options:request.options,operationId:message.id});
  else if(request.action==="undo")result=await undoBrasas(actor,request.recordId,{...common,expectedState:request.expectedState,reason:request.reason,operationId:message.id});
  else if(request.action==="end")result=await endBrasas(actor,request.recordId,{...common,expectedState:request.expectedState,reason:request.reason,operationId:message.id});
  else result=await recoverBrasas(actor,request.operationId,{...common,close:request.action==="close",reason:request.reason});
  intentGuard();completed=true;
  await message.update({[`flags.${SYSTEM_ID}.brasasResponse`]:{ok:true,action:request.action,status:result.status,recordId:result.recordId??request.recordId??null,operationId:result.operationId??request.operationId??null,replayed:result.replayed===true}});
 }catch(error){
  // Never write a response to a now-public, removed, hidden or differently authored message.
  if(!completed&&isPrimaryGM()&&!response(message))try{brasasPrivateMessage(message,userId);await message.update({[`flags.${SYSTEM_ID}.brasasResponse`]:{ok:false,error:String(error.message??"Brasas indisponíveis.").slice(0,500)}});}catch{}
 }
}
export async function enqueueBrasasRequest(message,_options,userId){
 if(!isPrimaryGM()||!raw(message)||response(message)||busy.has(message.id))return;
 if((message.author?.id??message.user?.id)!==userId||!game.users?.get?.(userId)||game.messages?.get?.(message.id)!==message)return;
 busy.add(message.id);try{return await execute(message,userId);}finally{busy.delete(message.id);}
}
export async function resumeBrasasRequests(){if(!isPrimaryGM())return;for(const m of game.messages?.contents??[])if(raw(m)&&!response(m))await enqueueBrasasRequest(m,{},m.author?.id??m.user?.id);}
export function renderBrasasRequest(message,html){if(raw(message)){const wrapper=html.closest?.(".message")??html;if(html.dataset)html.dataset.godsBattleInternalBrasas="";wrapper.hidden=true;wrapper.setAttribute?.("aria-hidden","true");}}
export function notifyBrasasResponse(message,changes){
 if(changes&&!Object.hasOwn(changes,`flags.${SYSTEM_ID}.brasasResponse`)&&!changes.flags?.[SYSTEM_ID]?.brasasResponse)return;
 const r=response(message);if(!r||(message.author?.id??message.user?.id)!==game.user.id)return;
 if(!r.ok)ui.notifications.error(r.error);else ui.notifications.info(r.replayed?"Operação já registrada.":({apply:"Parcela registrada.",undo:"Parcela desfeita.",end:"Brasas encerradas.",recover:"Registro recuperado.",close:"Operação encerrada."}[r.action]??"Brasas atualizadas."));
}
