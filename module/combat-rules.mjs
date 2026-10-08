export function physicalDamage(attack, defense, {damageLevel, damageBonus = 0, protection = 0}) {
  if (![attack,defense,damageLevel,damageBonus,protection].every(Number.isFinite)) throw Error("Valores de combate inválidos.");
  const hits = Math.max(0,attack-defense);
  return {hits,damageLevel,damageBonus,protection,damage: hits * Math.max(0,damageLevel+damageBonus-protection),armorDamage:0};
}
export function damageSnapshot(actor, body, armorDamage, armorId) {
  if (![body,armorDamage].every(n=>Number.isFinite(n)&&n>=0&&n<=1000000)) throw Error("Dano inválido.");
  const armor = armorId ? actor.items.get(armorId) : null;
  if (armorDamage && (!armor || armor.type !== "armor" || !armor.system.equipped)) throw Error("Armadura mudou; resolva o dano novamente.");
  return {before:{health:actor.system.resources.health.value,armor:armor?.system.health.value??null},
    after:{health:actor.system.resources.health.value-body,armor:armor?armor.system.health.value-armorDamage:null},armorId:armor?.id??null,body,armorDamage};
}
export function snapshotMatches(actor,snapshot,which) {
  const values=snapshot[which],armor=snapshot.armorId?actor.items.get(snapshot.armorId):null;
  return actor.system.resources.health.value===values.health && (!snapshot.armorId || armor?.system.health.value===values.armor);
}
export function canReadChat(user,message) {
  if (user.isGM) return true;
  if (message.blind) return false;
  const author=message.author?.id??message.user?.id;
  const recipients=(message.whisper??[]).map(u=>typeof u==="string"?u:u.id);
  return !recipients.length || recipients.includes(user.id) || author===user.id;
}
