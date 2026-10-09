import {optionalNote} from "./form-values.mjs";
import {SYSTEM_ID} from "./config.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {effectState} from "./effect-rules.mjs";
import {CONDITION_RULES,conditionRecords,conditionDefinition,conditionTotals} from "./condition-rules.mjs";
const escape=value=>String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
function available(actor){if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode conferir condições.");assertNoTechniqueInterruption(actor);if(actor.flags?.[SYSTEM_ID]?.levelOperation?.status==="prepared"||Object.values(actor.flags?.[SYSTEM_ID]?.damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Confira a operação interrompida antes de registrar condições.");}
async function guard(actor,baseline){available(actor);const current=await fromUuid(actor.uuid);available(actor);if(!current||current.uuid!==actor.uuid||effectState(current)!==baseline||effectState(actor)!==baseline)throw Error("Ficha, recursos, condições ou mestre mudou. Abra a revisão novamente.");}
export function conditionSheetContext(actor){return {...conditionTotals(actor.uuid,actor.flags),records:Object.entries(conditionRecords(actor)).map(([id,r])=>({...r,id,active:r.status==="active",canEnd:game.user.isGM&&r.status==="active",foreign:r.actorUuid!==actor.uuid})).toSorted((a,b)=>b.time-a.time)};}
export async function registerCondition(actor){
 available(actor);return runMasterOperation(async()=>{
  available(actor);const baseline=effectState(actor),content=await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/condition-dialog.hbs`,{name:actor.name,rules:Object.entries(CONDITION_RULES).map(([key,r])=>({key,...r}))});await guard(actor,baseline);
  const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Registrar condição assistida"},content,buttons:[{action:"save",label:"Aplicar condição",callback:(_e,b)=>{const f=b.form.elements;return {key:f.key.value,count:Number(f.count.value),origin:f.origin.value,details:f.details.value,until:f.until.value,reason:f.reason.value};}},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
  if(!answer)return;const definition=conditionDefinition(answer);await guard(actor,baseline);
  if(Object.values(conditionRecords(actor)).some(r=>r.actorUuid===actor.uuid&&r.key===definition.key&&r.status==="active"))throw Error("Já existe esta condição assistida. Encerre/revise o registro anterior para alterar a quantidade; não duplicar parcelas.");
  const id=foundry.utils.randomID();if(!/^[a-zA-Z0-9]{1,32}$/.test(id))throw Error("Identificador de condição inválido.");
  const record={...definition,actorUuid:actor.uuid,status:"active",userId:game.user.id,time:Date.now()};await actor.update({[`flags.${SYSTEM_ID}.conditionEffects.${id}`]:record});return {id,...record};
 });
}
export async function endCondition(actor,id){
 available(actor);if(!/^[a-zA-Z0-9]{1,32}$/.test(id??""))throw Error("Registro inválido.");return runMasterOperation(async()=>{
  available(actor);const r=conditionRecords(actor)[id];if(r?.status!=="active")throw Error("Não há condição ativa para encerrar.");const baseline=effectState(actor);
  const reason=await foundry.applications.api.DialogV2.wait({window:{title:"Encerrar condição"},content:`<p>${escape(r.label)}. Encerrar remove somente as parcelas assistidas deste registro. PV, CE, ajustes manuais e caixas de condição permanecem. Em cópia, afeta apenas o registro local.</p><label>Notas (opcional)<textarea name="reason" maxlength="2000"></textarea></label>`,buttons:[{action:"end",label:"Encerrar",callback:(_e,b)=>b.form.elements.reason.value},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
  if(reason===null||reason===undefined)return;optionalNote(reason);await guard(actor,baseline);await actor.update({[`flags.${SYSTEM_ID}.conditionEffects.${id}.status`]:"ended",[`flags.${SYSTEM_ID}.conditionEffects.${id}.end`]:{reason:optionalNote(reason),userId:game.user.id,time:Date.now()}});
 });
}
