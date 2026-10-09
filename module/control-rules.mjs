import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
export const CONTROL_ROUNDS={bronze:2,silver:3,gold:4};
export function controlDuration(technique) {
 if(technique?.effectKind!=="control")return null;
 const base=CONTROL_ROUNDS[technique.classification],manual=technique.controlRounds??0;
 if(!base||!Number.isSafeInteger(manual)||manual<0||manual>500)throw Error("Controle: escolha classe Bronze/Prata/Ouro e duração inteira de 0 a 500.");
 return {version:1,classification:technique.classification,baseRounds:manual||base,mode:manual?"manual":"class",page:"205/207/208/224"};
}
export function controlTimeline() {
 const combat=globalThis.game?.combat;
 return !combat?null:{combatUuid:combat.uuid,started:combat.started,round:combat.round,members:(combat.combatants?.contents??[]).map(m=>({id:m.id,actorUuid:m.actor?.uuid})).toSorted((a,b)=>a.id.localeCompare(b.id))};
}
export function controlStart() {
 const c=controlTimeline();return c?.started&&Number.isSafeInteger(c.round)&&c.round>0?c:null;
}
export function controlResistance(attack,total) {
 const c=attack?.control;
 if(attack?.effectKind!=="control"||!c)return null;
 if(c.version!==1||!CONTROL_ROUNDS[c.classification]||!Number.isSafeInteger(c.baseRounds)||c.baseRounds<1||c.baseRounds>500||!["manual","class"].includes(c.mode)||c.mode==="class"&&c.baseRounds!==CONTROL_ROUNDS[c.classification]||!Number.isFinite(attack.powerCosmic)||!Number.isFinite(total))throw Error("Duração de Controle inválida.");
 const resisted=total>=attack.powerCosmic,double=total<attack.powerCosmic-10;
 return {resisted,baseRounds:c.baseRounds,rounds:resisted?0:c.baseRounds*(double?2:1),doubleDuration:double,classification:c.classification,retryCost:c.classification==="gold"?2:1,page:c.page};
}
export function sameControlAttack(a,b) {
 if(!a||!b)return false;
 return actionHash(a)===actionHash(b);
}
export const hasControlOrigin=(actor,rootId)=>Object.values(actor.flags?.[SYSTEM_ID]?.persistentEffects??{}).some(r=>r.actorUuid===actor.uuid&&r.controlOrigin?.rootMessageId===rootId);
