// Value-only finite encounter records and journals. No document writes.
import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {drainActor,drainTarget,drainSource,drainProfile,drainSourceMath,drainCapturedPlan} from "./drain-rules.mjs";
import {optionalNote} from "./form-values.mjs";
export const drainSame=(a,b)=>actionHash(a)===actionHash(b);
export function drainKey(v){if(typeof v!=="string"||!/^[a-zA-Z0-9]{1,32}$/.test(v))throw Error("Identificador de Dreno inválido.");return v;}
const ref=v=>{if(typeof v!=="string"||!v||v.length>256)throw Error("Vínculo de Dreno inválido.");return v;};
const nat=(v,min=0)=>{if(!Number.isSafeInteger(v)||v<min)throw Error("Parcela/revisão de Dreno inválida.");return v;};
export function drainEncounter(actor,uuid){
 drainActor(actor);const combat=(game.combats?.contents??[]).find(c=>c.uuid===uuid);
 if(!combat?.started||!Number.isSafeInteger(combat.round)||combat.round<1)throw Error("Encontro de Dreno indisponível.");
 const members=(combat.combatants?.contents??[]).filter(m=>m.actor?.uuid===actor.uuid);if(members.length!==1)throw Error("O alvo precisa de um único combatente neste encontro.");
 return {combatUuid:ref(combat.uuid),combatantId:ref(members[0].id),epoch:ref(combat.flags?.[SYSTEM_ID]?.actionControl?.epoch??"initial"),round:combat.round};
}
export function drainRegistrationState(item,actor,combatUuid){return actionHash({source:drainSourceMath(drainSource(item)),target:drainTarget(actor),encounter:drainEncounter(actor,combatUuid)});}
export function validateDrainRecord(record,actorUuid,key=record?.id){
 drainKey(key);drainActor({type:"knight",uuid:actorUuid});
 if(!record||record.kind!=="cosmoDrain"||record.ruleVersion!==1||record.id!==key||record.actorUuid!==actorUuid||!["active","expired","ended"].includes(record.status))throw Error("Registro de Dreno ausente, inválido ou de outra ficha.");
 const source=drainProfile(record.source);if(!drainSame(record.source,source))throw Error("Perfil capturado de Dreno alterado.");
 nat(record.revision);nat(record.firstRound,1);nat(record.lastRound,record.firstRound);if(record.lastRound-record.firstRound>=1000)throw Error("Prazo de Dreno fora do limite técnico.");
 const e=record.encounter;ref(e?.combatUuid);ref(e?.combatantId);ref(e?.epoch);ref(record.userId);optionalNote(record.reason);
 if(!Number.isFinite(record.time)||!Array.isArray(record.resolved)||!Array.isArray(record.history)||record.history.length>1000||record.resolved.length>record.lastRound-record.firstRound+1)throw Error("Histórico de Dreno inválido.");
 const ids=new Set();for(const h of record.history){drainKey(h?.id);if(ids.has(h.id)||!["apply","undo"].includes(h.direction)||!Number.isSafeInteger(h.round)||h.round<record.firstRound||h.round>record.lastRound||!Number.isFinite(h.time))throw Error("Histórico de Dreno inválido.");ids.add(h.id);ref(h.userId);optionalNote(h.reason);}
 for(const [i,t]of record.resolved.entries())if(!t||t.round!==record.firstRound+i||!ids.has(t.operationId)||typeof t.skipped!=="boolean"||![t.current,t.extra,t.removed].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000)||t.current+t.extra!==t.removed||t.skipped&&t.removed!==0)throw Error("Sequência de parcelas de Dreno inválida.");
 if(record.last!==null&&(drainKey(record.last)!==record.resolved.at(-1)?.operationId))throw Error("Última parcela de Dreno inválida.");
 const full=record.resolved.length===record.lastRound-record.firstRound+1;if(record.status==="active"&&full||record.status==="expired"&&!full)throw Error("Prazo/estado de Dreno incompatíveis.");
 return record;
}
export function drainRecord(actor,key){return validateDrainRecord(actor.flags?.[SYSTEM_ID]?.persistentEffects?.[key],actor.uuid,key);}
export function drainRecordMath(r){return {id:r.id,actorUuid:r.actorUuid,source:drainSourceMath(r.source),status:r.status,revision:r.revision,firstRound:r.firstRound,lastRound:r.lastRound,encounter:r.encounter,resolved:r.resolved,last:r.last};}
export function drainRecordState(actor,record){validateDrainRecord(record,actor.uuid);return actionHash({record:drainRecordMath(record),target:drainTarget(actor)});}
export function drainNextRound(record){return record.firstRound+record.resolved.length<=record.lastRound?record.firstRound+record.resolved.length:null;}
export function drainRecordAfter(op){
 drainKey(op.id);const before=validateDrainRecord(op.beforeRecord,op.actorUuid,op.recordId),p=op.plan;
 if(before.status==="ended"||before.history.length>=1000||!Number.isFinite(op.time)||typeof op.skipped!=="boolean"||!drainSame(drainSourceMath(before.source),drainSourceMath(p.source))||p.before.uuid!==op.actorUuid)throw Error("Journal de Dreno incompatível.");
 const after=structuredClone(before);nat(before.revision+1);after.revision++;
 if(op.direction==="apply"){
  if(before.status!=="active"||op.round!==drainNextRound(before)||op.skipped&&p.removed!==0)throw Error("Rodada de Dreno não está pendente.");
  after.resolved.push({round:op.round,operationId:op.id,current:p.allocation.current,extra:p.allocation.extra,removed:p.removed,skipped:op.skipped});after.last=op.id;if(drainNextRound(after)===null)after.status="expired";
 }else if(op.direction==="undo"){
  if(op.skipped||before.last!==op.originalId||before.resolved.at(-1)?.round!==op.round)throw Error("Somente a última parcela intacta pode ser desfeita.");after.resolved.pop();after.last=null;after.status="active";
 }else throw Error("Sentido de Dreno inválido.");
 after.history.push({id:op.id,direction:op.direction,round:op.round,removed:p.removed,userId:ref(op.userId),time:op.time,reason:optionalNote(op.reason)});
 return validateDrainRecord(after,op.actorUuid,op.recordId);
}
export function validateDrainJournal(op,original=null){
 if(!op||op.kind!=="cosmoDrain"||op.ruleVersion!==1||!["prepared","applied","reviewed"].includes(op.status))throw Error("Journal de Dreno inválido.");drainKey(op.id);drainKey(op.recordId);
 const p=op.plan,b=p?.before;if(!b)throw Error("Snapshot de Dreno ausente.");
 const actor={uuid:b.uuid,type:"knight",system:{resources:{cosmo:{value:b.current,unlimited:b.unlimited},cosmoExtra:b.extra,cosmoReserved:b.reserved}}};
 const expected=drainCapturedPlan(p.source,actor,{...p.allocation,reason:p.reason});
 if(!drainSame(expected,p)||!drainSame(drainRecordAfter(op),op.afterRecord))throw Error("Matemática do journal de Dreno alterada.");
 if(op.direction==="undo"){
  validateDrainJournal(original);if(original.status!=="applied"||original.direction!=="apply"||original.id!==op.originalId||original.actorUuid!==op.actorUuid||original.recordId!==op.recordId||!drainSame(original.plan,p)||!drainSame(drainRecordMath(original.afterRecord),drainRecordMath(op.beforeRecord)))throw Error("Journal da parcela a desfazer incompatível.");
 }
 return op;
}
