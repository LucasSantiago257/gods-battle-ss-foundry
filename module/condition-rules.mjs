import {SYSTEM_ID} from "./config.mjs";
export const CONDITION_RULES=Object.freeze({tired:Object.freeze({label:"Cansado",page:"393",modifier:-2,dice:0,maxCount:1000,unit:"dias / níveis de cansaço"}),incapacitated:Object.freeze({label:"Incapacitado · membro debilitado",page:"397",modifier:-2,dice:1,maxCount:1000,unit:"membros debilitados"}),disoriented:Object.freeze({label:"Desorientado · sentidos perdidos",page:"393–394",modifier:-4,dice:1,maxCount:6,unit:"sentidos perdidos"})});
export const conditionRecords=actor=>actor.flags?.[SYSTEM_ID]?.conditionEffects??{};
export const conditionSignature=actor=>JSON.stringify({uuid:actor.uuid,records:conditionRecords(actor)});
export function conditionNumbers(key,count,modifierOverride=null){
 const rule=typeof key==="string"&&Object.hasOwn(CONDITION_RULES,key)?CONDITION_RULES[key]:null;
 if(!rule||!Number.isSafeInteger(count)||count<1||count>rule.maxCount)throw Error("Escolha condição e quantidade inteira válida: Desorientado1–6; demais1–1000.");
 if(key==="disoriented"&&modifierOverride!==null&&modifierOverride!==undefined&&(!Number.isSafeInteger(modifierOverride)||modifierOverride>0||modifierOverride< -100))throw Error("Modificador final de Desorientado: inteiro entre −100 e0, ou vazio para −4 por sentido.");
 return {modifier:key==="disoriented"&&modifierOverride!==null&&modifierOverride!==undefined?modifierOverride:rule.modifier*count,dice:rule.dice*count};
}
export function validCondition(actorUuid,r){
 if(!actorUuid||r?.actorUuid!==actorUuid||r.ruleVersion!==(r.key==="disoriented"?2:1)||r.reviewedManual!==true||r.status!=="active")return false;
 try{conditionNumbers(r.key,r.count,r.modifierOverride);return true;}catch{return false;}
}
export function conditionTotals(actorUuid,flags={}) {
 const entries=[],warnings=[];let modifier=0,dice=0;const used=new Set();
 for(const [id,r] of Object.entries(flags?.[SYSTEM_ID]?.conditionEffects??{})){
  if(r?.status!=="active")continue;
  if(!validCondition(actorUuid,r)){warnings.push({id,label:r.label??"Condição",reason:"Registro inválido ou copiado de outra ficha; aplicação manual."});continue;}
  const rule=CONDITION_RULES[r.key];if(used.has(r.key)){warnings.push({id,label:rule.label,reason:"Duplicata ativa da mesma condição; conferir com o mestre."});continue;}
  used.add(r.key);const entry={id,key:r.key,label:rule.label,page:rule.page,count:r.count,...conditionNumbers(r.key,r.count,r.modifierOverride)};entries.push(entry);modifier+=entry.modifier;dice+=entry.dice;
 }
 return {modifier,dice,entries,warnings};
}
export function conditionPool(system,dice,modifier,{maxDice=100}={}) {
 const loss=system.automation?.conditionDicePenalty??0,penalty=system.automation?.conditionModifier??0;
 if(!Number.isSafeInteger(loss)||loss<0||loss>1006||!Number.isFinite(penalty)||penalty>0||penalty< -4100)throw Error("Parcelas de condições inválidas; confira os registros.");
 return {dice:dice<1?dice:Math.max(1,Math.min(maxDice,dice-loss)),modifier:modifier+penalty};
}
export function conditionSummary(system) {
 const modifier=system.automation?.conditionModifier??0,dice=system.automation?.conditionDicePenalty??0;
 return modifier||dice?`Condições assistidas: ${modifier} no modificador; −${dice} dado(s), mínimo da jogada preservado. Referências: pp.393–394/397.`:"";
}
export function conditionDefinition(answer) {
 conditionNumbers(answer?.key,answer?.count,answer?.modifierOverride);
 const rule=CONDITION_RULES[answer.key],result={key:answer.key,label:rule.label,page:rule.page,count:answer.count,ruleVersion:answer.key==="disoriented"?2:1,reviewedManual:true};
 if(answer.key==="disoriented")result.modifierOverride=answer.modifierOverride??null;
 for(const [key,max] of [["reason",2000],["origin",500],["details",2000],["until",1000]]){const value=answer[key]??"";if(typeof value!=="string"||value.length>max)throw Error(`Preencha ${key} em até ${max} caracteres.`);result[key]=value.trim();}
 result.until ||= "Até encerrar";return result;
}
