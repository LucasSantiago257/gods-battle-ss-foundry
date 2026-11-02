// pp.205/225: preserve the published round/once profiles; opposition is separate.
// Pure numeric plans only. Runtime must authenticate payer, target identity and intent.
import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {cosmoPayment,paymentAuthorization} from "./technique-rules.mjs";
import {optionalNote} from "./form-values.mjs";
const copy=structuredClone,plain=o=>!!o&&typeof o==="object"&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
const same=(a,b)=>actionHash(a)===actionHash(b);
export function sustainPaymentKey(value){if(typeof value!=="string"||!/^[a-zA-Z0-9]{1,32}$/.test(value))throw Error("Identidade de recarga inv\u00e1lida.");return value;}
function ref(value,label){if(typeof value!=="string"||!value||value.length>256)throw Error(`${label} inv\u00e1lida.`);return value;}
function integer(value,label,min=0){if(!Number.isSafeInteger(value)||value<min)throw Error(`${label} inv\u00e1lido.`);return value;}
function recordOf(actor,key){
 sustainPaymentKey(key);if(actor?.type!=="knight"||typeof actor.uuid!=="string"||!/^(Actor\.|Scene\.)/.test(actor.uuid))throw Error("Escolha uma ficha ou token pagador.");
 const r=actor.flags?.[SYSTEM_ID]?.persistentEffects?.[key];
 if(!r||r.id!==key||r.actorUuid!==actor.uuid||r.kind!=="sustained"||r.damage!==0||!["active","ended"].includes(r.status))throw Error("Sustentada ausente ou de outra ficha.");return r;
}
function paymentMath(id,p,record,previous){
 sustainPaymentKey(id);
 if(!plain(p)||p.operationId!==id||p.cost!==1||p.mode!==record.mode||typeof p.unlimited!=="boolean")throw Error("Pagamento hist\u00f3rico de Sustentada inv\u00e1lido.");
 const round=integer(p.round,"Rodada de recarga",1),fromCurrent=integer(p.fromCurrent,"CE atual hist\u00f3rica"),fromExtra=integer(p.fromExtra,"CE extra hist\u00f3rica");
 if(round<=previous||round>record.paidUntilRound||(p.unlimited?(fromCurrent!==0||fromExtra!==0):(fromCurrent+fromExtra!==1)))throw Error("Valores hist\u00f3ricos de recarga incompat\u00edveis.");
 // Gap is a record of uncovered rounds, never proof of continuity or retroactive debt.
 const gap=round>previous+1?{first:previous+1,last:round-1}:null;
 if(!same(p.gap??null,gap))throw Error("Lacuna hist\u00f3rica de Sustentada inv\u00e1lida.");
 return {operationId:id,round,cost:1,mode:p.mode,fromCurrent,fromExtra,unlimited:p.unlimited,gap};
}
// No current Item, enemy resources, names, notes, opposition payload or condition flags.
export function sustainPaymentRecordMath(actor,key){
 const r=recordOf(actor,key),s=r.sustain,source=r.source;
 if(!plain(s)||s.cost!==1||!["round","once"].includes(s.mode)||source?.actorUuid!==actor.uuid||!["bronze","silver","gold"].includes(source?.classification))throw Error("Perfil capturado de Sustentada inv\u00e1lido.");
 ref(source.itemUuid,"T\u00e9cnica");if(!source.itemUuid.startsWith(`${actor.uuid}.Item.`)||!source.itemUuid.slice(`${actor.uuid}.Item.`.length)||source.itemUuid.slice(`${actor.uuid}.Item.`.length).includes("."))throw Error("Identidade da fonte de Sustentada inv\u00e1lida.");
 const firstRound=integer(r.firstRound,"Rodada inicial",1),lastRound=integer(r.lastRound,"Prazo inicial",firstRound),paidUntilRound=integer(s.paidUntilRound,"Rodada coberta",lastRound);
 if(lastRound-firstRound>=1000||r.rounds!==undefined&&r.rounds!==lastRound-firstRound+1)throw Error("Prazo inicial de Sustentada inv\u00e1lido.");
 if(r.time!==undefined&&(!Number.isFinite(r.time)||r.time<0))throw Error("Registro temporal inv\u00e1lido.");
 const record={actorUuid:actor.uuid,recordId:key,registration:{time:r.time??null,userId:r.userId===undefined?null:ref(r.userId,"Autor do registro")},status:r.status,combatUuid:ref(r.combatUuid,"Encontro"),combatantId:ref(r.combatantId,"Pagador"),source:{actorUuid:actor.uuid,itemUuid:source.itemUuid,classification:source.classification},firstRound,lastRound,targetUuid:ref(s.targetUuid,"Alvo"),targetCombatantId:ref(s.targetCombatantId,"Combatente alvo"),mode:s.mode,cost:1,paidUntilRound};
 if(!/^(Actor\.|Scene\.)/.test(record.targetUuid)||!plain(s.payments??{}))throw Error("Identidade/hist\u00f3rico de Sustentada inv\u00e1lido.");
 let previous=lastRound;
 const payments=Object.entries(s.payments??{}).sort((a,b)=>a[1]?.round-b[1]?.round).map(([id,p])=>{const result=paymentMath(id,p,record,previous);previous=result.round;return result;});
 if(previous!==paidUntilRound||s.mode==="once"&&payments.length>1)throw Error("Hist\u00f3rico/perfil de recarga incompat\u00edvel.");
 const marker=s.lastOperation,lastOperation=marker===undefined?null:{id:sustainPaymentKey(marker?.id),action:marker?.action};
 if(lastOperation&&(!["pay","end"].includes(lastOperation.action)||lastOperation.action==="pay"&&payments.at(-1)?.operationId!==lastOperation.id||lastOperation.action==="end"&&r.status!=="ended"))throw Error("\u00daltima recarga inv\u00e1lida.");
 return {...record,payments,lastOperation};
}
export function sustainPaymentSnapshot(actor,key){
 const r=actor.system?.resources;if(typeof r?.cosmo?.unlimited!=="boolean")throw Error("Recursos de CE inv\u00e1lidos.");
 return {resources:{current:integer(r.cosmo.value,"CE atual"),extra:integer(r.cosmoExtra,"CE extra"),reserved:integer(r.cosmoReserved,"CE reservada"),unlimited:r.cosmo.unlimited},record:sustainPaymentRecordMath(actor,key)};
}
export function sustainPaymentState(actor,key){return actionHash(sustainPaymentSnapshot(actor,key));}
export function sustainEndState(actor,key){return actionHash({record:sustainPaymentRecordMath(actor,key)});}
export function sustainPaymentContext(record,context){
 if(!plain(context)||context.combatUuid!==record.combatUuid||context.combatantId!==record.combatantId||context.targetUuid!==record.targetUuid||context.targetCombatantId!==record.targetCombatantId)throw Error("Encontro ou participante da recarga mudou.");
 const round=integer(context.round,"Rodada de recarga",1);
 if(record.status!=="active"||round<=record.paidUntilRound||record.mode==="once"&&record.payments.length)throw Error("Rodada coberta ou Sustentada encerrada; n\u00e3o repetir recarga.");
 return {combatUuid:record.combatUuid,combatantId:record.combatantId,targetUuid:record.targetUuid,targetCombatantId:record.targetCombatantId,round,epoch:ref(context.epoch,"\u00c9poca da inten\u00e7\u00e3o")};
}
function optionsOf(value){if(!plain(value)||typeof value.useExtra!=="boolean")throw Error("Escolha a prefer\u00eancia de CE extra.");return {useExtra:value.useExtra,reason:optionalNote(value.reason)};}
function payment(resources,useExtra){return paymentAuthorization(cosmoPayment({resources:{cosmo:{value:resources.current,unlimited:resources.unlimited},cosmoExtra:resources.extra,cosmoReserved:resources.reserved,cosmoOverload:0}},1,{useExtra,allowOverload:false}));}
export function sustainPaymentPreview(actor,key,values,context){
 const before=sustainPaymentSnapshot(actor,key),options=optionsOf(values),encounter=sustainPaymentContext(before.record,context),paid=payment(before.resources,options.useExtra),signature=actionHash({before,useExtra:options.useExtra,payment:paid,context:encounter});
 return {kind:"sustainPaymentOwned",version:1,signature,before,options,context:encounter,payment:paid,gap:encounter.round>before.record.paidUntilRound+1?{first:before.record.paidUntilRound+1,last:encounter.round-1}:null};
}
export function sustainPaymentPlan(actor,key,values,context,{operationId}={}){
 sustainPaymentKey(operationId);const p=sustainPaymentPreview(actor,key,values,context);
 if(p.before.record.payments.some(r=>r.operationId===operationId))throw Error("Inten\u00e7\u00e3o de recarga j\u00e1 registrada.");
 const entry={operationId,round:p.context.round,cost:1,mode:p.before.record.mode,fromCurrent:p.payment.fromCurrent,fromExtra:p.payment.fromExtra,unlimited:p.payment.unlimited,gap:p.gap};
 const after=copy(p.before);after.resources.current-=p.payment.fromCurrent;after.resources.extra-=p.payment.fromExtra;after.record.paidUntilRound=p.context.round;after.record.payments.push(entry);after.record.lastOperation={id:operationId,action:"pay"};
 return {...p,action:"pay",operationId,baseline:actionHash(p.before),after,entry};
}
export function sustainEndPlan(actor,key,{operationId,reason}={}){
 sustainPaymentKey(operationId);const before={record:sustainPaymentRecordMath(actor,key)};
 if(before.record.status!=="active")throw Error("Sustentada j\u00e1 encerrada.");
 if(before.record.payments.some(r=>r.operationId===operationId)||before.record.lastOperation?.id===operationId)throw Error("Inten\u00e7\u00e3o de recarga j\u00e1 registrada.");
 const after=copy(before);after.record.status="ended";after.record.lastOperation={id:operationId,action:"end"};
 return {kind:"sustainPaymentOwned",version:1,action:"end",operationId,baseline:actionHash(before),before,after,reason:optionalNote(reason)};
}
function actorFromSnapshot(snapshot){
 const m=snapshot?.record,r=snapshot?.resources;if(!m)throw Error("Snapshot de Sustentada ausente.");
 const actor={uuid:m.actorUuid,type:"knight",system:{resources:r?{cosmo:{value:r.current,unlimited:r.unlimited},cosmoExtra:r.extra,cosmoReserved:r.reserved}:{}},flags:{[SYSTEM_ID]:{persistentEffects:{}}}};
 actor.flags[SYSTEM_ID].persistentEffects[m.recordId]={id:m.recordId,actorUuid:m.actorUuid,kind:"sustained",damage:0,status:m.status,combatUuid:m.combatUuid,combatantId:m.combatantId,firstRound:m.firstRound,lastRound:m.lastRound,time:m.registration?.time??undefined,userId:m.registration?.userId??undefined,source:copy(m.source),sustain:{cost:1,mode:m.mode,targetUuid:m.targetUuid,targetCombatantId:m.targetCombatantId,paidUntilRound:m.paidUntilRound,payments:Object.fromEntries((m.payments??[]).map(p=>[p.operationId,copy(p)])),...(m.lastOperation?{lastOperation:copy(m.lastOperation)}:{})}};
 return actor;
}
// Validate stored numeric plans, return a normalized plan; patches/functions are never output.
export function validateSustainPaymentPlan(plan){
 if(!plain(plan)||plan.kind!=="sustainPaymentOwned"||plan.version!==1||!["pay","end"].includes(plan.action))throw Error("Plano de recarga inv\u00e1lido.");
 const actor=actorFromSnapshot(plan.before),key=plan.before.record.recordId;
 const expected=plan.action==="pay"?sustainPaymentPlan(actor,key,plan.options,plan.context,{operationId:plan.operationId}):sustainEndPlan(actor,key,{operationId:plan.operationId,reason:plan.reason});
 for(const key of Object.keys(expected))if(!same(plan[key],expected[key]))throw Error("Pagamento, identidade ou snapshot de Sustentada incompat\u00edvel.");
 return expected;
}
