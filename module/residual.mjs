import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {effectRecords,effectState,effectSourceState,encounterForEffect} from "./effect-rules.mjs";
import {residualSource,residualInitial,residualParameters,residualOutcome} from "./residual-rules.mjs";
import {evaluatePool,prepareRollMessage} from "./rolls.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {optionalNote} from "./form-values.mjs";
const f=doc=>doc?.flags?.[SYSTEM_ID]??{};
const keyOf=key=>{if(typeof key!=="string"||!/^[a-zA-Z0-9]{1,32}$/.test(key))throw Error("Identificador de Residual inválido.");return key;};
function available(actor,id=null){
 if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode preparar Cosmo Residual.");
 assertNoTechniqueInterruption(actor,{effectOperationId:id});
 if(f(actor).levelOperation?.status==="prepared"||Object.values(f(actor).damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Recupere evolução/dano interrompido antes do Residual.");
}
async function guard(actor,baseline,target,targetBaseline,item,sourceBaseline,userId,id=null){
 available(actor,id);available(target);
 const source=await fromUuid(item.uuid),live=await fromUuid(actor.uuid),other=await fromUuid(target.uuid);
 if(game.user.id!==userId||!source||source.parent?.uuid!==actor.uuid||!source.isOwner||!item.isOwner||effectSourceState(source)!==sourceBaseline||effectSourceState(item)!==sourceBaseline||effectSourceState(actor.items.get(item.id)??{})!==sourceBaseline||live?.type!=="knight"||live.uuid!==actor.uuid||!live.isOwner||other?.type!=="knight"||other.uuid!==target.uuid||!other.isOwner||effectState(live)!==baseline||effectState(actor)!==baseline||effectState(other)!==targetBaseline||effectState(target)!==targetBaseline)throw Error("Mestre, técnica, participantes, efeito ou rodada mudou. Abra o Residual novamente.");
 available(live,id);available(other);available(actor,id);available(target);
}
const expectedState=(actor,id,operation)=>{const flags=structuredClone(actor.flags??{});flags[SYSTEM_ID]??={};flags[SYSTEM_ID].effectOperations??={};flags[SYSTEM_ID].effectOperations[id]=operation;return effectState({uuid:actor.uuid,system:actor.system,flags});};
const snapshot=(actor,key)=>({penalty:actor.system.combat.asterismPenalty??0,record:structuredClone(effectRecords(actor)[key]??null)});
function preparedCard(operation){
 const message=game.messages.get(operation.messageId),saved=f(message).residualPrepared;
 if(!message||message.author?.id!==operation.userId||!saved||actionHash(saved)!==operation.cardHash||saved.card.blind||saved.card.whisper?.length)throw Error("Cartão de Residual removido ou alterado. Não repita a rolagem.");
 return {message,saved};
}
async function publish(actor,id,operation){
 available(actor);if(operation.actorUuid!==actor.uuid||operation.status!=="applied")throw Error("Residual ainda não registrado.");
 const message=game.messages.get(operation.messageId),resolution=f(message).residualResolution;
 if(resolution?.actorUuid===actor.uuid&&resolution.operationId===id){if(!operation.published)await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.published`]:true});return message;}
 const saved=preparedCard(operation).saved;
 await message.update({...saved.card,rolls:saved.card.rolls.map(r=>Roll.fromData(r)),[`flags.${SYSTEM_ID}.-=residualPrepared`]:null,[`flags.${SYSTEM_ID}.residualResolution`]:{actorUuid:actor.uuid,operationId:id}});
 try{await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.published`]:true});}catch(error){console.error(`${SYSTEM_ID}: publicação de Residual`,error);}return message;
}
export async function depositResidual(actor){
 available(actor);const baseline=effectState(actor),context=encounterForEffect(actor),userId=game.user.id,sources=[];
 for(const item of actor.items?.contents??[])try{sources.push({...residualSource(actor,item),baseline:effectSourceState(item)});}catch{}
 if(!sources.length)throw Error("Crie uma técnica com primordial Cosmo Residual ou selecione esse primordial na cópia da técnica.");
 const targets=[];for(const member of game.combat?.combatants?.contents??[]){const target=member.actor;try{
  available(target);const participant=encounterForEffect(target,context.combatUuid);
  for(const [key,record]of Object.entries(effectRecords(target)))try{
   keyOf(key);if(!sources.some(source=>{try{residualInitial(actor,source,target,key,context,participant);return true;}catch{return false;}}))continue;
   targets.push({selection:`${target.uuid}|${key}`,uuid:target.uuid,key,name:target.name,label:record.label,firstRound:record.firstRound,lastRound:record.lastRound,baseline:effectState(target)});
  }catch{}
 }catch{}}
 if(!targets.length)throw Error("Registre primeiro o efeito inicial de Controle/anotação manual no alvo do encontro. Confira sua duração.");
 const content=await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/residual-dialog.hbs`,{payerName:actor.name,round:context.round,sources,targets,powerCosmic:actor.system.combat.cosmicPower});
 if(effectState(actor)!==baseline||!isPrimaryGM()||game.user.id!==userId||!actor.isOwner)throw Error("Ficha ou mestre mudou durante a prévia.");
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Preparar Cosmo Residual"},content,buttons:[{action:"roll",label:"Rolar segundo Asterismo público",default:true,callback:(_e,b)=>{const e=b.form.elements;return {itemUuid:e.itemUuid.value,selection:e.selection.value,difficulty:e.difficulty.value.trim()===""?NaN:Number(e.difficulty.value),powerCosmic:e.powerCosmic.value.trim()===""?NaN:Number(e.powerCosmic.value),bonus:Number(e.bonus.value),reason:e.reason.value};}},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!answer)return;
 return runMasterOperation(async()=>{
  const source=sources.find(s=>s.itemUuid===answer.itemUuid),selection=targets.find(t=>t.selection===answer.selection);if(!source||!selection)throw Error("Escolha técnica e efeito inicial da lista.");
  const item=await fromUuid(source.itemUuid),target=await fromUuid(selection.uuid);if(!item||!target)throw Error("Técnica ou alvo removido.");
  await guard(actor,baseline,target,selection.baseline,item,source.baseline,userId);
  const initial=residualInitial(actor,residualSource(actor,item),target,selection.key,context,encounterForEffect(target,context.combatUuid)),plan=residualParameters(actor.system,source.nature,answer),id=keyOf(foundry.utils.randomID());
  if(f(actor).effectOperations?.[id]||effectRecords(actor)[id])throw Error("Identificador já utilizado.");
  const before=snapshot(actor,id);let operation={kind:"residualDeposit",status:"prepared",actorUuid:actor.uuid,targetUuid:target.uuid,itemUuid:item.uuid,sourceState:source.baseline,targetState:selection.baseline,round:context.round,effectId:id,userId,time:Date.now(),before,casterSystemHash:actionHash(actor.system)};
  let expected=expectedState(actor,id,operation);await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}`]:operation});await guard(actor,expected,target,selection.baseline,item,source.baseline,userId,id);
  const rolled=await evaluatePool(plan.pool.dice,plan.pool.modifier);await guard(actor,expected,target,selection.baseline,item,source.baseline,userId,id);
  const outcome=residualOutcome(rolled.result.total,plan.difficulty,plan.powerCosmic),result={...outcome,total:rolled.result.total,difficulty:plan.difficulty,powerCosmic:plan.powerCosmic};
  const record={id,kind:"residual",actorUuid:actor.uuid,label:source.name,source:{...source},status:outcome.success?"active":"failed",damage:0,page:"224/225",firstRound:context.round,combatUuid:context.combatUuid,combatantId:context.combatantId,ticks:{},reason:plan.reason,time:Date.now(),userId,residual:{...result,operationId:id,targetUuid:target.uuid,targetName:target.name,initialEffectId:selection.key,initialLabel:initial.label,initialFirstRound:initial.firstRound,initialLastRound:initial.lastRound,initialSignature:actionHash(initial)}};
  const card=await prepareRollMessage(actor,rolled.messageRoll,{name:source.name,payerName:actor.name,targetName:target.name,initialLabel:initial.label,round:context.round,...rolled.result,...plan.pool,...result,oldPenalty:plan.pool.penalty,reason:plan.reason},{template:"residual-chat",rollMode:"publicroll",flags:{residualDeposit:result}});
  card.whisper=[];card.blind=false;card.rolls=card.rolls.map(r=>r.toJSON());await guard(actor,expected,target,selection.baseline,item,source.baseline,userId,id);
  const prepared={card},message=await ChatMessage.create({content:"<p>Cosmo Residual em processamento. Aguarde o mesmo resultado.</p>",whisper:[userId],blind:false,flags:{[SYSTEM_ID]:{residualPrepared:prepared}}});await guard(actor,expected,target,selection.baseline,item,source.baseline,userId,id);
  operation={...operation,after:{penalty:outcome.penalty,record},messageId:message.id,cardHash:actionHash(prepared)};const next=expectedState(actor,id,operation);await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}`]:operation});expected=next;await guard(actor,expected,target,selection.baseline,item,source.baseline,userId,id);
  preparedCard(operation);if(actionHash(snapshot(actor,id))!==actionHash(before))throw Error("Registro ou penalidade alterado antes do Residual.");
  await actor.update({"system.combat.asterismPenalty":outcome.penalty,[`flags.${SYSTEM_ID}.persistentEffects.${id}`]:record,[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"applied"});await publish(actor,id,f(actor).effectOperations[id]);return record;
 });
}
export async function recoverResidual(actor,id){
 keyOf(id);if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode recuperar Residual.");
 const operation=f(actor).effectOperations?.[id];if(operation?.kind!=="residualDeposit"||!["prepared","applied"].includes(operation.status))throw Error("Não há Residual pendente.");const baseline=effectState(actor);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Recuperar Cosmo Residual"},content:'<p>Recuperar o mesmo resultado sem nova rolagem, cobrança ou restauração de recursos. Se o estado divergir, preserve os ajustes e encerre apenas a pendência.</p><label>Notas (opcional)<textarea name="reason" maxlength="2000"></textarea></label>',buttons:[{action:"recover",label:"Recuperar mesmo resultado",callback:(_e,b)=>({close:false,reason:b.form.elements.reason.value})},{action:"close",label:"Encerrar pendência sem alterar recursos",callback:(_e,b)=>({close:true,reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!answer)return;
 return runMasterOperation(async()=>{
  const reason=optionalNote(answer.reason),live=await fromUuid(actor.uuid);if(!isPrimaryGM()||!actor.isOwner||!live?.isOwner||live.uuid!==actor.uuid||effectState(live)!==baseline||effectState(actor)!==baseline)throw Error("Ficha, mestre ou registro mudou.");
  if(answer.close){await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"reviewed",[`flags.${SYSTEM_ID}.effectOperations.${id}.review`]:{reason,userId:game.user.id,time:Date.now()}});return;}
  if(operation.actorUuid!==actor.uuid)throw Error("Registro de outra ficha. Encerre somente a pendência local.");
  if(operation.status==="applied")return publish(actor,id,operation);
  const current=snapshot(actor,operation.effectId);
  if(operation.after&&actionHash(current)===actionHash(operation.after)){await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"applied"});return publish(actor,id,{...operation,status:"applied"});}
  if(actionHash(current)!==actionHash(operation.before))throw Error("Registro/penalidade divergente. Preserve ajustes e confira manualmente.");
  if(!operation.after){await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"failed"});return;}
  const item=await fromUuid(operation.itemUuid),target=await fromUuid(operation.targetUuid);if(!item||!target||game.combat?.round!==operation.round||actionHash(actor.system)!==operation.casterSystemHash)throw Error("Técnica, participantes ou rodada mudaram. Preserve o resultado.");
  await guard(actor,baseline,target,operation.targetState,item,operation.sourceState,game.user.id,id);preparedCard(operation);
  await actor.update({"system.combat.asterismPenalty":operation.after.penalty,[`flags.${SYSTEM_ID}.persistentEffects.${operation.effectId}`]:operation.after.record,[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"applied"});return publish(actor,id,{...operation,status:"applied"});
 });
}
