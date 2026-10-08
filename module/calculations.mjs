import {STYLES} from "./config.mjs";
import {effectiveAttribute} from "./passives.mjs";

export function divineBonuses(system) {
  const excess = key => Math.max(0, effectiveAttribute(system,key) - 5);
  if (!system.automation?.enabled) return {health: 0, physicalDamage: 0, techniqueDamage: 0, resistance: 0, speed: 0};
  return {health: 10 * excess("vig"), physicalDamage: excess("for"), techniqueDamage: 15 * excess("cos"), resistance: excess("sen"), speed: excess("vel")};
}
export function healthMaximum(system) {
  const style = STYLES[system.profile.style], level = system.profile.level;
  return style.hp + style.hpStep * (level - 1) + effectiveAttribute(system,"vig") * level + divineBonuses(system).health + system.resources.health.bonus + (system.automation.healthBonus ?? 0);
}
export function calculationSummary(system, resistanceMode = "rank") {
  const style = STYLES[system.profile.style], level = system.profile.level, divine = divineBonuses(system);
  return [
    {label: "PV", text: `${style.hp} base + ${style.hpStep} × (${level} − 1) + Vigor ${effectiveAttribute(system,"vig")} × ${level} + ${divine.health} divino + ${system.resources.health.bonus} ajuste + ${system.automation.healthBonus ?? 0} itens = ${healthMaximum(system)}${system.resources.health.manualMax ? `; máximo manual ${system.resources.health.manualMax}` : ""}`, page: "58–124, 158–159; incremento inicial definido pela campanha"},
    {label: "CE", text: `Cosmo ${system.attributes.cos.value} + crescimento do estilo + armadura viva + ajuste = ${system.resources.cosmo.max}`, page: "58–124; atributo confirmado pela campanha"},
    {label: "Domínio", text: `(${system.attributes.sen.value} Sentidos + ${system.sense.domainBonus} estágio + ${system.combat.domainBonus} extra) × 3 + 1,5 = ${system.combat.domain} m`, page: "388"},
    {label: "Resistência", text: `${resistanceMode === "rank" ? "Graduação" : "Modificador"} do atributo + ${system.combat.levelModifier} nível + ${system.combat.resistanceBonus} ajuste + ${divine.resistance} divino; interpretação configurável`, page: "207, 434; exemplo divergente em 207"},
    {label: "Atributos divinos", text: `PV +${divine.health}; dano físico +${divine.physicalDamage}; dano de técnica +${divine.techniqueDamage}; resistência +${divine.resistance}; velocidade superada +${divine.speed}${system.automation?.enabled ? "" : "; automação desativada: conferir lançamentos manuais"}`, page: "159"}
  ];
}
