import {SYSTEM_ID} from "./config.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {optionalNote} from "./form-values.mjs";
import {drainActor,drainSource,drainTarget,drainCapturedPlan} from "./drain-rules.mjs";
import {drainKey,drainSame,drainEncounter,drainRegistrationState,drainRecord,drainRecordMath,drainRecordState,drainNextRound,drainRecordAfter,validateDrainJournal} from "./drain-records.mjs";
const flags=a=>a.flags?.[SYSTEM_ID]??{},ops=a=>flags(a).effectOperations??{},recordPath=id=>`flags.${SYSTEM_ID}.persistentEffects.${drainKey(id)}`,opPath=id=>`flags.${SYSTEM_ID}.effectOperations.${drainKey(id)}`;
function primary(){if(!isPrimaryGM())throw Error("A operação exige o mestre responsável ativo.");}
function authorize(actor,user){primary();drainActor(actor);if(!user||game.users?.get?.(user.id)!==user||!actor.testUserPermission?.(user,"OWNER"))throw Error("Dreno indisponível para este usuário.");}
function available(actor,user,id=null){authorize(actor,user);assertNoTechniqueInterruption(actor,{effectOperationId:id});if(flags(actor).levelOperation?.status==="prepared"||Object.values(flags(actor).damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Confira a operação interrompida antes de alterar CE.");}
function intent(fn){if(fn!==null&&typeof fn!=="function")throw Error("Guarda de intenção inválido.");fn?.();}
async function identity(actor,user,{id=null,intentGuard=null,readOnly=false}={}){intent(intentGuard);(readOnly?authorize:available)(actor,user,id);const doc=await fromUuid(actor.uuid);intent(intentGuard);(readOnly?authorize:available)(actor,user,id);if(doc!==actor)throw Error("A ficha do alvo foi removida ou substituída.");}
function encounter(actor,record,round=null){const current=drainEncounter(actor,record.encounter.combatUuid);if(!drainSame({...current,round:undefined},{...record.encounter,round:undefined})||round!==null&&current.round<round)throw Error("O encontro/combatente de Dreno mudou.");return current;}
async function bindEncounter(actor,record,user,options){await identity(actor,user,options);const current=encounter(actor,record);const combat=(game.combats?.contents??[]).find(c=>c.uuid===current.combatUuid);if(await fromUuid(current.combatUuid)!==combat)throw Error("Encontro de Dreno removido ou substituído.");await identity(actor,user,options);encounter(actor,record);return current;}
function expected(record,revision){if(!Number.isSafeInteger(revision)||record.revision!==revision)throw Error("O registro de Dreno mudou.");}
const summary=op=>({status:op.status,recordId:op.recordId,operationId:op.id,direction:op.direction,round:op.round});
function validateOp(actor,op){return validateDrainJournal(op,op?.direction==="undo"?ops(actor)[op.originalId]:null);}
async function replay(actor,key,id,user,direction,intentGuard){
 if(id===null)return null;drainKey(id);const prior=ops(actor)[id];if(!prior)return null;await identity(actor,user,{id,intentGuard,readOnly:true});
 if(prior.kind!=="cosmoDrain"||prior.actorUuid!==actor.uuid||prior.recordId!==key||prior.direction!==direction||prior.userId!==user.id)throw Error("Identificador de outra intenção de Dreno.");
 validateOp(actor,prior);if(prior.status!=="applied")throw Error("Esta parcela está interrompida ou encerrada; confira seu registro.");return {...summary(prior),replayed:true};
}
function newOperation(actor,record,plan,{direction="apply",round,skipped=false,reason="",originalId=null,user,id}){
 const op={kind:"cosmoDrain",ruleVersion:1,id:drainKey(id??foundry.utils.randomID()),actorUuid:actor.uuid,recordId:record.id,status:"prepared",direction,round,skipped,plan,beforeRecord:structuredClone(record),userId:user.id,time:Date.now(),reason:optionalNote(reason),...(originalId?{originalId}:{})};
 if(ops(actor)[op.id])throw Error("Intenção de Dreno repetida.");op.afterRecord=drainRecordAfter(op);validateOp(actor,op);return op;
}
function sides(op){return op.direction==="apply"?{before:op.plan.before,after:op.plan.after}:{before:op.plan.after,after:op.plan.before};}
async function guardBefore(actor,op,user,intentGuard){
 await bindEncounter(actor,op.beforeRecord,user,{id:op.id,intentGuard});encounter(actor,op.beforeRecord,op.round);
 if(!drainSame(ops(actor)[op.id],op)||!drainSame(drainRecord(actor,op.recordId),op.beforeRecord)||!drainSame(drainTarget(actor),sides(op).before))throw Error("CE, registro ou journal mudaram; preserve ajustes e confira a interrupção.");
 validateOp(actor,op);intent(intentGuard);
}
async function commit(actor,op,user,intentGuard){
 await guardBefore(actor,op,user,intentGuard);const after=sides(op).after;
 // Only two finite CE fields, a validated record, and this journal's status are writable.
 const updates={[recordPath(op.recordId)]:structuredClone(op.afterRecord),[`${opPath(op.id)}.status`]:"applied"};
 if(after.current!==sides(op).before.current)updates["system.resources.cosmo.value"]=after.current;
 if(after.extra!==sides(op).before.extra)updates["system.resources.cosmoExtra"]=after.extra;
 await actor.update(updates);return {...summary(op),status:"applied"};
}
async function transact(actor,op,user,intentGuard){
 await bindEncounter(actor,op.beforeRecord,user,{intentGuard});encounter(actor,op.beforeRecord,op.round);
 if(!drainSame(drainRecord(actor,op.recordId),op.beforeRecord)||!drainSame(drainTarget(actor),sides(op).before))throw Error("A prévia de Dreno mudou.");intent(intentGuard);
 if(ops(actor)[op.id])throw Error("Identificador de Dreno ocupado durante a confirmação.");
 await actor.update({[opPath(op.id)]:op});return commit(actor,op,user,intentGuard);
}
export async function registerDrain(item,actor,{combatUuid,rounds,firstOffset,expectedState,reason="",registrationId=null,requester=game.user,intentGuard=null}={}){
 primary();return runMasterOperation(async()=>{
  await identity(actor,requester,{intentGuard});authorize(item?.parent,requester);const sourceActor=item.parent;
  if(await fromUuid(sourceActor.uuid)!==sourceActor||await fromUuid(item.uuid)!==item)throw Error("Fonte de Dreno removida ou substituída.");authorize(sourceActor,requester);intent(intentGuard);
  if(registrationId!==null){drainKey(registrationId);const prior=flags(actor).persistentEffects?.[registrationId];if(prior){drainRecord(actor,registrationId);if(prior.userId!==requester.id||prior.source.itemUuid!==item.uuid)throw Error("Identificador de outro registro.");return {status:"registered",recordId:registrationId,replayed:true};}}
  if(!Number.isSafeInteger(rounds)||rounds<1||rounds>1000||![0,1].includes(firstOffset))throw Error("Informe duração de1 a1000 rodadas e primeira parcela nesta/próxima rodada.");
  const baseline=drainRegistrationState(item,actor,combatUuid);if(typeof expectedState!=="string"||baseline!==expectedState)throw Error("A prévia do registro de Dreno mudou.");
  const e=drainEncounter(actor,combatUuid),source={...drainSource(item),name:"Dreno"},firstRound=e.round+firstOffset,lastRound=firstRound+rounds-1;
  if(!Number.isSafeInteger(lastRound))throw Error("Prazo de Dreno fora do limite numérico.");
  const record={kind:"cosmoDrain",ruleVersion:1,id:drainKey(registrationId??foundry.utils.randomID()),actorUuid:actor.uuid,label:"Dreno",source,encounter:{combatUuid:e.combatUuid,combatantId:e.combatantId,epoch:e.epoch},firstRound,lastRound,status:"active",revision:0,resolved:[],history:[],last:null,userId:requester.id,time:Date.now(),reason:optionalNote(reason)};
  if(flags(actor).persistentEffects?.[record.id]||Object.values(flags(actor).persistentEffects??{}).some(r=>r.kind==="cosmoDrain"&&r.actorUuid===actor.uuid&&r.status==="active"&&r.source?.itemUuid===item.uuid))throw Error("Já existe Dreno ativo desta fonte no alvo; confira ou encerre o registro.");
  await bindEncounter(actor,record,requester,{intentGuard});authorize(sourceActor,requester);
  if(await fromUuid(sourceActor.uuid)!==sourceActor||await fromUuid(item.uuid)!==item)throw Error("Fonte de Dreno removida ou substituída.");await identity(actor,requester,{intentGuard});authorize(sourceActor,requester);
  if(drainRegistrationState(item,actor,combatUuid)!==baseline)throw Error("A prévia do registro de Dreno mudou.");
  if(flags(actor).persistentEffects?.[record.id]||Object.values(flags(actor).persistentEffects??{}).some(r=>r.kind==="cosmoDrain"&&r.actorUuid===actor.uuid&&r.status==="active"&&r.source?.itemUuid===item.uuid))throw Error("Registro de Dreno mudou durante a confirmação.");
  // Capture only the canonical profile and identities, never private names/descriptions.
  await actor.update({[recordPath(record.id)]:record});return {status:"registered",recordId:record.id};
 });
}
export async function applyDrain(actor,key,{expectedRevision,expectedState,options={},skip=false,operationId=null,requester=game.user,intentGuard=null}={}){
 primary();drainKey(key);return runMasterOperation(async()=>{
  const prior=await replay(actor,key,operationId,requester,"apply",intentGuard);if(prior)return prior;
  await identity(actor,requester,{intentGuard});const record=drainRecord(actor,key);expected(record,expectedRevision);const round=drainNextRound(record);
  if(record.status!=="active"||round===null)throw Error("Não há parcela de Dreno pendente.");if(typeof skip!=="boolean"||!options||typeof options!=="object"||![Object.prototype,null].includes(Object.getPrototypeOf(options)))throw Error("Dispensa/parâmetros de Dreno inválidos.");
  if(typeof expectedState!=="string"||drainRecordState(actor,record)!==expectedState)throw Error("A prévia de Dreno mudou.");
  const plan=drainCapturedPlan(record.source,actor,skip?{current:0,extra:0,reason:optionalNote(options?.reason)}:options),op=newOperation(actor,record,plan,{round,skipped:skip,reason:plan.reason,user:requester,id:operationId});
  return transact(actor,op,requester,intentGuard);
 });
}
export async function undoDrain(actor,key,{expectedRevision,operationId=null,reason="",requester=game.user,intentGuard=null}={}){
 primary();drainKey(key);return runMasterOperation(async()=>{
  const prior=await replay(actor,key,operationId,requester,"undo",intentGuard);if(prior)return prior;await identity(actor,requester,{intentGuard});
  const record=drainRecord(actor,key);expected(record,expectedRevision);const original=ops(actor)[record.last];validateOp(actor,original);
  if(original.status!=="applied"||original.direction!=="apply"||original.actorUuid!==actor.uuid||original.recordId!==key||!drainSame(drainRecordMath(record),drainRecordMath(original.afterRecord))||!drainSame(drainTarget(actor),original.plan.after))throw Error("Somente a última parcela intacta pode ser desfeita.");
  const op=newOperation(actor,record,original.plan,{direction:"undo",round:original.round,reason,originalId:original.id,user:requester,id:operationId});return transact(actor,op,requester,intentGuard);
 });
}
export async function endDrain(actor,key,{expectedRevision,operationId=null,reason="",requester=game.user,intentGuard=null}={}){
 primary();drainKey(key);return runMasterOperation(async()=>{
  await identity(actor,requester,{intentGuard});const record=drainRecord(actor,key);if(operationId!==null){drainKey(operationId);if(record.status==="ended"&&record.end?.operationId===operationId&&record.end.userId===requester.id)return {status:"ended",recordId:key,replayed:true};}
  expected(record,expectedRevision);if(record.status==="ended")throw Error("Dreno já encerrado.");if(!Number.isSafeInteger(record.revision+1))throw Error("Revisão fora do limite numérico.");
  const after={...structuredClone(record),status:"ended",revision:record.revision+1,end:{operationId,reason:optionalNote(reason),userId:requester.id,time:Date.now()}};intent(intentGuard);
  await actor.update({[recordPath(key)]:after});return {status:"ended",recordId:key};
 });
}
export async function recoverDrain(actor,id,{close=false,reason="",requester=game.user,intentGuard=null}={}){
 primary();drainKey(id);if(typeof close!=="boolean")throw Error("Recuperação de Dreno inválida.");return runMasterOperation(async()=>{
  await identity(actor,requester,{id,intentGuard});const op=structuredClone(ops(actor)[id]);
  if(!op||op.id!==id||op.kind!=="cosmoDrain"||op.actorUuid!==actor.uuid)throw Error("Journal de Dreno ausente ou de outra ficha.");
  if(close){
   if(op.status==="reviewed")return {...summary(op),replayed:true};if(op.status!=="prepared")throw Error("Operação já concluída.");
   await identity(actor,requester,{id,intentGuard});if(!drainSame(ops(actor)[id],op))throw Error("O journal de Dreno mudou.");
   const updates={[`${opPath(id)}.status`]:"reviewed",[`${opPath(id)}.review`]:{userId:requester.id,time:Date.now(),reason:optionalNote(reason)}};
   try{const record=drainRecord(actor,op.recordId);if(record.status!=="ended"){if(!Number.isSafeInteger(record.revision+1))throw Error("Revisão fora do limite.");updates[recordPath(record.id)]={...structuredClone(record),status:"ended",revision:record.revision+1,end:{reason:optionalNote(reason),userId:requester.id,time:Date.now(),operationId:id}};}}catch{/* Invalid/foreign records are never a resource write source. */}
   intent(intentGuard);await actor.update(updates);return {status:"reviewed",operationId:id,recordId:op.recordId};
  }
  validateOp(actor,op);if(op.status==="applied")return {...summary(op),replayed:true};if(op.status!=="prepared")throw Error("Journal encerrado sem nova parcela.");
  const current=drainRecord(actor,op.recordId),state=drainTarget(actor),points=sides(op);
  if(drainSame(drainRecordMath(current),drainRecordMath(op.afterRecord))&&drainSame(state,points.after)){
   await identity(actor,requester,{id,intentGuard});if(!drainSame(ops(actor)[id],op)||!drainSame(drainRecordMath(drainRecord(actor,op.recordId)),drainRecordMath(op.afterRecord))||!drainSame(drainTarget(actor),points.after))throw Error("O registro de Dreno mudou.");intent(intentGuard);await actor.update({[`${opPath(id)}.status`]:"applied"});return {...summary(op),status:"applied"};
  }
  if(!drainSame(current,op.beforeRecord)||!drainSame(state,points.before))throw Error("Recursos ou registro divergentes; encerre preservando ajustes.");return commit(actor,op,requester,intentGuard);
 });
}
