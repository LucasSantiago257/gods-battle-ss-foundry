// Value-only validation of local Brasas journals. Never execute received patches.
import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {encounterForEffect} from "./effect-rules.mjs";
import {brasasKey,brasasSnapshot,brasasUndoPlan,brasasEndPlan,validateBrasasApplyReceipt} from "./brasas-rules.mjs";
import {optionalNote} from "./form-values.mjs";
export const brasasSame=(a,b)=>actionHash(a)===actionHash(b);
const ref=v=>{if(typeof v!=="string"||!v||v.length>256)throw Error("Identidade do journal de Brasas inválida.");return v;};
export function brasasEncounter(actor,key){
 const r=actor.flags?.[SYSTEM_ID]?.persistentEffects?.[brasasKey(key)],e=encounterForEffect(actor,r?.combatUuid);
 const combat=(game.combats?.contents??[]).find(c=>c.uuid===e.combatUuid),members=(combat?.combatants?.contents??[]).filter(m=>m.actor?.uuid===actor.uuid);
 if(r?.combatantId!==e.combatantId||members.length!==1||members[0].actor!==actor)throw Error("Encontro, combatente ou identidade de Brasas mudou.");
 return {...e,epoch:ref(combat.flags?.[SYSTEM_ID]?.actionControl?.epoch??"initial")};
}
export function brasasApplicationState(actor,key){return actionHash({snapshot:brasasSnapshot(actor,key),encounter:brasasEncounter(actor,key)});}
function snapshotActor(s){
 const m=s?.record;if(!m)throw Error("Snapshot de Brasas ausente.");brasasKey(m.recordId);
 const ticks=Object.fromEntries((m.ticks??[]).map(t=>[`round${t.round}`,{...structuredClone(t),...(t.operationId===null?{operationId:undefined}:{})}]));
 const r={kind:"brasas",id:m.recordId,actorUuid:m.actorUuid,status:m.status,combatUuid:m.combatUuid,combatantId:m.combatantId,firstRound:m.firstRound,lastRound:m.lastRound,damage:m.damage,source:structuredClone(m.source),ticks,...(m.lastOperation===null?{}:{brasasLastOperation:structuredClone(m.lastOperation)}),...(m.registration?.time===null?{}:{time:m.registration?.time}),...(m.registration?.userId===null?{}:{userId:m.registration?.userId})};
 const actor={uuid:m.actorUuid,type:"knight",system:{resources:{health:{value:s.health}}},flags:{[SYSTEM_ID]:{persistentEffects:{[m.recordId]:r}}}};
 if(!brasasSame(brasasSnapshot(actor,m.recordId),s))throw Error("Snapshot financeiro de Brasas inválido.");
 return actor;
}
export function validateBrasasJournal(op,original=null){
 if(!op||op.kind!=="brasasParcel"||op.version!==1||!["prepared","applied","reviewed"].includes(op.status)||!["apply","undo","end"].includes(op.action))throw Error("Journal de Brasas inválido.");
 brasasKey(op.id);brasasKey(op.recordId);if(op.operationId!==op.id)throw Error("Intenção de Brasas incompatível.");ref(op.actorUuid);ref(op.userId);
 if(!Number.isFinite(op.time)||op.time<0||op.before?.record?.actorUuid!==op.actorUuid||op.before.record.recordId!==op.recordId||op.after?.record?.actorUuid!==op.actorUuid||op.after.record.recordId!==op.recordId||op.baseline!==actionHash(op.before))throw Error("Vínculo ou snapshot do journal de Brasas inválido.");
 const before=snapshotActor(op.before);snapshotActor(op.after);
 if(op.action==="apply"){
  validateBrasasApplyReceipt({...op,status:"applied"},before,op.recordId);
  const e=op.context;if(!e||e.combatUuid!==op.before.record.combatUuid||e.combatantId!==op.before.record.combatantId||!Number.isSafeInteger(e.round)||e.round<op.tick.round)throw Error("Prazo do journal de Brasas inválido.");
  ref(e.epoch);optionalNote(op.tick.reason);
 }else if(op.action==="undo"){
  validateBrasasJournal(original);if(original.action!=="apply"||original.status!=="applied"||original.id!==op.originalId||original.actorUuid!==op.actorUuid||original.recordId!==op.recordId)throw Error("Journal da parcela original incompatível.");
  const expected=brasasUndoPlan(before,op.recordId,original,{operationId:op.id,reason:op.reason});
  if(!brasasSame(expected.after,op.after)||expected.round!==op.round||op.context!==null)throw Error("Inversão de Brasas alterada.");
 }else{
  const expected=brasasEndPlan(before,op.recordId,{operationId:op.id,reason:op.reason});
  if(!brasasSame(expected.after,op.after)||op.context!==null)throw Error("Encerramento de Brasas alterado.");
 }
 return op;
}
