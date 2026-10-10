import {sustainedView} from "./sustained-rules.mjs";
import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {componentUuid} from "./technique-builder-rules.mjs";
import {techniqueReadiness} from "./technique-rules.mjs";

export const BRASAS={id:"e63322f3195be739",key:"bigbang:extra:Brasas",page:"225",damage:{bronze:5,silver:10,gold:15}};
export const effectRecords=actor=>actor.flags?.[SYSTEM_ID]?.persistentEffects??{};
export const effectSourceState=item=>actionHash({uuid:item.uuid,parent:item.parent?.uuid,system:item.system,flags:item.flags??{}});
export function brasasSource(item) {
 if(item?.type!=="technique"||item.parent?.type!=="knight"||item.system.effectKind!=="damage"||techniqueReadiness(item))throw Error("Brasas assistidas exigem uma técnica personalizada de Dano concluída e pronta para ativação.");
 const flags=item.flags?.[SYSTEM_ID],record=flags?.techniqueConstructionHistory?.[flags.techniqueConstructionId];
 if(!record||record.primary?.uuid!==componentUuid("13841831d802c5be")||!Array.isArray(record.components))throw Error("Confira a composição salva com primordial Dano.");
 const matches=record.components.filter(c=>c.uuid===componentUuid(BRASAS.id));
 if(matches.length!==1||matches[0].key!==BRASAS.key||matches[0].type!=="bigbang"||matches[0].rank!==1||record.components.some(c=>c.key?.startsWith("bigbang:primordial:")))throw Error("A composição precisa de um Big Bang Brasas canônico, sem primordial misto.");
 const damage=BRASAS.damage[item.system.classification];if(!damage)throw Error("Confira a classificação Bronze, Prata ou Ouro da técnica.");
 return {itemUuid:item.uuid,actorUuid:item.parent.uuid,name:item.name,classification:item.system.classification,damage,page:BRASAS.page,componentUuid:componentUuid(BRASAS.id),constructionId:flags.techniqueConstructionId};
}
const text=(value,label,max,required=true)=>{if(typeof value!=="string"||value.length>max||required&&!value.trim())throw Error(`${label}: preencha até ${max} caracteres.`);return value.trim();};
export function effectDefinition(answer,source=null) {
 if(!["brasas","manual"].includes(answer?.kind))throw Error("Escolha um tipo de efeito válido.");
 if(!Number.isSafeInteger(answer.rounds)||answer.rounds<1||answer.rounds>1000||![0,1].includes(answer.firstOffset))throw Error("Informe duração de1 a1000 rodadas e escolha a primeira aplicação.");
 const reason=text(answer.reason??"","Notas",2000,false),description=text(answer.description??"","Descrição",2000,false);
 if(answer.kind==="brasas") {if(!source)throw Error("Escolha uma técnica personalizada com Brasas.");return {kind:"brasas",label:"Brasas",rounds:answer.rounds,firstOffset:answer.firstOffset,reason,description,page:source.page,damage:source.damage,source};}
 return {kind:"manual",label:text(answer.label,"Nome",120),rounds:answer.rounds,firstOffset:answer.firstOffset,reason,description,page:text(answer.page??"","Referência",120,false),damage:0,source:null};
}
export function encounterForEffect(actor,uuid=game.combat?.uuid) {
 const combat=(game.combats?.contents??[]).find(c=>c.uuid===uuid);
 if(!combat?.started||!Number.isSafeInteger(combat.round)||combat.round<1)throw Error("Abra um encontro iniciado para acompanhar rodadas do efeito.");
 const members=(combat.combatants?.contents??[]).filter(c=>c.actor?.uuid===actor.uuid);
 if(members.length!==1)throw Error("A ficha precisa de exatamente um combatente neste encontro; cópias/tokens independentes conservam registros próprios.");
 return {combatUuid:combat.uuid,combatantId:members[0].id,round:combat.round};
}
export function nextEffectRound(record) {
 if(!Number.isSafeInteger(record.firstRound)||!Number.isSafeInteger(record.lastRound)||record.firstRound<1||record.lastRound<record.firstRound||record.lastRound-record.firstRound>=1000)throw Error("Duração registrada inválida; encerrar/revisar manualmente.");
 for(let round=record.firstRound;round<=record.lastRound;round++)if(!record.ticks?.[`round${round}`])return round;
 return null;
}
export function effectView(actor,record) {
 if(record.actorUuid!==actor.uuid)return {record,state:"Cópia de outra ficha · encerrar/recriar após revisão",foreign:true,canResolve:false};
 if(record.status!=="active")return {record,state:record.status==="expired"?"Duração concluída":"Encerrado pelo mestre",canResolve:false};
 if(record.kind==="sustained"){try{const v=sustainedView(actor,record);return {...v,isSustained:true,canResolve:false};}catch(error){return {record,isSustained:true,state:error.message,canResolve:false,canPay:false};}}
 let context;try{context=encounterForEffect(actor,record.combatUuid);}catch(error){return {record,state:"Pausado · encontro/ficha indisponível",detail:error.message,canResolve:false};}
 if(context.combatantId!==record.combatantId)return {record,state:"Pausado · combatente do registro foi substituído",canResolve:false};
 let nextRound;try{nextRound=nextEffectRound(record);}catch(error){return {record,state:error.message,canResolve:false};}if(nextRound===null)return {record,state:"Duração concluída · conferir registro",canResolve:false};
 const due=nextRound<=context.round;
 return {record,context,nextRound,canResolve:due,overdue:nextRound<context.round,state:due?(nextRound<context.round?"Rodada pendente · revisar atraso":"Aguardando conferência da rodada"):"Aguardando próxima rodada"};
}
export function effectState(actor) {
 return actionHash({uuid:actor.uuid,system:actor.system,flags:actor.flags??{},openCombat:game.combat?.uuid,combats:(game.combats?.contents??[]).map(c=>({uuid:c.uuid,started:c.started,round:c.round,members:(c.combatants?.contents??[]).map(m=>({id:m.id,actor:m.actor?.uuid}))}))});
}
export function effectTickPlan(actor,record,{skip=false,reason,checked,damage:finalDamage=record.damage}={}) {
 if(typeof skip!=="boolean")throw Error("Opção de rodada inválida.");
 reason=text(reason??"","Notas",2000,false);
 const view=effectView(actor,record);if(!view.canResolve)throw Error(view.state);
 if(record.kind==="brasas"&&(record.source?.componentUuid!==componentUuid(BRASAS.id)||record.damage!==BRASAS.damage[record.source?.classification])||record.kind==="manual"&&record.damage!==0||!["brasas","manual"].includes(record.kind))throw Error("Parcela do efeito alterada ou inválida. Revise o registro.");
 if(!Number.isFinite(finalDamage)||finalDamage<0||finalDamage>1000000)throw Error("Dano final inválido.");
 const damage=skip||record.kind==="manual"?0:finalDamage;
 if(!Number.isFinite(damage)||damage<0||damage>1000000||!Number.isFinite(actor.system.resources.health.value))throw Error("Dano/PV do efeito inválidos.");
 const before=actor.system.resources.health.value,after=before-damage;
 const tick={round:view.nextRound,status:skip?"skipped":"applied",baseDamage:record.damage,damage,before,after,reason};
 const final=view.nextRound===record.lastRound;
 return {view,tick,before,after,status:final?"expired":"active"};
}
