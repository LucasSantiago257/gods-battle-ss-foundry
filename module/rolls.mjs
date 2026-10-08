import {SYSTEM_ID, ATTRIBUTES, SKILLS} from "./config.mjs";
import {resolvePool, testParameters, classify} from "./rules.mjs";

export async function rollTest(actor, kind, key) {
  if (!actor.isOwner) return;
  const label = kind === "skill" ? SKILLS[key]?.label : ATTRIBUTES[key];
  if (!label) return;
  const parameters = testParameters(actor.system, kind, key, game.settings.get(SYSTEM_ID, "resistanceMode"));
  const answer = await foundry.applications.api.DialogV2.wait({window: {title: `${kind === "resistance" ? "Resistência: " : ""}${label}`},
    content: `<div class="form-group"><label>Dificuldade</label><input name="dc" type="number" value="10" step="1"></div>
      <div class="form-group"><label>Modificador da situação</label><input name="bonus" type="number" value="0" step="1"></div>
      <div class="form-group"><label>Vantagem / desvantagem</label><select name="advantage"><option value="0">Normal</option><option value="1">Vantagem (+1 dado, +2)</option><option value="-1">Desvantagem (-1 dado, -2)</option></select></div>
      <p>${parameters.dice}d10; modificador base ${parameters.modifier >= 0 ? "+" : ""}${parameters.modifier}.</p>`,
    buttons: [{action: "roll", label: "Rolar", default: true, callback: (_event, button) => {
      const form = button.form;
      return {difficulty: Number(form.elements.dc.value), bonus: Number(form.elements.bonus.value), advantage: Number(form.elements.advantage.value)};
    }}, {action: "cancel", label: "Cancelar", callback: () => null}], rejectClose: false});
  if (!answer || typeof answer !== "object") return;
  if (!Object.values(answer).every(Number.isFinite)) return ui.notifications.warn("Informe valores numéricos válidos.");
  const dice = Math.max(1, parameters.dice + answer.advantage);
  const roll = await new Roll(`${dice}d10kh1`).evaluate();
  const result = resolvePool(roll.dice[0].results.map(r => r.result), parameters.modifier + answer.bonus + answer.advantage * 2);
  // A rolagem nativa salva no chat também precisa representar o total UmD10+.
  // Reutiliza a parada avaliada; o termo adicional é determinístico.
  const adjustment = result.tens * 2 - result.ones * 2 + result.modifier;
  const constant = await new Roll(String(Math.abs(adjustment))).evaluate();
  const messageRoll = Roll.fromTerms([...roll.terms, new foundry.dice.terms.OperatorTerm({operator: adjustment < 0 ? "-" : "+"}), ...constant.terms]);
  if (!Number.isFinite(messageRoll.total)) await messageRoll.evaluate();
  const content = await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/chat.hbs`, {label,
    kind: kind === "resistance" ? "Resistência" : kind === "skill" ? "Perícia" : "Atributo", ...result, difficulty: answer.difficulty, outcome: classify(result.total, answer.difficulty)});
  const mode = game.settings.get("core", "rollMode");
  const message = {speaker: ChatMessage.getSpeaker({actor}), content, rolls: [messageRoll], flags: {[SYSTEM_ID]: {test: result, difficulty: answer.difficulty}}};
  ChatMessage.applyRollMode(message, mode);
  return ChatMessage.create(message);
}
