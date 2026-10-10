import {SYSTEM_ID} from "./config.mjs";
import {techniqueReadiness,cosmoPayment} from "./technique-rules.mjs";
import {effectRecords,encounterForEffect} from "./effect-rules.mjs";
import {optionalNote} from "./form-values.mjs";
export const sustainedDefaults={bronze:2,silver:3,gold:4};
const keyOf=key=>{if(typeof key!=="string"||!/^[a-zA-Z0-9]{1,32}$/.test(key))throw Error("Registro de Sustentada inválido.");return key;};
export function sustainedSource(actor,item){
 if(item?.type!=="technique"||item.parent?.uuid!==actor.uuid||item.system.effectKind!=="sustained"||techniqueReadiness(item)||!sustainedDefaults[item.system.classification])throw Error("Escolha uma técnica Sustentada pronta, Bronze, Prata ou Ouro, da ficha pagadora.");
 return {itemUuid:item.uuid,actorUuid:actor.uuid,name:item.name,classification:item.system.classification,defaultRounds:sustainedDefaults[item.system.classification]};
}
export function sustainedDefinition(actor,item,target,answer){
 const source=sustainedSource(actor,item),context=encounterForEffect(actor),participant=encounterForEffect(target,context.combatUuid);
 if(game.combat?.uuid!==context.combatUuid||target.type!=="knight"||!target.isOwner)throw Error("Escolha um alvo acessível neste encontro.");
 const maintenanceMode=answer?.maintenanceMode??"round";if(!["round","once"].includes(maintenanceMode))throw Error("Escolha o perfil de recarga.");
 const rounds=answer?.rounds===null?source.defaultRounds:answer?.rounds;
 if(!Number.isSafeInteger(answer?.firstRound)||answer.firstRound<1||answer.firstRound>context.round||!Number.isSafeInteger(rounds)||rounds<1||rounds>1000)throw Error("Confira a rodada de ativação e duração inicial de1 a1000 rodadas.");
 const lastRound=answer.firstRound+rounds-1;if(!Number.isSafeInteger(lastRound))throw Error("Duração inicial fora do limite numérico.");
 if(context.round>lastRound+1)throw Error("O registro exige fase inicial ou primeira rodada de manutenção. Confira a duração antes de registrar.");
 return {kind:"sustained",label:source.name,source,page:"205/225",damage:0,firstRound:answer.firstRound,lastRound,rounds,reason:optionalNote(answer.reason),description:"Recarga de Sustentada; oposição e efeitos conferidos na mesa.",sustain:{cost:1,mode:maintenanceMode,targetUuid:target.uuid,targetName:target.name,targetCombatantId:participant.combatantId,paidUntilRound:lastRound,payments:{}},combatUuid:context.combatUuid,combatantId:context.combatantId};
}
export function sustainedView(actor,record){
 if(record.actorUuid!==actor.uuid)throw Error("Cópia de outra ficha; encerre/recrie o registro local.");
 if(record.status!=="active"||record.kind!=="sustained"||record.damage!==0||record.sustain?.cost!==1||!["round","once"].includes(record.sustain.mode)||record.source?.actorUuid!==actor.uuid||!sustainedDefaults[record.source?.classification])throw Error("Sustentada inativa ou parâmetros inválidos.");
 const s=record.sustain;
 if(!Number.isSafeInteger(record.firstRound)||record.firstRound<1||!Number.isSafeInteger(record.lastRound)||record.lastRound<record.firstRound||record.lastRound-record.firstRound>=1000||!Number.isSafeInteger(s.paidUntilRound)||s.paidUntilRound<record.lastRound||typeof s.targetUuid!=="string")throw Error("Duração/histórico de manutenção inválido.");
 const context=encounterForEffect(actor,record.combatUuid);
 if(game.combat?.uuid!==record.combatUuid||context.combatantId!==record.combatantId)throw Error("Encontro ou combatente pagador mudou.");
 const combat=game.combat,targets=(combat.combatants?.contents??[]).filter(m=>m.actor?.uuid===s.targetUuid);
 if(targets.length!==1||targets[0].id!==s.targetCombatantId||targets[0].actor.type!=="knight")throw Error("Alvo/combatente indisponível ou substituído.");
 const payments=Object.entries(s.payments??{});
 if(payments.some(([id,p])=>!p||p.operationId!==id||p.cost!==1||!Number.isSafeInteger(p.round)||p.round<=record.lastRound||p.round>s.paidUntilRound)||s.paidUntilRound!==payments.reduce((max,[,p])=>Math.max(max,p.round),record.lastRound))throw Error("Histórico de manutenção inválido.");
 const oneOff=s.mode==="once"&&payments.length>0,nextRound=oneOff?null:s.paidUntilRound+1;
 return {context,target:targets[0].actor,nextRound,overdue:!oneOff&&context.round>nextRound,canPay:!oneOff&&context.round>=nextRound,oneOff,mode:s.mode,phase:context.round<=record.lastRound?"initial":"maintenance",state:oneOff?"Recarga única registrada · oposição manual":context.round<=record.lastRound?"Duração inicial · sem recarga":context.round<=s.paidUntilRound?"Recarga registrada · oposição manual":context.round>nextRound?"Manutenção pendente · lacuna sem cobrança automática":"Manutenção pendente · 1 CE",record};
}
export function sustainedPaymentPlan(actor,key,answer){
 keyOf(key);const view=sustainedView(actor,effectRecords(actor)[key]??{});
 if(!view.canPay)throw Error("Esta rodada já está coberta pelo prazo inicial ou pagamento; retrocesso não repete a cobrança.");
 if(typeof answer?.useExtra!=="boolean")throw Error("Escolha como usar a CE extra.");
 const round=view.context.round;
 if(Object.values(actor.flags?.[SYSTEM_ID]?.effectOperations??{}).some(r=>r.kind==="sustainPayment"&&r.actorUuid===actor.uuid&&r.effectId===key&&["prepared","applied"].includes(r.status)&&r.round>=round))throw Error("Manutenção já registrada; recupere a operação existente.");
 return {...view,round,cost:1,payment:cosmoPayment(actor.system,1,{useExtra:answer.useExtra,allowOverload:false}),reason:optionalNote(answer.reason),gap:view.overdue?{first:view.nextRound,last:round-1}:null};
}
