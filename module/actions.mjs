import {optionalNote} from "./form-values.mjs";
import {SYSTEM_ID,FIGHTING} from "./config.mjs";
import {actionHash,actionContext,actionView,actionPlan,rawActionUsage,actionSignature,ACTION_LABELS} from "./action-rules.mjs";
import {primaryGM,isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {evaluatePool,prepareRollMessage} from "./rolls.mjs";
import {physicalDamage} from "./combat-rules.mjs";
import {conditionPool,conditionSummary,conditionSignature} from "./condition-rules.mjs";
const f=doc=>doc?.flags?.[SYSTEM_ID]??{};
const author=m=>m.author?.id??m.user?.id;
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modes=new Set(["publicroll","gmroll","blindroll","selfroll"]);
export const combatActionState=actor=>actionHash({actorUuid:actor.uuid,system:actor.system.toObject?actor.system.toObject(false):actor.system,actions:actionSignature(actor),conditions:conditionSignature(actor)});
function available(actor) {
 assertNoTechniqueInterruption(actor);
 if(f(actor).levelOperation?.status==="prepared"||Object.values(f(actor).damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Há operação interrompida de dano/evolução. Confira antes de gastar ações.");
}
export function pendingAction(actor) {return (game.messages?.contents??[]).some(m=>f(m).actionRequest?.actorUuid===actor.uuid&&!['published','failed','reviewed'].includes(f(m).actionResponse?.status));}
export async function submitCombatAction(actor,options,baseline=combatActionState(actor)) {
 if(!actor.isOwner)throw Error("Sem permissão para gastar ações desta ficha.");
 const gm=primaryGM();if(!gm?.active)throw Error("É necessário um mestre conectado para processar as ações.");
 available(actor);if(pendingAction(actor))throw Error("Há solicitação de ações aguardando processamento. Confira o histórico antes de repetir.");
 if(combatActionState(actor)!==baseline)throw Error("Ficha, rodada ou ações mudaram. Abra a confirmação novamente.");
 if(!actionContext(actor))throw Error("O controle de ações não está ativo para esta ficha.");
 const rollMode=game.settings.get("core","rollMode");if(!modes.has(rollMode))throw Error("Visibilidade inválida.");
 return ChatMessage.create({content:"<p>Ação enviada ao mestre. Este cartão receberá o resultado; não repita a solicitação.</p>",whisper:[...new Set([game.user.id,gm.id])],blind:rollMode==="blindroll",flags:{[SYSTEM_ID]:{actionRequest:{actorUuid:actor.uuid,baseline,options:structuredClone(options),rollMode}}}});
}
async function respond(message,status,text) {
 if(actionHash(f(message).actionResponse)===actionHash({status,text}))return;
 await message.update({[`flags.${SYSTEM_ID}.actionResponse`]:{status,text},content:`<p>${escape(text)}</p>`});
}
async function publish(message,actor,record) {
 if(!isPrimaryGM())throw Error("Mestre responsável mudou; ações registradas aguardam publicação.");
 if(f(message).actionResponse?.status==="published")return;
 const saved=f(message).actionPrepared;if(!saved||actionHash(saved)!==record.cardHash)throw Error("Resultado ausente/alterado. Confira o histórico; não role novamente.");
 await message.update({...saved.card,rolls:saved.card.rolls.map(data=>Roll.fromData(data)),[`flags.${SYSTEM_ID}.-=actionRequest`]:null,[`flags.${SYSTEM_ID}.-=actionPrepared`]:null,[`flags.${SYSTEM_ID}.actionResolution`]:{actorUuid:actor.uuid,operationId:message.id},[`flags.${SYSTEM_ID}.actionResponse`]:{status:"published",text:"Ações registradas; cartão publicado."}});
 try{await actor.update({[`flags.${SYSTEM_ID}.actionOperations.${message.id}.published`]:true});}catch(error){console.error(error);}
}
function guard(message,request,user,actor,signature) {
 if(!isPrimaryGM()||author(message)!==user.id||!actor.testUserPermission(user,"OWNER"))throw Error("Mestre, autor ou permissão mudou durante a ação.");
 if(actionHash(f(message).actionRequest)!==signature||combatActionState(actor)!==request.baseline)throw Error("Ficha, solicitação, rodada ou ações mudaram durante a confirmação. Confira o registro.");
}
async function rootAttack(options,user,actor,ownId=null) {
 const root=game.messages.get(options.rootId),fight=f(root).fight;
 if(!root||!fight||fight.targetUuid!==actor.uuid)throw Error("Ataque original indisponível ou dirigido a outra ficha.");
 if(!user.isGM&&(root.blind||root.whisper?.length&&!root.whisper.includes(user.id)))throw Error("Sem acesso ao ataque original.");
 if(actionHash(fight)!==options.fightHash)throw Error("Ataque original mudou desde a confirmação.");
 const context=actionContext(actor);
 if(fight.actionContext&&["combatUuid","round","epoch"].some(key=>fight.actionContext[key]!==context?.[key]))throw Error("Este ataque pertence a outra rodada/encontro. Resolva o cartão pendente antes de avançar; para exceções use conferência manual.");
 const source=f(root).actionResolution;
 if(source&&f(root).actionResponse?.status!=="published")throw Error("Ataque ainda não publicado.");
 if(Object.values(f(actor).actionOperations??{}).some(r=>r.requestId!==ownId&&r.actorUuid===actor.uuid&&r.rootId===root.id&&r.kind==="defend"&&['prepared','paid'].includes(r.status)))throw Error("A defesa deste ataque já foi registrada. Recupere o mesmo cartão; não gaste ações novamente.");
 return {root,fight};
}
export async function executeActionRequest(message,userId) {
 if(!isPrimaryGM())return;
 const request=f(message).actionRequest,user=game.users.get(userId);if(!request||!user||author(message)!==userId||['published','failed','reviewed'].includes(f(message).actionResponse?.status))return;
 let actor;
 try {
  actor=await fromUuid(request.actorUuid);
  if(actor?.type!=="knight"||actor.uuid!==request.actorUuid||!actor.testUserPermission(user,"OWNER")||!modes.has(request.rollMode)||!/^[a-zA-Z0-9]{1,32}$/.test(message.id))throw Error("Solicitação ou permissão inválida.");
  const prior=f(actor).actionOperations?.[message.id];
  if(prior){if(prior.actorUuid!==actor.uuid||prior.userId!==userId)throw Error("Registro pertence a outra ficha/autor.");if(prior.status==="paid"){await publish(message,actor,prior);return;}if(prior.status==="prepared"){await respond(message,"interrupted","Ação interrompida. O mestre deve conferir o histórico; não repetir.");return;}throw Error("Solicitação já encerrada.");}
  available(actor);if(!actionContext(actor))throw Error("Controle de ações desativado ou combate encerrado.");
  const options=request.options,signature=actionHash(request);guard(message,request,user,actor,signature);
  if(!options||!["attack","defend","consume"].includes(options.kind))throw Error("Tipo de ação inválido.");
  if(!Number.isFinite(options.bonus??0)||Math.abs(options.bonus??0)>10000)throw Error("Modificador inválido.");
  let target,root,fight,dice,pool,label;
  if(options.kind==="attack"){
   if(!FIGHTING[options.fighting]||options.fighting==="defense")throw Error("Habilidade de ataque inválida.");
   target=await fromUuid(options.targetUuid);if(target?.type!=="knight"||target.uuid!==options.targetUuid)throw Error("Alvo indisponível.");
   dice=actor.system.fighting[options.fighting];pool="attack";label=`${FIGHTING[options.fighting]} contra ${target.name}`;
  }else if(options.kind==="defend"){
   ({root,fight}=await rootAttack(options,user,actor));dice=actor.system.fighting.defense;pool="defense";label=actor.name;
  }else{pool=options.pool;label=ACTION_LABELS[pool];if(!["movement","reaction"].includes(pool)||(options.reason!==undefined&&typeof options.reason!=="string")||(options.reason?.length??0)>2000)throw Error("Uso de Movimento/Reação ou descrição inválida.");}
  if(dice!==undefined&&(!Number.isInteger(dice)||dice<1||dice>5))throw Error("Configure graduação de luta entre1 e5.");
  guard(message,request,user,actor,signature);
  const plan=actionPlan(actor,pool,options.amount,{operationId:message.id});
  let record={status:"prepared",actorUuid:actor.uuid,userId,requestId:message.id,kind:options.kind,rootId:root?.id??null,pool,cost:plan.cost,label,time:Date.now(),before:plan.before,after:plan.after,reason:options.reason??""};
  await actor.update({[`flags.${SYSTEM_ID}.actionOperations.${message.id}`]:record});guard(message,request,user,actor,signature);
  let card;
  if(options.kind==="consume")card={content:`<p>${escape(label)}: ${plan.cost} ação. ${escape(options.reason)}</p>`,rolls:[],whisper:[user.id,primaryGM().id],blind:false};
  else {
   const pool=conditionPool(actor.system,dice,plan.cost+actor.system.combat.levelModifier+(options.bonus??0),{maxDice:5});
   const {result,messageRoll}=await evaluatePool(pool.dice,pool.modifier);
   guard(message,request,user,actor,signature);
   if(options.kind==="attack"){
    fight={attackerUuid:actor.uuid,targetUuid:target.uuid,kind:options.fighting,attack:result.total,damageLevel:actor.system.combat.attackLevel,damageBonus:actor.system.combat.damageBonus+actor.system.combat.physicalDamageBonus,actionContext:plan.view.context};
    card=await prepareRollMessage(actor,messageRoll,{label,kind:"Ataque",...result,fight,conditionSummary:conditionSummary(actor.system),actions:{cost:plan.cost,pool:ACTION_LABELS[pool],round:plan.view.context.round}},{template:"combat-chat",rollMode:request.rollMode,flags:{fight}});
   }else{
    const outcome=physicalDamage(fight.attack,result.total,{...fight,protection:actor.system.combat.protection}),resolvedDamage={actorUuid:actor.uuid,rootMessageId:root.id,body:outcome.damage,armor:0,armorId:null};
    card=await prepareRollMessage(actor,messageRoll,{label,kind:"Defesa",...result,outcome,resolvedDamage,conditionSummary:conditionSummary(actor.system),actions:{cost:plan.cost,pool:ACTION_LABELS[pool],round:plan.view.context.round}},{template:"combat-chat",rollMode:request.rollMode,flags:{resolvedDamage}});
   }
   if(request.rollMode==="selfroll")card.whisper=[user.id];card.blind=request.rollMode==="blindroll";card.whisper??=[];card.rolls=card.rolls.map(r=>r.toJSON());
  }
  const saved={card};guard(message,request,user,actor,signature);
  await message.update({[`flags.${SYSTEM_ID}.actionPrepared`]:saved});guard(message,request,user,actor,signature);
  record={...record,cardHash:actionHash(saved)};await actor.update({[`flags.${SYSTEM_ID}.actionOperations.${message.id}`]:record});guard(message,request,user,actor,signature);
  if(options.kind==="attack"){const current=await fromUuid(options.targetUuid);if(current?.uuid!==target.uuid||current.type!=="knight")throw Error("Alvo removido durante a ação.");}
  if(options.kind==="defend")await rootAttack(options,user,actor,message.id);
  guard(message,request,user,actor,signature);if(actionHash(f(message).actionPrepared)!==record.cardHash)throw Error("Cartão alterado antes do gasto.");
  await actor.update({...plan.updates,[`flags.${SYSTEM_ID}.actionOperations.${message.id}`]:{...record,status:"paid"}});
  await publish(message,actor,f(actor).actionOperations[message.id]);
 }catch(error){if(!isPrimaryGM()||f(message).actionResponse?.status==="published")return;const record=actor&&f(actor).actionOperations?.[message.id];await respond(message,record?.status==="paid"?"paid":record?.status==="prepared"?"interrupted":"failed",`${error.message}${record?" Não repita: confira o histórico de ações.":""}`).catch(console.error);}
}
export function enqueueActionRequest(message,_options,userId){if(isPrimaryGM()&&f(message).actionRequest)return runMasterOperation(()=>executeActionRequest(message,userId));}
export async function resumeActionRequests(){if(isPrimaryGM())for(const m of game.messages.contents)if(f(m).actionRequest&&!['published','failed','reviewed'].includes(f(m).actionResponse?.status))await enqueueActionRequest(m,{},author(m));}
export function notifyActionResponse(message,changes){if(changes&&!changes[`flags.${SYSTEM_ID}.actionResponse`]&&!changes.flags?.[SYSTEM_ID]?.actionResponse)return;const r=f(message).actionResponse;if(r&&author(message)===game.user.id)(r.status==="published"?ui.notifications.info:ui.notifications.warn)(r.text);}
export async function recoverAction(actor,key) {
 if(!isPrimaryGM())throw Error("Somente o mestre responsável pode recuperar ações.");
 return runMasterOperation(async()=>{
  const record=f(actor).actionOperations?.[key],baseline=actionHash(record);if(!record||!["prepared","paid"].includes(record.status))throw Error("Nenhuma operação pendente.");
  if(record.actorUuid!==actor.uuid)throw Error("Registro veio de outra ficha. Encerre após revisão manual apenas nesta cópia.");
  if(!await foundry.applications.api.DialogV2.confirm({window:{title:"Conferir ação interrompida"},content:"<p>Conferir gasto registrado e recuperar o mesmo cartão? Não consome nem rola outra vez. Estado divergente exige ajuste/revisão manual.</p>"}))return;
  if(!isPrimaryGM()||actionHash(f(actor).actionOperations?.[key])!==baseline)throw Error("Registro ou mestre mudou.");
  const message=game.messages.get(record.requestId);
  if(record.status==="paid"){if(!message)throw Error("Cartão removido. Gasto permanece registrado; revise manualmente.");await publish(message,actor,record);return;}
  if(actionHash(rawActionUsage(actor))===actionHash(record.before)){
   await actor.update({[`flags.${SYSTEM_ID}.actionOperations.${key}.status`]:"failed"});if(message)await message.update({[`flags.${SYSTEM_ID}.-=actionRequest`]:null,[`flags.${SYSTEM_ID}.-=actionPrepared`]:null,[`flags.${SYSTEM_ID}.actionResponse`]:{status:"failed",text:"Ação encerrada pelo mestre sem gasto."},content:"<p>Ação encerrada sem gasto e sem novo teste.</p>"});return;
  }
  if(actionHash(rawActionUsage(actor))===actionHash(record.after)){
   await actor.update({[`flags.${SYSTEM_ID}.actionOperations.${key}.status`]:"paid"});if(!message)throw Error("Gasto reconhecido; cartão removido. Revise manualmente.");await publish(message,actor,{...record,status:"paid"});return;
  }
  throw Error("Ações alteradas após a interrupção. Preserve os ajustes e revise manualmente.");
 });
}
export async function reviewAction(actor,key) {
 if(!isPrimaryGM())throw Error("Somente o mestre responsável pode revisar ações.");
 return runMasterOperation(async()=>{
  const r=f(actor).actionOperations?.[key],baseline=actionHash(r);if(!r||!['prepared','paid'].includes(r.status)||r.published)throw Error("Não há ação interrompida para revisar.");
  const message=r.actorUuid===actor.uuid?game.messages.get(r.requestId):null;if(f(message).actionResponse?.status==="published")throw Error("A ação já foi publicada.");
  const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Encerrar ação após revisão manual"},content:"<p>Confira o gasto e faça o ajuste necessário. Encerrar conserva todas as reservas atuais e não cria resultado.</p><label>Notas (opcional)<textarea name=\"reason\"></textarea></label>",buttons:[{action:"review",label:"Registrar revisão",callback:(_e,b)=>({reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
  if(!answer)return;optionalNote(answer.reason);
  if(!isPrimaryGM()||actionHash(f(actor).actionOperations?.[key])!==baseline)throw Error("Mestre ou registro mudou.");
  await actor.update({[`flags.${SYSTEM_ID}.actionOperations.${key}.status`]:"reviewed",[`flags.${SYSTEM_ID}.actionOperations.${key}.review`]:{reason:optionalNote(answer.reason),userId:game.user.id,time:Date.now()}});
  if(message)await message.update({[`flags.${SYSTEM_ID}.-=actionRequest`]:null,[`flags.${SYSTEM_ID}.-=actionPrepared`]:null,[`flags.${SYSTEM_ID}.actionResponse`]:{status:"reviewed",text:"Ação encerrada após revisão manual."},content:"<p>Ação encerrada após revisão manual; reservas preservadas.</p>"});
 });
}
export async function toggleActionControl() {
 if(!isPrimaryGM())throw Error("Somente o mestre responsável pode alterar o controle de ações.");
 return runMasterOperation(async()=>{
  const combat=game.combat;if(!combat)throw Error("Abra um encontro no rastreador de combate.");
  const enabled=!!f(combat).actionControl?.enabled,baseline=actionHash({round:combat.round,control:f(combat).actionControl});
  if(!await foundry.applications.api.DialogV2.confirm({window:{title:enabled?"Desativar controle de ações":"Ativar controle de ações"},content:enabled?"<p>Desativar neste encontro? Novas rolagens não consumirão reservas. Registros existentes são conservados; operações interrompidas ainda exigem revisão.</p>":"<p>Ativar neste encontro? Todos os participantes recebem reservas novas nesta rodada. Ataques/defesas confirmam quantidades; técnicas gastam toda a reserva escolhida. Mudar a rodada repõe reservas; mudar a vez não. PV e CE são preservados.</p>"}))return;
  if(!isPrimaryGM()||game.combat!==combat||actionHash({round:combat.round,control:f(combat).actionControl})!==baseline)throw Error("Encontro ou mestre mudou.");
  await combat.update({[`flags.${SYSTEM_ID}.actionControl`]:{enabled:!enabled,epoch:foundry.utils.randomID(),userId:game.user.id,time:Date.now()}});
 });
}
export async function consumeAction(actor,pool) {
 const view=actionView(actor),baseline=combatActionState(actor);if(!view.enabled)throw Error("Ative o controle de ações no encontro iniciado.");
 if(!["movement","reaction"].includes(pool))throw Error("Reserva inválida.");
 if(view.remaining[pool]<1)throw Error(`Nenhuma ação de ${ACTION_LABELS[pool]} disponível nesta rodada.`);
 const reason=await foundry.applications.api.DialogV2.wait({window:{title:`Usar ${ACTION_LABELS[pool]}`},content:`<p>Disponível: ${view.remaining[pool]}. Registra uma ação; efeito, deslocamento e CE são conferidos separadamente.</p><label>Descrição (opcional)<textarea name="reason"></textarea></label>`,buttons:[{action:"use",label:"Confirmar uso",callback:(_e,b)=>b.form.elements.reason.value},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(reason===null)return;
 return submitCombatAction(actor,{kind:"consume",pool,amount:1,reason},baseline);
}
export async function adjustActions(actor) {
 if(!isPrimaryGM())throw Error("Somente o mestre responsável ajusta ações.");
 return runMasterOperation(async()=>{
  const view=actionView(actor),baseline=combatActionState(actor);if(!view.enabled)throw Error("Controle de ações não está ativo.");
  const fields=Object.entries(ACTION_LABELS).map(([key,label])=>`<label>${label} disponíveis (máximo ${view.maxima[key]})<input name="${key}" type="number" min="0" max="${view.maxima[key]}" value="${view.remaining[key]}"></label>`).join("");
  const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Ajustar reservas de ações"},content:`<p>Revisão do mestre para exceções/efeitos conferidos. Não concede virtudes nem aplica efeitos. Operações interrompidas devem ser encerradas após o reparo.</p>${fields}<label>Notas (opcional)<textarea name="reason"></textarea></label>`,buttons:[{action:"adjust",label:"Registrar ajuste",callback:(_e,b)=>({values:Object.fromEntries(Object.keys(ACTION_LABELS).map(key=>[key,Number(b.form.elements[key].value)])),reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
  if(!answer)return;if(!isPrimaryGM()||combatActionState(actor)!==baseline)throw Error("Mestre, rodada ou ações mudou.");
  optionalNote(answer.reason);
  const spent={};for(const key of Object.keys(ACTION_LABELS)){const value=answer.values[key];if(!Number.isSafeInteger(value)||value<0||value>view.maxima[key])throw Error("Disponibilidade fora dos limites da ficha.");spent[key]=view.maxima[key]-value;}
  const id=foundry.utils.randomID(),after={actorUuid:actor.uuid,context:view.context,spent,last:id};
  await actor.update({[`flags.${SYSTEM_ID}.actionUsage`]:after,[`flags.${SYSTEM_ID}.actionAdjustments.${id}`]:{before:rawActionUsage(actor),after,reason:optionalNote(answer.reason),userId:game.user.id,time:Date.now()}});
 });
}
export function actionSheetContext(actor) {
 try{const view=actionView(actor);return {...view,entries:Object.entries(ACTION_LABELS).map(([key,label])=>({key,label,max:view.maxima[key],spent:view.spent[key],remaining:view.remaining[key]})),canToggle:!!game.combat,controlEnabled:!!f(game.combat).actionControl?.enabled};}catch(error){return {error:error.message};}
}
export function refreshActionSheets(){for(const actor of game.actors?.contents??[])for(const app of Object.values(actor.apps??{}))if(app.rendered)app.render();for(const token of globalThis.canvas?.tokens?.placeables??[])for(const app of Object.values(token.actor?.apps??{}))if(app.rendered)app.render();}
