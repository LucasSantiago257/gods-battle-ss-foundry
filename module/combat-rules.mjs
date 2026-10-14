import {SYSTEM_ID} from "./config.mjs";
export function physicalDamage(attack, defense, {damageLevel, damageBonus = 0, protection = 0}) {
  if (![attack,defense,damageLevel,damageBonus,protection].every(Number.isFinite)) throw Error("Valores de combate inválidos.");
  const hits = Math.max(0,attack-defense);
  return {hits,damageLevel,damageBonus,protection,damage: hits * Math.max(0,damageLevel+damageBonus-protection),armorDamage:0};
}
export function damageTurnSnapshot(actor, combats=globalThis.game?.combats?.contents??[]) {
  const matches=combats.filter(combat=>combat?.started&&(combat.combatants?.contents??[]).filter(c=>c.actor?.uuid===actor?.uuid).length===1);
  if(matches.length!==1)return null;
  const combat=matches[0],round=combat.round,maximumHealth=actor.system.resources.health.max,epoch=combat.flags?.[SYSTEM_ID]?.actionControl?.epoch??"initial";
  if(typeof combat.uuid!=="string"||!Number.isSafeInteger(round)||round<1||!Number.isFinite(maximumHealth)||maximumHealth<=0||typeof epoch!=="string")return null;
  return {combatUuid:combat.uuid,round,epoch,maximumHealth};
}
export function damageTurnSummary(operations, turn) {
  if(!turn||!Array.isArray(operations)||operations.length>100000||!Number.isFinite(turn.maximumHealth)||turn.maximumHealth<=0)return null;
  const same=r=>r?.turnSnapshot?.combatUuid===turn.combatUuid&&r.turnSnapshot.round===turn.round&&r.turnSnapshot.epoch===turn.epoch&&r.turnSnapshot.maximumHealth===turn.maximumHealth;
  // Compare decimal inputs as base-10 integers so accumulated tenths do not drift across binary floating-point sums.
  const decimal=value=>{
    const [coefficient,exponentText="0"]=String(value).toLowerCase().split("e"), exponent=Number(exponentText);
    const [whole,fraction=""]=coefficient.split("."), digits=`${whole}${fraction}`, scale=fraction.length-exponent;
    if(!Number.isInteger(exponent)||Math.abs(exponent)>20||!/^\\d+$/.test(digits))throw Error("Precisão decimal inválida.");
    return scale<0?{n:BigInt(digits)*10n**BigInt(-scale),scale:0}:{n:BigInt(digits),scale};
  };
  const damage=[];let scale=decimal(turn.maximumHealth).scale;
  for(const r of operations){
    if(!same(r)||r.status!=="applied"||r.direction!=="apply")continue;
    if(!Number.isFinite(r.body)||r.body<0||r.body>1000000)return null;
    const amount=decimal(r.body);damage.push(amount);scale=Math.max(scale,amount.scale);
  }
  const health=decimal(turn.maximumHealth),factor=10n**BigInt(scale-health.scale);
  const bodyScaled=damage.reduce((sum,amount)=>sum+amount.n*10n**BigInt(scale-amount.scale),0n),healthScaled=health.n*factor;
  const comparison=bodyScaled*10n-healthScaled*7n,bodyDamage=Number(bodyScaled)/10**scale,threshold=turn.maximumHealth*.7;
  return {combatUuid:turn.combatUuid,round:turn.round,epoch:turn.epoch,bodyDamage,maximumHealth:turn.maximumHealth,threshold,exceeded:comparison>0n,atThreshold:comparison===0n,remaining:Math.max(0,threshold-bodyDamage)};
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

