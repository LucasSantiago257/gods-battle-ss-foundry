import {SYSTEM_ID,NATURES,ATTRIBUTES} from "./config.mjs";
import {componentUuid,PRIMORDIALS} from "./technique-builder-rules.mjs";
import {conditionPool,conditionSummary} from "./condition-rules.mjs";
import {optionalNote} from "./form-values.mjs";
const f=doc=>doc?.flags?.[SYSTEM_ID]??{};
export function residualSource(actor,item){
 const saved=f(item).techniqueConstructionHistory?.[f(item).techniqueConstructionId];
 const canonical=saved?.primary?.uuid===componentUuid(PRIMORDIALS.residual.id)&&Array.isArray(saved.components)&&!saved.components.some(c=>c.key?.startsWith("bigbang:primordial:"));
 if(item?.type!=="technique"||item.parent?.uuid!==actor.uuid||!item.isOwner||f(item).techniqueDraft||!NATURES[item.system?.nature]||!item.system?.classification||item.system.effectKind!=="residual"&&!(item.system.effectKind==="manual"&&canonical))throw Error("Escolha uma técnica própria com primordial Cosmo Residual; composições mistas continuam manuais.");
 if(saved?.components?.some(c=>c.key?.startsWith("bigbang:primordial:")))throw Error("Primordiais mistos exigem resolução específica.");
 return {actorUuid:actor.uuid,itemUuid:item.uuid,name:item.name,nature:item.system.nature,classification:item.system.classification};
}
export function residualInitial(actor,source,target,key,context,participant){
 const record=f(target).persistentEffects?.[key];
 if(target?.type!=="knight"||target.uuid===actor.uuid||!target.isOwner||record?.actorUuid!==target.uuid||record.status!=="active"||record.kind!=="manual"||record.damage!==0||record.combatUuid!==context.combatUuid||record.combatantId!==participant.combatantId||!Number.isSafeInteger(record.firstRound)||!Number.isSafeInteger(record.lastRound)||record.firstRound<1||record.lastRound<record.firstRound||record.lastRound-record.firstRound>=1000||context.round<record.firstRound||context.round>Math.max(record.lastRound,record.firstRound+1))throw Error("Escolha um efeito manual/Controle ativo no alvo, durante a duração inicial ou no turno seguinte à ativação.");
 const origin=record.controlOrigin?.itemUuid??record.source?.itemUuid;
 if(origin&&origin!==source.itemUuid)throw Error("A técnica não corresponde à origem do efeito escolhido.");
 const prior=Object.values(f(actor).persistentEffects??{}).filter(r=>r.actorUuid===actor.uuid&&r.kind==="residual"&&r.source?.itemUuid===source.itemUuid&&r.residual?.targetUuid===target.uuid&&r.residual?.initialEffectId===key);
 if(prior.some(r=>r.status==="active"||r.combatUuid===context.combatUuid&&r.firstRound>=context.round))throw Error("Residual ativo ou tentativa já registrada nesta rodada; consulte o histórico. Retrocesso não repete o teste.");
 if(Object.values(f(actor).effectOperations??{}).some(r=>r.kind==="residualDeposit"&&r.actorUuid===actor.uuid&&r.status==="applied"&&!r.published))throw Error("Publique o resultado pendente antes de outro Residual.");
 return record;
}
export function residualPool(system,nature,bonus){
 const skill=system.skills.asterism,attribute=skill.associated||NATURES[nature]?.key;
 if(!Object.hasOwn(ATTRIBUTES,attribute)||!Number.isFinite(bonus)||Math.abs(bonus)>10000||!Number.isSafeInteger(skill.value)||skill.value<0)throw Error("Confira natureza, Asterismo e bônus adicional.");
 const penalty=system.combat.asterismPenalty??0;
 if(!Number.isFinite(penalty)||Math.abs(penalty)>10000)throw Error("Penalidade de Asterismo inválida.");
 const base=skill.value>0?skill.mod+system.attributes[attribute].mod+skill.bonus+(skill.effectBonus??0):0;
 const pool=conditionPool(system,Math.max(1,Math.min(5,skill.value)),base+penalty+bonus,{maxDice:5});
 if(!Number.isSafeInteger(pool.dice)||pool.dice<1||pool.dice>5||!Number.isFinite(pool.modifier)||Math.abs(pool.modifier)>1000000)throw Error("Parada de Asterismo inválida.");
 return {...pool,attribute,attributeLabel:ATTRIBUTES[attribute],base,penalty,bonus,conditionSummary:conditionSummary(system)};
}
export function residualParameters(system,nature,answer){
 if(!Number.isFinite(answer?.difficulty)||answer.difficulty<0||answer.difficulty>1000000||!Number.isFinite(answer?.powerCosmic)||answer.powerCosmic<0||answer.powerCosmic>1000000)throw Error("Informe dificuldade do segundo Asterismo e Poder Cósmico final entre0 e1000000.");
 return {difficulty:answer.difficulty,powerCosmic:answer.powerCosmic,reason:optionalNote(answer.reason),pool:residualPool(system,nature,answer.bonus)};
}
export function residualOutcome(total,difficulty,powerCosmic){
 if(![total,difficulty,powerCosmic].every(Number.isFinite)||Math.abs(total)>2000000||difficulty<0||difficulty>1000000||powerCosmic<0||powerCosmic>1000000)throw Error("Resultado de Residual inválido.");
 const success=total>=difficulty,excess=success?total-difficulty:0,value=success?powerCosmic+excess:null;
 if(value!==null&&value>2000000)throw Error("Valor de Residual fora do limite.");
 return {success,excess,value,penalty:total<difficulty-10?-10:0};
}
