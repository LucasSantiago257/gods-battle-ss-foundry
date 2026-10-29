// p.208: reuse the published generic retry; no state-specific condition rules.
// Pure plans only. Runtime must authenticate the real target, context and intent.
import {SYSTEM_ID,NATURES} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {testParameters,resolvePool,classify} from "./rules.mjs";
import {conditionPool} from "./condition-rules.mjs";
import {cosmoPayment,paymentAuthorization} from "./technique-rules.mjs";
import {optionalNote} from "./form-values.mjs";
const copy=structuredClone,costs={bronze:1,silver:1,gold:2},attrs=["vig","vel","sen","cos"];
export function controlRetryKey(value){if(typeof value!=="string"||!/^[a-zA-Z0-9]{1,32}$/.test(value))throw Error("Identidade de tentativa inválida.");return value;}
const ref=(v,label)=>{if(typeof v!=="string"||!v||v.length>256)throw Error(`${label} inválida.`);return v;};
const optionalRef=(v,label)=>v===undefined||v===null?null:ref(v,label);
function integer(v,label,min=0){if(!Number.isSafeInteger(v)||v<min||v>1000000)throw Error(`${label} inválido.`);return v;}
function number(v,label){if(!Number.isFinite(v)||Math.abs(v)>1000000)throw Error(`${label} inválido.`);return v;}
const plain=o=>!!o&&typeof o==="object"&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
const same=(a,b)=>actionHash(a)===actionHash(b);
function retryMath(id,r,record){
 controlRetryKey(id);if(!plain(r)||r.operationId!==id||!Number.isSafeInteger(r.round)||r.round<=record.firstRound||r.round>record.lastRound||!attrs.includes(r.attribute)||typeof r.success!=="boolean"||typeof r.end!=="boolean"||r.end&&!r.success||typeof r.unlimited!=="boolean")throw Error("Histórico de tentativas inválido.");
 number(r.total,"Resultado");number(r.difficulty,"Dificuldade");if(r.success!==(r.total>=r.difficulty))throw Error("Sucesso histórico incompatível.");
 if(![1,2].includes(r.cost))throw Error("Custo histórico inválido.");integer(r.fromCurrent,"CE atual histórica");integer(r.fromExtra,"CE extra histórica");
 if(r.unlimited?r.fromCurrent!==0||r.fromExtra!==0:r.fromCurrent+r.fromExtra!==r.cost)throw Error("Pagamento histórico incompatível.");
 return {operationId:id,round:r.round,total:r.total,difficulty:r.difficulty,success:r.success,end:r.end,cost:r.cost,fromCurrent:r.fromCurrent,fromExtra:r.fromExtra,unlimited:r.unlimited,attribute:r.attribute};
}
export function controlRetryRecordMath(actor,key){
 controlRetryKey(key);if(actor?.type!=="knight"||typeof actor.uuid!=="string"||!/^(Actor\.|Scene\.)/.test(actor.uuid))throw Error("Escolha uma ficha ou token próprio.");
 const r=actor.flags?.[SYSTEM_ID]?.persistentEffects?.[key],o=r?.controlOrigin;
 if(!r||r.id!==key||r.actorUuid!==actor.uuid||r.kind!=="manual"||r.damage!==0||!o||!Object.hasOwn(costs,o.classification)||!["active","ended","expired"].includes(r.status))throw Error("Escolha um Controle vinculado desta ficha.");
 if(!Number.isSafeInteger(r.firstRound)||r.firstRound<1||!Number.isSafeInteger(r.lastRound)||r.lastRound<r.firstRound||r.lastRound-r.firstRound>=1000)throw Error("Prazo de Controle inválido.");
 if(r.time!==undefined&&(!Number.isFinite(r.time)||r.time<0))throw Error("Registro temporal inválido.");
 const ticks=[];if(!plain(r.ticks??{}))throw Error("Rodadas de Controle inválidas.");
 for(const [id,t]of Object.entries(r.ticks??{})){
  if(!t||id!==`round${t.round}`||!Number.isSafeInteger(t.round)||t.round<r.firstRound||t.round>r.lastRound||!["applied","skipped"].includes(t.status)||t.damage!==0)throw Error("Rodada histórica de Controle inválida.");
  ticks.push({round:t.round,status:t.status,damage:0});
 }
 if(!plain(r.controlRetries??{}))throw Error("Histórico de tentativas inválido.");
 const retries=Object.entries(r.controlRetries??{}).map(([id,t])=>retryMath(id,t,r)).sort((a,b)=>a.round-b.round);
 if(retries.length>1000||new Set(retries.map(r=>r.round)).size!==retries.length)throw Error("Tentativas duplicadas na mesma rodada.");
 return {actorUuid:actor.uuid,recordId:key,status:r.status,registration:{time:r.time??null,userId:optionalRef(r.userId,"Autor do registro")},combatUuid:ref(r.combatUuid,"Encontro"),combatantId:ref(r.combatantId,"Combatente"),firstRound:r.firstRound,lastRound:r.lastRound,origin:{rootMessageId:ref(o.rootMessageId,"Ativação"),resistanceMessageId:optionalRef(o.resistanceMessageId,"Resistência"),attackerUuid:optionalRef(o.attackerUuid,"Origem"),itemUuid:optionalRef(o.itemUuid,"Técnica"),classification:o.classification,nature:optionalRef(o.nature,"Natureza"),powerCosmic:number(o.powerCosmic,"Poder Cósmico")},ticks:ticks.sort((a,b)=>a.round-b.round),retries};
}
export function controlRetrySnapshot(actor,key){
 const r=actor.system?.resources;if(!r||typeof r.cosmo?.unlimited!=="boolean")throw Error("Recursos de CE inválidos.");
 return {resources:{current:integer(r.cosmo.value,"CE atual"),extra:integer(r.cosmoExtra,"CE extra"),reserved:integer(r.cosmoReserved,"CE reservada"),overload:integer(r.cosmoOverload,"CE acima do limite"),unlimited:r.cosmo.unlimited},record:controlRetryRecordMath(actor,key)};
}
export function controlRetryOptions(value){
 if(!plain(value)||!attrs.includes(value.attribute)||!Number.isFinite(value.bonus)||Math.abs(value.bonus)>10000||![-1,0,1].includes(value.advantage)||typeof value.useExtra!=="boolean"||!["end","keep"].includes(value.onSuccess)||!["rank","modifier"].includes(value.resistanceMode))throw Error("Confira os parâmetros de resistência.");
 return {attribute:value.attribute,bonus:value.bonus,advantage:value.advantage,useExtra:value.useExtra,onSuccess:value.onSuccess,resistanceMode:value.resistanceMode,reason:optionalNote(value.reason)};
}
export function controlRetryContext(record,context){
 if(!plain(context)||context.combatUuid!==record.combatUuid||context.combatantId!==record.combatantId||!Number.isSafeInteger(context.round)||context.round<=record.firstRound||context.round>record.lastRound)throw Error("Tentativa exige rodada posterior à ativação, no prazo e mesmo encontro/combatente.");
 if(record.status!=="active"||record.retries.some(r=>r.round>=context.round))throw Error("Controle encerrado ou tentativa já registrada nesta rodada ou posterior.");
 return {combatUuid:ref(context.combatUuid,"Encontro"),combatantId:ref(context.combatantId,"Combatente"),round:context.round,epoch:ref(context.epoch,"Época da intenção")};
}
function payment(resources,cost,useExtra){
 const p=cosmoPayment({resources:{cosmo:{value:resources.current,unlimited:resources.unlimited},cosmoExtra:resources.extra,cosmoReserved:resources.reserved,cosmoOverload:resources.overload}},cost,{useExtra,allowOverload:false});return paymentAuthorization(p);
}
function poolValue(p){if(!plain(p)||!Number.isSafeInteger(p.dice)||p.dice<1||p.dice>100||!Number.isFinite(p.modifier)||Math.abs(p.modifier)>1000000)throw Error("Parada de resistência inválida.");return {dice:p.dice,modifier:p.modifier};}
export function controlRetryPreview(actor,key,values,context){
 const before=controlRetrySnapshot(actor,key),options=controlRetryOptions(values),encounter=controlRetryContext(before.record,context);
 const base=testParameters(actor.system,"resistance",options.attribute,options.resistanceMode,{technique:true,conditions:false});
 const pool=poolValue(conditionPool(actor.system,Math.max(1,base.dice+options.advantage),base.modifier+options.bonus+options.advantage*2,{maxDice:100}));
 const paid=payment(before.resources,costs[before.record.origin.classification],options.useExtra);
 const {reason,...math}=options,signature=actionHash({before,options:math,pool,payment:paid,context:encounter});
 return {version:1,signature,before,options,pool,payment:paid,context:encounter,difficulty:before.record.origin.powerCosmic,defaultAttribute:NATURES[before.record.origin.nature]?.resistance??""};
}
export function controlRetryState(actor,key,values,context){return controlRetryPreview(actor,key,values,context).signature;}
function numericPreview(v){
 if(!plain(v)||v.version!==1)throw Error("Prévia de Controle inválida.");
 const actor=actorFromSnapshot(v.before),before=controlRetrySnapshot(actor,v.before.record.recordId);
 if(!same(before,v.before))throw Error("Snapshot de Controle inválido.");
 const options=controlRetryOptions(v.options),context=controlRetryContext(before.record,v.context),pool=poolValue(v.pool),paid=payment(before.resources,costs[before.record.origin.classification],options.useExtra),{reason,...math}=options;
 if(!same(paid,v.payment)||v.difficulty!==before.record.origin.powerCosmic||v.signature!==actionHash({before,options:math,pool,payment:paid,context}))throw Error("Pagamento ou assinatura de Controle incompatível.");
 return {version:1,signature:v.signature,before,options,pool,payment:paid,context,difficulty:v.difficulty};
}
function finish(preview,faces,operationId){
 controlRetryKey(operationId);const p=numericPreview(preview);if(!Array.isArray(faces)||faces.length!==p.pool.dice)throw Error("Dados não correspondem à parada salva.");
 const result=resolvePool([...faces],p.pool.modifier),success=result.total>=p.difficulty,end=success&&p.options.onSuccess==="end",cost=p.payment.cost;
 const attempt={operationId,round:p.context.round,total:result.total,difficulty:p.difficulty,success,end,cost,fromCurrent:p.payment.fromCurrent,fromExtra:p.payment.fromExtra,unlimited:p.payment.unlimited,attribute:p.options.attribute};
 const after=copy(p.before);after.resources.current-=p.payment.fromCurrent;after.resources.extra-=p.payment.fromExtra;after.record.retries.push(attempt);if(end)after.record.status="ended";
 return {version:1,operationId,baseline:actionHash(p.before),signature:p.signature,before:p.before,after,context:p.context,options:p.options,pool:p.pool,payment:p.payment,result:{...result,outcome:classify(result.total,p.difficulty)},attempt,reason:p.options.reason};
}
export function controlRetryResultPlan(preview,faces,{operationId}={}){return finish(preview,faces,operationId);}
function actorFromSnapshot(s){
 const m=s?.record,r=s?.resources;if(!m||!r)throw Error("Snapshot de Controle ausente.");
 const actor={uuid:m.actorUuid,type:"knight",system:{resources:{cosmo:{value:r.current,unlimited:r.unlimited},cosmoExtra:r.extra,cosmoReserved:r.reserved,cosmoOverload:r.overload}},flags:{[SYSTEM_ID]:{persistentEffects:{}}}};
 actor.flags[SYSTEM_ID].persistentEffects[m.recordId]={id:m.recordId,actorUuid:m.actorUuid,kind:"manual",damage:0,status:m.status,combatUuid:m.combatUuid,combatantId:m.combatantId,firstRound:m.firstRound,lastRound:m.lastRound,time:m.registration?.time??undefined,userId:m.registration?.userId??undefined,controlOrigin:copy(m.origin),ticks:Object.fromEntries((m.ticks??[]).map(t=>[`round${t.round}`,copy(t)])),controlRetries:Object.fromEntries((m.retries??[]).map(t=>[t.operationId,copy(t)]))};return actor;
}
// Validate numeric receipts; serialized patches/functions are never an execution source.
export function validateControlRetryPlan(plan){
 if(!plain(plan)||plan.version!==1)throw Error("Plano de Controle inválido.");
 const p={version:1,signature:plan.signature,before:plan.before,context:plan.context,options:plan.options,pool:plan.pool,payment:plan.payment,difficulty:plan.before?.record?.origin?.powerCosmic};
 const expected=finish(p,plan.result?.results,plan.operationId);
 for(const key of ["baseline","before","after","context","options","pool","payment","result","attempt","reason"])if(!same(plan[key],expected[key]))throw Error("Resultado, pagamento ou snapshot de Controle incompatível.");
 return expected;
}
