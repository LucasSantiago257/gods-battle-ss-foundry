import {ownedSustainSheetContext,paySustainedFromSheet} from "./sustained-payment-ui.mjs";
import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {effectState,effectSourceState,effectRecords,encounterForEffect} from "./effect-rules.mjs";
import {sustainedSource,sustainedDefinition} from "./sustained-rules.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {optionalNote} from "./form-values.mjs";
const keyOf=key=>{if(typeof key!=="string"||!/^[a-zA-Z0-9]{1,32}$/.test(key))throw Error("Registro de Sustentada inválido.");return key;};
const flags=actor=>actor.flags?.[SYSTEM_ID]??{};
const snapshot=(actor,key)=>({resources:structuredClone(actor.system.resources),record:structuredClone(effectRecords(actor)[key])});
function available(actor,id=null){
 if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode registrar Sustentada.");
 assertNoTechniqueInterruption(actor,{effectOperationId:id});
 if(flags(actor).levelOperation?.status==="prepared"||Object.values(flags(actor).damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Confira a operação interrompida de evolução/dano antes de continuar.");
}
async function guard(actor,baseline,id=null,target=null,targetBaseline=null){
 available(actor,id);const current=await fromUuid(actor.uuid);
 if(current?.uuid!==actor.uuid||current.type!=="knight"||!current.isOwner||effectState(current)!==baseline||effectState(actor)!==baseline)throw Error("Ficha, recursos ou rodada mudou. Abra a conferência novamente.");
 if(target){const live=await fromUuid(target.uuid);if(!live?.isOwner||live.type!=="knight"||effectState(live)!==targetBaseline||effectState(target)!==targetBaseline)throw Error("Alvo ou rodada mudou. Abra a conferência novamente.");}
 available(actor,id);
 // O alvo pode ser a própria ficha; revalide o pagador depois de todas as leituras.
 if(effectState(actor)!==baseline)throw Error("Ficha ou rodada mudou durante a conferência.");
}
export async function registerSustained(actor){
 available(actor);const context=encounterForEffect(actor),baseline=effectState(actor);
 const sources=[];for(const item of actor.items?.contents??[])try{sources.push({...sustainedSource(actor,item),baseline:effectSourceState(item)});}catch{}
 if(!sources.length)throw Error("Configure ou crie uma técnica Sustentada nesta ficha antes de registrar.");
 const combat=game.combat;if(combat?.uuid!==context.combatUuid)throw Error("Abra o encontro da ficha.");
 const targets=[];for(const member of combat.combatants.contents)try{const target=member.actor;if(target?.type!=="knight"||!target.isOwner)continue;encounterForEffect(target,context.combatUuid);targets.push({uuid:target.uuid,name:target.name,baseline:effectState(target)});}catch{}
 const html=await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/sustained-dialog.hbs`,{sources,targets,round:context.round});
 await guard(actor,baseline);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Registrar Sustentada no pagador"},content:html,buttons:[{action:"register",label:"Registrar duração inicial",callback:(_e,b)=>{const f=b.form.elements;return {itemUuid:f.itemUuid.value,targetUuid:f.targetUuid.value,maintenanceMode:f.maintenanceMode.value,firstRound:Number(f.firstRound.value),rounds:f.rounds.value.trim()===""?null:Number(f.rounds.value),reason:f.reason.value};}},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
 if(!answer)return;
 return runMasterOperation(async()=>{
  const source=sources.find(s=>s.itemUuid===answer.itemUuid),selection=targets.find(t=>t.uuid===answer.targetUuid);if(!source||!selection)throw Error("Selecione técnica e alvo da lista.");
  const item=await fromUuid(source.itemUuid),target=await fromUuid(selection.uuid);if(!target)throw Error("O alvo foi removido. Abra o registro novamente.");
  await guard(actor,baseline,null,target,selection.baseline);
  if(!item||effectSourceState(item)!==source.baseline||actor.items.get(item.id)?.uuid!==item.uuid||effectSourceState(actor.items.get(item.id))!==source.baseline)throw Error("Técnica alterada ou removida; abra o registro novamente.");
  const definition=sustainedDefinition(actor,item,target,answer);
  if(Object.values(effectRecords(actor)).some(r=>r.actorUuid===actor.uuid&&r.kind==="sustained"&&r.status==="active"&&r.source?.itemUuid===item.uuid))throw Error("Já há Sustentada desta técnica. Use o registro existente ou encerre-o; múltiplos alvos usam resolução manual.");
  const id=keyOf(foundry.utils.randomID());if(effectRecords(actor)[id])throw Error("Identificador existente.");
  const record={...definition,id,actorUuid:actor.uuid,status:"active",ticks:{},userId:game.user.id,time:Date.now()};
  await actor.update({[`flags.${SYSTEM_ID}.persistentEffects.${id}`]:record});return record;
 });
}
// All new payments, including GM shortcuts, use authenticated requests.
export function sustainedPaymentPreview(actor,key){
 keyOf(key);const context=ownedSustainSheetContext(actor),row=context.rows.find(r=>r.id===key);
 if(!row?.canPay)throw Error(row?.warning||context.warning||(row?.foreign?row.displayState:"Rodada coberta ou recarga indispon\u00edvel."));
 return {round:row.round,signature:row.paySignature,label:row.payLabel};
}
export async function paySustained(actor,key,{quick=false,expectedRound=null,expectedState=null}={}){
 keyOf(key);if(typeof quick!=="boolean"||quick&&(!Number.isSafeInteger(expectedRound)||typeof expectedState!=="string"))throw Error("A pr\u00e9via da recarga mudou.");
 if(quick)return paySustainedFromSheet(actor,key,{signature:expectedState,round:expectedRound});
 const context=ownedSustainSheetContext(actor),row=context.rows.find(r=>r.id===key);if(!row?.canAdjust)throw Error(row?.warning||context.warning||(row?.foreign?row.displayState:"Rodada coberta ou recarga indispon\u00edvel."));
 return paySustainedFromSheet(actor,key,{signature:row.dialogSignature,round:row.round,adjust:true});
}
export async function recoverSustained(actor,id){
 keyOf(id);if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode recuperar a recarga.");
 const operation=flags(actor).effectOperations?.[id];if(operation?.kind!=="sustainPayment"||operation.status!=="prepared")throw Error("Não há recarga interrompida.");
 const baseline=effectState(actor);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Recuperar recarga de Sustentada"},content:'<p>Conferir pagamento e registro sem cobrar ou restaurar recursos. Valores divergentes exigem revisão manual.</p><label>Notas (opcional)<textarea name="reason" maxlength="2000"></textarea></label>',buttons:[{action:"recover",label:"Conferir registro",callback:(_e,b)=>({close:false,reason:b.form.elements.reason.value})},{action:"close",label:"Encerrar pendência sem alterar recursos",callback:(_e,b)=>({close:true,reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
 if(!answer)return;
 return runMasterOperation(async()=>{
  const reason=optionalNote(answer.reason);if(!isPrimaryGM()||!actor.isOwner||effectState(actor)!==baseline)throw Error("Mestre, ficha ou registro mudou.");
  const live=await fromUuid(actor.uuid);if(live?.uuid!==actor.uuid||!live.isOwner||effectState(live)!==baseline||effectState(actor)!==baseline||!isPrimaryGM()||!actor.isOwner)throw Error("Ficha ou mestre mudou.");
  const own=operation.actorUuid===actor.uuid,current=snapshot(actor,operation.effectId);
  const status=answer.close?"reviewed":own&&actionHash(current)===actionHash(operation.after)?"applied":own&&actionHash(current)===actionHash(operation.before)?"failed":null;
  if(!status)throw Error("Recursos ou registro divergentes/de outra ficha. Preserve os ajustes e confira manualmente.");
  await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:status,[`flags.${SYSTEM_ID}.effectOperations.${id}.review`]:{reason,userId:game.user.id,time:Date.now()}});return status;
 });
}
