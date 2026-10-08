import {ATTRIBUTE_MODS, SKILL_MODS, STYLES, SKILLS, NATURES, ARMORS, MOVEMENT, JUMP, LIFT, BREAK} from "./config.mjs";
import {divineBonuses, healthMaximum} from "./calculations.mjs";
import {evaluatePassives, effectiveAttribute} from "./passives.mjs";

export function attributeModifier(rank) { return ATTRIBUTE_MODS[rank] ?? 0; }
export function skillModifier(rank) { return SKILL_MODS[rank] ?? 0; }
export function classify(total, difficulty) {
  if (total > difficulty + 10) return "Sucesso crítico";
  if (total >= difficulty) return "Sucesso";
  if (total < difficulty - 10) return "Falha crítica";
  return "Falha";
}
export function resolvePool(results, modifier = 0) {
  if (!results.length || results.some(n => !Number.isInteger(n) || n < 1 || n > 10)) throw new Error("Parada de d10 inválida.");
  const tens = results.filter(n => n === 10).length;
  const ones = results.filter(n => n === 1).length;
  return {results, highest: Math.max(...results), tens, ones, modifier, total: Math.max(...results) + tens * 2 - ones * 2 + modifier};
}
export function testParameters(system, kind, key, resistanceMode = "rank") {
  if (kind === "attribute") return {dice: effectiveAttribute(system,key), modifier: system.attributes[key].mod + (key === "sen" ? system.automation.testSen ?? 0 : 0)};
  if (kind === "skill") {
    const skill = system.skills[key];
    return {dice: Math.max(1, Math.min(skill.value, 5)), modifier: skill.value ? skill.total : 0};
  }
  if (kind === "resistance") {
    const a = system.attributes[key];
    return {dice: effectiveAttribute(system,key), modifier: (resistanceMode === "rank" ? effectiveAttribute(system,key) : a.mod) + system.combat.levelModifier + system.combat.resistanceBonus + divineBonuses(system).resistance + (system.automation.resistanceBonus ?? 0) + (key === "cos" ? system.automation.resistanceCos ?? 0 : key === "sen" ? system.automation.resistanceSen ?? 0 : 0)};
  }
  throw new Error("Tipo de teste desconhecido.");
}
export function armorValues(system, multiplier = 1) {
  const base = ARMORS[system.class] ?? ARMORS.bronze;
  const version = system.class === "gold" ? 0 : Math.max(0, system.version - 1);
  return {hp: system.health.manualMax || (base.hp + version * 5 + system.health.bonus) * multiplier, pa: base.pa + version + system.protectionBonus,
    ce: base.ce + system.cosmoBonus, minimum: base.min + version * 2, unlimited: system.class === "kamui"};
}
export function prepareKnight(system, items = [], resistanceMode = "rank") {
  const style = STYLES[system.profile.style];
  const {totals: effects} = evaluatePassives(system, items);
  Object.assign(system.automation, {healthBonus: effects.health ?? 0, resistanceBonus: effects.resistance ?? 0, techniqueND: effects.techniqueND ?? 0, physicalDamage: effects.physicalDamage ?? 0, testSen: effects["test.sen"] ?? 0, resistanceCos: effects["resistance.cos"] ?? 0, resistanceSen: effects["resistance.sen"] ?? 0});
  for (const [key, a] of Object.entries(system.attributes)) {a.effective = Math.max(0,Math.min(12,a.value + (effects[`attribute.${key}`] ?? 0))); a.mod = attributeModifier(a.effective) + a.bonus;}
  for (const [key, def] of Object.entries(SKILLS)) {
    const skill = system.skills[key];
    skill.attribute = skill.associated || (def.attribute === "style" ? style.key : def.attribute === "nature" ? NATURES[system.profile.nature].key : def.attribute);
    skill.mod = skillModifier(skill.value);
    skill.effectBonus = effects[`skill.${key}`] ?? 0;
    skill.total = skill.value ? skill.mod + system.attributes[skill.attribute].mod + skill.bonus + skill.effectBonus + (key === "leadership" ? system.progression.legend : 0) : 0;
  }
  const level = system.profile.level;
  // Até nível 20, tabelas dos estilos. Valores posteriores são registrados por ajuste.
  const tableLevel = Math.min(level, 20);
  const actionGrowth = style.fastActions ? tableLevel - 1 : Math.floor(tableLevel / 2);
  const ceGrowth = style.fastCosmo ? tableLevel - 1 : Math.floor(tableLevel / 2);
  const armor = items.find(i => i.type === "armor" && i.system.equipped && i.system.health.value >= 0 && i.system.state !== "dead");
  for (const item of items.filter(i => i.type === "armor")) {item.system.armor = armorValues(item.system,effects.armorHealthMultiplier || 1);item.system.health.max = item.system.armor.hp;}
  const av = armor ? armor.system.armor : {pa: 0, ce: 0, unlimited: false};
  const divine = divineBonuses(system);
  const hp = healthMaximum(system);
  system.resources.health.max = system.resources.health.manualMax || hp;
  system.resources.cosmo.max = Math.max(0, effectiveAttribute(system,"cos") + ceGrowth + av.ce + system.resources.cosmo.bonus);
  system.resources.cosmo.unlimited = av.unlimited;
  system.resources.maximum.max = 20;
  system.combat.levelModifier = level + system.progression.legend + system.sense.levelBonus + system.combat.levelBonus;
  system.combat.attack = 1 + actionGrowth + system.combat.attackBonus + (effects.attack ?? 0);
  system.combat.defense = 1 + actionGrowth + system.combat.defenseBonus + (effects.defense ?? 0);
  system.combat.protection = av.pa + system.combat.protectionBonus + (effects.protection ?? 0);
  system.combat.cosmicPower = 10 + system.combat.levelModifier + Math.floor(level / 10) + system.combat.powerBonus;
  system.combat.initiative = system.sense.initiative + system.combat.initiativeBonus;
  system.combat.passiveEvasion = 7 + system.skills.combat.total + system.combat.levelModifier;
  system.combat.passiveDuel = 7 + system.skills.cosmoUse.total + system.combat.levelModifier;
  system.combat.intuition = 7 + system.skills.perception.mod + system.combat.levelModifier + system.combat.attention + (effects.intuition ?? 0);
  system.combat.resistances = Object.fromEntries(["vig", "vel", "sen", "cos"].map(key => [key, testParameters(system, "resistance", key, resistanceMode).modifier]));
  system.combat.physicalDamageBonus = divine.physicalDamage + (effects.physicalDamage ?? 0);
  system.combat.techniqueDamageBonus = divine.techniqueDamage;
  system.combat.divineSpeed = divine.speed;
  const vel = Math.min(effectiveAttribute(system,"vel"), 10), force = Math.min(effectiveAttribute(system,"for"), 10);
  system.movement = {walk: MOVEMENT[vel], run: MOVEMENT[vel] * 3, jump: JUMP[vel], lift: LIFT[force], break: BREAK[force]};
  // Leitura numérica de Domínio permanece editável enquanto a divergência estiver aberta.
  system.combat.domain = (effectiveAttribute(system,"sen") + system.sense.domainBonus + system.combat.domainBonus + (effects.domain ?? 0)) * 3 + 1.5;
  system.creation = {training: 8, total: Object.values(system.attributes).reduce((n, a) => n + a.value, 0), budget: 5 + 8 + 1 + system.progression.trainingAdjust,
    virtueBudget: 2 + Math.floor(level / 4), skillBudget: (2 + system.attributes.sen.value) * 3};
  return system;
}
