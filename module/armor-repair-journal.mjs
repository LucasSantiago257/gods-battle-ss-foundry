// Value-only repair journals: validate arithmetic before completing a partial write.
import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {ARMOR_REPAIR,armorRepairPlan,armorRepairState} from "./armor-repair-rules.mjs";
import {optionalNote} from "./form-values.mjs";
export const repairSame=(a,b)=>actionHash(a)===actionHash(b);
export function repairKey(key){if(typeof key!=="string"||!/^[a-zA-Z0-9]{1,32}$/.test(key))throw Error("Registro de reparo inválido.");return key;}
export function repairRecord(actor,key){
 repairKey(key);const record=actor.flags?.[SYSTEM_ID]?.armorRepairs?.[key];
 if(!record||record.kind!=="armorRepair"||record.ruleVersion!==1||record.id!==key||record.actorUuid!==actor.uuid||!["active","ended"].includes(record.status)||!Number.isSafeInteger(record.revision)||record.revision<0||!Number.isSafeInteger(record.hours)||record.hours<0||!record.ticks||typeof record.ticks!=="object"||Array.isArray(record.ticks))throw Error("Trabalho de reparo ausente, inválido ou de outra ficha.");
 return record;
}
function documents(plan,payerSide="before",armorSide=payerSide){
 const source=plan.source,p=plan[payerSide].payer,a=plan[armorSide].armor;
 const payer={uuid:p.uuid,type:"knight",system:{profile:{level:source.level},resources:{health:{value:p.health},cosmo:{value:p.current,unlimited:p.unlimited},cosmoExtra:p.extra,cosmoReserved:p.reserved,cosmoOverload:p.overload}}};
 const target=a.actorUuid===p.uuid?payer:{uuid:a.actorUuid,type:"knight"};
 const item={id:source.id,uuid:source.uuid,name:source.name,type:"technique",parent:payer,system:{nature:"manipulation",effectKind:"control"},flags:{[SYSTEM_ID]:{source:{key:source.key}}}};
 const armor={id:a.id,uuid:a.uuid,name:a.name,type:"armor",parent:target,system:{state:a.state,class:a.classification,version:a.version,health:{value:a.health,max:a.maximum}}};
 payer.items={get:id=>id===item.id?item:target===payer&&id===armor.id?armor:null};if(target!==payer)target.items={get:id=>id===armor.id?armor:null};
 return {item,armor};
}
export function repairPointState(plan,payerSide,armorSide=payerSide){const d=documents(plan,payerSide,armorSide);return armorRepairState(d.item,d.armor);}
export function repairRecordAfter(operation){
 const {beforeRecord:before,id,direction,plan,userId,time}=operation;repairKey(id);
 if(!before||before.kind!=="armorRepair"||before.ruleVersion!==1||!["active","ended"].includes(before.status)||!before.ticks||typeof before.ticks!=="object"||Array.isArray(before.ticks)||before.actorUuid!==operation.actorUuid||before.id!==operation.recordId||!Number.isSafeInteger(before.revision)||before.revision<0||!Number.isSafeInteger(before.hours)||before.hours<0||Object.hasOwn(before.ticks??{},id)||Object.keys(before.ticks??{}).length>=1000)throw Error("Histórico de reparo inválido ou limite técnico atingido.");
 if(before.sourceUuid!==plan.source.uuid||before.actorUuid!==plan.source.actorUuid||before.armorUuid!==plan.before.armor.uuid||before.targetUuid!==plan.before.armor.actorUuid||operation.targetUuid!==before.targetUuid||plan.source.key!==ARMOR_REPAIR.key)throw Error("Vínculos do journal de reparo incompatíveis.");
 const after=structuredClone(before),hour=direction==="apply"?before.hours+1:before.hours;
 if(direction==="apply"){if(before.status!=="active")throw Error("Trabalho encerrado.");after.hours++;after.last=id;}
 else if(direction==="undo"){if(before.hours<1||before.last!==operation.originalId)throw Error("Somente a última hora pode ser desfeita.");after.hours--;after.last=operation.previousLast??null;}
 else throw Error("Sentido do reparo inválido.");
 after.revision++;if(!Number.isSafeInteger(after.revision)||!Number.isSafeInteger(after.hours))throw Error("Histórico fora do limite numérico.");after.ticks[id]={id,hour,direction,repair:plan.repair,cost:plan.cost,userId,time,reason:optionalNote(operation.reason),...(direction==="undo"?{originalId:operation.originalId}:{})};return after;
}
export function validateRepairJournal(operation,original=null){
 if(!operation||operation.kind!=="armorRepair"||!["prepared","applied","failed","reviewed"].includes(operation.status)||!Number.isFinite(operation.time)||typeof operation.userId!=="string")throw Error("Journal de reparo inválido.");
 repairKey(operation.id);repairKey(operation.recordId);
 const plan=operation.plan;if(!plan?.before||!plan.after||plan.kind!=="armorRepair"||plan.ruleVersion!==1||plan.source?.actorUuid!==operation.actorUuid)throw Error("Plano do journal inválido.");
 const d=documents(plan),expected=armorRepairPlan(d.item,d.armor,{...plan.options,reason:plan.reason});
 if(!repairSame(plan,expected)||!repairSame(operation.afterRecord,repairRecordAfter(operation)))throw Error("Matemática ou snapshots do journal alterados.");
 if(operation.direction==="undo"){
  validateRepairJournal(original);
  if(original.direction!=="apply"||original.status!=="applied"||original.id!==operation.originalId||original.recordId!==operation.recordId||original.actorUuid!==operation.actorUuid||original.afterRecord.hours!==operation.beforeRecord.hours||original.beforeRecord.last!==operation.previousLast||!repairSame(original.plan,plan))throw Error("Journal da hora a desfazer incompatível.");
 }
 return operation;
}
