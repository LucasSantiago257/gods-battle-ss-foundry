import {resistanceDefenseContext} from "./technique-defense-resolution.mjs";
import {techniqueDefenseResistance} from "./technique-defense-rules.mjs";
import {areaAttackFor} from "./area-rules.mjs";
import {actionHash} from "./action-rules.mjs";
import {SYSTEM_ID, ATTRIBUTES, SKILLS} from "./config.mjs";
import {resolvePool, testParameters, classify} from "./rules.mjs";
import {resistancePreview} from "./technique-rules.mjs";
import {assertNoTechniqueInterruption} from "./master-queue.mjs";
import {conditionPool,conditionSummary,conditionSignature} from "./condition-rules.mjs";
import {damageTurnSnapshot} from "./combat-rules.mjs";
import {attackResistanceComponent} from "./technique-components.mjs";

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
export async function prepareRollMessage(actor, roll, context, {template = "chat", flags = {},rollMode=game.settings.get("core", "rollMode")} = {}) {
  const content = await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/${template}.hbs`, context);
  const message = {speaker: ChatMessage.getSpeaker({actor}), content, rolls: roll?[roll]:[], flags: {[SYSTEM_ID]: flags}};
  ChatMessage.applyRollMode(message, rollMode);
  return message;
}

export async function rollTest(actor, kind, key, options = {}) {
  if (!actor.isOwner) return;
  if(kind==="skill"&&key==="asterism")try{assertNoTechniqueInterruption(actor);}catch(error){return ui.notifications.warn(error.message);}
  if(options.resistanceAttack?.targetUuid&&options.resistanceAttack.targetUuid!==actor.uuid)throw Error("Este resultado pertence ao alvo marcado da técnica.");
  const label = kind === "skill" ? SKILLS[key]?.label : ATTRIBUTES[key];
  if (!label) return;
  const conditionBaseline=conditionSignature(actor);
  const resistanceBaseline=JSON.stringify(options.resistanceAttack??null);
  const sourceId=options.resistanceAttack?.messageId,source=sourceId?game.messages?.get?.(sourceId):null;
  const sourceBaseline=source?actionHash(source.flags?.[SYSTEM_ID]?.attack):null;
  if(source){
    try{
      const original=source.flags?.[SYSTEM_ID]?.attack,expected=original?.areaTargets?areaAttackFor(original,actor.uuid):original,{messageId,...received}=options.resistanceAttack;
      if(source.isContentVisible===false||!expected||actionHash(expected)!==actionHash(received))return ui.notifications.warn("O ataque original mudou. Atualize o cartão antes de resistir.");
    }catch{return ui.notifications.warn("O ataque original ou alvo da área mudou. Atualize o cartão antes de resistir.");}
  }
  const defenseContext=resistanceDefenseContext(actor,source,game.user);
  const defenseUnchanged=()=>{try{return defenseContext.validate();}catch{return false;}};
  const defenderState=()=>actionHash({actorUuid:actor.uuid,system:actor.system.toObject?actor.system.toObject(false):actor.system,armors:(actor.items?.contents??[]).filter(i=>i.type==="armor").map(i=>({id:i.id,uuid:i.uuid,system:i.system.toObject?i.system.toObject(false):i.system}))});
  const defenderBaseline=options.resistanceAttack?defenderState():null;
  const resistanceUnchanged=()=>defenseUnchanged()&&JSON.stringify(options.resistanceAttack??null)===resistanceBaseline
    &&(!options.resistanceAttack||defenderState()===defenderBaseline)
    &&(!source||game.messages?.get?.(sourceId)===source&&source.isContentVisible!==false&&actionHash(source.flags?.[SYSTEM_ID]?.attack)===sourceBaseline);
  if(defenseContext.record&&!defenseContext.record.result.resistanceAllowed){
    if(!actor.isOwner||!resistanceUnchanged())return ui.notifications.warn("A defesa mudou; atualize o cartão.");
    const attack=options.resistanceAttack,resistance=techniqueDefenseResistance(actor.system,actor.items.contents,attack,defenseContext.record.result);
    const resolvedDamage={actorUuid:actor.uuid,rootMessageId:attack.messageId,body:resistance.damage,armor:resistance.armorDamage,...(defenseContext.stamp?{techniqueDefenseStamp:defenseContext.stamp}:{}),armorId:actor.items.contents.find(i=>i.type==="armor"&&i.system.equipped&&i.system.health.value>=0&&i.system.state!=="dead")?.id??null,turnSnapshot:Object.hasOwn(attack,"turnSnapshot")?attack.turnSnapshot:damageTurnSnapshot(actor)};
    const card=await prepareRollMessage(actor,null,{label,kind:"Dano",attackName:attack.name,resistance},{flags:{resistance,attack,resolvedDamage}});
    if(!actor.isOwner||conditionSignature(actor)!==conditionBaseline||!resistanceUnchanged())return ui.notifications.warn("A defesa ou ficha mudou antes de publicar o dano.");
    return ChatMessage.create(card);
  }
  const parameters = testParameters(actor.system, kind, key, game.settings.get(SYSTEM_ID, "resistanceMode"), {technique:!!options.resistanceAttack,conditions:false});
  const pendingPenalty = kind === "skill" && key === "asterism" ? actor.system.combat.asterismPenalty ?? 0 : 0;
  const componentResistance=options.resistanceAttack?attackResistanceComponent(options.resistanceAttack):null;
  parameters.modifier += pendingPenalty+(componentResistance?.modifier??0);
  const difficulty = Number.isFinite(options.difficulty) ? options.difficulty : 10;
  const answer = options.quick===true ? {difficulty,bonus:0,advantage:0} : await foundry.applications.api.DialogV2.wait({window: {title: `${kind === "resistance" ? "Resistência: " : ""}${label}`},
    content: `<div class="form-group"><label>Dificuldade${options.resistanceAttack?" · Poder Cósmico do ataque":""}</label><input name="dc" type="number" value="${difficulty}" step="1" ${options.resistanceAttack?"readonly":""}></div>
      <div class="form-group"><label>Modificador da situação</label><input name="bonus" type="number" value="0" step="1"></div>
      <div class="form-group"><label>Vantagem / desvantagem</label><select name="advantage"><option value="0">Normal</option><option value="1">Vantagem (+1 dado, +2)</option><option value="-1">Desvantagem (-1 dado, -2)</option></select></div>
      <p>${parameters.dice}d10; modificador base ${parameters.modifier >= 0 ? "+" : ""}${parameters.modifier}.</p>${componentResistance?`<p>${componentResistance.label}: ${componentResistance.modifier} no teste, já incluído (p.${componentResistance.page}).</p>`:""}<p>${conditionSummary(actor.system)}</p>`,
    buttons: [{action: "roll", label: "Rolar", default: true, callback: (_event, button) => {
      const form = button.form;
      return {difficulty: Number(form.elements.dc.value), bonus: Number(form.elements.bonus.value), advantage: Number(form.elements.advantage.value)};
    }}, {action: "cancel", label: "Cancelar", callback: () => null}], rejectClose: false});
  if (!answer || typeof answer !== "object") return;
  if(!actor.isOwner||conditionSignature(actor)!==conditionBaseline||!resistanceUnchanged())return ui.notifications.warn("A técnica, a ficha do defensor ou as condições mudaram durante a prévia. Abra o teste novamente.");
  if(options.resistanceAttack)answer.difficulty=difficulty;
  if (!Object.values(answer).every(Number.isFinite) || ![-1, 0, 1].includes(answer.advantage)) return ui.notifications.warn("Informe valores numéricos válidos.");
  const pool=conditionPool(actor.system,Math.max(1,parameters.dice+answer.advantage),parameters.modifier+answer.bonus+answer.advantage*2,{maxDice:kind==="skill"?5:100});
  const {result, messageRoll} = await evaluatePool(pool.dice,pool.modifier);
  if(!actor.isOwner||conditionSignature(actor)!==conditionBaseline||!resistanceUnchanged())return ui.notifications.warn("A técnica, a ficha do defensor ou as condições mudaram durante o teste. Confira a situação antes de rolar novamente.");
  const resistance = options.resistanceAttack ? defenseContext.record?techniqueDefenseResistance(actor.system,actor.items.contents,options.resistanceAttack,defenseContext.record.result,result.total,answer.difficulty):resistancePreview(actor.system, actor.items.contents, options.resistanceAttack, result.total, answer.difficulty) : null;
  const message = await prepareRollMessage(actor, messageRoll, {label, resistance, componentResistance, attackName: options.resistanceAttack?.name,
    kind: kind === "resistance" ? "Resistência" : kind === "skill" ? "Perícia" : "Atributo", ...result,conditionSummary:conditionSummary(actor.system), difficulty: answer.difficulty, outcome: classify(result.total, answer.difficulty)},
    {flags: {test: result, difficulty: answer.difficulty, ...(resistance ? {resistance, attack: options.resistanceAttack,
      ...(resistance.control?{controlResolution:{actorUuid:actor.uuid,rootMessageId:options.resistanceAttack.messageId,...resistance.control}}:{}),...(resistance.application==="damage"&&options.resistanceAttack.messageId ? {resolvedDamage:{actorUuid:actor.uuid,rootMessageId:options.resistanceAttack.messageId,body:resistance.damage,armor:resistance.armorDamage,...(defenseContext.stamp?{techniqueDefenseStamp:defenseContext.stamp}:{}),armorId:actor.items.contents.find(i=>i.type==="armor"&&i.system.equipped&&i.system.health.value>=0&&i.system.state!=="dead")?.id??null,turnSnapshot:Object.hasOwn(options.resistanceAttack,"turnSnapshot")?options.resistanceAttack.turnSnapshot:damageTurnSnapshot(actor)}} : {})} : {})}});
  if(!actor.isOwner||conditionSignature(actor)!==conditionBaseline||!resistanceUnchanged())return ui.notifications.warn("A técnica, a ficha do defensor ou as condições mudaram antes de publicar o teste.");
  if (kind === "skill" && key === "asterism") {try{assertNoTechniqueInterruption(actor);}catch(error){return ui.notifications.warn(error.message);}await actor.update({"system.combat.asterismPenalty": result.total < answer.difficulty - 10 ? -10 : 0});}
  return ChatMessage.create(message);
}
