// p.307–308: one complete campaign hour reported by the table, never a combat tick.
// Pure plans only. Runtime authorization, coordination and journaling belong to the caller.
import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {cosmoPayment,paymentAuthorization} from "./technique-rules.mjs";
import {optionalNote} from "./form-values.mjs";

export const ARMOR_REPAIR=Object.freeze({id:"16ffa8dcf4d1e1d8",key:"technique:cosmic:PRATA:CONSERTAR ARMADURAS",page:"307–308",costPerHour:1});
const clone=structuredClone;
function reference(value,label){if(typeof value!=="string"||!value||value.length>256)throw Error(`${label} ausente ou inválido.`);return value;}
function integer(value,label,min=0){if(!Number.isSafeInteger(value)||value<min||value>1000000)throw Error(`${label}: informe um inteiro válido.`);return value;}
function actorIdentity(actor){if(actor?.type!=="knight")throw Error("Escolha uma ficha de cavaleiro.");return reference(actor.uuid,"Ficha");}
function member(item,type){
 const actorUuid=actorIdentity(item?.parent);
 if(item.type!==type||item.parent.items?.get?.(item.id)!==item)throw Error("Item ausente, substituído ou de outra ficha.");
 const id=reference(item.id,"Item"),uuid=reference(item.uuid,"Item");
 if(uuid!==`${actorUuid}.Item.${id}`)throw Error("Identidade do Item não corresponde à ficha.");
 return {actorUuid,id,uuid};
}
export function armorRepairSource(item){
 const identity=member(item,"technique"),s=item.system;
 if(item.flags?.[SYSTEM_ID]?.source?.key!==ARMOR_REPAIR.key||item.flags?.[SYSTEM_ID]?.techniqueDraft||s?.nature!=="manipulation"||s.effectKind!=="control")throw Error("Escolha a cópia de Consertar Armaduras com seu perfil de Controle/Manipulação.");
 // Acquisition requirements and ordinary activation parameters are not a new repair gate.
 return {...identity,name:typeof item.name==="string"?item.name:"Consertar Armaduras",key:ARMOR_REPAIR.key,level:integer(item.parent.system?.profile?.level,"Nível do usuário",1)};
}
export function armorRepairTarget(armor){
 const identity=member(armor,"armor"),s=armor.system,h=s?.health;
 if(s?.state==="dead"||!Number.isFinite(h?.value)||h.value<0)throw Error("Armadura morta ou com PV negativos exige tratamento manual próprio.");
 if(!Number.isFinite(h.max)||h.max<=0)throw Error("Máximo atual da armadura inválido.");
 return {...identity,name:typeof armor.name==="string"?armor.name:"Armadura",state:s.state??null,classification:s.class??null,version:s.version??null,health:h.value,maximum:h.max};
}
function payerState(actor){
 const uuid=actorIdentity(actor),r=actor.system?.resources;
 if(!r||typeof r.cosmo?.unlimited!=="boolean"||!Number.isFinite(r.health?.value))throw Error("Recursos atuais do usuário inválidos.");
 return {uuid,health:r.health.value,current:integer(r.cosmo.value,"CE atual"),extra:integer(r.cosmoExtra,"CE extra"),reserved:integer(r.cosmoReserved,"CE reservada"),overload:integer(r.cosmoOverload,"CE acima do limite"),unlimited:r.cosmo.unlimited};
}
function context(item,armor){return {source:armorRepairSource(item),target:armorRepairTarget(armor),payer:payerState(item.parent)};}
function signature(c){
 // Display names/notes do not change payment. Identity, level, resource values and
 // the selected armor's derived maximum do. No serialized update command is trusted.
 const {name:_sourceName,...source}=c.source,{name:_targetName,...target}=c.target;
 return actionHash({source,target,payer:c.payer});
}
export function armorRepairState(item,armor){return signature(context(item,armor));}
export function armorRepairPlan(item,armor,options={}){
 if(!options||typeof options!=="object"||![Object.prototype,null].includes(Object.getPrototypeOf(options)))throw Error("Parâmetros de reparo inválidos.");
 const own=(key,fallback)=>Object.hasOwn(options,key)?options[key]:fallback;
 const c=context(item,armor),repair=own("repair",c.source.level),cost=integer(own("cost",ARMOR_REPAIR.costPerHour),"CE da hora"),useExtra=own("useExtra",true),allowOverload=own("allowOverload",false);
 if(!Number.isFinite(repair)||repair<0||repair>1000000)throw Error("PV de reparo: informe um valor válido.");
 if(typeof useExtra!=="boolean"||typeof allowOverload!=="boolean")throw Error("Distribuição de CE inválida.");
 const payment=cosmoPayment(item.parent.system,cost,{useExtra,allowOverload}),amount=Math.min(repair,Math.max(0,c.target.maximum-c.target.health));
 const before={payer:clone(c.payer),armor:clone(c.target)},after=clone(before),u=payment.updates;
 after.payer.current=u["system.resources.cosmo.value"]??before.payer.current;
 after.payer.extra=u["system.resources.cosmoExtra"]??before.payer.extra;
 after.payer.overload=u["system.resources.cosmoOverload"]??before.payer.overload;
 after.payer.health=u["system.resources.health.value"]??before.payer.health;
 after.armor.health=before.armor.health+amount;
 if(!Number.isFinite(after.payer.health)||!Number.isFinite(after.armor.health))throw Error("Resultado de reparo fora do limite numérico.");
 return {ruleVersion:1,kind:"armorRepair",hours:1,page:ARMOR_REPAIR.page,source:clone(c.source),baseline:signature(c),baseRepair:c.source.level,requestedRepair:repair,repair:after.armor.health-before.armor.health,cost,payment:paymentAuthorization(payment),options:{repair,cost,useExtra,allowOverload},adjusted:repair!==c.source.level||cost!==ARMOR_REPAIR.costPerHour,reason:optionalNote(options.reason),before,after};
}
