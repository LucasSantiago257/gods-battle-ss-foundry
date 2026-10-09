import {activationPreview} from "./technique-rules.mjs";
import {techniqueActionPlan} from "./action-rules.mjs";
export function activationFormOptions(form) {
 const e=form.elements;
 return {extra:Number(e.extra?.value??0),elevate:Number(e.elevate?.value??0),condense:Number(e.condense?.value??0),bonus:Number(e.bonus?.value??0),advantage:Number(e.advantage?.value??0),useExtra:e.useExtra?.checked??true,allowOverload:e.allowOverload?.checked??false,...(e.actionPool?{actionPool:e.actionPool.value}:{}),...(e.exhaust?{exhaust:Number(e.exhaust.value)}:{}),...(e.oppositeEssence?{oppositeEssence:e.oppositeEssence.checked}:{}),...(e.favorableTerrain?{favorableTerrain:e.favorableTerrain.checked}:{}),...(e.componentReason?{componentReason:e.componentReason.value}:{})};
}
export function techniquePreviewLabels(system,technique,options={}) {
 const p=activationPreview(system,technique,options),payment=p.payment;
 return {cost:`${p.parameters.cost} CE`,difficulty:String(p.parameters.difficulty),powerCosmic:String(p.parameters.powerCosmic),damage:String(p.normal.damage),criticalDamage:String(p.critical.damage),armorDamage:String(p.normal.armorDamage),criticalArmorDamage:String(p.critical.armorDamage),roll:`${p.parameters.dice}d10 · modificador ${p.parameters.modifier} · ${p.parameters.attributeLabel}`,conditions:p.parameters.conditionSummary,formula:p.formula,
  components:p.parameters.components.entries.map(e=>`${e.label} (p.${e.page}): ${e.applied}${e.kind==="space"?" m extras":" ND extras"}`).join(" · "),range:`${p.parameters.components.range} m (base ${technique.range??0} + ${p.parameters.components.rangeBonus})`,payment:payment?payment.unlimited?"CE ilimitada pela armadura.":`${payment.fromExtra} extra + ${payment.fromCurrent} atual${payment.overload?` + ${payment.overload} acima do limite (−${payment.lifeDamage} PV)`:""}`:"Pagamento pendente.",error:p.error};
}
export function installTechniquePreview(form,system,technique,actor=null) {
 const update=()=>{
  let values;
  try{const options=activationFormOptions(form);values=techniquePreviewLabels(system,technique,options);if(actor)techniqueActionPlan(actor,options,"preview");}catch(error){values={error:error.message};}
  for(const output of form.querySelectorAll("[data-technique-preview]"))output.textContent=values[output.dataset.techniquePreview]??"—";
  const button=form.querySelector('[data-action="activate"]');if(button)button.disabled=!!values.error;
 };
 form.addEventListener("input",update);form.addEventListener("change",update);update();return update;
}
