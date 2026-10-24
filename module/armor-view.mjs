// Read-only sheet context. Numeric armor.minimum remains available to existing calculations.
const SENSE_REQUIREMENTS = {gold: "7º Sentido", divine: "7º Sentido Superado", kamui: "9º Sentido"};

export function armorPresentation(item, actor = item?.parent) {
  if (item?.type !== "armor") return null;
  const s = item.system;
  const view = {...s.armor, ceLabel: s.armor.unlimited ? "∞" : `${s.armor.ce >= 0 ? "+" : ""}${s.armor.ce}`, requirement: SENSE_REQUIREMENTS[s.class] ?? `Cosmo ${s.armor.minimum}`, application: null};
  // World/compendium Items have no applied state; only a current embedded instance does.
  const items = actor?.type === "knight" ? actor.items?.contents : null;
  if (!items?.includes(item) || item.parent !== actor) return view;
  let key = "stored", label = "Guardada";
  if (s.equipped) {
    if (s.state === "dead") {key = "dead"; label = "Sem bônus · morta";}
    else if (!(s.health.value >= 0)) {key = "depleted"; label = "Sem bônus · PV abaixo de 0";}
    else {
      // Same collection order and eligibility as prepareKnight; display sorting must not choose the armor.
      const applied = items.find(i => i.type === "armor" && i.system.equipped && i.system.health.value >= 0 && i.system.state !== "dead");
      if (applied === item) {key = "applied"; label = "Bônus aplicados";}
      else {key = "other"; label = "Sem bônus · outra armadura em uso";}
    }
  }
  view.application = {key, label, applied: key === "applied"};
  return view;
}
