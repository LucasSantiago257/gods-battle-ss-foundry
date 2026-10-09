import {SYSTEM_ID, NATURES} from "./config.mjs";
import {techniqueParameters,cosmoPayment,techniqueReadiness} from "./technique-rules.mjs";
import {rollTest} from "./rolls.mjs";
import {activationFormOptions,installTechniquePreview} from "./technique-ui.mjs";
import {activationState,submitTechniqueActivation,techniqueRollMode,pendingTechnique} from "./technique-activation.mjs";
import {primaryGM,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {actionView,techniqueActionPlan} from "./action-rules.mjs";
import {techniqueWithComponents} from "./technique-components.mjs";

const active = new WeakSet();
export function techniqueTarget(targets=game.user.targets??[]) {
 const marked=[...targets];if(marked.length>1)throw Error("Marque somente um alvo; técnicas em área exigem resolução própria.");
 if(marked.length&&!marked[0].actor)throw Error("O alvo marcado não tem ficha.");
 if(marked.length&&marked[0].actor.type!=="knight")throw Error("Este fluxo atende alvos com ficha de cavaleiro.");
 return marked[0]?.actor??null;
}
export async function useTechnique(actor, item) {
  if (!actor?.isOwner || !item?.isOwner || item?.parent !== actor || item.type !== "technique") return;
  const reason = techniqueReadiness(item);
  if (reason) return ui.notifications.warn(reason);
  if (active.has(actor)) return ui.notifications.warn("Já existe uma ativação em andamento para este cavaleiro.");
  active.add(actor);
  try {
    if(!primaryGM()?.active)throw Error("É necessário um mestre ativo para processar a ativação.");
    assertNoTechniqueInterruption(actor);if(pendingTechnique(actor))throw Error("Já existe uma solicitação desta ficha aguardando processamento. Confira o chat antes de repetir.");
    const target=techniqueTarget(),baseline=activationState(actor,item),rollMode=techniqueRollMode();
    const effective=techniqueWithComponents(item),profile=effective.componentProfile;
    const content = await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/technique-dialog.hbs`, {
      name: item.name, cost: item.system.cost + item.system.costExtra, current: actor.system.resources.cosmo.value,
      extra: actor.system.resources.cosmoExtra, reserve: actor.system.resources.cosmoReserved,
      penalty: actor.system.combat.asterismPenalty, unlimited: actor.system.resources.cosmo.unlimited,targetName:target?.name,actions:actionView(actor),components:profile,hasExhaust:profile.rules.some(r=>r.kind==="exhaust"),hasEssence:profile.rules.some(r=>r.kind==="essence"),hasTerrain:profile.rules.some(r=>r.kind==="terrain")
    });
    const answer = await foundry.applications.api.DialogV2.wait({window: {title: "Ativar técnica"}, content,
      render:(_event,dialog)=>installTechniquePreview(dialog.form??dialog.element.querySelector("form"),actor.system,effective,actor),
      buttons: [{action: "activate", label: "Gastar CE e rolar", default: true, callback: (_event, button) => {
        return activationFormOptions(button.form);
      }}, {action: "cancel", label: "Cancelar", callback: () => null}], rejectClose: false});
    if (!answer || typeof answer !== "object") return;
    if(activationState(actor,item)!==baseline)throw Error("A ficha ou técnica mudou durante a prévia. Abra a ativação novamente.");
    const changed = techniqueReadiness(item);
    if (changed) throw Error(changed);
    const options={extra:0,elevate:0,condense:0,bonus:0,advantage:0,useExtra:true,allowOverload:false,...answer};
    techniqueActionPlan(actor,options,"preview");
    if(options.oppositeEssence&&!target)throw Error("Essência Alvo exige um alvo marcado.");
    const parameters = techniqueParameters(actor.system, effective, options);
    let payment = cosmoPayment(actor.system, parameters.cost, options);
    if (payment.lifeDamage) {
      const confirmed = await foundry.applications.api.DialogV2.confirm({window: {title: "Queimar além do limite do corpo"},
        content: `<p>Esta ativação ultrapassa a CE disponível em <strong>${payment.overload}</strong>. O excesso acumulado será ${actor.system.resources.cosmoOverload + payment.overload} CE e custará <strong>${payment.lifeDamage} PV</strong>.</p><p>Confirmar a queima e a rolagem?</p>`});
      if (!confirmed) return;
      // Se os recursos mudaram durante a confirmação, não cobre um valor diferente do autorizado.
      const refreshed = cosmoPayment(actor.system, parameters.cost, options);
      if (JSON.stringify(refreshed) !== JSON.stringify(payment)) throw Error("Os recursos mudaram durante a confirmação. Abra a ativação novamente.");
      payment = refreshed;
    }
    if (!actor.isOwner || item.parent !== actor || !actor.items.get(item.id)) return;
    return await submitTechniqueActivation(actor,item,{baseline,options,payment,target,rollMode});
  } catch (error) {
    console.error(`${SYSTEM_ID}: ativação`, error);
    ui.notifications.error(error.message);
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
