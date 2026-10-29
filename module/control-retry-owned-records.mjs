// Live context is derived locally, never accepted as a transported document.
import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {encounterForEffect} from "./effect-rules.mjs";
import {controlRetryKey,controlRetryPreview,validateControlRetryPreview,validateControlRetryPlan} from "./control-retry-rules.mjs";
export const sameControlRetry=(a,b)=>actionHash(a)===actionHash(b);
export function ownedControlContext(actor,key){
 const r=actor.flags?.[SYSTEM_ID]?.persistentEffects?.[controlRetryKey(key)],c=encounterForEffect(actor,r?.combatUuid);
 const combat=(game.combats?.contents??[]).find(x=>x.uuid===c.combatUuid),members=(combat?.combatants?.contents??[]).filter(m=>m.actor?.uuid===actor.uuid);
 if(game.combat?.uuid!==c.combatUuid||c.combatantId!==r?.combatantId||members.length!==1||members[0].actor!==actor)throw Error("Encontro, combatente ou identidade de Controle mudou.");
 const epoch=combat.flags?.[SYSTEM_ID]?.actionControl?.epoch??"initial";if(typeof epoch!=="string"||!epoch||epoch.length>256)throw Error("Época da intenção inválida.");
 return {...c,epoch};
}
export function ownedControlPreview(actor,key,options){return controlRetryPreview(actor,key,{...options,resistanceMode:game.settings.get(SYSTEM_ID,"resistanceMode")},ownedControlContext(actor,key));}
export function validateOwnedControlJournal(op){
 if(!op||op.kind!=="controlRetryOwned"||op.version!==1||!["prepared","applied","reviewed"].includes(op.status)||!["rolling","ready"].includes(op.phase))throw Error("Journal de Controle inválido.");
 controlRetryKey(op.id);controlRetryKey(op.recordId);if(typeof op.userId!=="string"||!op.userId||op.userId.length>256||!Number.isFinite(op.time)||op.time<0)throw Error("Autoria temporal de Controle inválida.");
 const p=validateControlRetryPreview(op.preview);
 if(p.before.record.actorUuid!==op.actorUuid||p.before.record.recordId!==op.recordId)throw Error("Journal de outra ficha ou registro.");
 if(op.phase==="rolling"){if(op.status==="applied"||op.plan!==undefined||op.roll!==undefined)throw Error("Dados ausentes ou fase de Controle inválida.");}
 else{
  const plan=validateControlRetryPlan(op.plan);
  if(plan.operationId!==op.id||plan.signature!==p.signature||!sameControlRetry(plan.before,p.before)||!sameControlRetry(plan.options,p.options)||!sameControlRetry(plan.pool,p.pool)||!sameControlRetry(plan.payment,p.payment)||!sameControlRetry(plan.context,p.context))throw Error("Resultado incompatível com a intenção de Controle.");
  if(!op.roll||!Number.isFinite(op.roll.total)||op.roll.total!==plan.result.total)throw Error("Rolagem nativa de Controle incompatível.");
 }
 if(op.published!==undefined&&typeof op.published!=="boolean"||op.messageId!==undefined&&(typeof op.messageId!=="string"||!op.messageId||op.messageId.length>256))throw Error("Publicação de Controle inválida.");
 return op;
}
