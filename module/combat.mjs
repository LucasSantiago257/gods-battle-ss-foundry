import {SYSTEM_ID,FIGHTING} from "./config.mjs";
import {evaluatePool,prepareRollMessage} from "./rolls.mjs";
import {physicalDamage,damageTurnSnapshot} from "./combat-rules.mjs";
import {actionView,actionHash,assertActionAllowed} from "./action-rules.mjs";
import {submitCombatAction,combatActionState,pendingAction} from "./actions.mjs";
import {assertNoTechniqueInterruption} from "./master-queue.mjs";
import {conditionPool,conditionSummary,conditionSignature} from "./condition-rules.mjs";
const escaped = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const busy=new WeakSet();
export async function attackTarget(actor) {
  if (!actor?.isOwner || busy.has(actor)) return;
  const targets=[...game.user.targets];
  if (targets.length!==1 || targets[0].actor?.type!=="knight") return ui.notifications.warn("Marque um único cavaleiro como alvo.");
  const target=targets[0].actor;
  busy.add(actor);
  try {
    assertNoTechniqueInterruption(actor);assertActionAllowed(actor,"attack");const view=actionView(actor),baseline=combatActionState(actor);
    if(view.enabled&&view.remaining.attack<1)throw Error("Nenhuma ação de ataque disponível nesta rodada.");
    const trained=Object.entries(FIGHTING).filter(([key])=>key!=="defense"&&Number.isInteger(actor.system.fighting[key])&&actor.system.fighting[key]>=1&&actor.system.fighting[key]<=5);
    if(!trained.length)throw Error("Configure uma habilidade de ataque com graduação entre 1 e 5.");
    const preferred=trained.reduce((best,entry)=>actor.system.fighting[entry[0]]>actor.system.fighting[best[0]]?entry:best)[0];
    const choices=trained.map(([key,label])=>`<option value="${key}"${key===preferred?" selected":""}>${label} (${actor.system.fighting[key]})</option>`).join("");
    const actions=view.enabled?`<label>Ações de ataque a usar (${view.remaining.attack} disponíveis)<input name="amount" type="number" min="1" max="${view.remaining.attack}" value="${view.remaining.attack}"></label>`:"";
    const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Ataque contra defensor"},content:`<p>Alvo: ${escaped(target.name)}</p><label>Habilidade de luta<select name="kind">${choices}</select></label><label>Modificador situacional<input type="number" name="bonus" value="0"></label>${actions}`,buttons:[{action:"roll",label:"Atacar",default:true,callback:(_e,b)=>({kind:b.form.elements.kind.value,bonus:Number(b.form.elements.bonus.value),amount:Number(b.form.elements.amount?.value??0)})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
    if (!answer) return;
    if(combatActionState(actor)!==baseline)throw Error("Ficha, rodada ou ações mudaram. Abra o ataque novamente.");
    if(view.enabled)return await submitCombatAction(actor,{kind:"attack",fighting:answer.kind,bonus:answer.bonus,amount:answer.amount,targetUuid:target.uuid},baseline);
    const dice=actor.system.fighting[answer.kind];
    if (!FIGHTING[answer.kind] || answer.kind==="defense" || !Number.isInteger(dice) || dice<1 || dice>5 || !Number.isFinite(answer.bonus)) throw Error("Escolha uma habilidade de luta com graduação entre 1 e 5.");
    const conditionBaseline=conditionSignature(actor),pool=conditionPool(actor.system,dice,actor.system.combat.attack+actor.system.combat.levelModifier+answer.bonus,{maxDice:5});
    const {result,messageRoll}=await evaluatePool(pool.dice,pool.modifier);
    if(conditionSignature(actor)!==conditionBaseline)throw Error("Condições mudaram durante o ataque; confira a situação antes de repetir.");
    const fight={attackerUuid:actor.uuid,targetUuid:target.uuid,kind:answer.kind,attack:result.total,damageLevel:actor.system.combat.attackLevel,damageBonus:actor.system.combat.damageBonus+actor.system.combat.physicalDamageBonus,turnSnapshot:damageTurnSnapshot(target)};
    const message=await prepareRollMessage(actor,messageRoll,{label:`${FIGHTING[answer.kind]} contra ${target.name}`,kind:"Ataque",...result,fight,conditionSummary:conditionSummary(actor.system)},{template:"combat-chat",flags:{fight}});
    if(conditionSignature(actor)!==conditionBaseline)throw Error("Condições mudaram antes de publicar o ataque.");
    return await ChatMessage.create(message);
  } catch(error) {ui.notifications.error(error.message);} finally {busy.delete(actor);}
}
// The direct action spends exactly one defense, never the entire reserve.
export async function defensePreview(message) {
  const fight=message.flags?.[SYSTEM_ID]?.fight;
  if(!message.isContentVisible||!fight)return null;
  const actor=await fromUuid(fight.targetUuid);
  if(!actor?.isOwner||actor.type!=="knight")return null;
  assertNoTechniqueInterruption(actor);assertActionAllowed(actor,"defense");
  const view=actionView(actor);
  if(pendingAction(actor)||Object.values(actor.flags?.[SYSTEM_ID]?.actionOperations??{}).some(r=>r.actorUuid===actor.uuid&&r.rootId===message.id&&r.kind==="defend"&&["prepared","paid"].includes(r.status)))return null;
  if(!view.enabled||view.remaining.defense<1||!Number.isInteger(actor.system.fighting.defense)||actor.system.fighting.defense<1||actor.system.fighting.defense>5)return null;
  if(fight.actionContext&&["combatUuid","round","epoch"].some(key=>fight.actionContext[key]!==view.context[key]))return null;
  return {state:combatActionState(actor),fightHash:actionHash(fight),label:`Defender com 1 ação · rodada ${view.context.round} · sem bônus`};
}
export async function defendAttack(message,{quick=false,expectedState=null,expectedFight=null}={}) {
  const fight=message.flags?.[SYSTEM_ID]?.fight;
  if (!message.isContentVisible || !fight) return;
  const actor=await fromUuid(fight.targetUuid);
  if (!actor?.isOwner || actor.type!=="knight") throw Error("Somente o mestre ou proprietário do defensor pode defender.");
  if (busy.has(actor)) return;
  busy.add(actor);
  try {
    assertNoTechniqueInterruption(actor);assertActionAllowed(actor,"defense");const view=actionView(actor),baseline=combatActionState(actor),fightHash=actionHash(fight);
    if(view.enabled&&view.remaining.defense<1)throw Error("Nenhuma ação de defesa disponível nesta rodada.");
    const grade=actor.system.fighting.defense;
    if (grade<1) throw Error("Configure a graduação de Esquiva/Bloqueio antes de defender.");
    if(quick&&(quick!==true||!view.enabled||expectedState!==baseline||expectedFight!==fightHash))throw Error("Ficha, ataque, rodada ou ações mudaram. Atualize a defesa antes de rolar.");
    const content='<label>Modificador situacional<input type="number" name="bonus" value="0"></label>'+(view.enabled?`<label>Ações de defesa a usar (${view.remaining.defense} disponíveis)<input name="amount" type="number" min="1" max="${view.remaining.defense}" value="${view.remaining.defense}"></label>`:"");
    const answer=quick?{bonus:0,amount:1}:await foundry.applications.api.DialogV2.wait({window:{title:"Defender ataque"},content,buttons:[{action:"roll",label:"Defender",default:true,callback:(_e,b)=>({bonus:Number(b.form.elements.bonus.value),amount:Number(b.form.elements.amount?.value??0)})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
    if (answer===null || answer===undefined) return;
    if(combatActionState(actor)!==baseline||actionHash(message.flags?.[SYSTEM_ID]?.fight)!==fightHash)throw Error("Ficha, ataque, rodada ou ações mudaram. Abra a defesa novamente.");
    if(view.enabled)return await submitCombatAction(actor,{kind:"defend",rootId:message.id,fightHash,bonus:answer.bonus,amount:answer.amount},baseline);
    if (!Number.isFinite(answer.bonus)) throw Error("Modificador inválido.");
    const conditionBaseline=conditionSignature(actor),pool=conditionPool(actor.system,grade,actor.system.combat.defense+actor.system.combat.levelModifier+answer.bonus,{maxDice:5});
    const {result,messageRoll}=await evaluatePool(pool.dice,pool.modifier);
    if(conditionSignature(actor)!==conditionBaseline)throw Error("Condições mudaram durante a defesa; confira a situação antes de repetir.");
    const outcome=physicalDamage(fight.attack,result.total,{...fight,protection:actor.system.combat.protection});
    const resolvedDamage={actorUuid:actor.uuid,rootMessageId:message.id,body:outcome.damage,armor:0,armorId:null,turnSnapshot:Object.hasOwn(fight,"turnSnapshot")?fight.turnSnapshot:damageTurnSnapshot(actor)};
    const data=await prepareRollMessage(actor,messageRoll,{label:actor.name,kind:"Defesa",...result,outcome,resolvedDamage,conditionSummary:conditionSummary(actor.system)},{template:"combat-chat",flags:{resolvedDamage}});
    if(conditionSignature(actor)!==conditionBaseline)throw Error("Condições mudaram antes de publicar a defesa.");
    return await ChatMessage.create(data);
  } finally {busy.delete(actor);}
}
