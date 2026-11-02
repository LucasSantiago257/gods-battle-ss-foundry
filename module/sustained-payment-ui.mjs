import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {primaryGM,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {sustainPaymentKey,sustainPaymentRecordMath,sustainPaymentSnapshot,sustainPaymentContext,sustainPaymentPreview,sustainEndState} from "./sustained-payment-rules.mjs";
import {sameSustainPayment,validateOwnedSustainJournal} from "./sustained-payment-records.mjs";
import {sustainPaymentPrivateMessage,submitSustainPaymentRequest} from "./sustained-payment-requests.mjs";
const flags=a=>a.flags?.[SYSTEM_ID]??{},classes={bronze:"Bronze",silver:"Prata",gold:"Ouro"},listeners=new WeakMap(),observedActors=new Set();
export function canManageOwnedSustained(actor,user=game.user){return !!user&&game.users?.get?.(user.id)===user&&actor?.type==="knight"&&typeof actor.uuid==="string"&&/^(Actor\.|Scene\.)/.test(actor.uuid)&&!!actor.testUserPermission?.(user,"OWNER")&&(user.isGM||!(actor.isToken&&(actor.token?.hidden||actor.token?.object?.visible===false)));}
const online=()=>{const gm=primaryGM();return !!gm?.active&&gm.isGM&&game.users?.get?.(gm.id)===gm;};
function ready(actor,{id=null,readOnly=false}={}){
 if(!canManageOwnedSustained(actor))throw Error("Sustentada indispon\u00edvel.");if(!online())throw Error("Mestre offline.");
 if(!readOnly){assertNoTechniqueInterruption(actor,{effectOperationId:id});if(flags(actor).levelOperation?.status==="prepared"||Object.values(flags(actor).damageOperations??{}).some(o=>["prepared","repair"].includes(o.status)))throw Error("Confira a opera\u00e7\u00e3o interrompida.");}
}
async function current(actor,user,options){if(game.user!==user)throw Error("Usu\u00e1rio mudou.");ready(actor,options);if(await fromUuid(actor.uuid)!==actor)throw Error("Ficha removida ou substitu\u00edda.");if(game.user!==user)throw Error("Usu\u00e1rio mudou.");ready(actor,options);}
// Inspect only the payer's combatant. Hidden enemies need not exist on this client.
export function payerSustainContext(actor,key){
 if(!canManageOwnedSustained(actor))throw Error("Sustentada indispon\u00edvel.");const r=sustainPaymentRecordMath(actor,key),combat=(game.combats?.contents??[]).find(c=>c.uuid===r.combatUuid);
 if(!combat?.started||game.combat!==combat||!Number.isSafeInteger(combat.round)||combat.round<1)throw Error("Encontro da recarga indispon\u00edvel.");
 const own=(combat.combatants?.contents??[]).filter(m=>m.id===r.combatantId);if(own.length!==1||own[0].actor!==actor)throw Error("Combatente pagador removido ou substitu\u00eddo.");
 const epoch=combat.flags?.[SYSTEM_ID]?.actionControl?.epoch??"initial";if(typeof epoch!=="string"||!epoch||epoch.length>256)throw Error("\u00c9poca da inten\u00e7\u00e3o inv\u00e1lida.");
 return {combatUuid:r.combatUuid,combatantId:r.combatantId,targetUuid:r.targetUuid,targetCombatantId:r.targetCombatantId,round:combat.round,epoch};
}
export function payerSustainPreview(actor,key,options){return sustainPaymentPreview(actor,key,options,payerSustainContext(actor,key));}
export function sustainPaymentDialogState(actor,key){
 if(!canManageOwnedSustained(actor))throw Error("Sustentada indispon\u00edvel.");const snapshot=sustainPaymentSnapshot(actor,key),context=sustainPaymentContext(snapshot.record,payerSustainContext(actor,key));return actionHash({snapshot,context});
}
export function sustainPaymentWaiting(actor){
 if(!canManageOwnedSustained(actor))return false;
 return (game.messages?.contents??[]).some(m=>{if(m.isContentVisible===false)return false;const author=m.author?.id??m.user?.id;if(author!==game.user.id&&!game.user.isGM)return false;try{sustainPaymentPrivateMessage(m,author);}catch{return false;}
  const r=m.flags?.[SYSTEM_ID]?.sustainPaymentRequest;if(!r||r.actorUuid!==actor.uuid||m.flags?.[SYSTEM_ID]?.sustainPaymentResponse)return false;const op=flags(actor).effectOperations?.[["pay","end"].includes(r.action)?m.id:r.operationId];return !op||!["prepared","applied","reviewed"].includes(op.status);
 });
}
function complete(actor,op){
 try{validateOwnedSustainJournal(op);if(op.actorUuid!==actor.uuid||op.status!=="prepared")return false;const s=op.action==="pay"?sustainPaymentSnapshot(actor,op.recordId):{record:sustainPaymentRecordMath(actor,op.recordId)};
  if(sameSustainPayment(s,op.after))return true;if(!sameSustainPayment(s,op.before))return false;ready(actor,{id:op.id});return op.action==="end"||payerSustainPreview(actor,op.recordId,op.options).signature===op.signature;
 }catch{return false;}
}
function history(r){return Object.values(r.sustain?.payments??{}).map(p=>({round:p.round,cost:p.cost,fromCurrent:p.fromCurrent,fromExtra:p.fromExtra,unlimited:p.unlimited,gap:p.gap?{first:p.gap.first,last:p.gap.last}:null,reason:typeof p.reason==="string"?p.reason:""})).sort((a,b)=>b.round-a.round);}
export function ownedSustainSheetContext(actor){
 const empty={visible:false,rows:[],interruptions:[],waiting:false,offline:false};if(!canManageOwnedSustained(actor))return empty;
 observedActors.add(actor);const rows=[],interruptions=[],waiting=sustainPaymentWaiting(actor);let free=false,blocked="";try{ready(actor);free=true;}catch(e){blocked=e.message;}
 for(const [id,r]of Object.entries(flags(actor).persistentEffects??{}))if(r?.kind==="sustained"){
  let math;try{math=sustainPaymentRecordMath(actor,id);}catch{rows.push({id,isOwnedSustained:true,label:"Sustentada",foreign:true,time:r.time,displayState:"Registro inv\u00e1lido ou de outra ficha",deadlinePriority:3});continue;}
  const row={id,isOwnedSustained:true,label:"Sustentada",time:r.time,status:r.status,classification:classes[math.source.classification],mode:math.mode,modeLabel:math.mode==="once"?"\u00fanica at\u00e9 encerrar":"por rodada",firstRound:math.firstRound,lastRound:math.lastRound,paidUntilRound:math.paidUntilRound,history:history(r),reason:typeof r.reason==="string"?r.reason:"",signature:sustainEndState(actor,id),canEnd:free&&!waiting&&r.status==="active",displayState:r.status==="ended"?"Encerrada":"Prazo pausado",pendingRounds:0,maintenancePending:false,deadlinePriority:r.status==="active"?3:2};
  if(r.status==="active")try{
   const c=payerSustainContext(actor,id);row.round=c.round;
   if(c.round<=math.lastRound){row.displayState=`Inicial at\u00e9 rodada ${math.lastRound}`;row.deadlinePriority=1;}
   else if(math.mode==="once"&&math.payments.length){row.displayState="Recarga \u00fanica registrada";row.deadlinePriority=1;}
   else if(c.round<=math.paidUntilRound){row.displayState=`Rodada ${c.round} coberta`;row.deadlinePriority=1;}
   else{
    row.displayState=`Recarga pendente \u00b7 rodada ${c.round}`;row.deadlinePriority=0;row.maintenancePending=true;row.dialogSignature=sustainPaymentDialogState(actor,id);row.canAdjust=free&&!waiting;
    row.gap=c.round>math.paidUntilRound+1?{first:math.paidUntilRound+1,last:c.round-1}:null;
    try{const p=payerSustainPreview(actor,id,{useExtra:true,reason:""});row.paySignature=p.signature;row.canPay=row.canAdjust;row.unlimited=p.payment.unlimited;row.payLabel=p.payment.unlimited?`Registrar recarga ilimitada \u00b7 rodada ${c.round}`:`Pagar 1 CE ${p.payment.fromExtra?"extra":"atual"} \u00b7 rodada ${c.round}`;}catch(e){row.warning=/insuficiente/.test(e.message)?"CE livre insuficiente.":e.message;}
   }
  }catch(e){row.warning=e.message;}
  rows.push(row);
 }
 for(const [id,op]of Object.entries(flags(actor).effectOperations??{}))if(op?.kind==="sustainPaymentOwned"&&op.status==="prepared")try{sustainPaymentKey(id);interruptions.push({id,canReview:online(),canComplete:online()&&complete(actor,op)});}catch{}
 return {visible:rows.length>0||interruptions.length>0,rows,interruptions,waiting,offline:!online(),warning:online()&&!interruptions.length?blocked:undefined};
}
function formOptions(form){const e=form.elements;if(typeof e.useExtra?.checked!=="boolean")throw Error("Escolha a prefer\u00eancia de CE extra.");return {useExtra:e.useExtra.checked,reason:e.reason?.value??""};}
export function installSustainPaymentPreview(form,actor,key,{signature,user=game.user}){
 if(!form)return;const update=()=>{const out=form.querySelector("[data-sustain-payment-preview]"),button=form.querySelector('button[data-action="pay"]');try{ready(actor);if(game.user!==user||sustainPaymentDialogState(actor,key)!==signature)throw Error("A pr\u00e9via mudou. Reabra a recarga.");const p=payerSustainPreview(actor,key,formOptions(form));if(out)out.textContent=p.payment.unlimited?"CE ilimitada":`CE atual ${p.before.resources.current} \u2192 ${p.before.resources.current-p.payment.fromCurrent} \u00b7 extra ${p.before.resources.extra} \u2192 ${p.before.resources.extra-p.payment.fromExtra}`;if(button)button.disabled=false;}catch(e){if(out)out.textContent=/insuficiente/.test(e.message)?"CE livre insuficiente.":e.message;if(button)button.disabled=true;}};
 const old=listeners.get(form);if(old){form.removeEventListener?.("input",old);form.removeEventListener?.("change",old);}listeners.set(form,update);form.addEventListener("input",update);form.addEventListener("change",update);update();
}
export async function paySustainedFromSheet(actor,key,{signature,round,adjust=false}={}){
 ready(actor);sustainPaymentKey(key);if(typeof adjust!=="boolean")throw Error("A\u00e7\u00e3o de recarga inv\u00e1lida.");const user=game.user,row=ownedSustainSheetContext(actor).rows.find(r=>r.id===key);
 if(!row||!(adjust?row.canAdjust:row.canPay)||round!==row.round||signature!==(adjust?row.dialogSignature:row.paySignature))throw Error("A pr\u00e9via da recarga mudou.");let options={useExtra:true,reason:""},expectedState=signature;
 if(adjust){
  const r=actor.system.resources,content=await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/sustained-payment-dialog.hbs`,{round:row.round,isOnce:row.mode==="once",current:r.cosmo.value,extra:r.cosmoExtra,reserved:r.cosmoReserved,unlimited:r.cosmo.unlimited,gap:row.gap});
  await current(actor,user);if(sustainPaymentDialogState(actor,key)!==signature)throw Error("A pr\u00e9via da recarga mudou.");
  const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Ajustar recarga de Sustentada"},content,render:(_e,d)=>installSustainPaymentPreview(d.form??d.element?.querySelector("form"),actor,key,{signature,user}),buttons:[{action:"pay",label:row.unlimited?"Registrar recarga":"Pagar 1 CE",callback:(_e,b)=>{ready(actor);if(game.user!==user||sustainPaymentDialogState(actor,key)!==signature)throw Error("A pr\u00e9via da recarga mudou.");const o=formOptions(b.form),p=payerSustainPreview(actor,key,o);return {options:o,expectedState:p.signature};}},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!answer)return;({options,expectedState}=answer);
 }
 await current(actor,user);const now=ownedSustainSheetContext(actor).rows.find(r=>r.id===key);
 if(!now||!now.canAdjust||round!==now.round||(adjust?now.dialogSignature:now.paySignature)!==signature||payerSustainPreview(actor,key,options).signature!==expectedState)throw Error("A pr\u00e9via da recarga mudou.");
 return submitSustainPaymentRequest({action:"pay",actorUuid:actor.uuid,recordId:key,options,expectedState});
}
export async function endSustainedFromSheet(actor,key,{signature}={}){
 ready(actor);const user=game.user;sustainPaymentKey(key);await current(actor,user);const row=ownedSustainSheetContext(actor).rows.find(r=>r.id===key);
 if(!row?.canEnd||row.signature!==signature)throw Error("O registro de Sustentada mudou.");return submitSustainPaymentRequest({action:"end",actorUuid:actor.uuid,recordId:key,expectedState:signature,reason:""});
}
export async function openOwnedSustainRecovery(actor,id){
 sustainPaymentKey(id);ready(actor,{readOnly:true});const user=game.user,op=flags(actor).effectOperations?.[id];if(op?.kind!=="sustainPaymentOwned"||op.status!=="prepared")throw Error("Interrup\u00e7\u00e3o da recarga indispon\u00edvel.");const original=structuredClone(op),canComplete=complete(actor,op);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Recarga interrompida"},content:'<details><summary>Notas</summary><textarea name="reason" maxlength="2000" aria-label="Notas opcionais"></textarea></details>',buttons:[...(canComplete?[{action:"recover",label:"Concluir pelo registro",callback:(_e,b)=>({action:"recover",reason:b.form.elements.reason.value})}]:[]),{action:"close",label:"Encerrar opera\u00e7\u00e3o",callback:(_e,b)=>({action:"close",reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!answer)return;
 await current(actor,user,{readOnly:true});if(!sameSustainPayment(flags(actor).effectOperations?.[id],original))throw Error("Journal da recarga mudou.");return submitSustainPaymentRequest({action:answer.action,actorUuid:actor.uuid,operationId:id,reason:answer.reason});
}
export function sanitizeOwnedSustainSheet(root,actor){if(!canManageOwnedSustained(actor))for(const e of root?.querySelectorAll?.("[data-sustained-owned]")??[])e.remove();}
// Refresh sheets already projected here, without resolving every enemy combatant.
export function refreshOwnedSustainSheets(){for(const actor of observedActors)for(const app of Object.values(actor?.apps??{}))if(app.rendered){sanitizeOwnedSustainSheet(app.element,actor);app.render();}}
