import {SYSTEM_ID,ATTRIBUTES} from "./config.mjs";
import {primaryGM,isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {optionalNote} from "./form-values.mjs";
import {controlRetryKey,controlRetrySnapshot,controlRetryResultPlan} from "./control-retry-rules.mjs";
import {sameControlRetry,ownedControlPreview,validateOwnedControlJournal} from "./control-retry-owned-records.mjs";
import {evaluatePool,prepareRollMessage} from "./rolls.mjs";
const flags=a=>a.flags?.[SYSTEM_ID]??{},ops=a=>flags(a).effectOperations??{},records=a=>flags(a).persistentEffects??{};
const path=id=>`flags.${SYSTEM_ID}.effectOperations.${controlRetryKey(id)}`,recordPath=id=>`flags.${SYSTEM_ID}.persistentEffects.${controlRetryKey(id)}`;
function authorize(actor,user){if(!isPrimaryGM()||primaryGM()!==game.user||game.users?.get?.(game.user?.id)!==game.user||actor?.type!=="knight"||typeof actor.uuid!=="string"||!/^(Actor\.|Scene\.)/.test(actor.uuid)||!user||game.users?.get?.(user.id)!==user||!actor.testUserPermission?.(user,"OWNER"))throw Error("Resistência de Controle indisponível.");}
function available(actor,user,id=null){authorize(actor,user);assertNoTechniqueInterruption(actor,{effectOperationId:id});if(flags(actor).levelOperation?.status==="prepared"||Object.values(flags(actor).damageOperations??{}).some(o=>["prepared","repair"].includes(o.status)))throw Error("Confira a operação interrompida antes de gastar CE.");}
function intent(fn){if(fn!==null&&typeof fn!=="function")throw Error("Guarda local inválida.");fn?.();}
async function identity(actor,user,{id=null,intentGuard=null,readOnly=false}={}){
 intent(intentGuard);(readOnly?authorize:available)(actor,user,id);const current=await fromUuid(actor.uuid);intent(intentGuard);(readOnly?authorize:available)(actor,user,id);if(current!==actor)throw Error("Ficha removida ou substituída.");
}
const summary=op=>({status:op.status,operationId:op.id,recordId:op.recordId,phase:op.phase,published:op.published===true,...(op.plan?{round:op.plan.attempt.round,total:op.plan.result.total,success:op.plan.attempt.success,end:op.plan.attempt.end}:{}),...(op.messageId?{messageId:op.messageId}:{})});
function check(actor,op){if(!sameControlRetry(ops(actor)[op.id],op))throw Error("Journal de Controle mudou.");validateOwnedControlJournal(op);}
function priorPublication(actor,key,id){if(Object.entries(ops(actor)).some(([oid,o])=>oid!==id&&["controlRetry","controlRetryOwned"].includes(o.kind)&&o.actorUuid===actor.uuid&&(o.effectId??o.recordId)===key&&o.status==="applied"&&!o.published))throw Error("Resistência anterior aguarda publicação; recupere o mesmo resultado.");}
async function before(actor,op,user,intentGuard,{fresh=false}={}){
 await identity(actor,user,{id:fresh?null:op.id,intentGuard});if(fresh){if(ops(actor)[op.id])throw Error("Identidade de intenção ocupada.");}else check(actor,op);
 priorPublication(actor,op.recordId,op.id);
 const verify=()=>{if(ownedControlPreview(actor,op.recordId,op.preview.options).signature!==op.preview.signature)throw Error("CE, parâmetros, registro ou rodada mudou. Atualize a prévia.");};verify();
 const combat=(game.combats?.contents??[]).find(c=>c.uuid===op.preview.context.combatUuid);
 if(await fromUuid(op.preview.context.combatUuid)!==combat)throw Error("Encontro removido ou substituído.");
 await identity(actor,user,{id:fresh?null:op.id,intentGuard});if(fresh){if(ops(actor)[op.id])throw Error("Identidade de intenção ocupada.");}else check(actor,op);priorPublication(actor,op.recordId,op.id);verify();intent(intentGuard);available(actor,user,fresh?null:op.id);
}
async function commit(actor,op,user,intentGuard){
 await before(actor,op,user,intentGuard);if(op.phase!=="ready")throw Error("Resultado de Controle não foi salvo.");savedRoll(op);
 const p=op.plan,rp=recordPath(op.recordId),r=records(actor)[op.recordId];if(r.controlRetries?.[op.id])throw Error("Tentativa de Controle já registrada.");
 const update={[`${rp}.controlRetries.${op.id}`]:{...structuredClone(p.attempt),reason:p.reason,time:op.time,userId:op.userId},[`${path(op.id)}.status`]:"applied"};
 if(p.payment.fromCurrent)update["system.resources.cosmo.value"]=p.after.resources.current;if(p.payment.fromExtra)update["system.resources.cosmoExtra"]=p.after.resources.extra;
 if(p.attempt.end){update[`${rp}.status`]="ended";update[`${rp}.end`]={...(r.end??{}),reason:p.reason,time:op.time,userId:op.userId,controlRetryOperationId:op.id};}
 await actor.update(update);return summary({...op,status:"applied"});
}
function savedRoll(op){const roll=Roll.fromData(structuredClone(op.roll));if(!roll||roll.total!==op.plan.result.total||!sameControlRetry(roll.dice?.[0]?.results?.map(r=>r.result),op.plan.result.results))throw Error("Rolagem salva incompatível; preserve o resultado.");return roll;}
function cardStamp(op){return {actorUuid:op.actorUuid,operationId:op.id,signature:op.plan.signature,total:op.plan.result.total,round:op.plan.context.round};}
const rollFaces=r=>(r?.dice?.[0]?.results??r?.terms?.[0]?.results)?.map(t=>t.result);
function matchingCard(m,actor,op){return !!m&&m.rolls?.[0]?.total===op.plan.result.total&&sameControlRetry(rollFaces(m.rolls[0]),op.plan.result.results)&&game.messages?.get?.(m.id)===m&&m.isContentVisible!==false&&!m.blind&&!(m.whisper?.length)&&game.users?.get?.(m.author?.id)?.isGM===true&&sameControlRetry(m.flags?.[SYSTEM_ID]?.controlRetryOwnedResolution,cardStamp(op));}
async function publish(actor,op,user,intentGuard){
 await identity(actor,user,{id:op.id,intentGuard,readOnly:true});check(actor,op);if(op.status!=="applied"||op.phase!=="ready")throw Error("Tentativa ainda não foi paga.");if(op.published)return summary(op);
 // Locate the same public card after an acknowledgement was lost before storing its ID.
 let message=op.messageId?game.messages?.get?.(op.messageId):(game.messages?.contents??[]).find(m=>matchingCard(m,actor,op));
 if(op.messageId&&!matchingCard(message,actor,op))throw Error("Cartão removido ou alterado; encerre a operação sem repetir gasto.");
 if(!message){
  const p=op.plan,result=p.result,card=await prepareRollMessage(actor,savedRoll(op),{actor,name:"Controle",label:ATTRIBUTES[p.attempt.attribute],...result,difficulty:p.attempt.difficulty,cost:p.payment.cost,round:p.context.round,end:p.attempt.end,success:p.attempt.success,fromCurrent:p.payment.fromCurrent,fromExtra:p.payment.fromExtra,unlimited:p.payment.unlimited,reason:p.reason},{template:"control-retry-chat",rollMode:"publicroll",flags:{controlRetryOwnedResolution:cardStamp(op)}});
  await identity(actor,user,{id:op.id,intentGuard,readOnly:true});check(actor,op);if(!card||card.blind||card.whisper?.length)throw Error("O cartão de Controle exige publicação pública.");
  message=(game.messages?.contents??[]).find(m=>matchingCard(m,actor,op))??await ChatMessage.create(card);
 }
 await identity(actor,user,{id:op.id,intentGuard,readOnly:true});check(actor,op);if(!matchingCard(message,actor,op))throw Error("Publicação de Controle ausente ou alterada.");
 await actor.update({[`${path(op.id)}.published`]:true,[`${path(op.id)}.messageId`]:message.id});return {...summary(op),published:true,messageId:message.id};
}
export async function retryOwnedControl(actor,key,{options={},expectedState,operationId=null,requester=game.user,intentGuard=null}={}){
 controlRetryKey(key);if(!isPrimaryGM())throw Error("Mestre responsável indisponível.");return runMasterOperation(async()=>{
  await identity(actor,requester,{id:operationId,intentGuard,readOnly:true});if(operationId!==null)controlRetryKey(operationId);
  const prior=operationId===null?null:ops(actor)[operationId];if(prior){validateOwnedControlJournal(prior);if(prior.id!==operationId||prior.actorUuid!==actor.uuid||prior.recordId!==key||prior.userId!==requester.id||prior.status!=="applied")throw Error("Intenção interrompida, encerrada ou de outro registro.");return {...await publish(actor,structuredClone(prior),requester,intentGuard),replayed:true};}
  await identity(actor,requester,{intentGuard});priorPublication(actor,key);const preview=ownedControlPreview(actor,key,options);if(typeof expectedState!=="string"||expectedState!==preview.signature)throw Error("A prévia da resistência de Controle mudou.");
  const id=controlRetryKey(operationId??foundry.utils.randomID());let op={kind:"controlRetryOwned",version:1,id,recordId:key,actorUuid:actor.uuid,userId:requester.id,time:Date.now(),status:"prepared",phase:"rolling",preview};validateOwnedControlJournal(op);
  await before(actor,op,requester,intentGuard,{fresh:true});await actor.update({[path(id)]:op});await before(actor,op,requester,intentGuard);
  const {result,messageRoll}=await evaluatePool(preview.pool.dice,preview.pool.modifier);await before(actor,op,requester,intentGuard);
  const plan=controlRetryResultPlan(preview,result.results,{operationId:id}),roll=messageRoll.toJSON();if(roll.total!==plan.result.total)throw Error("Dados salvos incompatíveis.");
  op={...op,phase:"ready",plan,roll};validateOwnedControlJournal(op);await actor.update({[path(id)]:op});await commit(actor,op,requester,intentGuard);op=structuredClone(ops(actor)[id]);return publish(actor,op,requester,intentGuard);
 });
}
export async function recoverOwnedControlRetry(actor,id,{close=false,reason="",requester=game.user,intentGuard=null}={}){
 controlRetryKey(id);if(typeof close!=="boolean")throw Error("Recuperação inválida.");return runMasterOperation(async()=>{
  await identity(actor,requester,{id,intentGuard,readOnly:true});const op=structuredClone(ops(actor)[id]);if(!op||op.kind!=="controlRetryOwned"||op.id!==id)throw Error("Journal de Controle ausente ou de outro tipo.");
  if(close||op.status==="prepared"&&op.phase==="rolling"){
   if(op.status==="reviewed")return {...summary(op),replayed:true};if(!["prepared","applied"].includes(op.status))throw Error("Operação já concluída.");
   const note=optionalNote(reason);await identity(actor,requester,{id,intentGuard,readOnly:true});if(!sameControlRetry(ops(actor)[id],op))throw Error("Journal de Controle mudou.");
   await actor.update({[`${path(id)}.status`]:"reviewed",[`${path(id)}.review`]:{reason:note,userId:requester.id,time:Date.now()}});return {...summary(op),status:"reviewed"};
  }
  if(op.actorUuid!==actor.uuid)throw Error("Journal de outra ficha; encerre sem alterar CE.");validateOwnedControlJournal(op);if(op.status==="applied")return publish(actor,op,requester,intentGuard);if(op.status!=="prepared")throw Error("Operação encerrada sem nova tentativa.");
  if(sameControlRetry(controlRetrySnapshot(actor,op.recordId),op.plan.after)){
   await identity(actor,requester,{id,intentGuard,readOnly:true});check(actor,op);if(!sameControlRetry(controlRetrySnapshot(actor,op.recordId),op.plan.after))throw Error("Registro ou CE mudou.");await actor.update({[`${path(id)}.status`]:"applied"});return publish(actor,structuredClone(ops(actor)[id]),requester,intentGuard);
  }
  await commit(actor,op,requester,intentGuard);return publish(actor,structuredClone(ops(actor)[id]),requester,intentGuard);
 });
}
