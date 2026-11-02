import {SYSTEM_ID} from "./config.mjs";
import {primaryGM,isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {optionalNote} from "./form-values.mjs";
import {sustainPaymentKey,sustainPaymentSnapshot,sustainPaymentRecordMath,sustainPaymentPlan,sustainEndState,sustainEndPlan} from "./sustained-payment-rules.mjs";
import {sameSustainPayment,ownedSustainParticipants,ownedSustainPreview,validateOwnedSustainJournal} from "./sustained-payment-records.mjs";
const flags=a=>a.flags?.[SYSTEM_ID]??{},ops=a=>flags(a).effectOperations??{},records=a=>flags(a).persistentEffects??{};
const path=id=>`flags.${SYSTEM_ID}.effectOperations.${sustainPaymentKey(id)}`,rp=id=>`flags.${SYSTEM_ID}.persistentEffects.${sustainPaymentKey(id)}`;
function authorize(actor,user){
 if(!isPrimaryGM()||primaryGM()!==game.user||game.users?.get?.(game.user?.id)!==game.user||actor?.type!=="knight"||typeof actor.uuid!=="string"||!/^(Actor\.|Scene\.)/.test(actor.uuid)||!user||game.users?.get?.(user.id)!==user||!actor.testUserPermission?.(user,"OWNER"))throw Error("Recarga indispon\u00edvel para este usu\u00e1rio.");
}
function available(actor,user,id=null){authorize(actor,user);assertNoTechniqueInterruption(actor,{effectOperationId:id});if(flags(actor).levelOperation?.status==="prepared"||Object.values(flags(actor).damageOperations??{}).some(o=>["prepared","repair"].includes(o.status)))throw Error("Confira a opera\u00e7\u00e3o interrompida antes de continuar a recarga.");}
function intent(fn){if(fn!==null&&typeof fn!=="function")throw Error("Guarda local inv\u00e1lida.");fn?.();}
async function identity(actor,user,{id=null,intentGuard=null,readOnly=false}={}){
 intent(intentGuard);(readOnly?authorize:available)(actor,user,id);const current=await fromUuid(actor.uuid);
 intent(intentGuard);(readOnly?authorize:available)(actor,user,id);if(current!==actor)throw Error("Ficha pagadora removida ou substitu\u00edda.");
}
const summary=op=>({status:op.status,operationId:op.id,...(typeof op.recordId==="string"&&/^[a-zA-Z0-9]{1,32}$/.test(op.recordId)?{recordId:op.recordId}:{}),...(["pay","end"].includes(op.action)?{action:op.action}:{}),...(Number.isSafeInteger(op.entry?.round)?{round:op.entry.round}:{}),...(op.action==="pay"?{cost:1}:{} )});
const snapshot=(actor,op)=>op.action==="pay"?sustainPaymentSnapshot(actor,op.recordId):{record:sustainPaymentRecordMath(actor,op.recordId)};
function check(actor,op,side){
 if(!sameSustainPayment(ops(actor)[op.id],op)||!sameSustainPayment(snapshot(actor,op),op[side]))throw Error("CE, registro ou journal da recarga mudou; preserve ajustes e confira a interrup\u00e7\u00e3o.");validateOwnedSustainJournal(op);
}
function priorPayment(actor,key,round,id){
 if(Object.entries(ops(actor)).some(([oid,o])=>oid!==id&&o.actorUuid===actor.uuid&&["prepared","applied"].includes(o.status)&&(o.kind==="sustainPayment"&&o.effectId===key&&o.round>=round||o.kind==="sustainPaymentOwned"&&o.recordId===key&&o.action==="pay"&&o.context?.round>=round)))throw Error("Recarga anterior j\u00e1 registrada; confira o journal existente.");
}
async function guard(actor,op,user,intentGuard,{prepared=true}={}){
 const id=prepared?op.id:null;
 await identity(actor,user,{id,intentGuard});
 const verify=()=>{if(prepared)check(actor,op,"before");else if(ops(actor)[op.id]||!sameSustainPayment(snapshot(actor,op),op.before))throw Error("Inten\u00e7\u00e3o ocupada ou pr\u00e9via da recarga mudou.");};verify();
 if(op.action==="pay"){
  const p=ownedSustainParticipants(actor,op.recordId);if(!sameSustainPayment(p.context,op.context))throw Error("Rodada, encontro ou epoch da inten\u00e7\u00e3o mudou.");priorPayment(actor,op.recordId,op.context.round,op.id);
  const live=await Promise.all([fromUuid(actor.uuid),fromUuid(p.combat.uuid),fromUuid(p.target.uuid)]);
  intent(intentGuard);available(actor,user,id);verify();
  const now=ownedSustainParticipants(actor,op.recordId);
  if(live[0]!==actor||live[1]!==p.combat||live[2]!==p.target||now.combat!==p.combat||now.target!==p.target||!sameSustainPayment(now.context,op.context))throw Error("Pagador, encontro ou alvo/combatente mudou.");
  priorPayment(actor,op.recordId,op.context.round,op.id);
 }
 intent(intentGuard);available(actor,user,id);verify();
}
async function replay(actor,key,id,user,action,intentGuard){
 if(id===null)return null;sustainPaymentKey(id);await identity(actor,user,{id,intentGuard,readOnly:true});const op=structuredClone(ops(actor)[id]);if(!op)return null;
 if(op.id!==id||op.kind!=="sustainPaymentOwned"||op.actorUuid!==actor.uuid||op.recordId!==key||op.userId!==user.id||op.action!==action)throw Error("Identificador de outra inten\u00e7\u00e3o de recarga.");
 validateOwnedSustainJournal(op);if(op.status!=="applied")throw Error("Recarga interrompida ou encerrada; confira seu registro.");return {...summary(op),replayed:true};
}
function operation(actor,key,plan,user){const op={...structuredClone(plan),id:plan.operationId,recordId:key,actorUuid:actor.uuid,userId:user.id,time:Date.now(),status:"prepared"};validateOwnedSustainJournal(op);return op;}
async function commit(actor,op,user,intentGuard){
 await guard(actor,op,user,intentGuard);
 const root=rp(op.recordId),updates={[`${root}.sustain.lastOperation`]:structuredClone(op.after.record.lastOperation),[`${path(op.id)}.status`]:"applied"};
 if(op.action==="pay"){
  if(op.before.resources.current!==op.after.resources.current)updates["system.resources.cosmo.value"]=op.after.resources.current;
  if(op.before.resources.extra!==op.after.resources.extra)updates["system.resources.cosmoExtra"]=op.after.resources.extra;
  updates[`${root}.sustain.paidUntilRound`]=op.after.record.paidUntilRound;
  updates[`${root}.sustain.payments.${op.id}`]={...structuredClone(op.entry),reason:optionalNote(op.options.reason),userId:op.userId,time:op.time};
 }else{
  updates[`${root}.status`]="ended";updates[`${root}.end`]={operationId:op.id,reason:optionalNote(op.reason),userId:op.userId,time:op.time};
 }
 // Never restore a whole record: late notes, oppositions and unrelated fields survive.
 await actor.update(updates);return {...summary(op),status:"applied"};
}
async function transact(actor,op,user,intentGuard){await guard(actor,op,user,intentGuard,{prepared:false});await actor.update({[path(op.id)]:op});return commit(actor,op,user,intentGuard);}
export async function payOwnedSustained(actor,key,{options={},expectedState,operationId=null,requester=game.user,intentGuard=null}={}){
 sustainPaymentKey(key);return runMasterOperation(async()=>{
  const prior=await replay(actor,key,operationId,requester,"pay",intentGuard);if(prior)return prior;
  await identity(actor,requester,{intentGuard});const preview=ownedSustainPreview(actor,key,options);
  if(typeof expectedState!=="string"||expectedState!==preview.signature)throw Error("A pr\u00e9via da recarga mudou.");
  const id=sustainPaymentKey(operationId??foundry.utils.randomID()),plan=sustainPaymentPlan(actor,key,preview.options,preview.context,{operationId:id});
  return transact(actor,operation(actor,key,plan,requester),requester,intentGuard);
 });
}
export async function endOwnedSustained(actor,key,{expectedState,operationId=null,reason="",requester=game.user,intentGuard=null}={}){
 sustainPaymentKey(key);return runMasterOperation(async()=>{
  const prior=await replay(actor,key,operationId,requester,"end",intentGuard);if(prior)return prior;
  await identity(actor,requester,{intentGuard});if(typeof expectedState!=="string"||expectedState!==sustainEndState(actor,key))throw Error("O registro de Sustentada mudou.");
  const plan=sustainEndPlan(actor,key,{operationId:sustainPaymentKey(operationId??foundry.utils.randomID()),reason});return transact(actor,operation(actor,key,plan,requester),requester,intentGuard);
 });
}
export async function recoverOwnedSustained(actor,id,{close=false,reason="",requester=game.user,intentGuard=null}={}){
 sustainPaymentKey(id);if(typeof close!=="boolean")throw Error("Recupera\u00e7\u00e3o de recarga inv\u00e1lida.");return runMasterOperation(async()=>{
  await identity(actor,requester,{id,intentGuard,readOnly:true});const op=structuredClone(ops(actor)[id]);
  if(!op||op.kind!=="sustainPaymentOwned"||op.id!==id)throw Error("Journal de recarga ausente ou de outro tipo.");
  if(close){
   if(op.status==="reviewed")return {...summary(op),replayed:true};if(op.status!=="prepared")throw Error("Recarga j\u00e1 conclu\u00edda.");
   const note=optionalNote(reason);await identity(actor,requester,{id,intentGuard,readOnly:true});if(!sameSustainPayment(ops(actor)[id],op))throw Error("Journal da recarga mudou.");
   await actor.update({[`${path(id)}.status`]:"reviewed",[`${path(id)}.review`]:{reason:note,userId:requester.id,time:Date.now()}});return {...summary(op),status:"reviewed"};
  }
  if(op.actorUuid!==actor.uuid)throw Error("Journal de outra ficha; encerre sem alterar CE.");validateOwnedSustainJournal(op);
  if(op.status==="applied")return {...summary(op),replayed:true};if(op.status!=="prepared")throw Error("Recarga encerrada sem novo pagamento.");
  const current=snapshot(actor,op);
  if(sameSustainPayment(current,op.after)){
   await identity(actor,requester,{id,intentGuard,readOnly:true});check(actor,op,"after");
   await actor.update({[`${path(id)}.status`]:"applied"});return {...summary(op),status:"applied"};
  }
  if(!sameSustainPayment(current,op.before))throw Error("CE ou registro divergentes; encerre a opera\u00e7\u00e3o preservando ajustes.");
  return commit(actor,op,requester,intentGuard);
 });
}
