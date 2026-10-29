import {controlRetryContextForSheet,openOwnedControlRetry,openOwnedControlRecovery} from "./control-retry-ui.mjs";
import {SYSTEM_ID,ATTRIBUTES,NATURES} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {effectRecords,effectState,encounterForEffect} from "./effect-rules.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {testParameters} from "./rules.mjs";
import {conditionPool} from "./condition-rules.mjs";
import {cosmoPayment} from "./technique-rules.mjs";
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
// Every NEW attempt, including GM, uses the same authenticated request/runtime.
export async function retryControl(actor,key){keyOf(key);const row=controlRetryContextForSheet(actor).rows.find(r=>r.id===key);return openOwnedControlRetry(actor,key,{signature:row?.signature});}
export async function recoverControlRetry(actor,id){
 keyOf(id);if(!game.user?.isGM&&!actor?.testUserPermission?.(game.user,"OWNER"))throw Error("Controle indisponível.");
 if(f(actor).effectOperations?.[id]?.kind==="controlRetryOwned")return openOwnedControlRecovery(actor,id);
 if(!isPrimaryGM()||!actor.isOwner)throw Error("Somente o mestre responsável pode recuperar a resistência.");
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
export function canRetryControl(actor,key){try{return controlRetryContextForSheet(actor).rows.find(r=>r.id===key)?.canRetry===true;}catch{return false;}}
