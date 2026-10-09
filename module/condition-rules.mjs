import {SYSTEM_ID} from "./config.mjs";
export const CONDITION_RULES={tired:{label:"Cansado",page:"393",modifier:-2,dice:0,unit:"dias / níveis de cansaço conferidos"},incapacitated:{label:"Incapacitado · membro debilitado",page:"397",modifier:-2,dice:1,unit:"membros debilitados conferidos"}};
export const conditionRecords=actor=>actor.flags?.[SYSTEM_ID]?.conditionEffects??{};
export const conditionSignature=actor=>JSON.stringify({uuid:actor.uuid,records:conditionRecords(actor)});
export function conditionTotals(actorUuid,flags={}) {
 const entries=[],warnings=[];let modifier=0,dice=0;const used=new Set();
 for(const [id,r] of Object.entries(flags?.[SYSTEM_ID]?.conditionEffects??{})){
  if(r.status!=="active")continue;
  const rule=CONDITION_RULES[r.key];
  if(!actorUuid||r.actorUuid!==actorUuid||r.ruleVersion!==1||r.reviewedManual!==true||!rule||!Number.isSafeInteger(r.count)||r.count<1||r.count>1000){warnings.push({id,label:r.label??"Condição",reason:"Registro não conferido, inválido ou copiado de outra ficha; aplicação manual."});continue;}
  if(used.has(r.key)){warnings.push({id,label:rule.label,reason:"Duplicata ativa da mesma condição; conferir com o mestre."});continue;}
  used.add(r.key);const entry={id,key:r.key,label:rule.label,page:rule.page,count:r.count,modifier:rule.modifier*r.count,dice:rule.dice*r.count};entries.push(entry);modifier+=entry.modifier;dice+=entry.dice;
 }
 return {modifier,dice,entries,warnings};
}
export function conditionPool(system,dice,modifier,{maxDice=100}={}) {
 const loss=system.automation?.conditionDicePenalty??0,penalty=system.automation?.conditionModifier??0;
 if(!Number.isSafeInteger(loss)||loss<0||loss>1000||!Number.isFinite(penalty)||penalty>0||penalty< -4000)throw Error("Parcelas de condições inválidas; confira os registros.");
 return {dice:dice<1?dice:Math.max(1,Math.min(maxDice,dice-loss)),modifier:modifier+penalty};
}
export function conditionSummary(system) {
 const modifier=system.automation?.conditionModifier??0,dice=system.automation?.conditionDicePenalty??0;
 return modifier||dice?`Condições assistidas: ${modifier} no modificador; −${dice} dado(s), mínimo da jogada preservado. Referências: pp.393/397.`:"";
}
export function conditionDefinition(answer) {
 const rule=CONDITION_RULES[answer?.key];if(!rule||!answer.reviewedManual||!Number.isSafeInteger(answer.count)||answer.count<1||answer.count>1000)throw Error("Escolha a condição, quantidade inteira e confirme a revisão dos ajustes manuais.");
 const result={key:answer.key,label:rule.label,page:rule.page,count:answer.count,ruleVersion:1,reviewedManual:true};
 for(const [key,max,required] of [["reason",2000,true],["origin",500,false],["details",2000,false],["until",1000,true]]){const value=answer[key]??"";if(typeof value!=="string"||value.length>max||required&&!value.trim())throw Error(`Preencha ${key} em até ${max} caracteres.`);result[key]=value.trim();}
 return result;
}
