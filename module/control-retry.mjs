import {SYSTEM_ID,ATTRIBUTES,NATURES} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {effectRecords,effectState,encounterForEffect} from "./effect-rules.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {testParameters,classify} from "./rules.mjs";
import {conditionPool,conditionSummary} from "./condition-rules.mjs";
import {cosmoPayment} from "./technique-rules.mjs";
import {evaluatePool,prepareRollMessage} from "./rolls.mjs";
import {optionalNote} from "./form-values.mjs";
const f=doc=>doc?.flags?.[SYSTEM_ID]??{};
const keyOf=key=>{if(typeof key!=="string"||!/^[a-zA-Z0-9]{1,32}$/.test(key))throw Error("Identificador de registro inválido.");return key;};
const resources=actor=>Object.fromEntries(["health","cosmo"].map(k=>[k,actor.system.resources[k].value]).concat(["cosmoExtra","cosmoReserved","cosmoOverload"].map(k=>[k,actor.system.resources[k]]),[["unlimited",actor.system.resources.cosmo.unlimited]]));
const snapshot=(actor,key)=>({resources:resources(actor),record:structuredClone(effectRecords(actor)[key])});
function available(actor,operationId=null){
 if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode processar a nova resistência.");
 assertNoTechniqueInterruption(actor,{effectOperationId:operationId});
 if(f(actor).levelOperation?.status==="prepared"||Object.values(f(actor).damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Confira a operação interrompida de evolução/dano antes de continuar.");
}
export function controlRetryView(actor,key){
 keyOf(key);const record=effectRecords(actor)[key],origin=record?.controlOrigin;
 if(!origin||record.actorUuid!==actor.uuid||record.status!=="active"||record.kind!=="manual"||record.damage!==0)throw Error("Escolha um Controle vinculado e ativo desta ficha.");
 const cost={bronze:1,silver:1,gold:2}[origin.classification];
 if(!cost||!Number.isFinite(origin.powerCosmic)||Math.abs(origin.powerCosmic)>1000000||!Number.isSafeInteger(record.firstRound)||!Number.isSafeInteger(record.lastRound)||record.lastRound<record.firstRound||record.firstRound<1||record.lastRound-record.firstRound>=1000||typeof origin.rootMessageId!=="string")throw Error("Origem ou duração de Controle inválida; confira manualmente.");
 const context=encounterForEffect(actor,record.combatUuid);
 if(game.combat?.uuid!==record.combatUuid||context.combatantId!==record.combatantId||context.round<=record.firstRound||context.round>record.lastRound)throw Error("A tentativa exige uma rodada posterior à ativação, dentro do prazo e no mesmo encontro/combatente.");
 if(Object.values(record.controlRetries??{}).some(r=>!Number.isSafeInteger(r.round)||r.round>=context.round)||Object.values(f(actor).effectOperations??{}).some(r=>r.kind==="controlRetry"&&r.actorUuid===actor.uuid&&r.effectId===key&&["prepared","applied"].includes(r.status)&&r.round>=context.round))throw Error("Há uma tentativa registrada nesta rodada ou em rodada posterior. Recupere o mesmo resultado; não cobre novamente.");
 if(Object.values(f(actor).effectOperations??{}).some(r=>r.kind==="controlRetry"&&r.actorUuid===actor.uuid&&r.effectId===key&&r.status==="applied"&&!r.published))throw Error("Pagamento aguarda publicação. Recupere o mesmo cartão antes de outra tentativa.");
 return {record,origin,context,cost,defaultAttribute:NATURES[origin.nature]?.resistance??""};
}
export function controlRetryPlan(actor,key,answer){
 const view=controlRetryView(actor,key);
 if(!["vig","vel","sen","cos"].includes(answer?.attribute)||!Number.isFinite(answer.bonus)||Math.abs(answer.bonus)>10000||![-1,0,1].includes(answer.advantage)||typeof answer.useExtra!=="boolean"||!["end","keep"].includes(answer.onSuccess))throw Error("Confira atributo, modificador, vantagem e aplicação do resultado.");
 const reason=optionalNote(answer.reason),mode=game.settings.get(SYSTEM_ID,"resistanceMode");
 if(!["rank","modifier"].includes(mode))throw Error("Modo de resistência inválido.");
 const base=testParameters(actor.system,"resistance",answer.attribute,mode,{technique:true,conditions:false});
 const pool=conditionPool(actor.system,Math.max(1,base.dice+answer.advantage),base.modifier+answer.bonus+answer.advantage*2,{maxDice:100});
 const payment=cosmoPayment(actor.system,view.cost,{useExtra:answer.useExtra,allowOverload:false});
 return {...view,reason,pool,payment,mode};
}
async function guard(actor,baseline,operationId=null){
 available(actor,operationId);const current=await fromUuid(actor.uuid);
 if(current?.uuid!==actor.uuid||current.type!=="knight"||effectState(current)!==baseline||effectState(actor)!==baseline)throw Error("Ficha, recursos, Controle ou rodada mudou. Abra a tentativa novamente.");
 available(actor,operationId);
}
const expectedState=(actor,key,operation)=>{const flags=structuredClone(actor.flags??{});flags[SYSTEM_ID]??={};flags[SYSTEM_ID].effectOperations??={};flags[SYSTEM_ID].effectOperations[key]=operation;return effectState({uuid:actor.uuid,system:actor.system,flags});};
async function publish(actor,id,operation){
 available(actor);if(operation.actorUuid!==actor.uuid||operation.status!=="applied")throw Error("Pagamento da tentativa ainda não confirmado.");
 const message=game.messages.get(operation.messageId);
 if(!message)throw Error("Cartão removido; pagamento permanece registrado. Encerre somente o registro após conferir.");
 if(f(message).controlRetryResolution?.operationId===id&&f(message).controlRetryResolution?.actorUuid===actor.uuid){if(!operation.published)await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.published`]:true});return message;}
 const saved=f(message).controlRetryPrepared;
 if(!saved||actionHash(saved)!==operation.cardHash||message.author?.id!==operation.userId)throw Error("Resultado ausente ou alterado. Recupere/encerre o registro sem cobrar ou rolar novamente.");
 if(saved.card.blind||saved.card.whisper?.length)throw Error("Esta assistência só publica resultados públicos.");
 await message.update({...saved.card,rolls:saved.card.rolls.map(r=>Roll.fromData(r)),[`flags.${SYSTEM_ID}.-=controlRetryPrepared`]:null,[`flags.${SYSTEM_ID}.controlRetryResolution`]:{actorUuid:actor.uuid,operationId:id}});
 try{await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.published`]:true});}catch(error){console.error(`${SYSTEM_ID}: publicação da resistência`,error);}
 return message;
}
export async function retryControl(actor,key){
 available(actor);const view=controlRetryView(actor,key),baseline=effectState(actor);
 const content=await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/control-retry-dialog.hbs`,{name:view.record.label,targetName:actor.name,round:view.context.round,lastRound:view.record.lastRound,cost:view.cost,difficulty:view.origin.powerCosmic,current:actor.system.resources.cosmo.value,reserved:actor.system.resources.cosmoReserved,extra:actor.system.resources.cosmoExtra,unlimited:actor.system.resources.cosmo.unlimited,attributes:["vig","vel","sen","cos"].map(value=>({value,label:ATTRIBUTES[value],selected:value===view.defaultAttribute}))});
 await guard(actor,baseline);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Nova resistência de Controle"},content,buttons:[{action:"retry",label:`Rolar público e gastar ${view.cost} CE`,default:true,callback:(_e,b)=>{const e=b.form.elements;return {attribute:e.attribute.value,bonus:Number(e.bonus.value),advantage:Number(e.advantage.value),useExtra:e.useExtra.checked,onSuccess:e.onSuccess.value,reason:e.reason.value};}},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
 if(!answer)return;
 return runMasterOperation(async()=>{
  await guard(actor,baseline);const plan=controlRetryPlan(actor,key,answer),id=keyOf(foundry.utils.randomID()),before=snapshot(actor,key);
  if(f(actor).effectOperations?.[id])throw Error("Identificador já registrado. Abra a tentativa novamente.");
  let operation={kind:"controlRetry",status:"prepared",actorUuid:actor.uuid,effectId:key,round:plan.context.round,userId:game.user.id,time:Date.now(),before,cost:plan.cost};
  let expected=expectedState(actor,id,operation);await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}`]:operation});await guard(actor,expected,id);
  const {result,messageRoll}=await evaluatePool(plan.pool.dice,plan.pool.modifier);await guard(actor,expected,id);
  const success=result.total>=plan.origin.powerCosmic,end=success&&answer.onSuccess==="end";
  const retry={operationId:id,round:plan.context.round,total:result.total,difficulty:plan.origin.powerCosmic,success,end,cost:plan.cost,fromExtra:plan.payment.fromExtra,fromCurrent:plan.payment.fromCurrent,unlimited:plan.payment.unlimited,attribute:answer.attribute,reason:plan.reason,userId:game.user.id,time:Date.now()};
  const afterRecord={...plan.record,controlRetries:{...plan.record.controlRetries,[id]:retry},...(end?{status:"ended",end:{reason:plan.reason,userId:game.user.id,time:Date.now(),controlRetryOperationId:id}}:{})};
  const card=await prepareRollMessage(actor,messageRoll,{label:ATTRIBUTES[answer.attribute],name:plan.record.label,...result,difficulty:plan.origin.powerCosmic,outcome:classify(result.total,plan.origin.powerCosmic),cost:plan.cost,round:plan.context.round,end,success,fromExtra:plan.payment.fromExtra,fromCurrent:plan.payment.fromCurrent,unlimited:plan.payment.unlimited,conditionSummary:conditionSummary(actor.system),reason:plan.reason},{template:"control-retry-chat",rollMode:"publicroll",flags:{controlRetry:{effectId:key,round:plan.context.round,difficulty:plan.origin.powerCosmic,test:result,success,end,cost:plan.cost}}});
  card.whisper=[];card.blind=false;card.rolls=card.rolls.map(r=>r.toJSON());await guard(actor,expected,id);
  const prepared={card},message=await ChatMessage.create({content:"<p>Nova resistência em processamento. O mesmo cartão receberá o resultado; não repita a tentativa.</p>",whisper:[game.user.id],blind:false,flags:{[SYSTEM_ID]:{controlRetryPrepared:prepared}}});
  await guard(actor,expected,id);
  const afterResources={...before.resources,cosmo:plan.payment.updates["system.resources.cosmo.value"]??before.resources.cosmo,cosmoExtra:plan.payment.updates["system.resources.cosmoExtra"]??before.resources.cosmoExtra,cosmoOverload:plan.payment.updates["system.resources.cosmoOverload"]??before.resources.cosmoOverload};
  operation={...operation,messageId:message.id,cardHash:actionHash(prepared),after:{resources:afterResources,record:afterRecord}};
  const next=expectedState(actor,id,operation);await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}`]:operation});expected=next;await guard(actor,expected,id);
  if(actionHash(f(message).controlRetryPrepared)!==operation.cardHash||actionHash(snapshot(actor,key))!==actionHash(before))throw Error("Resultado ou recursos alterados antes do pagamento. Confira o registro.");
  await actor.update({...plan.payment.updates,[`flags.${SYSTEM_ID}.persistentEffects.${key}`]:afterRecord,[`flags.${SYSTEM_ID}.effectOperations.${id}`]:{...operation,status:"applied"}});
  await publish(actor,id,f(actor).effectOperations[id]);return retry;
 });
}
export async function recoverControlRetry(actor,id){
 keyOf(id);if(!isPrimaryGM()||!actor.isOwner)throw Error("Somente o mestre responsável pode recuperar a resistência.");
 const operation=f(actor).effectOperations?.[id];if(operation?.kind!=="controlRetry"||!["prepared","applied"].includes(operation.status))throw Error("Não há tentativa pendente.");
 const baseline=effectState(actor);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Recuperar resistência de Controle"},content:"<p>Pagamento completo recupera o mesmo cartão. Valores anteriores encerram a tentativa sem gastar. Valores divergentes exigem reparo manual. Nenhum recurso será restaurado e nenhum teste repetido.</p><label>Notas (opcional)<textarea name=\"reason\" maxlength=\"2000\"></textarea></label>",buttons:[{action:"recover",label:"Recuperar pelo registro",callback:(_e,b)=>({reason:b.form.elements.reason.value,close:false})},{action:"close",label:"Encerrar sem alterar recursos",callback:(_e,b)=>({reason:b.form.elements.reason.value,close:true})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
 if(!answer)return;
 return runMasterOperation(async()=>{
  optionalNote(answer.reason);
  if(!isPrimaryGM()||!actor.isOwner||effectState(actor)!==baseline)throw Error("Mestre, ficha ou registro mudou. Confira novamente.");
  const own=operation.actorUuid===actor.uuid;
  if(answer.close){await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"reviewed",[`flags.${SYSTEM_ID}.effectOperations.${id}.review`]:{reason:optionalNote(answer.reason),time:Date.now(),userId:game.user.id}});return;}
  if(!own)throw Error("Registro de outra ficha. Encerre somente o registro local após conferir.");
  if(operation.status==="applied"){await publish(actor,id,operation);return;}
  const current=snapshot(actor,operation.effectId);
  if(operation.after&&actionHash(current)===actionHash(operation.after)){
   await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"applied"});await publish(actor,id,{...operation,status:"applied"});return;
  }
  if(actionHash(current)===actionHash(operation.before)){
   await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"failed",[`flags.${SYSTEM_ID}.effectOperations.${id}.review`]:{reason:optionalNote(answer.reason),time:Date.now(),userId:game.user.id}});return;
  }
  throw Error("Recursos ou efeito divergentes. Preserve os ajustes e confira manualmente antes de recuperar/encerrar.");
 });
}
export function canRetryControl(actor,key){try{available(actor);controlRetryView(actor,key);return true;}catch{return false;}}
