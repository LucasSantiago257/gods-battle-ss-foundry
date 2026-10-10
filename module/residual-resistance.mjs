import {SYSTEM_ID,ATTRIBUTES,NATURES} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {effectRecords,effectState} from "./effect-rules.mjs";
import {testParameters} from "./rules.mjs";
import {conditionPool,conditionSummary} from "./condition-rules.mjs";
import {evaluatePool,prepareRollMessage} from "./rolls.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {optionalNote} from "./form-values.mjs";
export const RESIDUAL_PROFILES={day:"Por dias desde a primeira resistência",attempt:"Por tentativa após a primeira",manual:"Bônus cumulativo informado pela mesa"};
const validProfile=value=>typeof value==="string"&&Object.hasOwn(RESIDUAL_PROFILES,value);
const f=doc=>doc?.flags?.[SYSTEM_ID]??{};
const keyOf=key=>{if(typeof key!=="string"||!/^[a-zA-Z0-9]{1,32}$/.test(key))throw Error("Registro de Residual inválido.");return key;};
function available(actor,id=null){
 if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode resolver resistência de Residual.");
 assertNoTechniqueInterruption(actor,{effectOperationId:id});
 if(f(actor).levelOperation?.status==="prepared"||Object.values(f(actor).damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Recupere evolução/dano interrompido antes da resistência.");
}
function targetFor(uuid){
 return [...(game.actors?.contents??[]),...(globalThis.canvas?.tokens?.placeables??[]).map(t=>t.actor),...(game.combats?.contents??[]).flatMap(c=>(c.combatants?.contents??[]).map(m=>m.actor))].find(a=>a?.uuid===uuid);
}
export function residualResistanceView(actor,key){
 keyOf(key);const record=effectRecords(actor)[key],r=record?.residual;
 if(record?.actorUuid!==actor.uuid||record.source?.actorUuid!==actor.uuid||record.kind!=="residual"||record.status!=="active"||record.damage!==0||r?.success!==true||!Number.isFinite(r.value)||r.value<0||r.value>2000000||!Object.hasOwn(NATURES,record.source.nature))throw Error("Escolha um Cosmo Residual ativo, válido e próprio da ficha.");
 const target=targetFor(r.targetUuid);if(target?.type!=="knight"||!target.isOwner||target.uuid===actor.uuid)throw Error("A ficha original do alvo não está disponível; preserve o registro e confira manualmente.");
 const saved=r.resistance,history=Object.values(saved?.attempts??{}).toSorted((a,b)=>a.attempt-b.attempt);
 if(saved&&(!validProfile(saved.profile)||!Number.isSafeInteger(saved.firstDay)||saved.firstDay<0||saved.firstDay>1000000||!Number.isSafeInteger(saved.lastDay)||saved.lastDay<saved.firstDay||saved.lastDay>1000000||!history.length)||history.some((h,i)=>h.attempt!==i+1||h.profile!==saved.profile||!Number.isSafeInteger(h.day)||h.day<(i?history[i-1].day:saved.firstDay)||h.day>1000000||i===0&&h.day!==saved.firstDay||h.resisted!==false||!Number.isFinite(h.total)||!Number.isSafeInteger(h.cumulativeBonus)||h.cumulativeBonus<0||h.cumulativeBonus>1000000||h.difficulty!==r.value||h.total>=r.value||saved.profile==="day"&&h.cumulativeBonus!==h.day-saved.firstDay||saved.profile==="attempt"&&h.cumulativeBonus!==i)||history.length&&history.at(-1).day!==saved.lastDay)throw Error("Histórico de dias/tentativas inválido ou resistência já concluída.");
 if(history.length>=1000)throw Error("Limite de1000 tentativas por registro; confira a continuidade manualmente.");
 if(Object.values(f(actor).effectOperations??{}).some(o=>["residualDeposit","residualResistance"].includes(o.kind)&&o.actorUuid===actor.uuid&&o.effectId===key&&o.status==="applied"&&!o.published))throw Error("Resultado aguarda publicação. Recupere o mesmo cartão antes de outra resistência.");
 return {record,target,history,profile:saved?.profile??null,firstDay:saved?.firstDay??null,lastDay:saved?.lastDay??null,attempt:history.length+1,difficulty:r.value,defaultAttribute:NATURES[record.source.nature].resistance};
}
export function residualResistancePlan(actor,key,answer){
 const view=residualResistanceView(actor,key);
 if(!validProfile(answer?.profile)||view.profile&&answer.profile!==view.profile||!Number.isSafeInteger(answer.day)||answer.day<0||answer.day>1000000||view.lastDay!==null&&answer.day<view.lastDay||!["vig","vel","sen","cos"].includes(answer.attribute)||!Number.isFinite(answer.bonus)||Math.abs(answer.bonus)>10000||![-1,0,1].includes(answer.advantage)||!Number.isSafeInteger(answer.cumulativeBonus)||answer.cumulativeBonus<0||answer.cumulativeBonus>1000000)throw Error("Confira perfil fixo, dia da campanha, atributo e modificadores; não retroceda o dia registrado.");
 const firstDay=view.firstDay??answer.day,cumulativeBonus=answer.profile==="day"?answer.day-firstDay:answer.profile==="attempt"?view.history.length:answer.cumulativeBonus,mode=game.settings.get(SYSTEM_ID,"resistanceMode");
 if(!["rank","modifier"].includes(mode))throw Error("Modo de resistência inválido.");
 const base=testParameters(view.target.system,"resistance",answer.attribute,mode,{technique:true,conditions:false});
 const pool=conditionPool(view.target.system,Math.max(1,base.dice+answer.advantage),base.modifier+answer.bonus+answer.advantage*2+cumulativeBonus,{maxDice:100});
 if(!Number.isSafeInteger(pool.dice)||pool.dice<1||pool.dice>100||!Number.isFinite(pool.modifier)||Math.abs(pool.modifier)>3000000)throw Error("Parada de resistência inválida.");
 return {...view,profile:answer.profile,day:answer.day,firstDay,cumulativeBonus,attribute:answer.attribute,bonus:answer.bonus,advantage:answer.advantage,mode,reason:optionalNote(answer.reason),pool:{...pool,base:base.modifier,conditionSummary:conditionSummary(view.target.system)}};
}
async function guard(actor,baseline,target,targetBaseline,userId,id=null){
 available(actor,id);available(target);const live=await fromUuid(actor.uuid),other=await fromUuid(target.uuid);
 if(game.user.id!==userId||live?.type!=="knight"||live.uuid!==actor.uuid||!live.isOwner||other?.type!=="knight"||other.uuid!==target.uuid||!other.isOwner||effectState(live)!==baseline||effectState(actor)!==baseline||effectState(other)!==targetBaseline||effectState(target)!==targetBaseline)throw Error("Mestre, participante, efeito ou estado mudou. Abra a resistência novamente.");
 available(live,id);available(other);available(actor,id);available(target);
}
const expectedState=(actor,id,operation)=>{const flags=structuredClone(actor.flags??{});flags[SYSTEM_ID]??={};flags[SYSTEM_ID].effectOperations??={};flags[SYSTEM_ID].effectOperations[id]=operation;return effectState({uuid:actor.uuid,system:actor.system,flags});};
function preparedCard(operation){
 const message=game.messages.get(operation.messageId),saved=f(message).residualResistancePrepared;
 if(!message||message.author?.id!==operation.userId||!saved||actionHash(saved)!==operation.cardHash||saved.card.blind||saved.card.whisper?.length)throw Error("Cartão de resistência ausente ou alterado. Não repita a rolagem.");
 return {message,saved};
}
async function publish(actor,id,operation){
 available(actor);if(operation.actorUuid!==actor.uuid||operation.status!=="applied")throw Error("Resistência ainda não registrada.");
 const message=game.messages.get(operation.messageId),resolution=f(message).residualResistanceResolution;
 if(resolution?.actorUuid===actor.uuid&&resolution.operationId===id){if(!operation.published)await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.published`]:true});return message;}
 const saved=preparedCard(operation).saved;
 await message.update({...saved.card,rolls:saved.card.rolls.map(r=>Roll.fromData(r)),[`flags.${SYSTEM_ID}.-=residualResistancePrepared`]:null,[`flags.${SYSTEM_ID}.residualResistanceResolution`]:{actorUuid:actor.uuid,operationId:id}});
 try{await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.published`]:true});}catch(error){console.error(`${SYSTEM_ID}: publicação de resistência de Residual`,error);}return message;
}
export async function resistResidual(actor,key){
 available(actor);const view=residualResistanceView(actor,key);available(view.target);
 const baseline=effectState(actor),targetBaseline=effectState(view.target),userId=game.user.id;
 const content=await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/residual-resistance-dialog.hbs`,{name:view.record.label,payerName:actor.name,targetName:view.target.name,difficulty:view.difficulty,attempt:view.attempt,day:view.lastDay??1,firstDay:view.firstDay,hasFirstDay:view.firstDay!==null,profiles:Object.entries(RESIDUAL_PROFILES).filter(([value])=>!view.profile||view.profile===value).map(([value,label])=>({value,label})),fixedProfile:!!view.profile,attributes:["vig","vel","sen","cos"].map(value=>({value,label:ATTRIBUTES[value],selected:value===view.defaultAttribute}))});
 await guard(actor,baseline,view.target,targetBaseline,userId);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Resistir ao Cosmo Residual"},content,buttons:[{action:"resist",label:"Rolar resistência pública",default:true,callback:(_e,b)=>{const e=b.form.elements;return {profile:e.profile.value,day:e.day.value.trim()===""?NaN:Number(e.day.value),attribute:e.attribute.value,bonus:Number(e.bonus.value),advantage:Number(e.advantage.value),cumulativeBonus:Number(e.cumulativeBonus.value),reason:e.reason.value};}},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!answer)return;
 return runMasterOperation(async()=>{
  await guard(actor,baseline,view.target,targetBaseline,userId);const plan=residualResistancePlan(actor,key,answer),id=keyOf(foundry.utils.randomID());if(f(actor).effectOperations?.[id])throw Error("Identificador existente.");
  const before=structuredClone(plan.record);let operation={kind:"residualResistance",status:"prepared",actorUuid:actor.uuid,targetUuid:plan.target.uuid,effectId:key,userId,time:Date.now(),before,casterSystemHash:actionHash(actor.system),targetState:targetBaseline};
  let expected=expectedState(actor,id,operation);await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}`]:operation});await guard(actor,expected,plan.target,targetBaseline,userId,id);
  const rolled=await evaluatePool(plan.pool.dice,plan.pool.modifier);await guard(actor,expected,plan.target,targetBaseline,userId,id);
  const resisted=rolled.result.total>=plan.difficulty,result={operationId:id,attempt:plan.attempt,day:plan.day,profile:plan.profile,cumulativeBonus:plan.cumulativeBonus,attribute:plan.attribute,bonus:plan.bonus,advantage:plan.advantage,mode:plan.mode,total:rolled.result.total,difficulty:plan.difficulty,resisted,reason:plan.reason,userId,time:Date.now()};
  const after={...before,residual:{...before.residual,resistance:{profile:plan.profile,firstDay:plan.firstDay,lastDay:plan.day,attempts:{...before.residual.resistance?.attempts,[id]:result}}},...(resisted?{status:"ended",end:{reason:plan.reason,userId,time:Date.now(),residualResistanceId:id}}:{})};
  const card=await prepareRollMessage(plan.target,rolled.messageRoll,{name:plan.record.label,payerName:actor.name,targetName:plan.target.name,...rolled.result,...plan.pool,...result,profileLabel:RESIDUAL_PROFILES[plan.profile],attributeLabel:ATTRIBUTES[plan.attribute],firstDay:plan.firstDay},{template:"residual-resistance-chat",rollMode:"publicroll",flags:{residualResistance:result}});
  card.whisper=[];card.blind=false;card.rolls=card.rolls.map(r=>r.toJSON());await guard(actor,expected,plan.target,targetBaseline,userId,id);
  const prepared={card},message=await ChatMessage.create({content:"<p>Resistência ao Residual em processamento. Aguarde o mesmo resultado.</p>",whisper:[userId],blind:false,flags:{[SYSTEM_ID]:{residualResistancePrepared:prepared}}});await guard(actor,expected,plan.target,targetBaseline,userId,id);
  operation={...operation,after,messageId:message.id,cardHash:actionHash(prepared)};const next=expectedState(actor,id,operation);await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}`]:operation});expected=next;await guard(actor,expected,plan.target,targetBaseline,userId,id);preparedCard(operation);
  if(actionHash(effectRecords(actor)[key])!==actionHash(before))throw Error("Residual alterado antes de registrar a resistência.");
  await actor.update({[`flags.${SYSTEM_ID}.persistentEffects.${key}`]:after,[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"applied"});await publish(actor,id,f(actor).effectOperations[id]);return result;
 });
}
export async function recoverResidualResistance(actor,id){
 keyOf(id);if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode recuperar resistência de Residual.");
 const operation=f(actor).effectOperations?.[id];if(operation?.kind!=="residualResistance"||!["prepared","applied"].includes(operation.status))throw Error("Não há resistência de Residual pendente.");const baseline=effectState(actor);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Recuperar resistência de Residual"},content:'<p>Recuperar o mesmo resultado sem nova rolagem, gasto ou restauração. Divergências preservam ajustes e permitem encerrar somente a pendência.</p><label>Notas (opcional)<textarea name="reason" maxlength="2000"></textarea></label>',buttons:[{action:"recover",label:"Recuperar mesmo resultado",callback:(_e,b)=>({close:false,reason:b.form.elements.reason.value})},{action:"close",label:"Encerrar pendência sem alterar recursos",callback:(_e,b)=>({close:true,reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!answer)return;
 return runMasterOperation(async()=>{
  const reason=optionalNote(answer.reason),live=await fromUuid(actor.uuid);if(!isPrimaryGM()||!actor.isOwner||!live?.isOwner||live.uuid!==actor.uuid||effectState(live)!==baseline||effectState(actor)!==baseline)throw Error("Ficha, mestre ou registro mudou.");
  if(answer.close){await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"reviewed",[`flags.${SYSTEM_ID}.effectOperations.${id}.review`]:{reason,userId:game.user.id,time:Date.now()}});return;}
  if(operation.actorUuid!==actor.uuid)throw Error("Registro de outra ficha. Encerre somente a pendência local.");
  if(operation.status==="applied")return publish(actor,id,operation);
  const current=effectRecords(actor)[operation.effectId];
  if(operation.after&&actionHash(current)===actionHash(operation.after)){await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"applied"});return publish(actor,id,{...operation,status:"applied"});}
  if(actionHash(current)!==actionHash(operation.before))throw Error("Residual divergente. Preserve ajustes e confira manualmente.");
  if(!operation.after){await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"failed"});return;}
  const target=await fromUuid(operation.targetUuid);if(!target||actionHash(actor.system)!==operation.casterSystemHash||effectState(target)!==operation.targetState)throw Error("Participantes ou estado mudaram. Preserve o resultado.");
  await guard(actor,baseline,target,operation.targetState,game.user.id,id);preparedCard(operation);
  await actor.update({[`flags.${SYSTEM_ID}.persistentEffects.${operation.effectId}`]:operation.after,[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:"applied"});return publish(actor,id,{...operation,status:"applied"});
 });
}
export function canResistResidual(actor,key){try{available(actor);const view=residualResistanceView(actor,key);available(view.target);return true;}catch{return false;}}
