import {SYSTEM_ID} from "./config.mjs";
import {optionalNote} from "./form-values.mjs";
export const DEPOSIT_MODES=Object.freeze({current:"Somente CE atual",capacity:"CE atual e máximo enquanto depositado"});
export const DEPOSIT_RULES=Object.freeze({
 roses:Object.freeze({key:"technique:physical:OURO:ROSA DIABÓLICA REAL POLÉN",type:"technique",amount:5,page:"281–282",event:"Técnica cessou",preparation:"Preparar pelo menos um dia antes; ativação consome 9 CE separadamente."}),
 coffin:Object.freeze({key:"technique:natural:OURO:GELO ETERNO / ATAÚDE DE GELO (Água)",type:"technique",amount:1,page:"357–358",event:"Ataúde se quebrou",preparation:"Criação e custo 5 CE separados; não pode ser usada em combate."}),
 fruit:Object.freeze({key:"aesir:ability:27:BENÇÃO DE EIR",type:"ability",amount:5,page:"553",event:"Fruta consumida",preparation:"Depósito opcional para conservar o fruto por dias. Cura e retirada de estados resolvidas separadamente."})
});
export const depositRecords=actor=>actor.flags?.[SYSTEM_ID]?.cosmoDeposits??{};
export const depositKey=key=>{if(typeof key!=="string"||!/^[a-zA-Z0-9]{1,32}$/.test(key))throw Error("Identificador de depósito inválido.");return key;};
const int=(v,label)=>{if(!Number.isSafeInteger(v)||v<0||v>1000000)throw Error(`${label} inválida.`);return v;};
export function depositSource(actor,item){
 const key=item?.flags?.[SYSTEM_ID]?.source?.key,entry=Object.entries(DEPOSIT_RULES).find(([,r])=>r.key===key&&r.type===item.type);
 if(!entry||item.parent?.uuid!==actor.uuid||actor.items?.get(item.id)?.uuid!==item.uuid||item.flags?.[SYSTEM_ID]?.techniqueDraft||item.flags?.[SYSTEM_ID]?.techniqueBuilder?.status==="draft")throw Error("Escolha uma cópia própria da Rosa/Pólen, Ataúde de Gelo ou Benção de Eir do catálogo.");
 return {contract:entry[0],...entry[1],itemUuid:item.uuid,actorUuid:actor.uuid,name:item.name};
}
export function validDeposit(actorUuid,r){
 const rule=Object.hasOwn(DEPOSIT_RULES,r?.contract??"")?DEPOSIT_RULES[r.contract]:null;
 return typeof actorUuid==="string"&&actorUuid.length>0&&!!rule&&!!r.source&&r.actorUuid===actorUuid&&r.source?.actorUuid===actorUuid&&r.source.key===rule.key&&typeof r.source.itemUuid==="string"&&r.amount===rule.amount&&Object.hasOwn(DEPOSIT_MODES,r.mode??"")&&typeof r.object==="string"&&r.object.trim().length>0&&r.object.length<=120&&["active","returned"].includes(r.status)&&typeof r.operationId==="string"&&/^[a-zA-Z0-9]{1,32}$/.test(r.operationId)&&(r.status==="active"?!r.return:r.return?.event===rule.event&&typeof r.return.operationId==="string"&&/^[a-zA-Z0-9]{1,32}$/.test(r.return.operationId));
}
// Cópias não recebem efeitos financeiros de um diário cujo UUID pertence à ficha original.
export function depositCapacity(actorUuid,flags){
 return Object.values(flags?.[SYSTEM_ID]?.cosmoDeposits??{}).reduce((sum,r)=>sum+(validDeposit(actorUuid,r)&&r.status==="active"&&r.mode==="capacity"?r.amount:0),0);
}
export function depositPlan(actor,item,answer){
 const source=depositSource(actor,item),mode=answer.mode;
 if(!Object.hasOwn(DEPOSIT_MODES,mode??""))throw Error("Selecione o tratamento da CE permanente usado pela mesa.");
 if(typeof answer.object!=="string"||!answer.object.trim()||answer.object.trim().length>120)throw Error("Identifique o jardim, ataúde ou fruto (até 120 caracteres).");
 const object=answer.object.trim(),objectKey=object.normalize("NFC").toLocaleLowerCase("pt-BR");
 const records=depositRecords(actor);
 if(Object.values(records).some(r=>r?.actorUuid===actor.uuid&&!validDeposit(actor.uuid,r)))throw Error("Há depósito inconsistente nesta ficha; confira antes de alterar CE.");
 if(Object.values(records).some(r=>r?.actorUuid===actor.uuid&&r.status==="active"&&r.contract===source.contract&&r.object.normalize("NFC").toLocaleLowerCase("pt-BR")===objectKey))throw Error("Já há depósito ativo para este objeto e regra. Devolva pelo registro existente.");
 const current=int(actor.system.resources.cosmo.value,"CE atual"),reserve=int(actor.system.resources.cosmoReserved,"Reserva");
 if(actor.system.resources.cosmo.unlimited)throw Error("Depósito com CE ilimitada exige resolução manual; não há saldo finito para este registro.");
 if(current-reserve<source.amount)throw Error("CE atual livre insuficiente para o depósito. CE extra, reserva e sobrecarga não são utilizadas.");
 if(mode==="capacity"&&int(actor.system.resources.cosmo.max,"CE máxima")<source.amount)throw Error("CE máxima insuficiente para manter o depósito neste perfil.");
 return {source,mode,object,amount:source.amount,before:current,after:current-source.amount,reason:optionalNote(answer.reason)};
}
export function returnDepositPlan(actor,key,answer){
 depositKey(key);const record=depositRecords(actor)[key];
 if(!validDeposit(actor.uuid,record)||record.status!=="active")throw Error("Não há depósito ativo próprio válido para devolver.");
 const rule=DEPOSIT_RULES[record.contract];if(answer.event!==rule.event)throw Error("Selecione o evento de devolução desta regra.");
 const before=actor.system.resources.cosmo.value,after=before+record.amount;
 if(!Number.isSafeInteger(before)||before< -100000||before>1000000||!Number.isSafeInteger(after)||after< -100000||after>1000000)throw Error("Saldo de CE inválido para devolução; preserve ajustes e confira manualmente.");
 return {record,before,after,reason:optionalNote(answer.reason),event:rule.event};
}
