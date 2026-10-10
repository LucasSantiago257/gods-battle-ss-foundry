import {recoverSustained} from "./sustained.mjs";
import {canRetryControl,recoverControlRetry} from "./control-retry.mjs";
import {optionalNote} from "./form-values.mjs";
import {SYSTEM_ID} from "./config.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {actionHash} from "./action-rules.mjs";
import {brasasSource,effectRecords,effectSourceState,effectDefinition,encounterForEffect,effectView,effectState,effectTickPlan} from "./effect-rules.mjs";
const escape=value=>String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const safeKey=key=>{if(!/^[a-zA-Z0-9]{1,32}$/.test(key??""))throw Error("Registro de efeito inválido.");return key;};
function available(actor,operationId=null) {
 if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode registrar ou resolver efeitos.");
 assertNoTechniqueInterruption(actor,{effectOperationId:operationId});
 if(actor.flags?.[SYSTEM_ID]?.levelOperation?.status==="prepared"||Object.values(actor.flags?.[SYSTEM_ID]?.damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Confira a operação interrompida de evolução/dano antes de resolver efeitos.");
}
async function guard(actor,baseline,operationId=null) {
 available(actor,operationId);const current=await fromUuid(actor.uuid);
 if(current?.type!=="knight"||current.uuid!==actor.uuid||effectState(current)!==baseline||effectState(actor)!==baseline)throw Error("Ficha, recursos, registro ou rodada mudou. Abra a conferência novamente.");
 available(actor,operationId);
}
const effectSnapshot=(actor,key)=>({health:actor.system.resources.health.value,record:structuredClone(effectRecords(actor)[key])});
export const effectOperationContext=actor=>Object.entries(actor.flags?.[SYSTEM_ID]?.effectOperations??{}).map(([id,r])=>({id,...r,canReview:game.user.isGM&&(r.status==="prepared"||r.kind==="controlRetry"&&r.status==="applied"&&!r.published)})).filter(r=>r.status==="prepared"||r.kind==="controlRetry"&&r.status==="applied"&&!r.published);
export function effectSources() {
 const actors=new Map();for(const actor of [...(game.actors?.contents??[]),...(globalThis.canvas?.tokens?.placeables??[]).map(t=>t.actor),...(game.combats?.contents??[]).flatMap(c=>(c.combatants?.contents??[]).map(m=>m.actor))])if(actor?.uuid)actors.set(actor.uuid,actor);
 const sources=[];for(const actor of actors.values())for(const item of actor.items?.contents??[])try{const source=brasasSource(item);sources.push({...source,label:`${actor.name} · ${item.name} · ${source.damage} PV/rodada`,baseline:effectSourceState(item)});}catch{/* Somente composições canônicas aptas. */}
 return sources.toSorted((a,b)=>a.label.localeCompare(b.label));
}
export function effectSheetContext(actor) {
 return Object.entries(effectRecords(actor)).map(([id,record])=>({id,...record,...effectView(actor,record),isSustained:record.kind==="sustained",sustainModeLabel:record.sustain?.mode==="once"?"única até encerrar":"por rodada",canRetryControl:canRetryControl(actor,id),controlRetries:Object.values(record.controlRetries??{}).toSorted((a,b)=>a.round-b.round),canPay:game.user.isGM&&isPrimaryGM()&&effectView(actor,record).canPay&&!Object.values(actor.flags?.[SYSTEM_ID]?.effectOperations??{}).some(r=>r.status==="prepared"),sustainPayments:Object.values(record.sustain?.payments??{}).toSorted((a,b)=>a.round-b.round),canEnd:game.user.isGM&&record.status==="active",canResolve:game.user.isGM&&effectView(actor,record).canResolve,ticks:Object.values(record.ticks??{}).toSorted((a,b)=>a.round-b.round)})).toSorted((a,b)=>b.time-a.time);
}
export function effectDialogContext(actor) {
 const context=encounterForEffect(actor);
 return {targetName:actor.name,round:context.round,combatUuid:context.combatUuid,sources:effectSources()};
}
export async function registerEffect(actor) {
 available(actor);
 const baseline=effectState(actor),context=effectDialogContext(actor);
 const content=await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/effect-dialog.hbs`,context);
 await guard(actor,baseline);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Registrar efeito com duração"},content,buttons:[{action:"save",label:"Conferir e registrar",callback:(_e,b)=>{const f=b.form.elements;return {kind:f.kind.value,sourceUuid:f.sourceUuid.value,label:f.label.value,page:f.page.value,rounds:Number(f.rounds.value),firstOffset:Number(f.firstOffset.value),reason:f.reason.value,description:f.description.value};}},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
 if(!answer)return;
 return runMasterOperation(async()=>{
  let source=null,sourceItem=null,selected=null;
  if(answer.kind==="brasas") {
   selected=context.sources.find(s=>s.itemUuid===answer.sourceUuid);if(!selected)throw Error("Escolha uma técnica válida da lista.");
   sourceItem=await fromUuid(selected.itemUuid);if(!sourceItem||effectSourceState(sourceItem)!==selected.baseline)throw Error("A composição/técnica mudou. Abra o registro novamente.");source=brasasSource(sourceItem);
  }
  const definition=effectDefinition(answer,source);await guard(actor,baseline);
  const encounter=encounterForEffect(actor,context.combatUuid);
  if(sourceItem&&(effectSourceState(sourceItem)!==selected.baseline||sourceItem.parent.items.get(sourceItem.id)?.uuid!==sourceItem.uuid||effectSourceState(sourceItem.parent.items.get(sourceItem.id))!==selected.baseline))throw Error("A técnica foi alterada/removida durante a confirmação.");
  if(definition.kind==="brasas"&&Object.values(effectRecords(actor)).some(r=>r.actorUuid===actor.uuid&&r.status==="active"&&r.kind==="brasas"&&r.source?.itemUuid===source.itemUuid))throw Error("Já há Brasas desta técnica na ficha. Encerre/revise o registro antes de reaplicar; cumulatividade não é presumida.");
  const id=safeKey(foundry.utils.randomID()),firstRound=encounter.round+definition.firstOffset,lastRound=firstRound+definition.rounds-1;
  const record={...definition,id,actorUuid:actor.uuid,combatUuid:encounter.combatUuid,combatantId:encounter.combatantId,firstRound,lastRound,status:"active",ticks:{},userId:game.user.id,time:Date.now()};
  await actor.update({[`flags.${SYSTEM_ID}.persistentEffects.${id}`]:record});return record;
 });
}
export async function resolveEffect(actor,key) {
 available(actor);safeKey(key);
 const record=effectRecords(actor)[key];if(!record)throw Error("Efeito ausente.");
 const view=effectView(actor,record);if(!view.canResolve)throw Error(view.state);
 effectTickPlan(actor,record,{checked:true,reason:"Prévia sem aplicação"});
 const baseline=effectState(actor),html=`<p>${escape(record.label)} · rodada ${view.nextRound} · ${record.damage} PV previstos. PV atuais: ${actor.system.resources.health.value}.</p>${view.overdue?"<p>Rodada atrasada: confirme o que aconteceu; nenhuma rodada foi cobrada automaticamente.</p>":""}<p>Aplicar afeta somente PV corporais. Anotações manuais apenas registram a passagem da rodada. Armadura, CE, ações e condições permanecem conferidas separadamente.</p><label>Dano corporal final, após ajustes conferidos<input type="number" name="damage" min="0" max="1000000" step="any" value="${record.damage}" ${record.kind==="manual"?"readonly":""}></label><label><input type="checkbox" name="skip">Registrar rodada sem dano/efeito (dispensa conferida)</label><label>Notas (opcional)<textarea name="reason" maxlength="2000"></textarea></label>`;
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Resolver rodada do efeito"},content:html,buttons:[{action:"resolve",label:"Registrar esta rodada",callback:(_e,b)=>({skip:b.form.elements.skip.checked,damage:Number(b.form.elements.damage.value),reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
 if(!answer)return;
 return runMasterOperation(async()=>{
  await guard(actor,baseline);const plan=effectTickPlan(actor,record,answer),operationId=safeKey(foundry.utils.randomID());
  const tick={...plan.tick,operationId,userId:game.user.id,time:Date.now()};
  const afterRecord={...record,ticks:{...record.ticks,[`round${tick.round}`]:tick},status:plan.status};
  const operation={status:"prepared",actorUuid:actor.uuid,effectId:key,round:tick.round,before:effectSnapshot(actor,key),after:{health:plan.after,record:afterRecord},userId:game.user.id,time:Date.now()};
  const flags=structuredClone(actor.flags??{});flags[SYSTEM_ID]??={};flags[SYSTEM_ID].effectOperations??={};flags[SYSTEM_ID].effectOperations[operationId]=operation;
  const expected=effectState({uuid:actor.uuid,system:actor.system,flags});
  await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${operationId}`]:operation});
  await guard(actor,expected,operationId);
  // Um único Actor.update reúne PV, rodada e conclusão; interrupção anterior exige revisão explícita.
  await actor.update({"system.resources.health.value":plan.after,[`flags.${SYSTEM_ID}.persistentEffects.${key}`]:afterRecord,[`flags.${SYSTEM_ID}.effectOperations.${operationId}.status`]:"applied"});return tick;
 });
}
export async function endEffect(actor,key) {
 available(actor);safeKey(key);
 const record=effectRecords(actor)[key];if(!record||record.status!=="active")throw Error("Não há efeito ativo para encerrar.");const baseline=effectState(actor);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Encerrar efeito após revisão"},content:`<p>${escape(record.label)}. Encerrar conserva PV, CE, ações e condições manuais. Não desfaz dano nem resolve rodadas pendentes. Em cópia, encerra somente o registro local.</p><label>Notas (opcional)<textarea name="reason" maxlength="2000"></textarea></label>`,buttons:[{action:"end",label:"Encerrar",callback:(_e,b)=>b.form.elements.reason.value},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
 if(answer===null||answer===undefined)return;
 return runMasterOperation(async()=>{
  optionalNote(answer);await guard(actor,baseline);
  await actor.update({[`flags.${SYSTEM_ID}.persistentEffects.${key}.status`]:"ended",[`flags.${SYSTEM_ID}.persistentEffects.${key}.end`]:{reason:optionalNote(answer),userId:game.user.id,time:Date.now()}});
 });
}
export async function recoverEffect(actor,key) {
 if(actor.flags?.[SYSTEM_ID]?.effectOperations?.[key]?.kind==="sustainPayment")return recoverSustained(actor,key);
 if(actor.flags?.[SYSTEM_ID]?.effectOperations?.[key]?.kind==="controlRetry")return recoverControlRetry(actor,key);
 if(!isPrimaryGM())throw Error("Somente o mestre responsável pode recuperar efeitos.");safeKey(key);
  const operation=actor.flags?.[SYSTEM_ID]?.effectOperations?.[key];if(operation?.status!=="prepared")throw Error("Não há resolução interrompida.");
 const baseline=effectState(actor);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Conferir efeito interrompido"},content:"<p>Conferir os registros anterior/posterior sem gastar ou restaurar PV? Valores divergentes ou registro de outra ficha exigem reparo manual antes de encerrar. Nenhuma rolagem ou rodada será repetida.</p><label>Notas (opcional)<textarea name=\"reason\" maxlength=\"2000\"></textarea></label>",buttons:[{action:"review",label:"Recuperar pelo registro",callback:(_e,b)=>({reason:b.form.elements.reason.value,repaired:false})},{action:"close",label:"Encerrar sem alterar PV",callback:(_e,b)=>({reason:b.form.elements.reason.value,repaired:true})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
 if(!answer)return;
 return runMasterOperation(async()=>{
  optionalNote(answer.reason);
  if(!isPrimaryGM()||!actor.isOwner||effectState(actor)!==baseline)throw Error("Mestre, ficha ou registro mudou.");
  const current=effectSnapshot(actor,operation.effectId),own=operation.actorUuid===actor.uuid;
  const status=own&&actionHash(current)===actionHash(operation.after)?"applied":own&&actionHash(current)===actionHash(operation.before)?"failed":answer.repaired?"reviewed":null;
  if(!status)throw Error("Valores divergentes ou registro de outra ficha. Preserve recursos e faça revisão/reparo manual antes de encerrar.");
  await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${key}.status`]:status,[`flags.${SYSTEM_ID}.effectOperations.${key}.review`]:{reason:optionalNote(answer.reason),userId:game.user.id,time:Date.now()}});
 });
}
