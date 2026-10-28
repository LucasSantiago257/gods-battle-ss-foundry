// Brasas225: reuse the published finite loss plan; no attacker lookup or new condition.
// These plans do not authorize requests. Runtime must fetch its own journal and real target.
import {actionHash} from "./action-rules.mjs";
import {BRASAS,effectRecords,effectTickPlan,nextEffectRound} from "./effect-rules.mjs";
import {componentUuid} from "./technique-builder-rules.mjs";
import {optionalNote} from "./form-values.mjs";
const copy=structuredClone;
export function brasasKey(value){if(typeof value!=="string"||!/^[a-zA-Z0-9]{1,32}$/.test(value))throw Error("Identidade de Brasas inválida.");return value;}
function identity(value,label){if(typeof value!=="string"||!value||value.length>256)throw Error(`${label} inválida.`);return value;}
function health(value){if(!Number.isFinite(value))throw Error("PV de Brasas inválidos.");return value;}
function ownRecord(actor,key){
 brasasKey(key);
 if(actor?.type!=="knight"||typeof actor.uuid!=="string"||!/^(Actor\.|Scene\.)/.test(actor.uuid))throw Error("Escolha uma ficha ou token próprio.");
 const record=effectRecords(actor)[key];
 if(record?.kind!=="brasas"||record.id!==key||record.actorUuid!==actor.uuid)throw Error("Registro de Brasas ausente ou de outra ficha.");
 return record;
}
function tickMath(tick,round,record){
 if(!tick||tick.round!==round||!["applied","skipped"].includes(tick.status)||tick.baseDamage!==record.damage||!Number.isFinite(tick.damage)||tick.damage<0||tick.damage>1000000||tick.status==="skipped"&&tick.damage!==0||health(tick.after)!==health(tick.before)-tick.damage)throw Error("Histórico financeiro de Brasas inválido.");
 const operationId=tick.operationId===undefined?null:brasasKey(tick.operationId);
 return {round,status:tick.status,baseDamage:tick.baseDamage,damage:tick.damage,before:tick.before,after:tick.after,operationId};
}
// Deliberately excludes labels, descriptions, source names, notes and unrelated resources.
export function brasasRecordMath(actor,key){
 const r=ownRecord(actor,key),s=r.source;
 if(!s||!Object.hasOwn(BRASAS.damage,s.classification)||r.damage!==BRASAS.damage[s.classification]||s.damage!==r.damage||s.componentUuid!==componentUuid(BRASAS.id))throw Error("Perfil capturado de Brasas inválido.");
 identity(s.actorUuid,"Origem");identity(s.itemUuid,"Técnica");
 if(!/^(Actor\.|Scene\.)/.test(s.actorUuid)||s.constructionId!==undefined&&s.constructionId!==null&&(typeof s.constructionId!=="string"||!s.constructionId||s.constructionId.length>256))throw Error("Origem capturada de Brasas inválida.");
 if(!s.itemUuid.startsWith(`${s.actorUuid}.Item.`)||!s.itemUuid.slice(`${s.actorUuid}.Item.`.length)||s.itemUuid.slice(`${s.actorUuid}.Item.`.length).includes("."))throw Error("Identidade da fonte de Brasas inválida.");
 if(!["active","expired","ended"].includes(r.status))throw Error("Estado de Brasas inválido.");
 nextEffectRound(r);
 if(!r.ticks||typeof r.ticks!=="object"||Array.isArray(r.ticks))throw Error("Histórico de Brasas inválido.");
 const ticks=[];let gap=false;
 for(let round=r.firstRound;round<=r.lastRound;round++){
  const t=r.ticks[`round${round}`];if(t===undefined){gap=true;continue;}
  if(gap)throw Error("Parcelas de Brasas fora de sequência.");
  ticks.push(tickMath(t,round,r));
 }
 if(Object.keys(r.ticks).length!==ticks.length)throw Error("Parcela fora do prazo de Brasas.");
 if(r.status==="expired"&&ticks.length!==r.lastRound-r.firstRound+1||r.status==="active"&&ticks.length===r.lastRound-r.firstRound+1)throw Error("Conclusão de Brasas incompatível com o prazo.");
 const marker=r.brasasLastOperation;
 const lastOperation=marker===undefined?null:{id:brasasKey(marker?.id),action:marker?.action};
 if(lastOperation&&(!["apply","undo","end"].includes(lastOperation.action)||lastOperation.action==="end"&&r.status!=="ended"||lastOperation.action==="apply"&&ticks.at(-1)?.operationId!==lastOperation.id))throw Error("Última operação de Brasas inválida.");
 if(r.time!==undefined&&(!Number.isFinite(r.time)||r.time<0)||r.userId!==undefined&&(typeof r.userId!=="string"||!r.userId||r.userId.length>256))throw Error("Origem temporal de Brasas inválida.");
 return {registration:{time:r.time??null,userId:r.userId??null},actorUuid:actor.uuid,recordId:key,status:r.status,combatUuid:identity(r.combatUuid,"Encontro"),combatantId:identity(r.combatantId,"Combatente"),firstRound:r.firstRound,lastRound:r.lastRound,damage:r.damage,source:{actorUuid:s.actorUuid,itemUuid:s.itemUuid,componentUuid:s.componentUuid,classification:s.classification,damage:s.damage,constructionId:s.constructionId??null},ticks,lastOperation};
}
export function brasasSnapshot(actor,key){return {health:health(actor.system?.resources?.health?.value),record:brasasRecordMath(actor,key)};}
export function brasasState(actor,key){return actionHash(brasasSnapshot(actor,key));}
export function brasasParcelPlan(actor,key,{operationId,...options}={}){
 brasasKey(operationId);
 const before=brasasSnapshot(actor,key),r=ownRecord(actor,key),p=effectTickPlan(actor,r,options);
 const tick={...p.tick,operationId},after={health:health(p.after),record:{...copy(before.record),status:p.status,ticks:[...copy(before.record.ticks),tickMath(tick,tick.round,r)],lastOperation:{id:operationId,action:"apply"}}};
 return {kind:"brasasParcel",version:1,action:"apply",operationId,before,after,tick,context:copy(p.view.context),baseline:actionHash(before)};
}
export function validateBrasasApplyReceipt(receipt,actor,key){
 if(receipt?.kind!=="brasasParcel"||receipt.version!==1||receipt.action!=="apply"||receipt.status!=="applied")throw Error("Não há parcela de Brasas aplicada para desfazer.");
 brasasKey(receipt.operationId);
 const b=receipt.before,a=receipt.after;
 if(b?.record?.actorUuid!==actor.uuid||b.record.recordId!==key||b.record.status!=="active"||a?.record?.actorUuid!==actor.uuid||a.record.recordId!==key||!Array.isArray(b.record.ticks)||!Array.isArray(a.record.ticks))throw Error("Recibo de outra ficha ou registro.");
 const round=b.record.firstRound+b.record.ticks.length,t=tickMath(receipt.tick,round,b.record);
 if(t.operationId!==receipt.operationId||round>b.record.lastRound||t.before!==b.health||t.after!==a.health)throw Error("Parcela do recibo inválida.");
 const expected={health:health(b.health)-t.damage,record:{...copy(b.record),status:round===b.record.lastRound?"expired":"active",ticks:[...copy(b.record.ticks),t],lastOperation:{id:receipt.operationId,action:"apply"}}};
 if(actionHash(a)!==actionHash(expected))throw Error("Recibo financeiro de Brasas inconsistente.");
 return {before:b,after:a};
}
// Call only with a receipt retrieved from the target Actor, never a transported receipt.
export function brasasUndoPlan(actor,key,receipt,{operationId,reason}={}){
 brasasKey(operationId);const current=brasasSnapshot(actor,key),original=validateBrasasApplyReceipt(receipt,actor,key);
 if(operationId===receipt.operationId||actionHash(current)!==actionHash(original.after)||current.record.lastOperation?.id!==receipt.operationId||current.record.lastOperation?.action!=="apply")throw Error("Somente a última parcela intacta de Brasas pode ser desfeita.");
 const after={health:original.before.health,record:{...copy(original.before.record),lastOperation:{id:operationId,action:"undo"}}};
 return {kind:"brasasParcel",version:1,action:"undo",operationId,originalId:receipt.operationId,before:current,after,round:receipt.tick.round,reason:optionalNote(reason),baseline:actionHash(current)};
}
export function brasasEndPlan(actor,key,{operationId,reason}={}){
 brasasKey(operationId);const before=brasasSnapshot(actor,key);
 if(before.record.status==="ended")throw Error("Brasas já encerradas.");
 return {kind:"brasasParcel",version:1,action:"end",operationId,before,after:{health:before.health,record:{...copy(before.record),status:"ended",lastOperation:{id:operationId,action:"end"}}},reason:optionalNote(reason),baseline:actionHash(before)};
}
