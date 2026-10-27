// p.227/310–311: finite, explicitly allocated CE loss; never a caster credit.
// Registration authorizes the source; later parcels authorize only the affected actor.
// Pure plans never write documents or authorize a transported command.
import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {componentUuid} from "./technique-builder-rules.mjs";
import {optionalNote} from "./form-values.mjs";
export const DRAIN=Object.freeze({id:"ea761952eeab6d92",key:"bigbang:extra:Dreno",primary:componentUuid("ac34d9f38628bd92"),page:"227/310–311",amount:Object.freeze({bronze:1,silver:3,gold:5}),catalogKey:"technique:cosmic:PRATA:TEIA DA TARÂNTULA"});
const copy=structuredClone;
const own=(o,key)=>Object.hasOwn(o,key)?o[key]:undefined;
function text(v,label){if(typeof v!=="string"||!v||v.length>256)throw Error(`${label} ausente ou inválido.`);return v;}
function integer(v,label){if(!Number.isSafeInteger(v)||v<0||v>1000000)throw Error(`${label}: informe inteiro de0 a1000000.`);return v;}
export function drainActor(actor){if(actor?.type!=="knight"||typeof actor.uuid!=="string"||!/^(Actor\.|Scene\.)/.test(actor.uuid))throw Error("Escolha uma ficha do mundo ou token.");return text(actor.uuid,"Ficha");}
export function drainSource(item){
 const actorUuid=drainActor(item?.parent),f=item?.flags?.[SYSTEM_ID]??{},s=item?.system;
 if(item?.type!=="technique"||item.parent.items?.get?.(item.id)!==item||item.uuid!==`${actorUuid}.Item.${item.id}`)throw Error("Técnica ausente, substituída ou de outra ficha.");
 text(item.id,"Técnica");text(item.uuid,"Técnica");
 if(s?.effectKind!=="sustained"||f.techniqueDraft||f.techniqueBuilder?.status==="draft")throw Error("Dreno assistido exige uma técnica Sustentada com composição concluída.");
 const constructionId=f.techniqueConstructionId;let profile;
 if(constructionId!==undefined&&constructionId!==null){
  text(constructionId,"Composição");const record=f.techniqueConstructionHistory?.[constructionId];
  if(!record||record.primary?.uuid!==DRAIN.primary||!Array.isArray(record.components))throw Error("Confira a composição com primordial Sustentada.");
  const matches=record.components.filter(c=>c.uuid===componentUuid(DRAIN.id));
  if(matches.length!==1||matches[0].key!==DRAIN.key||matches[0].type!=="bigbang"||matches[0].rank!==1||record.components.some(c=>c.key?.startsWith("bigbang:primordial:")))throw Error("A composição precisa de um Dreno canônico único, sem primordial misto.");
  profile={kind:"construction",constructionId};
 }else{
  if(f.source?.key!==DRAIN.catalogKey)throw Error("Escolha uma composição com Dreno ou Teia da Tarântula configurada.");
  profile={kind:"catalog",key:DRAIN.catalogKey};
 }
 if(!Object.hasOwn(DRAIN.amount,s.classification))throw Error("Dreno assistido usa classe Bronze, Prata ou Ouro da cópia.");
 return {itemUuid:item.uuid,actorUuid,name:typeof item.name==="string"?item.name:"Dreno",classification:s.classification,amount:DRAIN.amount[s.classification],componentUuid:componentUuid(DRAIN.id),primaryUuid:DRAIN.primary,profile,page:DRAIN.page};
}
export function drainTarget(actor){
 const uuid=drainActor(actor),r=actor.system?.resources;
 if(typeof r?.cosmo?.unlimited!=="boolean")throw Error("Estado da CEilimitada inválido.");
 if(r.cosmo.unlimited)throw Error("Dreno sobre CEilimitada permanece manual; não há saldo finito definido.");
 return {uuid,current:integer(r.cosmo.value,"CE atual"),extra:integer(r.cosmoExtra,"CE extra"),reserved:integer(r.cosmoReserved,"CE reservada"),unlimited:false};
}
export function drainSourceMath(source){const {name,...values}=source;return values;}
export function drainState(item,actor){return actionHash({source:drainSourceMath(drainSource(item)),target:drainTarget(actor)});}
export function drainCapturedPlan(profile,actor,options={}){
 if(!options||typeof options!=="object"||![Object.prototype,null].includes(Object.getPrototypeOf(options)))throw Error("Parâmetros de Dreno inválidos.");
 const source=drainProfile(profile),before=drainTarget(actor),current=integer(Object.hasOwn(options,"current")?options.current:source.amount,"Retirada da CE atual"),extra=integer(Object.hasOwn(options,"extra")?options.extra:0,"Retirada da CE extra");
 if(current>before.current||extra>before.extra)throw Error("Saldo insuficiente para esta alocação de Dreno. Ajuste a parcela explicitamente.");
 const removed=current+extra;if(!Number.isSafeInteger(removed)||removed>1000000)throw Error("Total retirado fora do limite técnico.");
 const reason=optionalNote(own(options,"reason")),after={...copy(before),current:before.current-current,extra:before.extra-extra};
 return {kind:"cosmoDrain",ruleVersion:1,source,before,after,suggested:source.amount,removed,allocation:{current,extra},adjusted:removed!==source.amount||extra!==0,reason,baseline:actionHash({source:drainSourceMath(source),target:before})};
}

export function drainProfile(source){
 if(!source||typeof source!=="object"||source.primaryUuid!==DRAIN.primary||source.componentUuid!==componentUuid(DRAIN.id)||!Object.hasOwn(DRAIN.amount,source.classification)||source.amount!==DRAIN.amount[source.classification])throw Error("Perfil de Dreno inválido.");
 const actorUuid=drainActor({uuid:source.actorUuid,type:"knight"}),itemUuid=text(source.itemUuid,"Técnica"),prefix=`${actorUuid}.Item.`;
 if(!itemUuid.startsWith(prefix)||!itemUuid.slice(prefix.length)||itemUuid.slice(prefix.length).includes("."))throw Error("Identidade da fonte de Dreno inválida.");
 let profile;if(source.profile?.kind==="catalog"&&source.profile.key===DRAIN.catalogKey)profile={kind:"catalog",key:DRAIN.catalogKey};
 else if(source.profile?.kind==="construction")profile={kind:"construction",constructionId:text(source.profile.constructionId,"Composição")};
 else throw Error("Origem canônica do perfil de Dreno inválida.");
 return {itemUuid,actorUuid,name:typeof source.name==="string"?source.name:"Dreno",classification:source.classification,amount:source.amount,componentUuid:componentUuid(DRAIN.id),primaryUuid:DRAIN.primary,profile,page:DRAIN.page};
}
export function drainPlan(item,actor,options={}){return drainCapturedPlan(drainSource(item),actor,options);}
