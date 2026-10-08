import {SYSTEM_ID, NATURES} from "./config.mjs";
import {techniqueParameters, techniqueOutcome, cosmoPayment, EFFECT_KINDS, techniqueReadiness} from "./technique-rules.mjs";
import {evaluatePool, prepareRollMessage, rollTest} from "./rolls.mjs";
import {activationFormOptions,installTechniquePreview} from "./technique-ui.mjs";

const active = new WeakSet();
const activationState=(actor,item)=>JSON.stringify({actor:actor.system.toObject?actor.system.toObject(false):actor.system,item:item.system.toObject?item.system.toObject():item.system,name:item.name});
export function techniqueTarget(targets=game.user.targets??[]) {
 const marked=[...targets];if(marked.length>1)throw Error("Marque somente um alvo; técnicas em área exigem resolução própria.");
 if(marked.length&&!marked[0].actor)throw Error("O alvo marcado não tem ficha.");
 if(marked.length&&marked[0].actor.type!=="knight")throw Error("Este fluxo atende alvos com ficha de cavaleiro.");
 return marked[0]?.actor??null;
}
export async function useTechnique(actor, item) {
  if (!actor?.isOwner || item?.parent !== actor || item.type !== "technique") return;
  const reason = techniqueReadiness(item);
  if (reason) return ui.notifications.warn(reason);
  if (active.has(actor)) return ui.notifications.warn("Já existe uma ativação em andamento para este cavaleiro.");
  active.add(actor);
  let paid = false;
  try {
    const target=techniqueTarget(),baseline=activationState(actor,item);
    const content = await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/technique-dialog.hbs`, {
      name: item.name, cost: item.system.cost + item.system.costExtra, current: actor.system.resources.cosmo.value,
      extra: actor.system.resources.cosmoExtra, reserve: actor.system.resources.cosmoReserved,
      penalty: actor.system.combat.asterismPenalty, unlimited: actor.system.resources.cosmo.unlimited,targetName:target?.name
    });
    const answer = await foundry.applications.api.DialogV2.wait({window: {title: "Ativar técnica"}, content,
      render:(_event,dialog)=>installTechniquePreview(dialog.form??dialog.element.querySelector("form"),actor.system,item.system),
      buttons: [{action: "activate", label: "Gastar CE e rolar", default: true, callback: (_event, button) => {
        return activationFormOptions(button.form);
      }}, {action: "cancel", label: "Cancelar", callback: () => null}], rejectClose: false});
    if (!answer || typeof answer !== "object") return;
    if(activationState(actor,item)!==baseline)throw Error("A ficha ou técnica mudou durante a prévia. Abra a ativação novamente.");
    const changed = techniqueReadiness(item);
    if (changed) throw Error(changed);
    const technique = item.system.toObject ? item.system.toObject() : {...item.system};
    const name = item.name;
    const parameters = techniqueParameters(actor.system, technique, answer);
    let payment = cosmoPayment(actor.system, parameters.cost, answer);
    if (payment.lifeDamage) {
      const confirmed = await foundry.applications.api.DialogV2.confirm({window: {title: "Queimar além do limite do corpo"},
        content: `<p>Esta ativação ultrapassa a CE disponível em <strong>${payment.overload}</strong>. O excesso acumulado será ${actor.system.resources.cosmoOverload + payment.overload} CE e custará <strong>${payment.lifeDamage} PV</strong>.</p><p>Confirmar a queima e a rolagem?</p>`});
      if (!confirmed) return;
      // Se os recursos mudaram durante a confirmação, não cobre um valor diferente do autorizado.
      const refreshed = cosmoPayment(actor.system, parameters.cost, answer);
      if (JSON.stringify(refreshed) !== JSON.stringify(payment)) throw Error("Os recursos mudaram durante a confirmação. Abra a ativação novamente.");
      payment = refreshed;
    }
    if (!actor.isOwner || item.parent !== actor || !actor.items.get(item.id)) return;
    const {result, messageRoll} = await evaluatePool(parameters.dice, parameters.modifier);
    if(activationState(actor,item)!==baseline)throw Error("A ficha ou técnica mudou durante a rolagem. Abra a ativação novamente; nenhum recurso foi gasto.");
    const outcome = techniqueOutcome(actor.system, technique, parameters, result.total);
    const attack = {name, nature: technique.nature, effectKind: parameters.effectKind,
      powerCosmic: parameters.powerCosmic, damage: outcome.damage, armorDamage: outcome.armorDamage,attackerUuid:actor.uuid,
      ...(target?{targetUuid:target.uuid,targetName:target.name}: {})};
    const {updates: _updates, ...paymentSummary} = payment;
    const message = await prepareRollMessage(actor, messageRoll, {name, ...result, ...parameters, ...outcome, payment,
      effectLabel: EFFECT_KINDS[parameters.effectKind], description: technique.description, isDamage: parameters.effectKind === "damage",targetName:target?.name,power:parameters.power,userLevel:actor.system.profile.level,damageBonus:actor.system.combat.damageBonus+(actor.system.combat.techniqueDamageBonus??0)},
      {template: "technique-chat", flags: {technique: {itemUuid: item.uuid, ...parameters, ...outcome, payment: paymentSummary},
        ...(outcome.success ? {attack} : {})}});
    if (activationState(actor,item)!==baseline||JSON.stringify(cosmoPayment(actor.system, parameters.cost, answer)) !== JSON.stringify(payment)) throw Error("A ficha ou técnica mudou durante a ativação. Abra a ativação novamente.");
    await actor.update({...payment.updates, "system.combat.asterismPenalty": outcome.nextPenalty});
    paid = true;
    return await ChatMessage.create(message);
  } catch (error) {
    console.error(`${SYSTEM_ID}: ativação`, error);
    ui.notifications.error(paid ? "Os recursos foram gastos, mas o cartão não foi publicado. Confira a ficha antes de repetir." : error.message);
  } finally {active.delete(actor);}
}

export function resistanceActor(tokens = [], character = game.user.character) {
  if (tokens.length > 1) throw Error("Selecione somente o token do cavaleiro que resistirá.");
  const actor = tokens.length ? tokens[0].actor : character;
  if (!actor?.isOwner || actor.type !== "knight") throw Error("Selecione um token de cavaleiro sob seu controle, ou atribua seu personagem ao usuário.");
  return actor;
}
export async function resistanceForAttack(attack,tokens=[],character=game.user.character) {
 if(!attack.targetUuid)return resistanceActor(tokens,character);
 const actor=await fromUuid(attack.targetUuid);
 if(!actor?.isOwner||actor.type!=="knight")throw Error("Somente o mestre ou proprietário do alvo marcado pode resistir.");
 return actor;
}
export function renderTechniqueChat(message, html) {
  const attack = message.flags?.[SYSTEM_ID]?.attack;
  const button = html.querySelector('[data-action="resistTechnique"]');
  if (!button) return;
  if (!message.isContentVisible || !attack || !NATURES[attack.nature] || !Number.isFinite(attack.powerCosmic)
    || !Number.isFinite(attack.damage) || !Number.isFinite(attack.armorDamage) || attack.damage < 0 || attack.armorDamage < 0) {
    button.remove(); return;
  }
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const actor = await resistanceForAttack(attack,globalThis.canvas?.tokens?.controlled ?? []);
      await rollTest(actor, "resistance", NATURES[attack.nature].resistance, {difficulty: attack.powerCosmic, resistanceAttack: {...attack,messageId:message.id}});
    } catch (error) {console.error(error); ui.notifications.error(error.message);}
    finally {button.disabled = false;}
  });
}
