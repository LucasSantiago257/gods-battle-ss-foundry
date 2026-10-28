// Runtime only; no hooks/UI are installed by importing this module.
import {SYSTEM_ID} from "./config.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {optionalNote} from "./form-values.mjs";
import {evaluatePool} from "./rolls.mjs";
import {techniqueDefenseParameters,techniqueDefensePreview} from "./technique-defense-rules.mjs";
import {defenseKey,defenseActor,defenseSame,defenseCash,defenseMathSystem,defenseHasBlocker,defenseSource,defensePaidOptions,resolvedDefense,receivedDefenseAttack,rawDefenseRecord,defenseRecordMath,defenseState,defenseClock,defenseReceivedTurn,defenseAction,defenseReadyValues,validateDefenseJournal} from "./technique-defense-records.mjs";
const flags=a=>a.flags?.[SYSTEM_ID]??{},ops=a=>flags(a).effectOperations??{},opPath=id=>`flags.${SYSTEM_ID}.effectOperations.${defenseKey(id)}`,recordPath=id=>`flags.${SYSTEM_ID}.techniqueDefenses.${defenseKey(id)}`,copy=structuredClone;
function authorize(a,user){if(!isPrimaryGM())throw Error("A defesa exige o mestre responsável ativo.");defenseActor(a);if(!user||game.users?.get?.(user.id)!==user||!a.testUserPermission?.(user,"OWNER"))throw Error("Sem permissão para resolver este defensor.");}
function available(a,user,id){authorize(a,user);assertNoTechniqueInterruption(a,{effectOperationId:id});if(flags(a).levelOperation?.status==="prepared"||Object.values(flags(a).damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Confira a operação interrompida antes de resolver a defesa.");}
function intent(fn){if(fn!==null&&typeof fn!=="function")throw Error("Guarda de intenção inválida.");fn?.();}
async function identity(a,user,{id=null,intentGuard=null,readOnly=false}={}){intent(intentGuard);(readOnly?authorize:available)(a,user,id);const doc=await fromUuid(a.uuid);intent(intentGuard);(readOnly?authorize:available)(a,user,id);if(doc!==a)throw Error("Defensor removido ou substituído.");}
function untouchedDamage(a,rootId){if(["applied","prepared","repair"].includes(flags(a).damageOperations?.[rootId]?.status))throw Error("O ataque já tem dano aplicado ou interrompido; confira antes de registrar defesa.");}
function sameRecord(a,op,side){return defenseSame(defenseRecordMath(rawDefenseRecord(a,op.rootId)),defenseRecordMath(side));}
const summary=op=>({status:op.status,operationId:op.id,rootId:op.rootId,revision:op.afterRecord?.revision??null,mode:op.mode});
async function replay(a,id,rootId,user,intentGuard){const op=ops(a)[id];if(!op)return null;await identity(a,user,{id,intentGuard,readOnly:true});if(op.kind!=="techniqueDefense"||op.actorUuid!==a.uuid||op.rootId!==rootId||op.userId!==user.id)throw Error("Identificador de outra intenção de defesa.");validateDefenseJournal(op);if(op.status!=="applied")throw Error("Defesa interrompida ou encerrada; confira o registro sem repetir o gasto.");return {...summary(op),replayed:true};}
async function bind(a,message,user,op,item,intentGuard){
 await identity(a,user,{id:op?.id??null,intentGuard});const root=receivedDefenseAttack(a,message,user);untouchedDamage(a,root.rootId);
 if(op?.mode==="paid"){
  const turn=defenseReceivedTurn(a,root);
  if(turn&&(!turn.available||["combatUuid","round","epoch"].some(k=>root.attack.turnSnapshot[k]!==turn[k])))throw Error("O ataque pertence a outra rodada ou encontro; registre o resultado já resolvido.");
  if(turn){const combat=(game.combats?.contents??[]).find(c=>c.uuid===turn.combatUuid);if(await fromUuid(turn.combatUuid)!==combat)throw Error("Encontro do ataque removido ou substituído.");await identity(a,user,{id:op.id,intentGuard});}
  const clock=defenseClock(a);if(clock.enabled){const c=(game.combats?.contents??[]).find(c=>c.uuid===clock.context.combatUuid);if(await fromUuid(clock.context.combatUuid)!==c)throw Error("Encontro removido ou substituído.");await identity(a,user,{id:op.id,intentGuard});}
  if(await fromUuid(item?.uuid)!==item)throw Error("Técnica defensiva removida ou substituída.");await identity(a,user,{id:op.id,intentGuard});defenseSource(item,a);
 }
 intent(intentGuard);receivedDefenseAttack(a,message,user);untouchedDamage(a,root.rootId);return root;
}
function guardState(a,message,user,op,item){
 if(!sameRecord(a,op,op.beforeRecord)||defenseState(a,message,user,{mode:op.mode,item,options:op.options})!==op.baseline)throw Error("A defesa, recursos, ações ou ataque mudaram; preserve ajustes e confira o registro.");
 if(op.mode==="paid"&&!defenseSame(defenseCash(a),op.before))throw Error("Os recursos da defesa mudaram.");
}
async function guard(a,message,user,op,item,intentGuard){await bind(a,message,user,op,item,intentGuard);if(!defenseSame(ops(a)[op.id],op))throw Error("Journal de defesa alterado.");validateDefenseJournal(op);guardState(a,message,user,op,item);}
async function commit(a,message,user,op,item,intentGuard){
 await guard(a,message,user,op,item,intentGuard);if(op.phase!=="ready")throw Error("Resultado da defesa ainda não foi gravado.");
 const current=rawDefenseRecord(a,op.rootId),afterRecord={...copy(op.afterRecord),reason:op.reasonExplicit?op.afterRecord.reason:current?.reason??op.afterRecord.reason};
 const updates={[recordPath(op.rootId)]:afterRecord,[`${opPath(op.id)}.status`]:"applied"};
 if(op.mode==="paid"){
  for(const [key,path]of Object.entries({current:"system.resources.cosmo.value",extra:"system.resources.cosmoExtra",overload:"system.resources.cosmoOverload",health:"system.resources.health.value",penalty:"system.combat.asterismPenalty"}))if(op.before[key]!==op.after[key])updates[path]=op.after[key];
  if(!defenseSame(op.before.actions,op.after.actions))updates[`flags.${SYSTEM_ID}.actionUsage`]=copy(op.after.actions);
 }
 // No arbitrary received update payload is ever a write source.
 intent(intentGuard);await a.update(updates);return {...summary(op),status:"applied"};
}
export async function applyTechniqueDefense(a,message,{mode="paid",item=null,options={},resolved=null,expectedState,expectedRevision=0,operationId,reason,requester=game.user,intentGuard=null}={}){
 defenseKey(operationId);defenseKey(message?.id);if(!["paid","resolved"].includes(mode))throw Error("Modo de defesa inválido.");
 return runMasterOperation(async()=>{
  const prior=await replay(a,operationId,message.id,requester,intentGuard);if(prior)return prior;await identity(a,requester,{intentGuard});
  const root=receivedDefenseAttack(a,message,requester),beforeRecord=rawDefenseRecord(a,message.id);untouchedDamage(a,message.id);
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision!==(beforeRecord?.revision??0))throw Error("A revisão da defesa mudou.");
  if(mode==="paid"&&beforeRecord)throw Error("Este ataque já tem defesa; ajuste o resultado já resolvido sem repetir a ativação.");
  const chosen=mode==="paid"?defensePaidOptions(options,defenseHasBlocker(a)):null;
  const baseline=defenseState(a,message,requester,{mode,item,options:chosen??{}});if(typeof expectedState!=="string"||baseline!==expectedState)throw Error("A prévia da defesa mudou.");
  const clock=defenseClock(a);
  if(mode==="paid"&&clock.enabled&&root.attack.turnSnapshot&&["combatUuid","round","epoch"].some(k=>root.attack.turnSnapshot[k]!==clock.context[k]))throw Error("O ataque pertence a outra rodada ou encontro; resultados anteriores têm registro já resolvido.");
  const op={kind:"techniqueDefense",version:1,id:operationId,actorUuid:a.uuid,rootId:message.id,attackSignature:root.attackSignature,attackMath:root.attackMath,context:copy(clock.context),mode,phase:mode==="paid"?"rolling":"ready",status:"prepared",baseline,beforeRecord,options:chosen,userId:requester.id,time:Date.now(),reason:optionalNote(reason??beforeRecord?.reason),reasonExplicit:reason!==undefined};
  if(mode==="paid"){
   op.source=defenseSource(item,a);op.system=defenseMathSystem(a.system);op.before=defenseCash(a);
   const action=defenseAction(a,chosen,op.id);op.action={before:action.before,after:action.after,cost:action.cost,view:defenseClock(a)};
   const preview=techniqueDefensePreview(a.system,op.source.technique,chosen);if(preview.error)throw Error(preview.error);
  }else{op.resolved=pickResolved(resolved);resolvedDefense(op.resolved);Object.assign(op,ready(op));}
  validateDefenseJournal(op);await bind(a,message,requester,op,item,intentGuard);guardState(a,message,requester,op,item);if(ops(a)[op.id])throw Error("Intenção de defesa ocupada.");
  await a.update({[opPath(op.id)]:op});
  if(mode==="paid"){
   await guard(a,message,requester,op,item,intentGuard);const p=techniqueDefenseParameters(op.system,op.source.technique,op.options);
   const {result}=await evaluatePool(p.dice,p.modifier);await guard(a,message,requester,op,item,intentGuard);
   const completed={...op,phase:"ready",roll:copy(result)};Object.assign(completed,ready(completed));validateDefenseJournal(completed);
   await a.update({[opPath(op.id)]:completed});return commit(a,message,requester,completed,item,intentGuard);
  }
  return commit(a,message,requester,op,null,intentGuard);
 });
}
const pickResolved=r=>r&&typeof r==="object"?{outcome:r.outcome,defense:r.defense,blocker:r.blocker??false}:null;
function ready(op){const v=defenseReadyValues(op);return {result:v.result,payment:v.payment,after:v.after,afterRecord:v.record};}
export async function recoverTechniqueDefense(a,id,{close=false,reason="",requester=game.user,intentGuard=null}={}){
 defenseKey(id);if(typeof close!=="boolean")throw Error("Recuperação da defesa inválida.");
 return runMasterOperation(async()=>{
  await identity(a,requester,{id,intentGuard});const op=copy(ops(a)[id]);if(!op||op.kind!=="techniqueDefense"||op.actorUuid!==a.uuid||op.id!==id)throw Error("Journal de outra ficha ou defesa ausente.");
  if(close){
   if(op.status==="reviewed")return {...summary(op),replayed:true};if(op.status!=="prepared")throw Error("Defesa já concluída.");
   await identity(a,requester,{id,intentGuard});if(!defenseSame(ops(a)[id],op))throw Error("Journal de defesa mudou.");intent(intentGuard);
   await a.update({[`${opPath(id)}.status`]:"reviewed",[`${opPath(id)}.review`]:{userId:requester.id,time:Date.now(),reason:optionalNote(reason)}});return {...summary(op),status:"reviewed"};
  }
  validateDefenseJournal(op);if(op.status==="applied")return {...summary(op),replayed:true};if(op.status!=="prepared")throw Error("Defesa já encerrada.");
  if(op.phase==="ready"&&sameRecord(a,op,op.afterRecord)&&(op.mode==="resolved"||defenseSame(defenseCash(a),op.after))){
   await identity(a,requester,{id,intentGuard});if(!defenseSame(ops(a)[id],op)||!sameRecord(a,op,op.afterRecord)||op.mode==="paid"&&!defenseSame(defenseCash(a),op.after))throw Error("Defesa ou recursos mudaram durante a recuperação.");
   await a.update({[`${opPath(id)}.status`]:"applied"});return {...summary(op),status:"applied"};
  }
  if(op.phase==="rolling"){
   if(!sameRecord(a,op,op.beforeRecord)||!defenseSame(defenseCash(a),op.before))throw Error("Recursos divergentes; encerre preservando ajustes.");
   await identity(a,requester,{id,intentGuard});if(!defenseSame(ops(a)[id],op)||!sameRecord(a,op,op.beforeRecord)||!defenseSame(defenseCash(a),op.before))throw Error("A defesa mudou durante a recuperação.");
   await a.update({[`${opPath(id)}.status`]:"reviewed",[`${opPath(id)}.review`]:{userId:requester.id,time:Date.now(),reason:"Resultado não gravado; encerrado sem repetir rolagem ou gasto."}});return {...summary(op),status:"reviewed"};
  }
  if(!sameRecord(a,op,op.beforeRecord)||op.mode==="paid"&&!defenseSame(defenseCash(a),op.before))throw Error("Recursos ou defesa divergentes; encerre preservando ajustes.");
  const message=game.messages?.get?.(op.rootId),item=op.mode==="paid"?a.items?.get?.(op.source.itemId):null;return commit(a,message,requester,op,item,intentGuard);
 });
}
