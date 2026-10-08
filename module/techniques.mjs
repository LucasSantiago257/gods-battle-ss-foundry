import {SYSTEM_ID, NATURES} from "./config.mjs";
import {techniqueParameters, techniqueOutcome, cosmoPayment, EFFECT_KINDS, techniqueReadiness} from "./technique-rules.mjs";
import {evaluatePool, prepareRollMessage, rollTest} from "./rolls.mjs";

const active = new WeakSet();
export async function useTechnique(actor, item) {
  if (!actor?.isOwner || item?.parent !== actor || item.type !== "technique") return;
  const reason = techniqueReadiness(item);
  if (reason) return ui.notifications.warn(reason);
  if (active.has(actor)) return ui.notifications.warn("Já existe uma ativação em andamento para este cavaleiro.");
  active.add(actor);
  let paid = false;
  try {
    const content = await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/technique-dialog.hbs`, {
      name: item.name, cost: item.system.cost + item.system.costExtra, current: actor.system.resources.cosmo.value,
      extra: actor.system.resources.cosmoExtra, reserve: actor.system.resources.cosmoReserved,
      penalty: actor.system.combat.asterismPenalty, unlimited: actor.system.resources.cosmo.unlimited
    });
    const answer = await foundry.applications.api.DialogV2.wait({window: {title: "Ativar técnica"}, content,
      buttons: [{action: "activate", label: "Gastar CE e rolar", default: true, callback: (_event, button) => {
        const e = button.form.elements;
        return {extra: Number(e.extra.value), elevate: Number(e.elevate.value), bonus: Number(e.bonus.value),
          advantage: Number(e.advantage.value), useExtra: e.useExtra.checked, allowOverload: e.allowOverload.checked};
      }}, {action: "cancel", label: "Cancelar", callback: () => null}], rejectClose: false});
    if (!answer || typeof answer !== "object") return;
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
    const outcome = techniqueOutcome(actor.system, technique, parameters, result.total);
    const attack = {name, nature: technique.nature, effectKind: parameters.effectKind,
      powerCosmic: parameters.powerCosmic, damage: outcome.damage, armorDamage: outcome.armorDamage};
    const {updates: _updates, ...paymentSummary} = payment;
    const message = await prepareRollMessage(actor, messageRoll, {name, ...result, ...parameters, ...outcome, payment,
      effectLabel: EFFECT_KINDS[parameters.effectKind], description: technique.description, isDamage: parameters.effectKind === "damage"},
      {template: "technique-chat", flags: {technique: {itemUuid: item.uuid, ...parameters, ...outcome, payment: paymentSummary},
        ...(outcome.success ? {attack} : {})}});
    if (JSON.stringify(cosmoPayment(actor.system, parameters.cost, answer)) !== JSON.stringify(payment)) throw Error("Os recursos mudaram durante a ativação. Abra a ativação novamente.");
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
      const actor = resistanceActor(canvas.tokens?.controlled ?? []);
      await rollTest(actor, "resistance", NATURES[attack.nature].resistance, {difficulty: attack.powerCosmic, resistanceAttack: {...attack,messageId:message.id}});
    } catch (error) {console.error(error); ui.notifications.error(error.message);}
    finally {button.disabled = false;}
  });
}
