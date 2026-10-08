import {NATURES, ATTRIBUTES} from "./config.mjs";
import {testParameters, classify} from "./rules.mjs";

export const EFFECT_KINDS = {damage: "Dano", control: "Controle", sustained: "Sustentada"};
const integer = (value, label, min = 0) => {
  if (!Number.isSafeInteger(value) || value < min) throw Error(`${label}: informe um número inteiro válido.`);
  return value;
};
export function techniqueParameters(system, technique, options = {}) {
  const nature = NATURES[technique.nature];
  if (!nature) throw Error("Natureza da técnica inválida.");
  const extra = integer(options.extra ?? 0, "CE adicional");
  const elevate = integer(options.elevate ?? 0, "Elevar Cosmo");
  const advantage = options.advantage ?? 0, bonus = options.bonus ?? 0;
  if (![-1, 0, 1].includes(advantage) || !Number.isFinite(bonus)) throw Error("Modificadores inválidos.");
  const effectKind = technique.effectKind ?? "damage";
  if (!EFFECT_KINDS[effectKind]) throw Error("Big Bang primordial inválido.");
  const cost = integer(integer(technique.cost, "Custo") + integer(technique.costExtra, "CE fixa adicional") + extra + elevate, "Custo total");
  const skill = system.skills.asterism;
  // p. 193/198: Asterismo acompanha a natureza da técnica usada, com ajuste manual preservado.
  const attribute = skill.associated || nature.key;
  if (!ATTRIBUTES[attribute]) throw Error("Atributo de Asterismo inválido.");
  const base = testParameters(system, "skill", "asterism");
  const trained = skill.value > 0;
  const modifier = (trained ? skill.mod + system.attributes[attribute].mod + skill.bonus : 0)
    + (system.combat.asterismPenalty ?? 0) + bonus + advantage * 2;
  return {cost, difficulty: 10 + cost, attribute, attributeLabel: ATTRIBUTES[attribute],
    dice: Math.max(1, Math.min(5, base.dice + advantage)), modifier, elevate, effectKind,
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
  const outcome = classify(total, parameters.difficulty);
  const success = total >= parameters.difficulty;
  const critical = total > parameters.difficulty + 10;
  const damageLevel = integer(technique.damageLevel, "Nível de Dano", 1) + parameters.elevate + (critical ? 1 : 0);
  const damage = parameters.effectKind === "damage"
    ? Math.max(0, damageLevel * integer(technique.power, "Nível de Poder") + system.profile.level + system.combat.damageBonus) : 0;
  const armorDamage = parameters.effectKind !== "damage" ? 0 : damageLevel > 20 ? 100 : damageLevel > 10 ? 70
    : ({bronze: 10, silver: 20, gold: 30}[technique.classification] ?? 0);
  return {outcome, success, critical, damageLevel, damage: success ? damage : 0, armorDamage: success ? armorDamage : 0,
    nextPenalty: total < parameters.difficulty - 10 ? -10 : 0};
}
export function resistancePreview(system, items, attack, total, difficulty = attack.powerCosmic) {
  const outcome = classify(total, difficulty);
  const armor = items.find(i => i.type === "armor" && i.system.equipped && i.system.health.value >= 0 && i.system.state !== "dead");
  const multiplier = total > difficulty + 10 ? 0 : total >= difficulty ? 0.5 : total < difficulty - 10 ? 2 : 1;
  return {outcome, damage: attack.damage * multiplier * (armor ? 1 : 2),
    armorDamage: armor && total < difficulty ? attack.armorDamage : 0,
    unarmored: !armor, effectsResisted: total >= difficulty, doubleDuration: total < difficulty - 10};
}
