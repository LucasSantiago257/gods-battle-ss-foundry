// Local encounter/journal validation; no enemy resource or source Item lookup.
import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {sustainPaymentKey,sustainPaymentRecordMath,sustainPaymentPreview,validateSustainPaymentPlan} from "./sustained-payment-rules.mjs";
export const sameSustainPayment=(a,b)=>actionHash(a)===actionHash(b);
const ref=v=>{if(typeof v!=="string"||!v||v.length>256)throw Error("Identidade da recarga inv\u00e1lida.");return v;};
// Called by the coordinator. Owner UI may use stored target references, never enemy flags.
export function ownedSustainParticipants(actor,key){
 const r=sustainPaymentRecordMath(actor,key),combat=(game.combats?.contents??[]).find(c=>c.uuid===r.combatUuid);
 if(!combat?.started||game.combat!==combat||!Number.isSafeInteger(combat.round)||combat.round<1)throw Error("Encontro da recarga indispon\u00edvel.");
 const members=combat.combatants?.contents??[],payer=members.filter(m=>m.actor?.uuid===actor.uuid),targets=members.filter(m=>m.actor?.uuid===r.targetUuid);
 if(payer.length!==1||payer[0].id!==r.combatantId||payer[0].actor!==actor||targets.length!==1||targets[0].id!==r.targetCombatantId||targets[0].actor?.type!=="knight")throw Error("Pagador ou alvo/combatente removido ou substitu\u00eddo.");
 const context={combatUuid:combat.uuid,combatantId:payer[0].id,targetUuid:r.targetUuid,targetCombatantId:targets[0].id,round:combat.round,epoch:ref(combat.flags?.[SYSTEM_ID]?.actionControl?.epoch??"initial")};
 return {combat,target:targets[0].actor,context};
}
export function ownedSustainContext(actor,key){return ownedSustainParticipants(actor,key).context;}
export function ownedSustainPreview(actor,key,options){return sustainPaymentPreview(actor,key,options,ownedSustainContext(actor,key));}
export function validateOwnedSustainJournal(op){
 if(!op||op.kind!=="sustainPaymentOwned"||op.version!==1||!["prepared","applied","reviewed"].includes(op.status)||!["pay","end"].includes(op.action))throw Error("Journal de recarga inv\u00e1lido.");
 sustainPaymentKey(op.id);sustainPaymentKey(op.recordId);ref(op.actorUuid);ref(op.userId);
 if(op.operationId!==op.id||!Number.isFinite(op.time)||op.time<0||op.before?.record?.actorUuid!==op.actorUuid||op.before.record.recordId!==op.recordId||op.after?.record?.actorUuid!==op.actorUuid||op.after.record.recordId!==op.recordId)throw Error("V\u00ednculo do journal de recarga inv\u00e1lido.");
 validateSustainPaymentPlan(op);return op;
}
