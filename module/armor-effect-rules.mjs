// Canonical, finite armor parcels from p.229; no bodily damage or CE maintenance.
import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {componentUuid} from "./technique-builder-rules.mjs";
import {techniqueReadiness} from "./technique-rules.mjs";
import {effectState,effectRecords,effectView,encounterForEffect,nextEffectRound} from "./effect-rules.mjs";
import {optionalNote} from "./form-values.mjs";

export const ARMOR_BREAK=Object.freeze({id:"4bf80b08a6fdf40c",key:"bigbang:extra:Quebrar Armadura",page:"229",primary:componentUuid("ac34d9f38628bd92"),damage:Object.freeze({bronze:1,silver:2,gold:3})});
const copySystem=armor=>structuredClone(armor.system.toObject?armor.system.toObject():armor.system);
const reference=(value,label)=>{if(typeof value!=="string"||!value||value.length>256)throw Error(`${label} ausente ou inválido.`);return value;};
export function armorBreakSource(item){
 if(item?.type!=="technique"||item.parent?.type!=="knight"||item.system.effectKind!=="sustained"||techniqueReadiness(item)||item.parent.items?.get(item.id)!==item)throw Error("Quebrar Armadura recorrente exige uma técnica Sustentada pronta da ficha de origem.");
 const f=item.flags?.[SYSTEM_ID],record=f?.techniqueConstructionHistory?.[f.techniqueConstructionId];
 if(!record||record.primary?.uuid!==ARMOR_BREAK.primary||!Array.isArray(record.components))throw Error("Confira a composição salva com primordial Sustentada.");
 const matches=record.components.filter(c=>c.uuid===componentUuid(ARMOR_BREAK.id));
 if(matches.length!==1||matches[0].key!==ARMOR_BREAK.key||matches[0].type!=="bigbang"||matches[0].rank!==1||record.components.some(c=>c.key?.startsWith("bigbang:primordial:")))throw Error("Escolha um Quebrar Armadura canônico único, sem primordial misto.");
 const damage=Object.hasOwn(ARMOR_BREAK.damage,item.system.classification)?ARMOR_BREAK.damage[item.system.classification]:0;if(!damage)throw Error("Quebrar Armadura exige classe Bronze, Prata ou Ouro.");
 return {itemUuid:reference(item.uuid,"Técnica"),actorUuid:reference(item.parent.uuid,"Origem"),name:item.name,classification:item.system.classification,damage,page:ARMOR_BREAK.page,componentUuid:componentUuid(ARMOR_BREAK.id),primaryUuid:ARMOR_BREAK.primary,constructionId:reference(f.techniqueConstructionId,"Composição")};
}
function armorFor(actor,binding=null){
 const armors=(actor.items?.contents??[]).filter(i=>i.type==="armor"&&i.system.equipped&&i.system.state!=="dead"&&Number.isFinite(i.system.health?.value)&&i.system.health.value>=0);
 if(armors.length!==1)throw Error("O alvo precisa de uma única armadura equipada com PV válidos.");
 const armor=armors[0];reference(armor.id,"Armadura");reference(armor.uuid,"Armadura");
 if(armor.parent?.uuid!==actor.uuid||actor.items.get(armor.id)!==armor)throw Error("A armadura não pertence a esta ficha.");
 if(binding&&(binding.id!==armor.id||binding.uuid!==armor.uuid))throw Error("A armadura registrada foi trocada ou removida; encerre ou confira o efeito.");
 return armor;
}
export function armorBreakDefinition(actor,item,answer){
 if(actor?.type!=="knight")throw Error("Escolha uma ficha de cavaleiro para o efeito.");
 const source=armorBreakSource(item),armor=armorFor(actor),context=encounterForEffect(actor);
 if(!Number.isSafeInteger(answer?.rounds)||answer.rounds<1||answer.rounds>1000||![0,1].includes(answer.firstOffset))throw Error("Escolha duração de1 a1000 rodadas e início nesta/próxima rodada.");
 const firstRound=context.round+answer.firstOffset,lastRound=firstRound+answer.rounds-1;
 if(!Number.isSafeInteger(lastRound))throw Error("Prazo fora do limite numérico.");
 return {kind:"armorBreak",label:"Quebrar Armadura · Sustentada",damage:source.damage,page:ARMOR_BREAK.page,source,armor:{id:armor.id,uuid:armor.uuid,name:armor.name},rounds:answer.rounds,firstOffset:answer.firstOffset,firstRound,lastRound,combatUuid:context.combatUuid,combatantId:context.combatantId,reason:optionalNote(answer.reason),description:optionalNote(answer.description)};
}
function canonicalRecord(record){
 const source=record.source;
 if(!Object.hasOwn(ARMOR_BREAK.damage,source?.classification)||record.kind!=="armorBreak"||source?.componentUuid!==componentUuid(ARMOR_BREAK.id)||source.primaryUuid!==ARMOR_BREAK.primary||record.damage!==ARMOR_BREAK.damage[source.classification]||source.damage!==record.damage)throw Error("Parcela de Quebrar Armadura alterada ou inválida.");
 reference(source.itemUuid,"Técnica registrada");reference(source.actorUuid,"Origem registrada");reference(source.constructionId,"Composição registrada");
}
function recordArmor(actor,record){canonicalRecord(record);return armorFor(actor,record.armor);}
export function armorBreakView(actor,record){
 const view=effectView(actor,record);if(record.kind!=="armorBreak")return {...view,canResolve:false,state:"Tipo de efeito incompatível."};
 if(view.foreign||record.status!=="active")return view;
 try{const armor=recordArmor(actor,record);return {...view,armorId:armor.id,armorUuid:armor.uuid,armorHealth:armor.system.health.value};}
 catch(error){return {...view,canResolve:false,state:error.message};}
}
export function armorBreakTickPlan(actor,record,{skip=false,damage:finalDamage=record.damage,reason}={}){
 if(typeof skip!=="boolean")throw Error("Opção de parcela inválida.");
 const view=armorBreakView(actor,record);if(!view.canResolve)throw Error(view.state);
 if(!Number.isFinite(finalDamage)||finalDamage<0||finalDamage>1000000)throw Error("Dano final à armadura inválido.");
 const damage=skip?0:finalDamage,before=view.armorHealth,after=before-damage;
 const tick={round:view.nextRound,status:skip?"skipped":"applied",pool:"armor",armorId:view.armorId,armorUuid:view.armorUuid,baseDamage:record.damage,damage,before,after,reason:optionalNote(reason)};
 return {view,tick,before,after,status:view.nextRound===record.lastRound?"expired":"active"};
}
// Includes the bound Item. The ordinary effect signature alone cannot see an armor edit.
export function armorBreakState(actor){
 const armors=(actor.items?.contents??[]).filter(i=>i.type==="armor").map(i=>({id:i.id,uuid:i.uuid,system:copySystem(i)})).toSorted((a,b)=>a.id.localeCompare(b.id));
 return actionHash({effect:effectState(actor),armors});
}
export function armorBreakSnapshot(actor,key){
 const record=effectRecords(actor)[key];if(!record?.armor)throw Error("Registro de armadura ausente.");
 const armor=actor.items?.get(record.armor.id);
 if(armor?.type!=="armor"||armor.uuid!==record.armor.uuid||armor.parent?.uuid!==actor.uuid)throw Error("A armadura vinculada foi removida ou substituída.");
 return {armorId:armor.id,armorUuid:armor.uuid,armorSystem:copySystem(armor),record:structuredClone(record)};
}
export function armorBreakAfter(before,record,armorHealth){
 if(!Number.isFinite(armorHealth)||record.armor?.id!==before.armorId||record.armor.uuid!==before.armorUuid)throw Error("Snapshot de parcela inválido.");
 const after=structuredClone(before);after.armorSystem.health.value=armorHealth;after.record=structuredClone(record);return after;
}
// Validate the cross-document journal before using any saved value for flags-only completion.
function validateJournal(operation){
 const {before,after,effectId,round,actorUuid}=operation,same=(a,b)=>actionHash(a)===actionHash(b);
 if(!before||!after||before.armorId!==after.armorId||before.armorUuid!==after.armorUuid||before.record?.id!==effectId||before.record.actorUuid!==actorUuid||before.record.status!=="active"||nextEffectRound(before.record)!==round)throw Error("Journal de armadura inválido.");
 canonicalRecord(before.record);
 const tick=after.record?.ticks?.[`round${round}`],health=before.armorSystem?.health?.value;
 if(!tick||tick.round!==round||tick.pool!=="armor"||tick.armorId!==before.armorId||tick.armorUuid!==before.armorUuid||!["applied","skipped"].includes(tick.status)||tick.baseDamage!==before.record.damage||!Number.isFinite(tick.damage)||tick.damage<0||tick.damage>1000000||tick.status==="skipped"&&tick.damage!==0||!Number.isFinite(health)||health<0||tick.before!==health||tick.after!==health-tick.damage)throw Error("Parcela do journal inválida.");
 const expectedRecord={...before.record,ticks:{...before.record.ticks,[`round${round}`]:tick},status:round===before.record.lastRound?"expired":"active"};
 if(!same(armorBreakAfter(before,expectedRecord,tick.after),after))throw Error("Snapshots do journal incompatíveis.");
}
// Recovery completes only the record. It never repeats an Item debit or restores resources.
export function armorBreakRecoveryPlan(actor,operation){
 if(operation?.kind!=="armorBreak"||operation.status!=="prepared"||operation.actorUuid!==actor.uuid)throw Error("Operação de armadura ausente ou de outra ficha.");
 validateJournal(operation);
 const current=armorBreakSnapshot(actor,operation.effectId),before=operation.before,after=operation.after,same=(a,b)=>actionHash(a)===actionHash(b);
 if(same(current,after))return {status:"applied"};
 if(same(current,before))return {status:"failed"};
 if(current.armorId===after.armorId&&current.armorUuid===after.armorUuid&&same(current.armorSystem,after.armorSystem)&&same(current.record,before.record))return {status:"applied",record:structuredClone(after.record)};
 throw Error("Armadura ou registro alterado após a interrupção. Preserve os ajustes e confira manualmente.");
}
