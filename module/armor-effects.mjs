import {SYSTEM_ID} from "./config.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {effectRecords,effectSourceState,encounterForEffect} from "./effect-rules.mjs";
import {armorBreakSource,armorBreakDefinition,armorBreakTickPlan,armorBreakState,armorBreakSnapshot,armorBreakAfter,armorBreakRecoveryPlan} from "./armor-effect-rules.mjs";
import {optionalNote} from "./form-values.mjs";
const escape=value=>String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const safeKey=key=>{if(!/^[a-zA-Z0-9]{1,32}$/.test(key??""))throw Error("Registro de armadura inválido.");return key;};
function available(actor,operationId=null){
 if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode acompanhar a armadura.");
 assertNoTechniqueInterruption(actor,{effectOperationId:operationId});
 if(actor.flags?.[SYSTEM_ID]?.levelOperation?.status==="prepared"||Object.values(actor.flags?.[SYSTEM_ID]?.damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Confira a operação interrompida de evolução/dano antes de continuar.");
}
async function guard(actor,baseline,operationId=null,state=armorBreakState){
 available(actor,operationId);const current=await fromUuid(actor.uuid);available(current,operationId);
 if(current.uuid!==actor.uuid||state(current)!==baseline||state(actor)!==baseline)throw Error("Ficha, armadura, registro ou rodada mudou. Atualize a prévia.");
}
// After Item.update, derived PA/capacity may change. Only flags, encounter and Items are
// compared here; no Actor.system field is ever written or restored by this operation.
const stageState=actor=>armorBreakState({uuid:actor.uuid,system:{},flags:actor.flags,items:actor.items});
function withOperation(actor,id,operation){const flags=structuredClone(actor.flags??{});flags[SYSTEM_ID]??={};flags[SYSTEM_ID].effectOperations??={};flags[SYSTEM_ID].effectOperations[id]=operation;return {uuid:actor.uuid,system:actor.system,flags,items:actor.items};}
function sourceItems(){
 const actors=new Map();for(const actor of [...(game.actors?.contents??[]),...(globalThis.canvas?.tokens?.placeables??[]).map(t=>t.actor),...(game.combats?.contents??[]).flatMap(c=>(c.combatants?.contents??[]).map(m=>m.actor))])if(actor?.uuid)actors.set(actor.uuid,actor);
 return [...actors.values()].flatMap(a=>a.items?.contents??[]);
}
export function armorBreakSources(){
 const sources=[];for(const item of sourceItems())try{const source=armorBreakSource(item);sources.push({...source,label:`${item.parent.name} · ${item.name} · ${source.damage} PV de armadura/rodada`,baseline:effectSourceState(item)});}catch{/* Only completed canonical compositions. */}
 return sources.toSorted((a,b)=>a.label.localeCompare(b.label));
}
export function canRegisterArmorBreak(actor){try{available(actor);return sourceItems().some(item=>{try{armorBreakDefinition(actor,item,{rounds:1,firstOffset:0});return !Object.values(effectRecords(actor)).some(r=>r.actorUuid===actor.uuid&&r.status==="active"&&r.kind==="armorBreak"&&r.source?.itemUuid===item.uuid);}catch{return false;}});}catch{return false;}}
export async function registerArmorBreak(actor){
 available(actor);encounterForEffect(actor);const baseline=armorBreakState(actor),sources=armorBreakSources();if(!sources.length)throw Error("Nenhuma técnica personalizada Sustentada com Quebrar Armadura disponível.");
 const armor=(actor.items?.contents??[]).filter(i=>i.type==="armor"&&i.system.equipped&&i.system.state!=="dead"&&Number.isFinite(i.system.health?.value)&&i.system.health.value>=0);if(armor.length!==1)throw Error("Escolha uma única armadura equipada com PV válidos.");
 const content=`<p>${escape(actor.name)} · ${escape(armor[0].name)} · ${armor[0].system.health.value} PV</p><label>Técnica<select name="sourceUuid">${sources.map(s=>`<option value="${escape(s.itemUuid)}">${escape(s.label)}</option>`).join("")}</select></label><label>Rodadas<input name="rounds" type="number" min="1" max="1000" step="1" value="1"></label><label>Primeira parcela<select name="firstOffset"><option value="0">Nesta rodada</option><option value="1" selected>Próxima rodada</option></select></label><label>Notas (opcional)<textarea name="reason" maxlength="2000"></textarea></label>`;
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Quebrar Armadura · Sustentada"},content,buttons:[{action:"save",label:"Registrar parcelas",callback:(_e,b)=>{const f=b.form.elements;return {sourceUuid:f.sourceUuid.value,rounds:Number(f.rounds.value),firstOffset:Number(f.firstOffset.value),reason:f.reason.value};}},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!answer)return;
 return runMasterOperation(async()=>{
  const selected=sources.find(s=>s.itemUuid===answer.sourceUuid);if(!selected)throw Error("Escolha uma técnica da lista.");const item=await fromUuid(selected.itemUuid);if(!item||effectSourceState(item)!==selected.baseline)throw Error("A técnica mudou. Abra o registro novamente.");
  const definition=armorBreakDefinition(actor,item,answer);await guard(actor,baseline);
  if(effectSourceState(item)!==selected.baseline||item.parent.items.get(item.id)!==item)throw Error("A técnica foi alterada ou removida.");
  if(Object.values(effectRecords(actor)).some(r=>r.actorUuid===actor.uuid&&r.status==="active"&&r.kind==="armorBreak"&&r.source?.itemUuid===item.uuid))throw Error("Esta técnica já tem parcelas ativas no alvo.");
  const id=safeKey(foundry.utils.randomID()),record={...definition,id,actorUuid:actor.uuid,status:"active",ticks:{},userId:game.user.id,time:Date.now()};await actor.update({[`flags.${SYSTEM_ID}.persistentEffects.${id}`]:record});return record;
 });
}
export async function resolveArmorBreak(actor,key,{quick=false,expectedRound=null,expectedState=null}={}){
 available(actor);safeKey(key);const record=effectRecords(actor)[key];if(!record)throw Error("Efeito de armadura ausente.");
 const preview=armorBreakTickPlan(actor,record),baseline=armorBreakState(actor);
 if(typeof quick!=="boolean"||quick&&(!Number.isSafeInteger(expectedRound)||expectedRound!==preview.view.nextRound||typeof expectedState!=="string"||expectedState!==baseline))throw Error("A prévia da armadura mudou. Atualize a ficha.");
 const content=`<p>${escape(record.armor.name)} · rodada ${preview.view.nextRound} · ${preview.before} PV atuais</p><label>Dano final à armadura<input name="damage" type="number" min="0" max="1000000" step="any" value="${record.damage}"></label><label><input name="skip" type="checkbox">Dispensar parcela</label><label>Notas (opcional)<textarea name="reason" maxlength="2000"></textarea></label>`;
 const answer=quick?{damage:record.damage,skip:false,reason:""}:await foundry.applications.api.DialogV2.wait({window:{title:"Ajustar parcela da armadura"},content,buttons:[{action:"resolve",label:"Registrar rodada",callback:(_e,b)=>({damage:Number(b.form.elements.damage.value),skip:b.form.elements.skip.checked,reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!answer)return;
 return runMasterOperation(async()=>{
  await guard(actor,baseline);const plan=armorBreakTickPlan(actor,record,answer),id=safeKey(foundry.utils.randomID()),tick={...plan.tick,operationId:id,userId:game.user.id,time:Date.now()},afterRecord={...record,ticks:{...record.ticks,[`round${tick.round}`]:tick},status:plan.status};
  const before=armorBreakSnapshot(actor,key),operation={kind:"armorBreak",status:"prepared",actorUuid:actor.uuid,effectId:key,round:tick.round,before,after:armorBreakAfter(before,afterRecord,plan.after),userId:game.user.id,time:Date.now()};
  const staged=withOperation(actor,id,operation),expected=armorBreakState(staged),expectedItems=staged.items.contents.map(item=>item.id===before.armorId?{id:item.id,uuid:item.uuid,type:item.type,system:operation.after.armorSystem}:item),afterStage=stageState({...staged,items:{contents:expectedItems}});
  await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}`]:operation});await guard(actor,expected,id);
  // Cross-document window: on any failure keep the prepared journal. Never retry or roll back Item.
  if(plan.after!==plan.before)await actor.items.get(before.armorId).update({"system.health.value":plan.after});
  await guard(actor,afterStage,id,stageState);
  await actor.update({[`flags.${SYSTEM_ID}.persistentEffects.${key}`]:afterRecord,[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"applied"});return tick;
 });
}
export async function recoverArmorBreak(actor,key){
 safeKey(key);available(actor,key);const operation=actor.flags?.[SYSTEM_ID]?.effectOperations?.[key];if(operation?.kind!=="armorBreak"||operation.status!=="prepared")throw Error("Nenhuma parcela de armadura interrompida.");
 const baseline=armorBreakState(actor);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Parcela de armadura interrompida"},content:`<p>${escape(operation.before?.record?.armor?.name)} · rodada ${escape(operation.round)}</p><label>Notas (opcional)<textarea name="reason" maxlength="2000"></textarea></label>`,buttons:[{action:"recover",label:"Concluir pelo registro",callback:(_e,b)=>({reason:b.form.elements.reason.value})},{action:"close",label:"Encerrar operação e efeito",callback:(_e,b)=>({reason:b.form.elements.reason.value,close:true})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!answer)return;
 return runMasterOperation(async()=>{
  const reason=optionalNote(answer.reason);await guard(actor,baseline,key);
  if(!answer.close&&operation.actorUuid!==actor.uuid)throw Error("Operação de outra ficha; preserve o registro original.");
  const plan=answer.close?{status:"reviewed"}:armorBreakRecoveryPlan(actor,operation),update={[`flags.${SYSTEM_ID}.effectOperations.${key}.status`]:plan.status,[`flags.${SYSTEM_ID}.effectOperations.${key}.review`]:{reason,userId:game.user.id,time:Date.now()}};
  if(plan.record)update[`flags.${SYSTEM_ID}.persistentEffects.${safeKey(operation.effectId)}`]=plan.record;
  // Closing a divergent journal also ends its own active effect, so the unresolved
  // parcel cannot be applied again from a fresh preview after a manual repair.
  if(answer.close){const record=effectRecords(actor)[operation.effectId];if(record?.actorUuid===actor.uuid&&record.id===operation.effectId&&record.status==="active"){safeKey(operation.effectId);update[`flags.${SYSTEM_ID}.persistentEffects.${operation.effectId}.status`]="ended";update[`flags.${SYSTEM_ID}.persistentEffects.${operation.effectId}.end`]={reason,userId:game.user.id,time:Date.now()};}}
  await actor.update(update);return plan.status;
 });
}
