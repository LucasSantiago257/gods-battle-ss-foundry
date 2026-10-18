import {areaGeometry,renderAreaGeometry} from "./area-geometry.mjs";
import {refreshAreaSelection,areaMeasurements} from "./area-preview.mjs";
import {techniqueDistance,techniqueDistanceLabel,previewDistanceSnapshot} from "./technique-distance.mjs";
import {activationPreview} from "./technique-rules.mjs";
import {techniqueActionPlan} from "./action-rules.mjs";
export function activationFormOptions(form) {
 const e=form.elements;
 if(e.applyDistance?.checked&&!form.distanceSnapshot)throw Error("Atualize a medida antes de aplicar a redução por distância.");
 return {...(form.areaTargets?{areaTargets:structuredClone(form.areaTargets)}:{}),...(e.applyDistance?.checked?{distanceSnapshot:structuredClone(form.distanceSnapshot)}:{}),extra:Number(e.extra?.value??0),elevate:Number(e.elevate?.value??0),condense:Number(e.condense?.value??0),bonus:Number(e.bonus?.value??0),advantage:Number(e.advantage?.value??0),useExtra:e.useExtra?.checked??true,allowOverload:e.allowOverload?.checked??false,...(e.actionPool?{actionPool:e.actionPool.value}:{}),...(e.exhaust?{exhaust:Number(e.exhaust.value)}:{}),...(e.oppositeEssence?{oppositeEssence:e.oppositeEssence.checked}:{}),...(e.favorableTerrain?{favorableTerrain:e.favorableTerrain.checked}:{}),...(e.componentReason?{componentReason:e.componentReason.value}:{})};
}
export function techniquePreviewLabels(system,technique,options={}) {
 const p=activationPreview(system,technique,options),payment=p.payment;
 return {area:p.parameters.area?`Área: ${p.parameters.area.count} alvos · +${p.parameters.area.extraCost} CE uma vez · +${p.parameters.area.difficultyExtra} na dificuldade · dano corporal dividido, armadura por alvo (p.210).`:"",distanceReduction:p.parameters.distance?`Distância: −${p.parameters.distance.levels} ${p.parameters.distance.powerCosmic?"PC":"ND"} já incluído (p.204). Custo e dificuldade do Asterismo preservados.`:"Redução por distância manual.",cost:`${p.parameters.cost} CE`,difficulty:String(p.parameters.difficulty),powerCosmic:String(p.parameters.powerCosmic),damage:String(p.normal.damage),criticalDamage:String(p.critical.damage),armorDamage:String(p.normal.armorDamage),criticalArmorDamage:String(p.critical.armorDamage),roll:`${p.parameters.dice}d10 · modificador ${p.parameters.modifier} · ${p.parameters.attributeLabel}`,conditions:p.parameters.conditionSummary,formula:p.formula,
  duration:p.parameters.control?`${p.parameters.control.baseRounds} rodadas, incluindo a ativação${p.parameters.control.mode==="manual"?" · duração manual":" · padrão da classe"}. Falha crítica na resistência dobra este prazo.`:"Duração conforme a técnica.",components:p.parameters.components.entries.map(e=>`${e.label} (p.${e.page}): ${e.applied}${e.kind==="space"?" m extras":e.kind==="stars"?" PC extra":e.kind==="destruction"?" no teste de resistência":" ND extras"}`).join(" · "),range:`${p.parameters.components.range} m (base ${technique.range??0} + ${p.parameters.components.rangeBonus})`,payment:payment?payment.unlimited?"CE ilimitada pela armadura.":`${payment.fromExtra} extra + ${payment.fromCurrent} atual${payment.overload?` + ${payment.overload} acima do limite (−${payment.lifeDamage} PV)`:""}`:"Pagamento pendente.",error:p.error};
}
export function installTechniquePreview(form,system,technique,actor=null,targetToken=null,areaTargets=null) {
 form.areaTargets=areaTargets?structuredClone(areaTargets):null;
 if(areaTargets){const distance=form.elements.applyDistance;if(distance){distance.checked=false;distance.disabled=true;}}
 const update=(refresh=false)=>{
  let values;
  try{if(areaTargets&&refresh===true)form.areaTargets=refreshAreaSelection(form.areaTargets);form.distanceSnapshot=undefined;if(form.elements.applyDistance?.checked)form.distanceSnapshot=previewDistanceSnapshot(actor,targetToken);const options=activationFormOptions(form);values=techniquePreviewLabels(system,technique,options);values.distance=areaTargets?"Área: forma, alcance e distância de cada alvo conferidos na mesa; redução automática de distância indisponível neste grupo.":techniqueDistanceLabel(options.distanceSnapshot?{available:true,distance:options.distanceSnapshot.distance}:techniqueDistance(actor,targetToken),activationPreview(system,technique,options).parameters.components.range,!!options.distanceSnapshot);if(actor)techniqueActionPlan(actor,options,"preview");
   if(areaTargets){
    const range=activationPreview(system,technique,options).parameters.components.range;
    const rows=areaMeasurements(actor,form.areaTargets,range);
    const shape=form.elements.areaShape?.value??"none",geometry=areaGeometry(actor,form.areaTargets,range,{shape,direction:form.elements.areaDirection?.value,angle:form.elements.areaAngle?.value});
    values.geometryNote=geometry.reason;
    renderAreaGeometry(form.querySelector("[data-area-geometry-map]"),geometry);
    const coneFields=form.querySelector("[data-area-cone-fields]");if(coneFields)coneFields.hidden=shape!=="cone";
    for(const output of form.querySelectorAll("[data-area-geometry-state]")){if(!output.dataset.areaGeometryState)continue;const entry=geometry.entries.find(e=>e.tokenUuid===output.dataset.areaGeometryState);output.textContent=entry?entry.inside===null?` · ${entry.reason}`:` · Centro ${entry.inside?"dentro":"fora"} da referência`:"";}
    for(const output of form.querySelectorAll("[data-area-field]")){const row=rows.find(r=>r.tokenUuid===output.dataset.areaToken);output.textContent=row?(output.dataset.areaField==="name"&&geometry.available?`${rows.indexOf(row)+1}. ${row.name}`:row[output.dataset.areaField]):"—";}
    if(rows.some(r=>r.changed))values.error="Os alvos se moveram ou mudaram desde a prévia. Use Atualizar prévia da área; para trocar alvos, reabra a ativação.";
   }}catch(error){renderAreaGeometry(form.querySelector("[data-area-geometry-map]"),{available:false});for(const output of form.querySelectorAll("[data-area-geometry-state]"))if(output.dataset.areaGeometryState)output.textContent="";values={error:error.message};if(areaTargets)for(const output of form.querySelectorAll("[data-area-field]"))if(output.dataset.areaField!=="name")output.textContent=output.dataset.areaField==="distanceText"?"—":"Prévia indisponível; confira os alvos.";}
  for(const output of form.querySelectorAll("[data-technique-preview]"))output.textContent=values[output.dataset.techniquePreview]??"—";
  const button=form.querySelector('[data-action="activate"]');if(button)button.disabled=!!values.error;
 };
 form.querySelector('[data-action="refreshArea"]')?.addEventListener("click",()=>update(true));
 form.querySelector('[data-action="measureTechnique"]')?.addEventListener("click",update);
 form.addEventListener("input",update);form.addEventListener("change",update);update(true);return update;
}
