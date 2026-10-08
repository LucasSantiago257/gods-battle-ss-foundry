import {SYSTEM_ID, ATTRIBUTES, SKILLS} from "./config.mjs";
import {resolvePool, testParameters, classify} from "./rules.mjs";
import {resistancePreview} from "./technique-rules.mjs";

export async function evaluatePool(dice, modifier) {
  if (!Number.isInteger(dice) || dice < 1 || dice > 100 || !Number.isFinite(modifier)) throw Error("Parada ou modificador inválido.");
  const roll = await new Roll(`${dice}d10kh1`).evaluate();
  const result = resolvePool(roll.dice[0].results.map(r => r.result), modifier);
  const adjustment = result.tens * 2 - result.ones * 2 + result.modifier;
  const constant = await new Roll(String(Math.abs(adjustment))).evaluate();
  const messageRoll = Roll.fromTerms([...roll.terms, new foundry.dice.terms.OperatorTerm({operator: adjustment < 0 ? "-" : "+"}), ...constant.terms]);
  if (!Number.isFinite(messageRoll.total)) await messageRoll.evaluate();
  return {result, messageRoll};
}
export async function prepareRollMessage(actor, roll, context, {template = "chat", flags = {}} = {}) {
  const content = await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/${template}.hbs`, context);
  const message = {speaker: ChatMessage.getSpeaker({actor}), content, rolls: [roll], flags: {[SYSTEM_ID]: flags}};
  ChatMessage.applyRollMode(message, game.settings.get("core", "rollMode"));
  return message;
}

export async function rollTest(actor, kind, key, options = {}) {
  if (!actor.isOwner) return;
  const label = kind === "skill" ? SKILLS[key]?.label : ATTRIBUTES[key];
  if (!label) return;
  const parameters = testParameters(actor.system, kind, key, game.settings.get(SYSTEM_ID, "resistanceMode"), {technique:!!options.resistanceAttack});
  const pendingPenalty = kind === "skill" && key === "asterism" ? actor.system.combat.asterismPenalty ?? 0 : 0;
  parameters.modifier += pendingPenalty;
  const difficulty = Number.isFinite(options.difficulty) ? options.difficulty : 10;
  const answer = await foundry.applications.api.DialogV2.wait({window: {title: `${kind === "resistance" ? "Resistência: " : ""}${label}`},
    content: `<div class="form-group"><label>Dificuldade</label><input name="dc" type="number" value="${difficulty}" step="1"></div>
      <div class="form-group"><label>Modificador da situação</label><input name="bonus" type="number" value="0" step="1"></div>
      <div class="form-group"><label>Vantagem / desvantagem</label><select name="advantage"><option value="0">Normal</option><option value="1">Vantagem (+1 dado, +2)</option><option value="-1">Desvantagem (-1 dado, -2)</option></select></div>
      <p>${parameters.dice}d10; modificador base ${parameters.modifier >= 0 ? "+" : ""}${parameters.modifier}.</p>`,
    buttons: [{action: "roll", label: "Rolar", default: true, callback: (_event, button) => {
      const form = button.form;
      return {difficulty: Number(form.elements.dc.value), bonus: Number(form.elements.bonus.value), advantage: Number(form.elements.advantage.value)};
    }}, {action: "cancel", label: "Cancelar", callback: () => null}], rejectClose: false});
  if (!answer || typeof answer !== "object") return;
  if (!Object.values(answer).every(Number.isFinite) || ![-1, 0, 1].includes(answer.advantage)) return ui.notifications.warn("Informe valores numéricos válidos.");
  const dice = Math.max(1, Math.min(kind === "skill" ? 5 : 100, parameters.dice + answer.advantage));
  const {result, messageRoll} = await evaluatePool(dice, parameters.modifier + answer.bonus + answer.advantage * 2);
  const resistance = options.resistanceAttack ? resistancePreview(actor.system, actor.items.contents, options.resistanceAttack, result.total, answer.difficulty) : null;
  const message = await prepareRollMessage(actor, messageRoll, {label, resistance, attackName: options.resistanceAttack?.name,
    kind: kind === "resistance" ? "Resistência" : kind === "skill" ? "Perícia" : "Atributo", ...result, difficulty: answer.difficulty, outcome: classify(result.total, answer.difficulty)},
    {flags: {test: result, difficulty: answer.difficulty, ...(resistance ? {resistance, attack: options.resistanceAttack,
      ...(options.resistanceAttack.messageId ? {resolvedDamage:{actorUuid:actor.uuid,rootMessageId:options.resistanceAttack.messageId,body:resistance.damage,armor:resistance.armorDamage,armorId:actor.items.contents.find(i=>i.type==="armor"&&i.system.equipped&&i.system.health.value>=0&&i.system.state!=="dead")?.id??null}} : {})} : {})}});
  if (kind === "skill" && key === "asterism") await actor.update({"system.combat.asterismPenalty": result.total < answer.difficulty - 10 ? -10 : 0});
  return ChatMessage.create(message);
}
