import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {primaryGM,isPrimaryGM} from "./master-queue.mjs";
import {defenseActor,defenseKey,resolvedDefense} from "./technique-defense-records.mjs";
import {applyTechniqueDefense,recoverTechniqueDefense} from "./technique-defense.mjs";
import {optionalNote} from "./form-values.mjs";
const busy=new Set(),raw=m=>m.flags?.[SYSTEM_ID]?.techniqueDefenseRequest,response=m=>m.flags?.[SYSTEM_ID]?.techniqueDefenseResponse;
const own=(o,k)=>Object.hasOwn(o,k)?o[k]:undefined;
function plain(v){if(!v||typeof v!=="object"||![Object.prototype,null].includes(Object.getPrototypeOf(v)))throw Error("Solicitação de defesa inválida.");return v;}
function text(v){if(typeof v!=="string"||!v||v.length>256)throw Error("Prévia da defesa inválida.");return v;}
export function techniqueDefenseRequest(value){
 const r=plain(value),action=own(r,"action");if(!["apply","recover","close"].includes(action))throw Error("Ação de defesa inválida.");
 const out={action,actorUuid:defenseActor({type:"knight",uuid:own(r,"actorUuid")})};
 if(action==="apply"){
  out.mode=own(r,"mode");if(!["paid","resolved"].includes(out.mode))throw Error("Modo de defesa inválido.");
  out.rootId=defenseKey(own(r,"rootId"));out.expectedState=text(own(r,"expectedState"));out.expectedRevision=own(r,"expectedRevision");
  if(!Number.isSafeInteger(out.expectedRevision)||out.expectedRevision<0||out.expectedRevision>1000000)throw Error("Revisão de defesa inválida.");
  if(out.mode==="paid"){
   out.itemId=defenseKey(own(r,"itemId"));const options=own(r,"options")===undefined?{}:plain(own(r,"options"));out.options={};
   for(const k of ["extra","elevate","condense","bonus","advantage","defense"]){if(!Object.hasOwn(options,k))continue;const v=options[k];if(!Number.isFinite(v)||Math.abs(v)>1000000||k!=="bonus"&&v<0&&k!=="advantage"||["extra","elevate","condense"].includes(k)&&!Number.isSafeInteger(v)||k==="advantage"&&![-1,0,1].includes(v))throw Error("Valor da defesa inválido.");out.options[k]=v;}
   for(const k of ["useExtra","allowOverload"]){if(!Object.hasOwn(options,k))continue;if(typeof options[k]!=="boolean")throw Error("Pagamento de defesa inválido.");out.options[k]=options[k];}
   if(Object.hasOwn(options,"actionPool")){if(!["defense","reaction"].includes(options.actionPool))throw Error("Reserva de defesa inválida.");out.options.actionPool=options.actionPool;}
  }else{const v=plain(own(r,"resolved"));out.resolved={outcome:own(v,"outcome"),defense:own(v,"defense"),blocker:own(v,"blocker")??false};resolvedDefense(out.resolved);}
 }else out.operationId=defenseKey(own(r,"operationId"));
 if(Object.hasOwn(r,"reason"))out.reason=optionalNote(r.reason);return out;
}
function privateRequest(message,userId){
 const author=message.author?.id??message.user?.id,user=game.users?.get?.(userId),whisper=message.whisper?.map?.(u=>typeof u==="string"?u:u.id);
 if(!user||author!==userId||game.messages?.get?.(message.id)!==message||message.blind||!Array.isArray(whisper)||!whisper.includes(userId)||!whisper.some(id=>game.users.get(id)?.isGM)||whisper.some(id=>id!==userId&&!game.users.get(id)?.isGM))throw Error("Defesa privada sem autoria ou acesso válido.");
 defenseKey(message.id);return user;
}
function guard(message,userId,signature){if(!isPrimaryGM())throw Error("O mestre responsável mudou.");privateRequest(message,userId);if(response(message)||actionHash(techniqueDefenseRequest(raw(message)))!==signature)throw Error("Solicitação de defesa alterada ou já respondida.");}
export async function submitTechniqueDefenseRequest(value){
 const request=techniqueDefenseRequest(value),gm=primaryGM();if(!gm?.active)throw Error("É necessário um mestre ativo para coordenar a defesa.");
 return ChatMessage.create({content:'<span aria-hidden="true"></span>',whisper:[...new Set([game.user.id,gm.id])],flags:{[SYSTEM_ID]:{techniqueDefenseRequest:request}}});
}
async function execute(message,userId){
 if(!isPrimaryGM()||response(message))return;let completed=false;
 try{
  const requester=privateRequest(message,userId),request=techniqueDefenseRequest(raw(message)),signature=actionHash(request),intentGuard=()=>guard(message,userId,signature);
  const actor=await fromUuid(request.actorUuid);intentGuard();defenseActor(actor);
  if(!actor.testUserPermission?.(requester,"OWNER"))throw Error("Sem permissão para resolver este defensor.");
  const common={requester,intentGuard,...(Object.hasOwn(request,"reason")?{reason:request.reason}:{})};let result;
  if(request.action==="apply"){
   // Only an ID-only local placeholder is used for an already committed receipt
   // whose root was deleted. A new intention still requires the canonical root.
   const root=game.messages?.get?.(request.rootId)??{id:request.rootId};
   const item=request.mode==="paid"?actor.items?.get?.(request.itemId):null;
   result=await applyTechniqueDefense(actor,root,{...common,mode:request.mode,item,options:request.options??{},resolved:request.resolved??null,expectedState:request.expectedState,expectedRevision:request.expectedRevision,operationId:message.id});
  }else result=await recoverTechniqueDefense(actor,request.operationId,{...common,close:request.action==="close"});
  intentGuard();completed=true;await message.update({[`flags.${SYSTEM_ID}.techniqueDefenseResponse`]:{ok:true,action:request.action,status:result.status,operationId:result.operationId,rootId:result.rootId,revision:result.revision,replayed:result.replayed===true}});
 }catch(error){if(!completed&&isPrimaryGM()&&game.messages?.get?.(message.id)===message&&!response(message))await message.update({[`flags.${SYSTEM_ID}.techniqueDefenseResponse`]:{ok:false,error:error.message}});}
}
export async function enqueueTechniqueDefenseRequest(message,_options,userId){
 if(!isPrimaryGM()||!raw(message)||response(message)||busy.has(message.id))return;
 if((message.author?.id??message.user?.id)!==userId||!game.users?.get?.(userId)||game.messages?.get?.(message.id)!==message)return;
 busy.add(message.id);try{return await execute(message,userId);}finally{busy.delete(message.id);}
}
export async function resumeTechniqueDefenseRequests(){if(!isPrimaryGM())return;for(const message of game.messages?.contents??[])if(raw(message)&&!response(message))await enqueueTechniqueDefenseRequest(message,{},message.author?.id??message.user?.id);}
export function renderTechniqueDefenseRequest(message,html){if(raw(message)){const root=html.closest?.(".message")??html;if(html.dataset)html.dataset.godsBattleInternalTechniqueDefense="";root.hidden=true;root.setAttribute?.("aria-hidden","true");}}
export function notifyTechniqueDefenseResponse(message,changes){
 if(changes&&!Object.hasOwn(changes,`flags.${SYSTEM_ID}.techniqueDefenseResponse`)&&!changes.flags?.[SYSTEM_ID]?.techniqueDefenseResponse)return;
 const r=response(message);if(!r||(message.author?.id??message.user?.id)!==game.user.id)return;
 if(!r.ok)ui.notifications.error(r.error);else ui.notifications.info(r.replayed?"Defesa já registrada.":r.action==="apply"?"Defesa registrada.":r.action==="recover"?"Defesa recuperada.":"Registro encerrado.");
}
