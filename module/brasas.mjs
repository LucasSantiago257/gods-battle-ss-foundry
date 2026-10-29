import {SYSTEM_ID} from "./config.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {optionalNote} from "./form-values.mjs";
import {brasasKey,brasasSnapshot,brasasState,brasasParcelPlan,brasasUndoPlan,brasasEndPlan} from "./brasas-rules.mjs";
import {brasasSame,brasasEncounter,brasasApplicationState,validateBrasasJournal} from "./brasas-records.mjs";
const flags=a=>a.flags?.[SYSTEM_ID]??{},ops=a=>flags(a).effectOperations??{},records=a=>flags(a).persistentEffects??{};
const rp=id=>`flags.${SYSTEM_ID}.persistentEffects.${brasasKey(id)}`,opPath=id=>`flags.${SYSTEM_ID}.effectOperations.${brasasKey(id)}`;
function primary(){if(!isPrimaryGM())throw Error("Brasas exige o mestre responsável ativo.");}
function authorize(actor,user){
 primary();if(actor?.type!=="knight"||typeof actor.uuid!=="string"||!/^(Actor\.|Scene\.)/.test(actor.uuid)||!user||game.users?.get?.(user.id)!==user||!actor.testUserPermission?.(user,"OWNER"))throw Error("Brasas indisponíveis para este usuário.");
}
function available(actor,user,id=null){
 authorize(actor,user);assertNoTechniqueInterruption(actor,{effectOperationId:id});
 if(flags(actor).levelOperation?.status==="prepared"||Object.values(flags(actor).damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Confira a operação interrompida antes de alterar PV.");
}
function intent(fn){if(fn!==null&&typeof fn!=="function")throw Error("Guarda local de intenção inválida.");fn?.();}
async function identity(actor,user,{id=null,intentGuard=null,readOnly=false}={}){
 intent(intentGuard);(readOnly?authorize:available)(actor,user,id);const doc=await fromUuid(actor.uuid);
 intent(intentGuard);(readOnly?authorize:available)(actor,user,id);if(doc!==actor)throw Error("A ficha do alvo foi removida ou substituída.");
}
const summary=op=>({status:op.status,operationId:op.id,...(typeof op.recordId==="string"&&/^[a-zA-Z0-9]{1,32}$/.test(op.recordId)?{recordId:op.recordId}:{}),...(["apply","undo","end"].includes(op.action)?{action:op.action}:{}),...(Number.isSafeInteger(op.tick?.round??op.round)?{round:op.tick?.round??op.round}:{})});
const validate=(actor,op)=>validateBrasasJournal(op,op?.action==="undo"?ops(actor)[op.originalId]:null);
async function replay(actor,key,id,user,action,intentGuard){
 if(id===null)return null;brasasKey(id);
 await identity(actor,user,{id,intentGuard,readOnly:true});const prior=structuredClone(ops(actor)[id]);if(!prior)return null;
 if(!brasasSame(ops(actor)[id],prior)||prior.id!==id||prior.kind!=="brasasParcel"||prior.actorUuid!==actor.uuid||prior.recordId!==key||prior.action!==action||prior.userId!==user.id)throw Error("Identificador de outra intenção de Brasas.");
 validate(actor,prior);if(prior.status!=="applied")throw Error("A intenção está interrompida ou encerrada; confira seu registro.");
 return {...summary(prior),replayed:true};
}
function check(actor,op,side){
 if(!brasasSame(ops(actor)[op.id],op)||!brasasSame(brasasSnapshot(actor,op.recordId),op[side]))throw Error("PV, registro ou journal de Brasas mudaram; preserve ajustes e confira a interrupção.");
 validate(actor,op);
}
async function guard(actor,op,user,intentGuard,{prepared=true}={}){
 await identity(actor,user,{id:prepared?op.id:null,intentGuard});
 const checkCurrent=()=>{if(prepared)check(actor,op,"before");else if(ops(actor)[op.id]||!brasasSame(brasasSnapshot(actor,op.recordId),op.before))throw Error("Identificador ocupado ou prévia de Brasas alterada.");};
 checkCurrent();
 if(op.action==="apply"){
  if(!brasasSame(brasasEncounter(actor,op.recordId),op.context))throw Error("A rodada, encontro ou epoch da intenção de Brasas mudou.");
  const combat=(game.combats?.contents??[]).find(c=>c.uuid===op.context.combatUuid);
  if(await fromUuid(op.context.combatUuid)!==combat)throw Error("Encontro de Brasas removido ou substituído.");
  await identity(actor,user,{id:prepared?op.id:null,intentGuard});checkCurrent();
  if(!brasasSame(brasasEncounter(actor,op.recordId),op.context))throw Error("A rodada, encontro ou epoch da intenção de Brasas mudou.");
 }
 intent(intentGuard);checkCurrent();available(actor,user,prepared?op.id:null);
 const history=records(actor)[op.recordId]?.brasasHistory;
 if(history!==undefined&&(!history||typeof history!=="object"||Array.isArray(history))||history?.[op.id]!==undefined)throw Error("Histórico ou identificador de Brasas ocupado.");
}
function historyEntry(actor,op){
 const entry={operationId:op.id,action:op.action,userId:op.userId,time:op.time,reason:optionalNote(op.action==="apply"?op.tick.reason:op.reason)};
 if(op.action==="apply")Object.assign(entry,{round:op.tick.round,damage:op.tick.damage,status:op.tick.status});
 if(op.action==="undo")Object.assign(entry,{round:op.round,originalId:op.originalId,archivedTick:structuredClone(records(actor)[op.recordId].ticks[`round${op.round}`])});
 return entry;
}
async function commit(actor,op,user,intentGuard){
 await guard(actor,op,user,intentGuard);
 const path=rp(op.recordId),updates={[`${path}.status`]:op.after.record.status,[`${path}.brasasLastOperation`]:structuredClone(op.after.record.lastOperation),[`${path}.brasasHistory.${op.id}`]:historyEntry(actor,op),[`${opPath(op.id)}.status`]:"applied"};
 if(op.after.health!==op.before.health)updates["system.resources.health.value"]=op.after.health;
 if(op.action==="apply")updates[`${path}.ticks.round${op.tick.round}`]={...structuredClone(op.tick),userId:op.userId,time:op.time};
 if(op.action==="undo")updates[`${path}.ticks.-=round${op.round}`]=null;
 // Never replace an entire record: late notes and unrelated adjustments survive.
 await actor.update(updates);return {...summary(op),status:"applied"};
}
function newOperation(actor,key,plan,user){
 const op={...structuredClone(plan),id:plan.operationId,actorUuid:actor.uuid,recordId:key,status:"prepared",userId:user.id,time:Date.now()};
 if(ops(actor)[op.id])throw Error("Intenção de Brasas repetida.");validate(actor,op);return op;
}
async function transact(actor,op,user,intentGuard){
 await guard(actor,op,user,intentGuard,{prepared:false});validate(actor,op);
 await actor.update({[opPath(op.id)]:op});return commit(actor,op,user,intentGuard);
}
const freshId=id=>brasasKey(id??foundry.utils.randomID());
export async function applyBrasas(actor,key,{expectedState,expectedRound,options={},operationId=null,requester=game.user,intentGuard=null}={}){
 primary();brasasKey(key);return runMasterOperation(async()=>{
  const prior=await replay(actor,key,operationId,requester,"apply",intentGuard);if(prior)return prior;
  await identity(actor,requester,{intentGuard});
  if(!options||typeof options!=="object"||![Object.prototype,null].includes(Object.getPrototypeOf(options)))throw Error("Parâmetros de Brasas inválidos.");
  if(typeof expectedState!=="string"||expectedState!==brasasApplicationState(actor,key))throw Error("A prévia de Brasas mudou.");
  const id=freshId(operationId),plan=brasasParcelPlan(actor,key,{operationId:id,damage:options.damage,skip:Object.hasOwn(options,"skip")?options.skip:false,reason:optionalNote(options.reason)});
  if(!Number.isSafeInteger(expectedRound)||expectedRound!==plan.tick.round)throw Error("A parcela exibida de Brasas mudou.");
  plan.context=brasasEncounter(actor,key);return transact(actor,newOperation(actor,key,plan,requester),requester,intentGuard);
 });
}
export async function undoBrasas(actor,key,{expectedState,operationId=null,reason="",requester=game.user,intentGuard=null}={}){
 primary();brasasKey(key);return runMasterOperation(async()=>{
  const prior=await replay(actor,key,operationId,requester,"undo",intentGuard);if(prior)return prior;
  await identity(actor,requester,{intentGuard});
  if(typeof expectedState!=="string"||expectedState!==brasasState(actor,key))throw Error("A prévia de Brasas mudou.");
  const original=ops(actor)[records(actor)[key]?.brasasLastOperation?.id];validate(actor,original);
  const plan=brasasUndoPlan(actor,key,original,{operationId:freshId(operationId),reason});plan.context=null;
  return transact(actor,newOperation(actor,key,plan,requester),requester,intentGuard);
 });
}
export async function endBrasas(actor,key,{expectedState,operationId=null,reason="",requester=game.user,intentGuard=null}={}){
 primary();brasasKey(key);return runMasterOperation(async()=>{
  const prior=await replay(actor,key,operationId,requester,"end",intentGuard);if(prior)return prior;
  await identity(actor,requester,{intentGuard});
  if(typeof expectedState!=="string"||expectedState!==brasasState(actor,key))throw Error("A prévia de Brasas mudou.");
  const plan=brasasEndPlan(actor,key,{operationId:freshId(operationId),reason});plan.context=null;
  return transact(actor,newOperation(actor,key,plan,requester),requester,intentGuard);
 });
}
export async function recoverBrasas(actor,id,{close=false,reason="",requester=game.user,intentGuard=null}={}){
 primary();brasasKey(id);if(typeof close!=="boolean")throw Error("Recuperação de Brasas inválida.");
 return runMasterOperation(async()=>{
  await identity(actor,requester,{id,intentGuard,readOnly:true});const op=structuredClone(ops(actor)[id]);
  if(!op||op.kind!=="brasasParcel"||op.id!==id)throw Error("Journal de Brasas ausente ou de outro tipo.");
  if(close){
   if(op.status==="reviewed")return {...summary(op),replayed:true};if(op.status!=="prepared")throw Error("Operação já concluída.");
   const note=optionalNote(reason);await identity(actor,requester,{id,intentGuard,readOnly:true});
   if(!brasasSame(ops(actor)[id],op))throw Error("O journal de Brasas mudou.");
   // Closing a divergent or copied journal only releases this lock; no record/resource write.
   await actor.update({[`${opPath(id)}.status`]:"reviewed",[`${opPath(id)}.review`]:{reason:note,userId:requester.id,time:Date.now()}});
   return {...summary(op),status:"reviewed"};
  }
  if(op.actorUuid!==actor.uuid)throw Error("Journal de outra ficha; encerre sem alterar PV.");validate(actor,op);
  if(op.status==="applied")return {...summary(op),replayed:true};if(op.status!=="prepared")throw Error("Operação encerrada sem nova aplicação.");
  const current=brasasSnapshot(actor,op.recordId);
  if(brasasSame(current,op.after)){
   await identity(actor,requester,{id,intentGuard,readOnly:true});
   if(!brasasSame(ops(actor)[id],op)||!brasasSame(brasasSnapshot(actor,op.recordId),op.after))throw Error("PV, registro ou journal de Brasas mudaram.");
   await actor.update({[`${opPath(id)}.status`]:"applied"});return {...summary(op),status:"applied"};
  }
  if(!brasasSame(current,op.before))throw Error("PV ou registro divergentes; encerre a operação preservando ajustes.");
  return commit(actor,op,requester,intentGuard);
 });
}
