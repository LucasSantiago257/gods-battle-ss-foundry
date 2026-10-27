// Coordinated repair operations. No chat hooks/UI are installed by importing this module.
import {SYSTEM_ID} from "./config.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {armorRepairPlan,armorRepairState} from "./armor-repair-rules.mjs";
import {repairKey,repairRecord,repairRecordAfter,repairPointState,repairSame,validateRepairJournal} from "./armor-repair-journal.mjs";
import {optionalNote} from "./form-values.mjs";
const flags=actor=>actor.flags?.[SYSTEM_ID]??{};
const ops=actor=>flags(actor).effectOperations??{};
function primary(){if(!isPrimaryGM())throw Error("A operação exige o mestre responsável ativo.");}
function authorize(actor,user){
 primary();if(!user||game.users?.get?.(user.id)!==user||actor?.type!=="knight"||!actor.isOwner||!actor.testUserPermission(user,"OWNER"))throw Error("Sem permissão para alterar origem ou alvo do reparo.");
}
function available(actor,user,id=null){
 authorize(actor,user);assertNoTechniqueInterruption(actor,{effectOperationId:id});
 if(flags(actor).levelOperation?.status==="prepared"||Object.values(flags(actor).damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Confira a operação interrompida antes do reparo.");
}
function checkExpected(record,expectedRevision){if(!Number.isSafeInteger(expectedRevision)||expectedRevision!==record.revision)throw Error("O trabalho mudou. Atualize a prévia.");}
async function binding(actor,record,user,id=null){
 available(actor,user,id);if(await fromUuid(actor.uuid)!==actor)throw Error("A ficha de origem foi substituída.");
 const item=await fromUuid(record.sourceUuid),armor=await fromUuid(record.armorUuid),target=await fromUuid(record.targetUuid);
 available(actor,user,id);available(target,user,id);
 if(item?.parent!==actor||armor?.parent!==target||item.uuid!==record.sourceUuid||armor.uuid!==record.armorUuid||target.uuid!==record.targetUuid)throw Error("Fonte ou armadura removida, substituída ou de outra ficha.");
 armorRepairState(item,armor);return {actor,item,armor,target,user};
}
async function identities(b,id=null){
 for(const actor of new Set([b.actor,b.target])){available(actor,b.user,id);if(await fromUuid(actor.uuid)!==actor)throw Error("Ficha do reparo substituída.");}
 if(await fromUuid(b.item.uuid)!==b.item||await fromUuid(b.armor.uuid)!==b.armor)throw Error("Técnica ou armadura substituída.");
 for(const actor of new Set([b.actor,b.target]))available(actor,b.user,id);
}
function mirror(op,status="prepared"){return {kind:"armorRepairTarget",status,actorUuid:op.targetUuid,payerUuid:op.actorUuid,operationId:op.id,recordId:op.recordId};}
function originalFor(actor,op){return op.direction==="undo"?ops(actor)[op.originalId]:null;}
async function stage(b,op,payerSide,armorSide,recordSide="before",targetStatus="prepared",payerStatus="prepared"){
 await identities(b,op.id);const current=ops(b.actor)[op.id];
 if(!repairSame(current,{...op,status:payerStatus})||!repairSame(repairRecord(b.actor,op.recordId),op[`${recordSide}Record`])||armorRepairState(b.item,b.armor)!==repairPointState(op.plan,payerSide,armorSide))throw Error("Recursos, trabalho ou journal mudaram durante o reparo.");
 if(b.actor!==b.target){const saved=ops(b.target)[op.id];if(targetStatus===null?saved!==undefined:!repairSame(saved,mirror(op,targetStatus)))throw Error("Vínculo de recuperação do alvo mudou.");}
}
function sides(op){return op.direction==="apply"?{from:"before",to:"after"}:{from:"after",to:"before"};}
function payerUpdates(op,side){
 const p=op.plan[side].payer;return {"system.resources.cosmo.value":p.current,"system.resources.cosmoExtra":p.extra,"system.resources.cosmoOverload":p.overload,"system.resources.health.value":p.health};
}
async function finish(b,op){
 const {to}=sides(op);
 // Keep the origin journal prepared until the target's lock has been released.
 await b.actor.update({[`flags.${SYSTEM_ID}.armorRepairs.${op.recordId}`]:op.afterRecord});
 await stage(b,op,to,to,"after");
 if(b.actor!==b.target){await b.target.update({[`flags.${SYSTEM_ID}.effectOperations.${op.id}.status`] :"applied"});await stage(b,op,to,to,"after","applied");}
 await b.actor.update({[`flags.${SYSTEM_ID}.effectOperations.${op.id}.status`] :"applied"});
 return {status:"applied",operationId:op.id,record:structuredClone(op.afterRecord)};
}
async function transact(b,op){
 validateRepairJournal(op,originalFor(b.actor,op));const {from,to}=sides(op);
 await b.actor.update({[`flags.${SYSTEM_ID}.effectOperations.${op.id}`]:op});
 await stage(b,op,from,from,"before",b.actor===b.target?"prepared":null);
 if(b.actor!==b.target){await b.target.update({[`flags.${SYSTEM_ID}.effectOperations.${op.id}`]:mirror(op)});await stage(b,op,from,from);}
 // Writes are built from the validated value snapshot, never from received update commands.
 if(!repairSame(op.plan[from].payer,op.plan[to].payer))await b.actor.update(payerUpdates(op,to));
 await stage(b,op,to,from);
 if(op.plan[from].armor.health!==op.plan[to].armor.health)await b.armor.update({"system.health.value":op.plan[to].armor.health});
 await stage(b,op,to,to);return finish(b,op);
}
function newOperation(actor,record,plan,direction,user,original=null,reason="",operationId=null){
 const id=repairKey(operationId??foundry.utils.randomID());if(Object.hasOwn(ops(actor),id))throw Error("Identificador de operação repetido.");
 const op={kind:"armorRepair",ruleVersion:1,status:"prepared",id,actorUuid:actor.uuid,targetUuid:record.targetUuid,recordId:record.id,direction,plan:structuredClone(plan),beforeRecord:structuredClone(record),userId:user.id,time:Date.now(),reason:optionalNote(reason),...(original?{originalId:original.id,previousLast:original.beforeRecord.last??null}:{})};
 op.afterRecord=repairRecordAfter(op);return op;
}
async function replay(actor,key,id,user,direction){
 if(id===null)return null;repairKey(id);const prior=ops(actor)[id];if(!prior)return null;
 authorize(actor,user);if(await fromUuid(actor.uuid)!==actor)throw Error("Ficha removida ou substituída.");
 if(prior.kind!=="armorRepair"||prior.actorUuid!==actor.uuid||prior.recordId!==key||prior.direction!==direction||prior.userId!==user.id)throw Error("Identificador de outra intenção de reparo.");
 const target=await fromUuid(prior.targetUuid);authorize(actor,user);authorize(target,user);
 if(prior.status==="prepared")throw Error("Esta hora está interrompida; use a recuperação do journal.");
 if(prior.status!=="applied")throw Error("Esta intenção já foi encerrada sem nova aplicação.");
 return {status:"applied",operationId:id,record:structuredClone(prior.afterRecord),replayed:true};
}
export async function registerArmorRepair(item,armor,{expectedState,requester=game.user,reason=""}={}){
 primary();return runMasterOperation(async()=>{
  const actor=item?.parent,target=armor?.parent;available(actor,requester);available(target,requester);
  if(typeof expectedState!=="string"||expectedState!==armorRepairState(item,armor))throw Error("A prévia do reparo mudou.");
  const b=await binding(actor,{sourceUuid:item.uuid,armorUuid:armor.uuid,targetUuid:target.uuid},requester);await identities(b);
  if(expectedState!==armorRepairState(b.item,b.armor))throw Error("A prévia do reparo mudou.");
  if(Object.values(flags(actor).armorRepairs??{}).some(r=>r.actorUuid===actor.uuid&&r.status==="active"&&r.sourceUuid===item.uuid&&r.armorUuid===armor.uuid))throw Error("Já existe um trabalho ativo para esta técnica e armadura.");
  const id=repairKey(foundry.utils.randomID());if(Object.hasOwn(flags(actor).armorRepairs??{},id))throw Error("Identificador de trabalho repetido.");
  const record={kind:"armorRepair",ruleVersion:1,id,actorUuid:actor.uuid,sourceUuid:item.uuid,targetUuid:target.uuid,armorUuid:armor.uuid,sourceName:item.name,armorName:armor.name,status:"active",revision:0,hours:0,last:null,ticks:{},reason:optionalNote(reason),userId:requester.id,time:Date.now()};
  await actor.update({[`flags.${SYSTEM_ID}.armorRepairs.${id}`]:record});return structuredClone(record);
 });
}
export async function applyArmorRepair(actor,key,{expectedRevision,expectedState,options={},requester=game.user,operationId=null}={}){
 primary();repairKey(key);return runMasterOperation(async()=>{
  const prior=await replay(actor,key,operationId,requester,"apply");if(prior)return prior;
  const record=repairRecord(actor,key);checkExpected(record,expectedRevision);if(record.status!=="active")throw Error("Trabalho encerrado.");
  const b=await binding(actor,record,requester),plan=armorRepairPlan(b.item,b.armor,options);
  if(typeof expectedState!=="string"||expectedState!==plan.baseline)throw Error("A prévia do reparo mudou.");
  const op=newOperation(actor,record,plan,"apply",requester,null,plan.reason,operationId);await identities(b);
  if(!repairSame(repairRecord(actor,key),record)||armorRepairState(b.item,b.armor)!==expectedState)throw Error("O trabalho mudou antes da aplicação.");
  return transact(b,op);
 });
}
export async function undoArmorRepair(actor,key,{expectedRevision,requester=game.user,reason="",operationId=null}={}){
 primary();repairKey(key);return runMasterOperation(async()=>{
  const prior=await replay(actor,key,operationId,requester,"undo");if(prior)return prior;
  const record=repairRecord(actor,key);checkExpected(record,expectedRevision);const b=await binding(actor,record,requester),original=ops(actor)[record.last];
  validateRepairJournal(original);if(original.status!=="applied"||original.direction!=="apply"||original.recordId!==key||original.actorUuid!==actor.uuid||armorRepairState(b.item,b.armor)!==repairPointState(original.plan,"after"))throw Error("Recursos alterados ou última hora indisponível para desfazer.");
  const op=newOperation(actor,record,original.plan,"undo",requester,original,reason,operationId);await identities(b);if(!repairSame(repairRecord(actor,key),record))throw Error("O trabalho mudou antes de desfazer.");return transact(b,op);
 });
}
export async function endArmorRepair(actor,key,{expectedRevision,requester=game.user,reason=""}={}){
 primary();repairKey(key);return runMasterOperation(async()=>{
  available(actor,requester);if(await fromUuid(actor.uuid)!==actor)throw Error("Ficha removida.");const record=structuredClone(repairRecord(actor,key));checkExpected(record,expectedRevision);
  const target=await fromUuid(record.targetUuid);if(await fromUuid(actor.uuid)!==actor)throw Error("Ficha removida ou substituída.");available(actor,requester);if(target)available(target,requester);if(!repairSame(repairRecord(actor,key),record))throw Error("O trabalho mudou antes de encerrar.");if(record.status!=="active")throw Error("Trabalho já encerrado.");
  if(!Number.isSafeInteger(record.revision+1))throw Error("Revisão fora do limite numérico.");
  const after={...structuredClone(record),status:"ended",revision:record.revision+1,end:{reason:optionalNote(reason),userId:requester.id,time:Date.now()}};
  await actor.update({[`flags.${SYSTEM_ID}.armorRepairs.${key}`]:after});return after;
 });
}
async function closeJournal(actor,op,user,reason){
 authorize(actor,user);if(await fromUuid(actor.uuid)!==actor)throw Error("Ficha removida ou substituída.");const target=await fromUuid(op.targetUuid);if(await fromUuid(actor.uuid)!==actor)throw Error("Ficha removida ou substituída.");if(target&&await fromUuid(target.uuid)!==target)throw Error("Alvo removido ou substituído.");authorize(actor,user);if(target)authorize(target,user);
 if(!repairSame(ops(actor)[op.id],op))throw Error("Journal alterado antes do encerramento.");
 if(op.actorUuid!==actor.uuid||op.id!==repairKey(op.id)||op.kind!=="armorRepair")throw Error("Journal de outra ficha.");
 // Closing never changes CE/PV. Release only this operation's exact matching target lock.
 if(target&&target!==actor){const lock=ops(target)[op.id];if(lock&&repairSame(lock,mirror(op))){await target.update({[`flags.${SYSTEM_ID}.effectOperations.${op.id}.status`] :"reviewed"});authorize(actor,user);authorize(target,user);}else if(lock?.status==="prepared")throw Error("Vínculo de outra operação; preserve o alvo.");}
 const updates={[`flags.${SYSTEM_ID}.effectOperations.${op.id}.status`] :"reviewed",[`flags.${SYSTEM_ID}.effectOperations.${op.id}.review`]:{reason:optionalNote(reason),userId:user.id,time:Date.now()}};
 const record=flags(actor).armorRepairs?.[op.recordId];if(record?.actorUuid===actor.uuid&&record.id===op.recordId&&record.status==="active"){repairKey(op.recordId);updates[`flags.${SYSTEM_ID}.armorRepairs.${op.recordId}.status`]="ended";if(Number.isSafeInteger(record.revision+1))updates[`flags.${SYSTEM_ID}.armorRepairs.${op.recordId}.revision`]=record.revision+1;}
 await actor.update(updates);return {status:"reviewed",operationId:op.id};
}
export async function recoverArmorRepair(actor,id,{requester=game.user,close=false,reason=""}={}){
 primary();repairKey(id);if(typeof close!=="boolean")throw Error("Opção de recuperação inválida.");optionalNote(reason);
 return runMasterOperation(async()=>{
  authorize(actor,requester);const op=structuredClone(ops(actor)[id]);if(!op||op.kind!=="armorRepair"||op.actorUuid!==actor.uuid||op.id!==id)throw Error("Journal de reparo ausente ou de outra ficha.");
  if(close){if(!["prepared","reviewed"].includes(op.status))throw Error("Operação já concluída.");return closeJournal(actor,op,requester,reason);}
  validateRepairJournal(op,originalFor(actor,op));
  if(op.status==="applied")return {status:"applied",operationId:id};
  if(op.status!=="prepared")throw Error("Nenhum reparo interrompido.");
  const b=await binding(actor,op.beforeRecord,requester,id),{from,to}=sides(op),record=repairRecord(actor,op.recordId),state=armorRepairState(b.item,b.armor),before=repairSame(record,op.beforeRecord),after=repairSame(record,op.afterRecord);
  if(!before&&!after)throw Error("Trabalho alterado após a interrupção; preserve os ajustes.");
  const lock=b.target===actor?null:ops(b.target)[id];if(lock&&!["prepared","applied","failed"].some(status=>repairSame(lock,mirror(op,status))))throw Error("Vínculo do alvo alterado.");
  // No resource write happened: release flags without charging a retry.
  if(before&&state===repairPointState(op.plan,from)&&(state!==repairPointState(op.plan,to)||b.target!==actor&&(!lock||lock.status==="failed"))){
   if(lock?.status==="applied")throw Error("Conclusão do alvo incompatível com os valores anteriores.");
   const lockStatus=b.target===actor?"prepared":lock?.status??null;
   await stage(b,op,from,from,"before",lockStatus);
   if(b.target!==actor&&lock&&lock.status!=="failed"){
    await b.target.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`] :"failed"});
    await stage(b,op,from,from,"before","failed");
   }
   await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`] :"failed"});return {status:"failed",operationId:id};
  }
  if(b.target!==actor&&!lock)throw Error("Vínculo do alvo ausente após pagamento; confira manualmente.");
  if(lock?.status==="failed")throw Error("Vínculo encerrado sem aplicação; confira os valores atuais.");
  if(state===repairPointState(op.plan,to)){
   if(b.target!==actor&&lock.status==="applied"){
    await stage(b,op,to,to,after?"after":"before","applied");if(!after)throw Error("Conclusão do alvo sem registro da hora.");
    await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`] :"applied"});return {status:"applied",operationId:id};
   }
   await stage(b,op,to,to,after?"after":"before");return finish(b,op);
  }
  if(before&&state===repairPointState(op.plan,to,from)&&!repairSame(op.plan[from].payer,op.plan[to].payer)){
   await stage(b,op,to,from);if(op.plan[from].armor.health!==op.plan[to].armor.health)await b.armor.update({"system.health.value":op.plan[to].armor.health});await stage(b,op,to,to);return finish(b,op);
  }
  throw Error("Recursos ou armadura alterados após a interrupção; preserve os ajustes e confira manualmente.");
 });
}

// A deleted origin must not leave an unrelated surviving target permanently locked.
// Only a GM can close this orphan link, and no resource/repair value is inferred.
export async function releaseOrphanArmorRepair(target,id,{requester=game.user,reason=""}={}){
 primary();repairKey(id);const note=optionalNote(reason);return runMasterOperation(async()=>{
  authorize(target,requester);if(!requester.isGM)throw Error("Somente o mestre pode encerrar vínculo órfão.");
  const lock=structuredClone(ops(target)[id]);
  if(!lock||lock.kind!=="armorRepairTarget"||lock.status!=="prepared"||lock.actorUuid!==target.uuid||lock.operationId!==id)throw Error("Vínculo órfão ausente ou de outra ficha.");
  repairKey(lock.recordId);const payer=await fromUuid(lock.payerUuid);
  if(payer&&Object.hasOwn(ops(payer),id))throw Error("O journal de origem existe; recupere a operação de origem.");
  if(await fromUuid(target.uuid)!==target)throw Error("Alvo substituído.");const currentPayer=await fromUuid(lock.payerUuid);authorize(target,requester);
  if(!repairSame(ops(target)[id],lock))throw Error("Vínculo alterado antes do encerramento.");
  if(currentPayer&&Object.hasOwn(ops(currentPayer),id))throw Error("O journal de origem reapareceu.");
  await target.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`] :"reviewed",[`flags.${SYSTEM_ID}.effectOperations.${id}.review`]:{reason:note,userId:requester.id,time:Date.now(),orphan:true}});return {status:"reviewed",operationId:id};
 });
}
