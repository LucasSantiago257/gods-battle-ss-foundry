import {SYSTEM_ID,FIGHTING} from "./config.mjs";
import {evaluatePool,prepareRollMessage} from "./rolls.mjs";
import {physicalDamage} from "./combat-rules.mjs";
const escaped = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const busy=new WeakSet();
export async function attackTarget(actor) {
  if (!actor?.isOwner || busy.has(actor)) return;
  const targets=[...game.user.targets];
  if (targets.length!==1 || targets[0].actor?.type!=="knight") return ui.notifications.warn("Marque um único cavaleiro como alvo.");
  const target=targets[0].actor;
  busy.add(actor);
  try {
    const choices=Object.entries(FIGHTING).filter(([key])=>key!=="defense").map(([key,label])=>`<option value="${key}">${label} (${actor.system.fighting[key]})</option>`).join("");
    const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Ataque contra defensor"},content:`<p>Alvo: ${escaped(target.name)}</p><label>Habilidade de luta<select name="kind">${choices}</select></label><label>Modificador situacional<input type="number" name="bonus" value="0"></label><p>Ações e efeitos especiais são conferidos manualmente.</p>`,buttons:[{action:"roll",label:"Rolar ataque",default:true,callback:(_e,b)=>({kind:b.form.elements.kind.value,bonus:Number(b.form.elements.bonus.value)})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
    if (!answer) return;
    const dice=actor.system.fighting[answer.kind];
    if (!FIGHTING[answer.kind] || answer.kind==="defense" || !Number.isInteger(dice) || dice<1 || dice>5 || !Number.isFinite(answer.bonus)) throw Error("Escolha uma habilidade de luta com graduação entre 1 e 5.");
    const {result,messageRoll}=await evaluatePool(dice,actor.system.combat.attack+actor.system.combat.levelModifier+answer.bonus);
    const fight={attackerUuid:actor.uuid,targetUuid:target.uuid,kind:answer.kind,attack:result.total,damageLevel:actor.system.combat.attackLevel,damageBonus:actor.system.combat.damageBonus+actor.system.combat.physicalDamageBonus};
    const message=await prepareRollMessage(actor,messageRoll,{label:`${FIGHTING[answer.kind]} contra ${target.name}`,kind:"Ataque",...result,fight},{template:"combat-chat",flags:{fight}});
    return await ChatMessage.create(message);
  } catch(error) {ui.notifications.error(error.message);} finally {busy.delete(actor);}
}
export async function defendAttack(message) {
  const fight=message.flags?.[SYSTEM_ID]?.fight;
  if (!message.isContentVisible || !fight) return;
  const actor=await fromUuid(fight.targetUuid);
  if (!actor?.isOwner || actor.type!=="knight") throw Error("Somente o mestre ou proprietário do defensor pode defender.");
  if (busy.has(actor)) return;
  busy.add(actor);
  try {
    const grade=actor.system.fighting.defense;
    if (grade<1) throw Error("Configure a graduação de Esquiva/Bloqueio antes de defender.");
    const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Defender ataque"},content:'<label>Modificador situacional<input type="number" name="bonus" value="0"></label>',buttons:[{action:"roll",label:"Rolar defesa",default:true,callback:(_e,b)=>Number(b.form.elements.bonus.value)},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
    if (answer===null || answer===undefined) return;
    if (!Number.isFinite(answer)) throw Error("Modificador inválido.");
    const {result,messageRoll}=await evaluatePool(grade,actor.system.combat.defense+actor.system.combat.levelModifier+answer);
    const outcome=physicalDamage(fight.attack,result.total,{...fight,protection:actor.system.combat.protection});
    const resolvedDamage={actorUuid:actor.uuid,rootMessageId:message.id,body:outcome.damage,armor:0,armorId:null};
    const data=await prepareRollMessage(actor,messageRoll,{label:actor.name,kind:"Defesa",...result,outcome,resolvedDamage},{template:"combat-chat",flags:{resolvedDamage}});
    return await ChatMessage.create(data);
  } finally {busy.delete(actor);}
}
