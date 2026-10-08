import {BOOK_RULES} from "./book-rules.mjs";
import {ATTRIBUTES, SKILLS} from "./config.mjs";
export const passiveDefinition = item => BOOK_RULES[item?.flags?.["gods-battle-ss"]?.source?.key] ?? null;
export const effectiveAttribute = (s, key) => s.attributes[key].effective ?? s.attributes[key].value;
export const effectLabel = target => target.startsWith("attribute.") ? `Graduação de ${ATTRIBUTES[target.slice(10)]}` : target.startsWith("skill.") ? `Teste de ${SKILLS[target.slice(6)].label}` : ({health:"PV",attack:"Ações de ataque",defense:"Ações de defesa",protection:"Proteção",domain:"Domínio",intuition:"Intuição",physicalDamage:"Dano físico",techniqueND:"Nível de dano da técnica",armorHealthMultiplier:"Multiplicador de PV da armadura","test.sen":"Teste de Sentidos","resistance.cos":"Resistência de Cosmo","resistance.sen":"Resistência de Sentidos"}[target] ?? target);
const normal = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function passiveWarnings(s, item, definition = passiveDefinition(item)) {
  if (!definition) return [];
  const c = definition.conditions, out = [];
  if (c.style && s.profile.style !== c.style) out.push("Estilo de origem diferente do personagem.");
  if (c.levelMin && s.profile.level < c.levelMin) out.push(`Requer nível ${c.levelMin}.`);
  if (c.specialization && normal(s.profile.specialization) !== normal(c.specialization)) out.push(`Conferir especialização ${c.specialization}.`);
  if (c.acquisitionLevel && (item.system.acquisitionLevel || s.profile.level) !== c.acquisitionLevel) out.push("Aquisição permitida somente no nível 1.");
  if (definition.unresolvedRequirements) out.push("Pré-requisito textual precisa de conferência.");
  if (definition.rules.some(r => r.target.startsWith("choice")) && (!ATTRIBUTES[item.system.attributeChoice1] || !ATTRIBUTES[item.system.attributeChoice2])) out.push("Escolha os dois pontos de atributo na cópia.");
  return out;
}
export function combinationTier(rank) {return rank <= 0 ? 0 : rank <= 3 ? 1 : rank <= 6 ? 2 : rank <= 8 ? 3 : 4;}
export function evaluatePassives(s, items = []) {
  const totals = {}, ledger = [], candidates = [], duplicates = new Set();
  for (const item of items) {
    const d = passiveDefinition(item); if (!d) continue;
    const warnings = passiveWarnings(s, item, d);
    const reason = !s.automation?.enabled ? "Automação da ficha desativada" : item.system.rulesEnabled === false ? "Efeitos da cópia desativados" : warnings.length && !item.system.rulesAccepted ? warnings.join(" ") : d.requiresActive && !item.system.active ? "Ative a melhoria após conferir a ação" : null;
    const entry = {id: item.id, name: item.name, status: d.status, reason: reason || d.reason, warnings, contributions: []}; ledger.push(entry);
    if (reason || !d.rules.length) continue;
    const key = item.flags["gods-battle-ss"].source.key;
    if (!d.repeatable && duplicates.has(key)) {entry.reason = "Cópia repetida: benefício já considerado"; continue;}
    duplicates.add(key);
    for (const [ruleIndex, rule] of d.rules.entries()) {
      const target = rule.target.startsWith("choice") ? `attribute.${item.system[rule.target === "choice1" ? "attributeChoice1" : "attributeChoice2"]}` : rule.target;
      if (target.startsWith("attribute.") && !ATTRIBUTES[target.slice(10)]) continue;
      if (target.startsWith("skill.") && !SKILLS[target.slice(6)]) continue;
      const scale = rule.scale === "level" ? s.profile.level : rule.scale === "rank" ? item.system.rank : 1;
      const amount = rule.value * scale + (rule.combination ? combinationTier(s.skills[rule.combination].value) : 0);
      if (!Number.isFinite(amount)) continue;
      const category = item.type === "virtue" ? "virtue" : item.system.abilityKind === "gift" ? "gift" : item.system.abilityKind === "improvement" ? "improvement" : "ability";
      const isModifier = /^(skill\.|test\.|resistance|physicalDamage)/.test(target);
      candidates.push({target, amount, entry, group: rule.identity || (!isModifier || d.repeatable ? `${item.id ?? key}:${ruleIndex}` : `${category}:${target}`)});
    }
  }
  const groups = Map.groupBy(candidates, c => `${c.target}:${c.group}`);
  for (const group of groups.values()) {
    // P.379 não permite acumular modificadores do mesmo tipo. Maior benefício e pior penalidade; veja cada contribuição suprimida.
    const positive = group.filter(c => c.amount >= 0).toSorted((a,b) => b.amount-a.amount), negative = group.filter(c => c.amount < 0).toSorted((a,b) => a.amount-b.amount);
    const chosen = new Set([positive[0],negative[0]].filter(Boolean));
    for (const c of group) {const applied = chosen.has(c);c.entry.contributions.push({target:c.target,label:effectLabel(c.target),amount:c.amount,applied}); if (applied) totals[c.target] = (totals[c.target] ?? 0) + c.amount;}
  }
  return {totals, ledger};
}
