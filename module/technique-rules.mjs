import {controlDuration,controlResistance} from "./control-rules.mjs";
import {NATURES, ATTRIBUTES} from "./config.mjs";
import {testParameters, classify} from "./rules.mjs";
import {componentOptions} from "./technique-components.mjs";
import {conditionPool,conditionSummary} from "./condition-rules.mjs";

export const EFFECT_KINDS = {damage: "Dano", control: "Controle", sustained: "Sustentada", manual: "Especial / aplicação manual"};
export const TECHNIQUE_MODES={manual:"Parâmetros manuais da cópia",status:"ND e Poder pelo status do usuário (p.201)"};
export const TECHNIQUE_TIERS={bronze:{cost:2,damageLevel:2,power:10,range:3},silver:{cost:3,damageLevel:3,power:15,range:4.5},gold:{cost:4,damageLevel:4,power:20,range:6}};
export function effectiveTechnique(system,technique) {
  const mode=technique.techniqueMode??"manual";
  if(!TECHNIQUE_MODES[mode])throw Error("Modo de cálculo da técnica inválido.");
  if(mode==="manual")return {...technique};
  const tier=TECHNIQUE_TIERS[system?.profile.status];
  if(!tier)throw Error("Este status exige ND e Poder manuais; a tabela automática cobre Bronze, Prata e Ouro.");
  return {...technique,damageLevel:tier.damageLevel,power:tier.power};
}
export function techniqueReadiness(item) {
  if(item?.flags?.["gods-battle-ss"]?.techniqueDraft)return "Conclua ou descarte o rascunho de composição antes de ativar esta técnica.";
  const reference = item?.flags?.["gods-battle-ss"]?.source?.reference, s = item?.system;
  if (reference?.manualOnly) return "Técnica cooperativa ou especial: aplique os testes e efeitos manualmente conforme a descrição.";
  if (!reference?.reviewRequired) return s?.effectKind === "manual" ? "Esta técnica usa aplicação manual." : null;
  if (!NATURES[s.nature]) return "Selecione a natureza desta cópia antes de ativar.";
  if (!EFFECT_KINDS[s.effectKind] || s.effectKind === "manual") return "Configure um efeito compatível ou aplique esta técnica manualmente.";
  if (!Number.isSafeInteger(s.cost) || s.cost < 1) return "Configure o custo total da técnica; 0 indica custo pendente no catálogo.";
  if(s.techniqueMode==="status"&&item.parent?.type==="knight"&&!TECHNIQUE_TIERS[item.parent.system.profile.status])return "Este status exige ND e Poder manuais; abra a cópia para conferir.";
  if (s.effectKind === "damage" && s.techniqueMode!=="status" && (!Number.isSafeInteger(s.power) || s.power < 1 || !Number.isSafeInteger(s.damageLevel) || s.damageLevel < 1)) return "Configure Poder e Nível de Dano antes de ativar.";
  return null;
}
const integer = (value, label, min = 0) => {
  if (!Number.isSafeInteger(value) || value < min) throw Error(`${label}: informe um número inteiro válido.`);
  return value;
};
export function techniqueParameters(system, technique, options = {}) {
  technique=effectiveTechnique(system,technique);
  const nature = NATURES[technique.nature];
  if (!nature) throw Error("Natureza da técnica inválida.");
  const extra = integer(options.extra ?? 0, "CE adicional");
  const elevate = integer(options.elevate ?? 0, "Elevar Cosmo");
  const condense=integer(options.condense??0,"Condensar");
  const advantage = options.advantage ?? 0, bonus = options.bonus ?? 0;
  if (![-1, 0, 1].includes(advantage) || !Number.isFinite(bonus)) throw Error("Modificadores inválidos.");
  const effectKind = technique.effectKind ?? "damage";
  if (!EFFECT_KINDS[effectKind] || effectKind === "manual") throw Error("Big Bang primordial inválido ou de aplicação manual.");
  const components=componentOptions(technique,options);
  const cost = integer(integer(technique.cost, "Custo") + integer(technique.costExtra, "CE fixa adicional") + extra + elevate + condense + components.extraCost, "Custo total");
  const skill = system.skills.asterism;
  // p. 193/198: Asterismo acompanha a natureza da técnica usada, com ajuste manual preservado.
  const attribute = skill.associated || nature.key;
  if (!ATTRIBUTES[attribute]) throw Error("Atributo de Asterismo inválido.");
  const base = testParameters(system, "skill", "asterism","rank",{conditions:false});
  const trained = skill.value > 0;
  const modifier = (trained ? skill.mod + system.attributes[attribute].mod + skill.bonus + (skill.effectBonus ?? 0) : 0)
    + (system.combat.asterismPenalty ?? 0) + bonus + advantage * 2;
  const pool=conditionPool(system,Math.max(1,base.dice+advantage),modifier,{maxDice:5});
  return {cost, difficulty: 10 + cost, control:controlDuration(technique),components,attribute, attributeLabel: ATTRIBUTES[attribute],conditionSummary:conditionSummary(system),
    dice: pool.dice, modifier:pool.modifier, elevate, condense, effectKind, baseDamageLevel:technique.damageLevel,power:technique.power,
    powerCosmic: system.combat.cosmicPower + (effectKind === "damage" ? 0 : elevate)};
}
export function cosmoPayment(system, cost, {useExtra = true, allowOverload = false} = {}) {
  integer(cost, "Custo");
  if (system.resources.cosmo.unlimited) return {updates: {}, cost, fromExtra: 0, fromCurrent: 0, overload: 0, lifeDamage: 0, unlimited: true};
  const current = integer(system.resources.cosmo.value, "CE atual");
  const reserve = integer(system.resources.cosmoReserved, "CE reservada");
  const extra = integer(system.resources.cosmoExtra, "CE extra");
  const fromExtra = useExtra ? Math.min(extra, cost) : 0;
  const fromCurrent = Math.min(Math.max(0, current - reserve), cost - fromExtra);
  const overload = cost - fromExtra - fromCurrent;
  if (overload && !allowOverload) throw Error("CE disponível insuficiente. Carregue Cosmo ou autorize ultrapassar o limite do corpo.");
  const accumulated = integer(system.resources.cosmoOverload, "CE acima do limite") + overload;
  // p. 447: cada nova queima acima do limite cobra nível × excesso acumulado.
  const lifeDamage = overload ? integer(system.profile.level, "Nível", 1) * accumulated : 0;
  const updates = {"system.resources.cosmo.value": current - fromCurrent,
    "system.resources.cosmoExtra": extra - fromExtra, "system.resources.cosmoOverload": accumulated};
  if (lifeDamage) updates["system.resources.health.value"] = system.resources.health.value - lifeDamage;
  return {updates, cost, fromExtra, fromCurrent, overload, lifeDamage, unlimited: false};
}
export function techniqueOutcome(system, technique, parameters, total) {
  technique=effectiveTechnique(system,technique);
  const outcome = classify(total, parameters.difficulty);
  const success = total >= parameters.difficulty;
  const critical = total > parameters.difficulty + 10;
  const damageLevel = parameters.effectKind === "damage" ? integer(technique.damageLevel, "Nível de Dano", 1) + parameters.elevate + (parameters.components?.levelBonus??0) + (system.automation?.techniqueND ?? 0) + (critical ? 1 : 0) : 0;
  const damage = parameters.effectKind === "damage"
    ? Math.max(0, damageLevel * integer(technique.power, "Nível de Poder") + system.profile.level + system.combat.damageBonus + (system.combat.techniqueDamageBonus ?? 0)) : 0;
  const armorDamage = parameters.effectKind !== "damage" ? 0 : damageLevel > 20 ? 100 : damageLevel > 10 ? 70
    : ({bronze: 10, silver: 20, gold: 30}[technique.classification] ?? 0);
  return {outcome, success, critical, damageLevel, damage: success ? damage : 0, armorDamage: success ? armorDamage : 0,
    nextPenalty: total < parameters.difficulty - 10 ? -10 : 0};
}
export function activationPreview(system,technique,options={}) {
 const parameters=techniqueParameters(system,technique,options),normal=techniqueOutcome(system,technique,parameters,parameters.difficulty),critical=techniqueOutcome(system,technique,parameters,parameters.difficulty+11);
 let payment,error="";try{payment=cosmoPayment(system,parameters.cost,options);}catch(e){error=e.message;}
 return {parameters,normal,critical,payment,error,formula:parameters.effectKind==="damage"?`${normal.damageLevel} ND × ${parameters.power} + nível ${system.profile.level} + bônus ${system.combat.damageBonus+(system.combat.techniqueDamageBonus??0)}`:"Efeito de controle/sustentação; sem dano genérico."};
}
export function resistancePreview(system, items, attack, total, difficulty = attack.powerCosmic) {
  const outcome = classify(total, difficulty);
  const control=controlResistance(attack,total);
  if(attack.effectKind&&attack.effectKind!=="damage")return {application:attack.effectKind,outcome,effectsResisted:total>=difficulty,doubleDuration:total<difficulty-10,control,isSustained:attack.effectKind==="sustained",manualEffect:!control?(EFFECT_KINDS[attack.effectKind]??"Efeito especial"):null};
  const armor = items.find(i => i.type === "armor" && i.system.equipped && i.system.health.value >= 0 && i.system.state !== "dead");
  const multiplier = total > difficulty + 10 ? 0 : total >= difficulty ? 0.5 : total < difficulty - 10 ? 2 : 1;
  return {application:"damage",control,outcome, damage: attack.damage * multiplier * (armor ? 1 : 2),
    armorDamage: armor && total < difficulty ? attack.armorDamage : 0,
    unarmored: !armor, effectsResisted: total >= difficulty, doubleDuration: total < difficulty - 10};
}
