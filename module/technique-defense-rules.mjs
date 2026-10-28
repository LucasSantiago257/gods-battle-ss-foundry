// pp.213–214: defensive damage is subtracted before resistance, not extra actions.
// Pure calculation only. Callers must authenticate, bind and journal a real attempt.
import {NATURES} from "./config.mjs";
import {techniqueParameters,techniqueOutcome,cosmoPayment,paymentAuthorization,resistancePreview} from "./technique-rules.mjs";

export const TECHNIQUE_DEFENSE=Object.freeze({version:1,page:"213–214",blockerId:"cc363cf3fc9795fb",blockerKey:"virtue:TÉCNICA:BLOQUEADOR DE TÉCNICAS",blockerPage:"178"});
const limit=1000000; // Technical bound, not a character or book limit.
function amount(value,label){if(!Number.isFinite(value)||value<0||value>limit)throw Error(`${label}: informe um valor válido.`);return value;}
function object(value){return value&&typeof value==="object"&&[Object.prototype,null].includes(Object.getPrototypeOf(value));}
function projection(technique,options){
 if(!object(technique)||!object(options))throw Error("Parâmetros de defesa inválidos.");
 if(!["damage","control","sustained","manual"].includes(technique.effectKind??"damage"))throw Error("Este primordial exige seu fluxo próprio de defesa.");
 if(technique.componentProfile?.enabled||technique.movement||options.areaTargets!==undefined||options.distanceSnapshot!==undefined)throw Error("Componentes, Movendo, área e distância da defesa exigem resolução própria.");
 if(typeof (options.blocker??false)!=="boolean")throw Error("Perfil de Bloqueador inválido.");
 // A local numeric projection never changes the Item's actual primordial or duration.
 return {...technique,effectKind:"damage",controlRounds:0};
}
export function techniqueDefenseParameters(system,technique,options={}){
 const numeric=projection(technique,options),blocker=options.blocker??false;
 const bonus=options.bonus??0;if(!Number.isFinite(bonus)||Math.abs(bonus)>limit)throw Error("Modificador de defesa inválido.");
 const parameters=techniqueParameters(system,numeric,{...options,bonus:bonus+(blocker?2:0)});
 for(const [key,label] of [["cost","CE"],["difficulty","Dificuldade"],["power","Poder"],["baseDamageLevel","ND"]])amount(parameters[key],label);
 if(parameters.power<1||parameters.baseDamageLevel<1||!Number.isFinite(parameters.modifier))throw Error("Configure ND, Poder e modificador válidos para esta defesa.");
 return {...parameters,blocker,defenseMode:true};
}
export function techniqueDefenseOutcome(system,technique,options,total){
 if(!Number.isFinite(total)||Math.abs(total)>limit)throw Error("Resultado de Asterismo inválido.");
 const parameters=techniqueDefenseParameters(system,technique,options),numeric={...technique,effectKind:"damage",controlRounds:0};
 const result=techniqueOutcome(system,numeric,parameters,total),criticalFailure=total<parameters.difficulty-10;
 const calculatedDefense=amount(result.damage,"Defesa calculada");
 let defense=calculatedDefense;
 if(Object.hasOwn(options??{},"defense")){
  const adjusted=amount(options.defense,"Defesa ajustada");
  if(!result.success&&adjusted!==0)throw Error("Um teste falho não produz abatimento; resolva a exceção como resultado manual separado.");
  defense=adjusted;
 }
 return {version:1,kind:"techniqueDefense",outcome:result.outcome,success:result.success,critical:result.critical,criticalFailure,blocker:parameters.blocker,damageLevel:result.damageLevel,calculatedDefense,defense,adjusted:defense!==calculatedDefense,resistanceAllowed:!criticalFailure||parameters.blocker,nextPenalty:parameters.blocker?0:result.nextPenalty};
}
export function techniqueDefensePreview(system,technique,options={}){
 const parameters=techniqueDefenseParameters(system,technique,options);let payment=null,error="";
 try{payment=paymentAuthorization(cosmoPayment(system,parameters.cost,options));}catch(e){error=e.message;}
 return {parameters,normal:techniqueDefenseOutcome(system,technique,options,parameters.difficulty),critical:techniqueDefenseOutcome(system,technique,options,parameters.difficulty+11),payment,error};
}
function validatedOutcome(defense){
 if(!object(defense)||defense.version!==1||defense.kind!=="techniqueDefense"||["success","critical","criticalFailure","blocker","resistanceAllowed"].some(k=>typeof defense[k]!=="boolean"))throw Error("Resultado da defesa inválido.");
 amount(defense.defense,"Defesa");
 if(defense.critical&&!defense.success||defense.success&&defense.criticalFailure||!defense.success&&defense.defense!==0||defense.resistanceAllowed!==(!defense.criticalFailure||defense.blocker))throw Error("Resultado da defesa incompatível.");
 return defense;
}
export function techniqueDefenseRemainder(attack,defense){
 if(!object(attack)||(attack.effectKind??"damage")!=="damage"||!NATURES[attack.nature])throw Error("Esta defesa numérica exige um ataque de técnica com dano.");
 amount(attack.damage,"Dano recebido");amount(attack.armorDamage,"Dano à armadura");amount(attack.powerCosmic,"Poder Cósmico");
 const d=validatedOutcome(defense),blocked=Math.min(attack.damage,d.defense),remaining=attack.damage-blocked;
 // Do not derive armor absorption from the body amount, or immunity to extra effects.
 return {incoming:attack.damage,blocked,remaining,resistanceAllowed:d.resistanceAllowed,armorManual:blocked>0&&attack.armorDamage>0,attack:{...structuredClone(attack),damage:remaining}};
}
export function techniqueDefenseResistance(system,items,attack,defense,total,difficulty=attack.powerCosmic){
 const remainder=techniqueDefenseRemainder(attack,defense);let result;
 if(remainder.resistanceAllowed){
  if(!Number.isFinite(total)||!Number.isFinite(difficulty))throw Error("Resultado de resistência inválido.");
  result=resistancePreview(system,items,remainder.attack,total,difficulty);
 }else{
  // Failure of the defense removes the resistance roll; it does not invent a
  // critical resistance result. Only the ordinary unarmored multiplier remains.
  const armor=items.find(i=>i.type==="armor"&&i.system.equipped&&i.system.health.value>=0&&i.system.state!=="dead");
  result={application:"damage",outcome:"Sem resistência",damage:remainder.remaining*(armor?1:2),armorDamage:armor?attack.armorDamage:0,unarmored:!armor,effectsResisted:false,doubleDuration:false,resistanceSkipped:true};
 }
 return {...result,techniqueDefense:{incoming:remainder.incoming,blocked:remainder.blocked,remaining:remainder.remaining,armorManual:remainder.armorManual,resistanceAllowed:remainder.resistanceAllowed}};
}
