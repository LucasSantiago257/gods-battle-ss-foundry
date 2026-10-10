import {SYSTEM_ID,ATTRIBUTES} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {effectRecords,effectState} from "./effect-rules.mjs";
import {sustainedView} from "./sustained-rules.mjs";
import {testParameters} from "./rules.mjs";
import {conditionPool,conditionSummary} from "./condition-rules.mjs";
import {evaluatePool,prepareRollMessage} from "./rolls.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {optionalNote} from "./form-values.mjs";
export const OPPOSITION_PROFILES={attribute:"Atributo chave · ambos rolam",cosmo:"Duelo de Cosmos · ambos rolam",passive:"Duelo de Cosmos · alvo passivo"};
const f=doc=>doc?.flags?.[SYSTEM_ID]??{};
const keyOf=key=>{if(typeof key!=="string"||!/^[a-zA-Z0-9]{1,32}$/.test(key))throw Error("Registro de oposição inválido.");return key;};
function available(actor,id=null){
 if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode resolver oposição.");
 assertNoTechniqueInterruption(actor,{effectOperationId:id});
 if(f(actor).levelOperation?.status==="prepared"||Object.values(f(actor).damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Confira a operação interrompida de evolução/dano antes da oposição.");
}
export function oppositionView(actor,key){
 keyOf(key);const view=sustainedView(actor,effectRecords(actor)[key]??{}),round=view.context.round;
 if(view.phase!=="maintenance"||view.record.sustain.paidUntilRound<round&&!view.oneOff||view.oneOff&&!Object.values(view.record.sustain.payments).some(p=>p.round<=round))throw Error("Registre a recarga vigente antes da oposição de manutenção.");
 if(view.target.uuid===actor.uuid)throw Error("Oposição exige dois participantes distintos; autossustentação continua manual.");
 const history=Object.values(view.record.sustain.oppositions??{});
 if(history.some(r=>!Number.isSafeInteger(r.round)||r.round>round||!Number.isSafeInteger(r.attempt)||r.attempt<1||r.attempt>1000||!["payer","target","tie"].includes(r.winner)||typeof r.repeat!=="boolean"||r.repeat&&(r.winner!=="tie"||r.tie!=="repeat")))throw Error("Histórico inválido ou rodada posterior; retrocesso não repete oposição.");
 const same=history.filter(r=>r.round===round).toSorted((a,b)=>a.attempt-b.attempt),last=same.at(-1);
 if(last?.attempt>=1000)throw Error("Limite de tentativas nesta rodada; confira manualmente.");
 if(last&&!last.repeat)throw Error("Oposição já concluída nesta rodada. Consulte o resultado existente.");
 if(Object.values(f(actor).effectOperations??{}).some(r=>r.kind==="sustainOpposition"&&r.actorUuid===actor.uuid&&r.effectId===key&&r.status==="applied"&&!r.published))throw Error("Resultado aguarda publicação. Recupere o mesmo cartão antes de outra oposição.");
 return {...view,round,attempt:(last?.attempt??0)+1};
}
export function oppositionPool(system,profile,attribute,bonus,{passive=false}={}){
 if(!OPPOSITION_PROFILES[profile]||!Number.isFinite(bonus)||Math.abs(bonus)>10000||profile==="attribute"&&!Object.hasOwn(ATTRIBUTES,attribute))throw Error("Confira perfil, atributo e bônus de oposição.");
 const level=system.combat.levelModifier;if(!Number.isFinite(level)||Math.abs(level)>1000000)throw Error("Modificador de nível inválido.");
 if(passive){
  if(profile!=="passive"||!Number.isFinite(system.skills.cosmoUse.total))throw Error("Duelo passivo inválido.");
  const base=7+system.skills.cosmoUse.total,pool=conditionPool(system,0,base+level+bonus);
  return {...pool,total:pool.modifier,base,level,bonus,conditionSummary:conditionSummary(system)};
 }
 const base=testParameters(system,profile==="attribute"?"attribute":"skill",profile==="attribute"?attribute:"cosmoUse","rank",{conditions:false});
 const pool=conditionPool(system,base.dice,base.modifier+level+bonus,{maxDice:profile==="attribute"?100:5});
 if(!Number.isSafeInteger(pool.dice)||pool.dice<1||pool.dice>100||!Number.isFinite(pool.modifier)||Math.abs(pool.modifier)>2000000)throw Error("Parada ou modificador de oposição inválido.");
 return {...pool,base:base.modifier,level,bonus,conditionSummary:conditionSummary(system)};
}
export function oppositionPlan(actor,key,answer){
 const view=oppositionView(actor,key);
 if(answer?.profile!=="attribute"&&(!Number.isSafeInteger(actor.system.skills.combat.value)||actor.system.skills.combat.value<1))throw Error("Duelo de Cosmos exige Combate1 no usuário (p.421); escolha atributo ou resolva exceção manualmente.");
 if(!["auto","repeat","keep","end"].includes(answer?.tie)||!["end","keep"].includes(answer?.onLoss))throw Error("Escolha aplicação da derrota e do empate.");
 return {...view,profile:answer.profile,attribute:answer.attribute,tie:answer.tie==="auto"?(answer.profile==="passive"?"defend":"repeat"):answer.tie,onLoss:answer.onLoss,reason:optionalNote(answer.reason),payerPool:oppositionPool(actor.system,answer.profile,answer.attribute,answer.payerBonus),targetPool:oppositionPool(view.target.system,answer.profile,answer.attribute,answer.targetBonus,{passive:answer.profile==="passive"})};
}
export function oppositionOutcome(payerTotal,targetTotal,tie,onLoss){
 if(!Number.isFinite(payerTotal)||!Number.isFinite(targetTotal)||!["defend","repeat","keep","end"].includes(tie)||!["end","keep"].includes(onLoss))throw Error("Resultado de oposição inválido.");
 const winner=payerTotal>targetTotal?"payer":payerTotal<targetTotal||payerTotal===targetTotal&&tie==="defend"?"target":"tie";
 return {winner,repeat:winner==="tie"&&tie==="repeat",end:winner==="target"&&onLoss==="end"||winner==="tie"&&tie==="end",label:winner==="payer"?"Usuário venceu":winner==="target"?(payerTotal===targetTotal?"Alvo resistiu · passivo igualado":"Alvo venceu"):tie==="repeat"?"Empate · repetir":tie==="keep"?"Empate · manter registro":"Empate · encerrar registro"};
}
async function guard(actor,baseline,target,targetBaseline,id=null){
 available(actor,id);available(target);const current=await fromUuid(actor.uuid),other=await fromUuid(target.uuid);
 if(!current?.isOwner||current.uuid!==actor.uuid||current.type!=="knight"||!other?.isOwner||other.uuid!==target.uuid||other.type!=="knight"||effectState(current)!==baseline||effectState(actor)!==baseline||effectState(other)!==targetBaseline||effectState(target)!==targetBaseline)throw Error("Participante, recursos, efeito ou rodada mudou. Abra a oposição novamente.");
 available(actor,id);available(target);
}
const expectedState=(actor,id,operation)=>{const flags=structuredClone(actor.flags??{});flags[SYSTEM_ID]??={};flags[SYSTEM_ID].effectOperations??={};flags[SYSTEM_ID].effectOperations[id]=operation;return effectState({uuid:actor.uuid,system:actor.system,flags});};
async function publish(actor,id,operation){
 available(actor);if(operation.actorUuid!==actor.uuid||operation.status!=="applied")throw Error("Oposição ainda não registrada.");
 const message=game.messages.get(operation.messageId);if(!message)throw Error("Cartão removido. Preserve o resultado e encerre somente a pendência após conferir.");
 const resolution=f(message).sustainOppositionResolution;
 if(resolution?.actorUuid===actor.uuid&&resolution.operationId===id){if(!operation.published)await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.published`]:true});return message;}
 const saved=f(message).sustainOppositionPrepared;
 if(!saved||actionHash(saved)!==operation.cardHash||message.author?.id!==operation.userId||saved.card.blind||saved.card.whisper?.length)throw Error("Cartão de oposição alterado, privado ou sem autoria válida. Não repita as rolagens.");
 await message.update({...saved.card,rolls:saved.card.rolls.map(r=>Roll.fromData(r)),[`flags.${SYSTEM_ID}.-=sustainOppositionPrepared`]:null,[`flags.${SYSTEM_ID}.sustainOppositionResolution`]:{actorUuid:actor.uuid,operationId:id}});
 try{await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.published`]:true});}catch(error){console.error(`${SYSTEM_ID}: publicação da oposição`,error);}return message;
}
export async function opposeSustained(actor,key){
 available(actor);const view=oppositionView(actor,key);available(view.target);
 const baseline=effectState(actor),targetBaseline=effectState(view.target);
 const content=await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/sustained-opposition-dialog.hbs`,{name:view.record.label,payerName:actor.name,targetName:view.target.name,round:view.round,attempt:view.attempt,profiles:Object.entries(OPPOSITION_PROFILES).map(([value,label])=>({value,label})),attributes:Object.entries(ATTRIBUTES).map(([value,label])=>({value,label}))});
 await guard(actor,baseline,view.target,targetBaseline);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Oposição de Sustentada"},content,buttons:[{action:"roll",label:"Resolver oposição pública",default:true,callback:(_e,b)=>{const e=b.form.elements;return {profile:e.profile.value,attribute:e.attribute.value,payerBonus:Number(e.payerBonus.value),targetBonus:Number(e.targetBonus.value),tie:e.tie.value,onLoss:e.onLoss.value,reason:e.reason.value};}},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
 if(!answer)return;
 return runMasterOperation(async()=>{
  await guard(actor,baseline,view.target,targetBaseline);const plan=oppositionPlan(actor,key,answer),id=keyOf(foundry.utils.randomID());if(f(actor).effectOperations?.[id])throw Error("Identificador já registrado.");
  const before=structuredClone(plan.record);let operation={kind:"sustainOpposition",status:"prepared",actorUuid:actor.uuid,targetUuid:plan.target.uuid,effectId:key,round:plan.round,userId:game.user.id,time:Date.now(),before,payerSystemHash:actionHash(actor.system),targetState:targetBaseline};
  let expected=expectedState(actor,id,operation);await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}`]:operation});await guard(actor,expected,plan.target,targetBaseline,id);
  const payer=await evaluatePool(plan.payerPool.dice,plan.payerPool.modifier);await guard(actor,expected,plan.target,targetBaseline,id);
  let target;if(plan.profile==="passive")target={result:{results:[],modifier:plan.targetPool.modifier,total:plan.targetPool.total,passive:true}};else{target=await evaluatePool(plan.targetPool.dice,plan.targetPool.modifier);await guard(actor,expected,plan.target,targetBaseline,id);}
  const outcome=oppositionOutcome(payer.result.total,target.result.total,plan.tie,plan.onLoss);
  const result={operationId:id,round:plan.round,attempt:plan.attempt,profile:plan.profile,attribute:plan.profile==="attribute"?plan.attribute:null,tie:plan.tie,onLoss:plan.onLoss,payerTotal:payer.result.total,targetTotal:target.result.total,...outcome,reason:plan.reason,userId:game.user.id,time:Date.now()};
  const after={...before,sustain:{...before.sustain,oppositions:{...before.sustain.oppositions,[id]:result}},...(outcome.end?{status:"ended",end:{reason:plan.reason,userId:game.user.id,time:Date.now(),oppositionOperationId:id}}:{})};
  const card=await prepareRollMessage(actor,payer.messageRoll,{name:plan.record.label,payerName:actor.name,targetName:plan.target.name,round:plan.round,attempt:plan.attempt,profileLabel:OPPOSITION_PROFILES[plan.profile],attributeLabel:plan.profile==="attribute"?ATTRIBUTES[plan.attribute]:"Utilização do Cosmo",payer:{...payer.result,...plan.payerPool},target:{...target.result,...plan.targetPool},outcome:outcome.label,end:outcome.end,repeat:outcome.repeat,reason:plan.reason},{template:"sustained-opposition-chat",rollMode:"publicroll",flags:{sustainedOpposition:result}});
  card.whisper=[];card.blind=false;card.rolls=[payer.messageRoll,...(target.messageRoll?[target.messageRoll]:[])].map(r=>r.toJSON());await guard(actor,expected,plan.target,targetBaseline,id);
  const prepared={card},message=await ChatMessage.create({content:"<p>Oposição em processamento. Aguarde o mesmo cartão; não repita as rolagens.</p>",whisper:[game.user.id],blind:false,flags:{[SYSTEM_ID]:{sustainOppositionPrepared:prepared}}});await guard(actor,expected,plan.target,targetBaseline,id);
  operation={...operation,messageId:message.id,cardHash:actionHash(prepared),after};const next=expectedState(actor,id,operation);await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}`]:operation});expected=next;await guard(actor,expected,plan.target,targetBaseline,id);
  if(message.author?.id!==operation.userId||actionHash(f(message).sustainOppositionPrepared)!==operation.cardHash||actionHash(effectRecords(actor)[key])!==actionHash(before))throw Error("Resultado ou efeito alterado antes de registrar a oposição.");
  await actor.update({[`flags.${SYSTEM_ID}.persistentEffects.${key}`]:after,[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"applied"});await publish(actor,id,f(actor).effectOperations[id]);return result;
 });
}
export async function recoverOpposition(actor,id){
 keyOf(id);if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode recuperar oposição.");
 const operation=f(actor).effectOperations?.[id];if(operation?.kind!=="sustainOpposition"||!["prepared","applied"].includes(operation.status))throw Error("Não há oposição pendente.");const baseline=effectState(actor);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Recuperar oposição de Sustentada"},content:'<p>Recuperar o mesmo resultado sem novas rolagens, gastos ou restauração de recursos. Resultado completo anterior pode ser registrado se participantes e rodada conservarem o estado; divergências ficam para revisão.</p><label>Notas (opcional)<textarea name="reason" maxlength="2000"></textarea></label>',buttons:[{action:"recover",label:"Recuperar mesmo resultado",callback:(_e,b)=>({close:false,reason:b.form.elements.reason.value})},{action:"close",label:"Encerrar pendência sem alterar recursos",callback:(_e,b)=>({close:true,reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!answer)return;
 return runMasterOperation(async()=>{
  const reason=optionalNote(answer.reason),live=await fromUuid(actor.uuid);if(!isPrimaryGM()||!actor.isOwner||!live?.isOwner||live.uuid!==actor.uuid||effectState(live)!==baseline||effectState(actor)!==baseline)throw Error("Ficha, mestre ou registro mudou.");
  if(answer.close){await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"reviewed",[`flags.${SYSTEM_ID}.effectOperations.${id}.review`]:{reason,userId:game.user.id,time:Date.now()}});return;}
  if(operation.actorUuid!==actor.uuid)throw Error("Registro de outra ficha. Encerre somente a pendência local.");
  if(operation.status==="applied")return publish(actor,id,operation);
  const current=effectRecords(actor)[operation.effectId];
  if(operation.after&&actionHash(current)===actionHash(operation.after)){await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"applied"});return publish(actor,id,{...operation,status:"applied"});}
  if(actionHash(current)!==actionHash(operation.before))throw Error("Efeito divergente. Preserve os ajustes e confira manualmente.");
  if(!operation.after){await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"failed"});return;}
  const target=await fromUuid(operation.targetUuid);if(!target||game.combat?.round!==operation.round||actionHash(actor.system)!==operation.payerSystemHash||effectState(target)!==operation.targetState)throw Error("Participantes ou rodada mudaram. Preserve o resultado e confira manualmente.");
  await guard(actor,baseline,target,operation.targetState,id);
  const message=game.messages.get(operation.messageId);if(!message||message.author?.id!==operation.userId||actionHash(f(message).sustainOppositionPrepared)!==operation.cardHash||f(message).sustainOppositionPrepared?.card.blind||f(message).sustainOppositionPrepared?.card.whisper?.length)throw Error("Cartão ausente ou alterado; não repita rolagens.");
  await actor.update({[`flags.${SYSTEM_ID}.persistentEffects.${operation.effectId}`]:operation.after,[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"applied"});return publish(actor,id,{...operation,status:"applied"});
 });
}
export function canOpposeSustained(actor,key){try{available(actor);const v=oppositionView(actor,key);available(v.target);return true;}catch{return false;}}
