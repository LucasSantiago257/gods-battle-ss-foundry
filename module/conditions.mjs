import {optionalNote} from "./form-values.mjs";
import {SYSTEM_ID} from "./config.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {effectState} from "./effect-rules.mjs";
import {actionHash} from "./action-rules.mjs";
import {CONDITION_RULES,conditionRecords,conditionDefinition,conditionTotals,validCondition,conditionNumbers} from "./condition-rules.mjs";
const escape=value=>String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const keyOf=id=>{if(typeof id!=="string"||!/^[a-zA-Z0-9]{1,32}$/.test(id))throw Error("Registro de condição inválido.");return id;};
function available(actor){if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode conferir condições.");assertNoTechniqueInterruption(actor);if(actor.flags?.[SYSTEM_ID]?.levelOperation?.status==="prepared"||Object.values(actor.flags?.[SYSTEM_ID]?.damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Confira a operação interrompida antes de registrar condições.");}
const baselineOf=actor=>({state:effectState(actor),userId:game.user.id});
async function guard(actor,baseline){available(actor);const current=await fromUuid(actor.uuid);available(actor);if(!current||current.type!=="knight"||!current.isOwner||current.uuid!==actor.uuid||effectState(current)!==baseline.state||effectState(actor)!==baseline.state||game.user.id!==baseline.userId)throw Error("Ficha, recursos, condições ou mestre mudou. Abra novamente.");}
function historyOf(r){
 const revision=r.revision??0,history=Object.entries(r.revisions??{}).toSorted(([,a],[,b])=>(a?.revision??0)-(b?.revision??0));
 if(!Number.isSafeInteger(revision)||revision<0||revision>1000||history.length!==revision)throw Error("Histórico de condição inconsistente; preserve o registro e confira manualmente.");
 for(let i=0;i<history.length;i++){
  const [id,h]=history[i];keyOf(id);
  if(!h||h.revision!==i+1||h.before?.key!==r.key||h.after?.key!==r.key||actionHash(conditionDefinition(h.before))!==actionHash(h.before)||actionHash(conditionDefinition(h.after))!==actionHash(h.after)||i&&actionHash(history[i-1][1].after)!==actionHash(h.before))throw Error("Histórico de condição inconsistente; preserve o registro e confira manualmente.");
 }
 if(history.length&&actionHash(history.at(-1)[1].after)!==actionHash(conditionDefinition(r)))throw Error("Condição diverge do último ajuste; preserve o registro e confira manualmente.");
 return revision;
}
function editable(actor,id){
 keyOf(id);const r=conditionRecords(actor)[id];if(!validCondition(actor.uuid,r))throw Error("Escolha uma condição ativa própria e válida.");
 if(Object.values(conditionRecords(actor)).filter(other=>other?.actorUuid===actor.uuid&&other.key===r.key&&other.status==="active").length!==1)throw Error("Há condições duplicadas deste tipo. Encerre os registros excedentes antes de ajustar.");
 const revision=historyOf(r);if(revision>=1000)throw Error("Limite técnico de1000 ajustes neste registro; encerre e registre a continuidade.");return {record:r,revision};
}
export function conditionSheetContext(actor){return {...conditionTotals(actor.uuid,actor.flags),records:Object.entries(conditionRecords(actor)).map(([id,value])=>{const r=value&&typeof value==="object"?value:{};let canEdit=false,editWarning="";try{available(actor);editable(actor,id);canEdit=true;}catch(error){if(isPrimaryGM()&&actor.isOwner&&validCondition(actor.uuid,r))editWarning=error.message;}return {...r,id,active:r.status==="active",canEdit,editWarning,canEnd:game.user.isGM&&r.status==="active",foreign:r.actorUuid!==actor.uuid,hasModifierOverride:r.key==="disoriented"&&r.modifierOverride!==null&&r.modifierOverride!==undefined,revisions:Object.values(r.revisions??{}).filter(h=>h&&typeof h==="object").map(h=>{try{const before=conditionNumbers(h.before.key,h.before.count,h.before.modifierOverride),after=conditionNumbers(h.after.key,h.after.count,h.after.modifierOverride);return {...h,beforeModifier:before.modifier,afterModifier:after.modifier,beforeDice:before.dice,afterDice:after.dice};}catch{return {...h};}}).toSorted((a,b)=>a.revision-b.revision)};}).toSorted((a,b)=>b.time-a.time)};}
async function decision(actor,baseline,record=null){
 const context={name:actor.name,editing:!!record,showModifier:!record||record.key==="disoriented",maxCount:record?CONDITION_RULES[record.key].maxCount:1000,...(record?conditionDefinition(record):{count:1}),rules:Object.entries(CONDITION_RULES).map(([key,r])=>({key,...r}))};
 const content=await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/condition-dialog.hbs`,context);await guard(actor,baseline);
 return foundry.applications.api.DialogV2.wait({window:{title:record?"Ajustar condição assistida":"Registrar condição assistida"},content,buttons:[{action:"save",label:record?"Salvar ajuste":"Aplicar condição",callback:(_e,b)=>{const f=b.form.elements,value=f.modifierOverride?.value??"";return {key:f.key.value,count:Number(f.count.value),modifierOverride:value.trim()===""?null:Number(value),origin:f.origin.value,details:f.details.value,until:f.until.value,reason:f.reason.value};}},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
}
export async function registerCondition(actor){
 available(actor);const baseline=baselineOf(actor),answer=await decision(actor,baseline);if(!answer)return;
 return runMasterOperation(async()=>{
  const definition=conditionDefinition(answer);await guard(actor,baseline);
  if(Object.values(conditionRecords(actor)).some(r=>r?.actorUuid===actor.uuid&&r.key===definition.key&&r.status==="active"))throw Error("Já existe esta condição assistida. Use Ajustar condição para mudar a quantidade; não duplicar parcelas.");
  const id=keyOf(foundry.utils.randomID());if(conditionRecords(actor)[id])throw Error("Identificador de condição existente.");
  const record={...definition,actorUuid:actor.uuid,status:"active",userId:game.user.id,time:Date.now()};await actor.update({[`flags.${SYSTEM_ID}.conditionEffects.${id}`]:record});return {id,...record};
 });
}
export async function editCondition(actor,id){
 available(actor);const preview=editable(actor,id),baseline=baselineOf(actor),answer=await decision(actor,baseline,preview.record);if(!answer)return;
 return runMasterOperation(async()=>{
  const after=conditionDefinition(answer);await guard(actor,baseline);const {record,revision}=editable(actor,id);
  if(after.key!==record.key)throw Error("O tipo desta condição não pode ser trocado no ajuste.");
  const before=conditionDefinition(record);if(actionHash(before)===actionHash(after))return record;
  const operationId=keyOf(foundry.utils.randomID());if(record.revisions?.[operationId])throw Error("Identificador de ajuste existente.");
  const entry={revision:revision+1,before,after,userId:game.user.id,time:Date.now()};
  const updated={...record,...after,revision:revision+1,revisions:{...record.revisions,[operationId]:entry}};
  await actor.update({[`flags.${SYSTEM_ID}.conditionEffects.${id}`]:updated});return updated;
 });
}
export async function endCondition(actor,id){
 available(actor);keyOf(id);
 const r=conditionRecords(actor)[id];if(r?.status!=="active")throw Error("Não há condição ativa para encerrar.");const baseline=baselineOf(actor);
 const reason=await foundry.applications.api.DialogV2.wait({window:{title:"Encerrar condição"},content:`<p>${escape(r.label)}. Encerrar remove as parcelas deste registro e conserva recursos e ajustes manuais.</p><label>Notas (opcional)<textarea name="reason" maxlength="2000"></textarea></label>`,buttons:[{action:"end",label:"Encerrar",callback:(_e,b)=>b.form.elements.reason.value},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
 if(reason===null||reason===undefined)return;
 return runMasterOperation(async()=>{
  optionalNote(reason);await guard(actor,baseline);await actor.update({[`flags.${SYSTEM_ID}.conditionEffects.${id}.status`]:"ended",[`flags.${SYSTEM_ID}.conditionEffects.${id}.end`]:{reason:optionalNote(reason),userId:game.user.id,time:Date.now()}});
 });
}
