import {SYSTEM_ID} from "./config.mjs";
import {techniqueParameters,techniqueOutcome,cosmoPayment,techniqueReadiness,EFFECT_KINDS} from "./technique-rules.mjs";
import {evaluatePool,prepareRollMessage} from "./rolls.mjs";
import {levelSignature} from "./level-rules.mjs";
import {primaryGM,isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {actionSignature,rawActionUsage,techniqueActionPlan} from "./action-rules.mjs";
import {componentState,techniqueWithComponents} from "./technique-components.mjs";
const flags=doc=>doc?.flags?.[SYSTEM_ID]??{};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=value=>levelSignature({},[{_id:"activation",value}]);
const author=message=>message.author?.id??message.user?.id;
const validActor=uuid=>typeof uuid==="string"&&uuid.length<=256&&/^(Actor|Scene)\.[a-zA-Z0-9.]+$/.test(uuid);
const modes=new Set(["publicroll","gmroll","blindroll","selfroll"]);
export const techniqueRollMode=()=>{const mode=game.settings.get("core","rollMode");if(!modes.has(mode))throw Error("Visibilidade de rolagem inválida.");return mode;};
export const activationState=(actor,item)=>hash({actorUuid:actor.uuid,system:actor.system.toObject?actor.system.toObject(false):actor.system,itemId:item.id,name:item.name,item:item.system.toObject?item.system.toObject():item.system,review:flags(item).source?.reference,draft:flags(item).techniqueDraft,last:flags(actor).techniqueLast??null,actions:actionSignature(actor),components:componentState(item)});
export function paymentSnapshot(actor) {const r=actor.system.resources;return {health:r.health.value,current:r.cosmo.value,extra:r.cosmoExtra,reserved:r.cosmoReserved,overload:r.cosmoOverload,unlimited:r.cosmo.unlimited,penalty:actor.system.combat.asterismPenalty,last:flags(actor).techniqueLast??null,actions:rawActionUsage(actor)};}
const matches=(actor,snapshot)=>{const current=paymentSnapshot(actor);if(!Object.hasOwn(snapshot,"actions"))delete current.actions;return hash(current)===hash(snapshot);};
function available(actor) {
 assertNoTechniqueInterruption(actor);
 if(flags(actor).levelOperation?.status==="prepared"||Object.values(flags(actor).damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Há operação de evolução/dano interrompida. O mestre precisa conferi-la antes de ativar técnicas.");
}
export function pendingTechnique(actor) {return (game.messages?.contents??[]).some(m=>flags(m).techniqueRequest?.actorUuid===actor.uuid&&!['published','failed','reviewed'].includes(flags(m).techniqueResponse?.status));}
export async function submitTechniqueActivation(actor,item,{baseline,options,payment,target,rollMode}) {
 if(!actor.isOwner||!item.isOwner||item.parent!==actor||!actor.items.get(item.id))throw Error("Sem permissão para ativar esta técnica.");
 const gm=primaryGM();if(!gm?.active)throw Error("É necessário um mestre ativo para processar a ativação.");
 available(actor);if(pendingTechnique(actor))throw Error("Já existe uma solicitação desta ficha aguardando processamento. Confira o chat/registro antes de repetir.");
 if(activationState(actor,item)!==baseline||techniqueReadiness(item))throw Error("A ficha ou técnica mudou durante a confirmação. Abra a ativação novamente.");
 if(!modes.has(rollMode))throw Error("Visibilidade de rolagem inválida.");
 return ChatMessage.create({content:"<p>Ativação enviada ao mestre. Aguarde: este cartão será atualizado com o resultado. Não repita a solicitação.</p>",whisper:[...new Set([game.user.id,gm.id])],blind:rollMode==="blindroll",flags:{[SYSTEM_ID]:{techniqueRequest:{actorUuid:actor.uuid,itemId:item.id,itemUuid:item.uuid,baseline,options:structuredClone(options),expectedPayment:structuredClone(payment),targetUuid:target?.uuid??null,rollMode}}}});
}
async function response(message,status,text,paid=false) {
 const next={ok:status==="published",status,text,paid};if(hash(flags(message).techniqueResponse)===hash(next))return;
 await message.update({[`flags.${SYSTEM_ID}.techniqueResponse`]:next,...(status==="published"?{}:{content:`<p>${escape(text)}</p>`})});
}
function validateCurrent(message,request,requester,actor,item,baseline,signature) {
 if(!isPrimaryGM())throw Error("Mestre responsável mudou durante a ativação.");
 if(author(message)!==requester.id||hash(flags(message).techniqueRequest)!==signature)throw Error("A solicitação foi alterada durante o processamento.");
 if(!actor.testUserPermission(requester,"OWNER")||!actor.items.get(item.id)||item.parent!==actor||item.uuid!==request.itemUuid)throw Error("Sem permissão ou técnica removida.");
 if(activationState(actor,item)!==baseline)throw Error("A ficha ou técnica mudou durante a ativação. Confira novamente; nenhum recurso foi gasto.");
 const reason=techniqueReadiness(item);if(reason)throw Error(reason);
}
async function publishStored(message,actor,record) {
 if(!isPrimaryGM())throw Error("Mestre responsável mudou; o pagamento está registrado e aguarda publicação.");
 if(flags(message).techniqueResponse?.status==="published"&&flags(message).techniqueResolution?.operationId===record.requestId){if(!record.cardPublished)await actor.update({[`flags.${SYSTEM_ID}.techniqueOperations.${message.id}.cardPublished`]:true});return;}
 const saved=flags(message).techniquePrepared;
 if(!saved||record.preparedSignature!==hash(saved))throw Error("Pagamento registrado; cartão ausente/alterado. O mestre deve conferir a ativação interrompida.");
 const card={...saved.card,rolls:saved.card.rolls.map(data=>Roll.fromData(data))};
 await message.update({...card,[`flags.${SYSTEM_ID}.-=techniqueRequest`]:null,[`flags.${SYSTEM_ID}.-=techniquePrepared`]:null,[`flags.${SYSTEM_ID}.techniqueResolution`]:{actorUuid:actor.uuid,operationId:message.id},[`flags.${SYSTEM_ID}.techniqueResponse`]:{ok:true,status:"published",paid:true,text:"Técnica processada; pagamento registrado."}});
 // A publicação é idempotente: atualiza o mesmo documento, sem criar outra rolagem.
 try{await actor.update({[`flags.${SYSTEM_ID}.techniqueOperations.${message.id}.cardPublished`]:true});}catch(error){console.error(`${SYSTEM_ID}: registro da publicação`,error);}
}
export async function executeTechniqueRequest(message,userId) {
 if(!isPrimaryGM())return;
 const request=flags(message).techniqueRequest,requester=game.users.get(userId);
 if(!request||!requester||author(message)!==userId||['published','failed','reviewed'].includes(flags(message).techniqueResponse?.status))return;
 let actor,record;
 try{
  if(!/^[a-zA-Z0-9]{1,32}$/.test(message.id)||!validActor(request.actorUuid)||!modes.has(request.rollMode))throw Error("Solicitação de ativação inválida.");
  actor=await fromUuid(request.actorUuid);
  if(actor?.type!=="knight"||actor.uuid!==request.actorUuid||!actor.testUserPermission(requester,"OWNER"))throw Error("Sem permissão para ativar este cavaleiro.");
  record=flags(actor).techniqueOperations?.[message.id];
  if(record&&record.actorUuid!==actor.uuid)throw Error("Registro de ativação pertence a outra cópia da ficha.");
  if(record?.userId!==undefined&&record.userId!==userId)throw Error("Autor do registro não corresponde à solicitação.");
  if(record?.status==="paid"){await publishStored(message,actor,record);return;}
  if(record?.status==="prepared"){
   if(flags(message).techniqueResponse?.status!=="interrupted")await response(message,"interrupted","Ativação interrompida. Não repetir: o mestre deve conferir o registro na aba Combate.");return;
  }
  if(record?.status==="reviewed"){await response(message,"reviewed","Ativação encerrada após reparo manual registrado pelo mestre.",record.review?.previousStatus==="paid");return;}
  if(record)throw Error("Esta solicitação já foi encerrada; abra uma nova ativação após conferir a ficha.");
  available(actor);
  const item=actor.items.get(request.itemId);
  if(item?.type!=="technique"||item.parent!==actor||item.uuid!==request.itemUuid)throw Error("Técnica não pertence ao cavaleiro.");
  const baseline=activationState(actor,item),signature=hash(request);
  if(baseline!==request.baseline)throw Error("A ficha ou técnica mudou desde a confirmação. Abra uma nova ativação.");
  validateCurrent(message,request,requester,actor,item,baseline,signature);
  const options=request.options;if(!options||typeof options.useExtra!=="boolean"||typeof options.allowOverload!=="boolean")throw Error("Opções de pagamento inválidas.");
  const actionPlan=techniqueActionPlan(actor,options,message.id);
  const technique=techniqueWithComponents(item),parameters=techniqueParameters(actor.system,technique,options),payment=cosmoPayment(actor.system,parameters.cost,options);
  if(hash(payment)!==hash(request.expectedPayment))throw Error("O pagamento mudou; confirme os valores novamente.");
  let target=null;if(request.targetUuid){if(!validActor(request.targetUuid))throw Error("Alvo inválido.");target=await fromUuid(request.targetUuid);if(target?.type!=="knight"||target.uuid!==request.targetUuid)throw Error("O alvo não está mais disponível.");}
  if(options.oppositeEssence&&!target)throw Error("Essência Alvo exige um alvo marcado e sua Essência contrária conferida.");
  validateCurrent(message,request,requester,actor,item,baseline,signature);
  const before=paymentSnapshot(actor);
  record={status:"prepared",actorUuid:actor.uuid,requestId:message.id,userId,name:item.name,itemUuid:item.uuid,baseline,requestSignature:signature,before,payment:Object.fromEntries(Object.entries(payment).filter(([key])=>key!=="updates")),time:Date.now(),rollMode:request.rollMode,actionCost:actionPlan.cost,actionPool:options.actionPool??null,actionContext:actionPlan.view.context,components:parameters.components,componentReason:options.componentReason??""};
  await actor.update({[`flags.${SYSTEM_ID}.techniqueOperations.${message.id}`]:record});
  validateCurrent(message,request,requester,actor,item,baseline,signature);
  const {result,messageRoll}=await evaluatePool(parameters.dice,parameters.modifier);
  validateCurrent(message,request,requester,actor,item,baseline,signature);
  const outcome=techniqueOutcome(actor.system,technique,parameters,result.total),attack={name:item.name,nature:technique.nature,effectKind:parameters.effectKind,powerCosmic:parameters.powerCosmic,damage:outcome.damage,armorDamage:outcome.armorDamage,attackerUuid:actor.uuid,...(target?{targetUuid:target.uuid,targetName:target.name}:{})};
  const card=await prepareRollMessage(actor,messageRoll,{name:item.name,...result,...parameters,...outcome,payment,componentReason:options.componentReason??"",actions:actionPlan.cost?{cost:actionPlan.cost,pool:options.actionPool==="attack"?"Ataque":"Defesa",round:actionPlan.view.context.round}:null,effectLabel:EFFECT_KINDS[parameters.effectKind],description:technique.description,isDamage:parameters.effectKind==="damage",targetName:target?.name,power:parameters.power,userLevel:actor.system.profile.level,damageBonus:actor.system.combat.damageBonus+(actor.system.combat.techniqueDamageBonus??0)},
   {template:"technique-chat",rollMode:request.rollMode,flags:{technique:{itemUuid:item.uuid,...parameters,...outcome,payment:record.payment},...(outcome.success?{attack}:{})}});
  // Self roll acompanha o solicitante, não o cliente mestre que executou o teste.
  if(request.rollMode==="selfroll")card.whisper=[userId];
  card.blind=request.rollMode==="blindroll";card.whisper??=[];
  card.rolls=card.rolls.map(roll=>roll.toJSON());const prepared={card};
  validateCurrent(message,request,requester,actor,item,baseline,signature);
  await message.update({[`flags.${SYSTEM_ID}.techniquePrepared`]:prepared});
  validateCurrent(message,request,requester,actor,item,baseline,signature);
  const after={...before,current:payment.updates["system.resources.cosmo.value"]??before.current,extra:payment.updates["system.resources.cosmoExtra"]??before.extra,overload:payment.updates["system.resources.cosmoOverload"]??before.overload,health:payment.updates["system.resources.health.value"]??before.health,penalty:outcome.nextPenalty,last:message.id,actions:actionPlan.after};
  record={...record,after,preparedSignature:hash(prepared)};
  await actor.update({[`flags.${SYSTEM_ID}.techniqueOperations.${message.id}`]:record});
  validateCurrent(message,request,requester,actor,item,baseline,signature);
  if(request.targetUuid){const current=await fromUuid(request.targetUuid);if(current?.type!=="knight"||current.uuid!==request.targetUuid)throw Error("O alvo mudou ou não está mais disponível.");validateCurrent(message,request,requester,actor,item,baseline,signature);}
  if(!matches(actor,before)||hash(flags(message).techniquePrepared)!==record.preparedSignature)throw Error("Recursos ou cartão mudaram antes do pagamento. Confira o registro.");
  await actor.update({...payment.updates,...actionPlan.updates,"system.combat.asterismPenalty":outcome.nextPenalty,[`flags.${SYSTEM_ID}.techniqueLast`]:message.id,[`flags.${SYSTEM_ID}.techniqueOperations.${message.id}`]:{...record,status:"paid"}});
  record=flags(actor).techniqueOperations[message.id];
  await publishStored(message,actor,record);
 }catch(error){
  if(!isPrimaryGM()||flags(message).techniqueResponse?.status==="published")return;
  const actual=actor&&flags(actor).techniqueOperations?.[message.id],paid=actual?.status==="paid",interrupted=actual?.status==="prepared";
  const status=paid?"paid":interrupted?"interrupted":"failed";
  const text=paid?"Os recursos foram gastos e registrados, mas o cartão não foi publicado. Não repita: o mestre pode recuperar o cartão na aba Combate.":interrupted?`${error.message} Ativação interrompida: confira o registro na aba Combate; não repetir cobrança.`:error.message;
  try{await response(message,status,text,paid);}catch(failure){console.error(`${SYSTEM_ID}: resposta de ativação`,failure);}
 }
}
export function enqueueTechniqueRequest(message,_options,userId) {if(!isPrimaryGM()||!flags(message).techniqueRequest)return;return runMasterOperation(()=>executeTechniqueRequest(message,userId));}
export async function reviewTechniqueOperation(actor,key) {
 if(!isPrimaryGM())throw Error("A revisão exige o mestre responsável.");
 return runMasterOperation(async()=>{
  const r=flags(actor).techniqueOperations?.[key];if(!r||!['prepared','paid'].includes(r.status)||r.cardPublished)throw Error("Não há registro interrompido para liberar.");
  const baseline=hash(r),message=r.actorUuid===actor.uuid?game.messages.get(r.requestId):null;if(flags(message).techniqueResponse?.status==="published")throw Error("O cartão já foi publicado; conserve o registro de pagamento.");
  const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Liberar após reparo manual"},content:"<p>Confira CE, PV, excesso acumulado e penalidade de Asterismo. Esta ação encerra a solicitação sem restaurar recursos, publicar resultado ou repetir a rolagem. Faça os ajustes manuais necessários antes de confirmar.</p><label>Motivo e reparos feitos<textarea name=\"reason\"></textarea></label><label><input type=\"checkbox\" name=\"reviewed\">Conferi e reparei a ficha; desejo encerrar esta solicitação.</label>",buttons:[{action:"review",label:"Registrar revisão e encerrar",callback:(_e,b)=>({reason:b.form.elements.reason.value,reviewed:b.form.elements.reviewed.checked})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
  if(!answer)return;
  if(!answer.reviewed||typeof answer.reason!=="string"||!answer.reason.trim()||answer.reason.length>2000)throw Error("Confirme o reparo e registre uma justificativa de até2000 caracteres.");
  if(!isPrimaryGM()||hash(flags(actor).techniqueOperations?.[key])!==baseline)throw Error("Mestre ou registro mudou durante a conferência.");
  const wasPaid=r.status==="paid";
  await actor.update({[`flags.${SYSTEM_ID}.techniqueOperations.${key}.status`]:"reviewed",[`flags.${SYSTEM_ID}.techniqueOperations.${key}.review`]:{reason:answer.reason.trim(),previousStatus:r.status,userId:game.user.id,time:Date.now()}});
  if(message)await message.update({[`flags.${SYSTEM_ID}.-=techniquePrepared`]:null,[`flags.${SYSTEM_ID}.-=techniqueRequest`]:null,[`flags.${SYSTEM_ID}.techniqueResponse`]:{ok:false,status:"reviewed",paid:wasPaid,text:"Ativação encerrada após reparo manual registrado pelo mestre."},content:`<p>Solicitação encerrada após revisão manual: ${escape(answer.reason.trim())}. Nenhum recurso foi restaurado automaticamente.</p>`});
 });
}
export async function resumeTechniqueRequests() {
 if(!isPrimaryGM())return;
 for(const message of game.messages.contents)if(flags(message).techniqueRequest&&!['published','failed','reviewed'].includes(flags(message).techniqueResponse?.status))await enqueueTechniqueRequest(message,{},author(message));
}
export function notifyTechniqueResponse(message,changes=null) {
 if(changes&&!changes[`flags.${SYSTEM_ID}.techniqueResponse`]&&!changes.flags?.[SYSTEM_ID]?.techniqueResponse)return;
 const r=flags(message).techniqueResponse;if(!r||author(message)!==game.user.id)return;
 if(r.ok)ui.notifications.info("Ativação processada; pagamento registrado.");else ui.notifications.error(r.text);
}
export async function recoverTechniqueOperation(actor,key) {
 if(!isPrimaryGM())throw Error("A recuperação exige o mestre responsável.");
 return runMasterOperation(async()=>{
  const r=flags(actor).techniqueOperations?.[key];if(!r||!['prepared','paid'].includes(r.status))throw Error("Não há ativação pendente para conferir.");
  if(r.actorUuid!==actor.uuid)throw Error("Este registro veio de outra cópia da ficha. Confira manualmente e encerre somente o registro desta cópia.");
  const recordSignature=hash(r);
  const message=game.messages.get(r.requestId);
  if(!await foundry.applications.api.DialogV2.confirm({window:{title:"Conferir ativação interrompida"},content:"<p>Conferir o registro? Pagamento completo republica o mesmo resultado, sem cobrar ou rolar novamente. Se os valores ainda forem os anteriores, encerra a solicitação sem gastar. Valores diferentes exigem reparo manual.</p>"}))return;
  if(!isPrimaryGM()||hash(flags(actor).techniqueOperations?.[key])!==recordSignature)throw Error("Mestre ou registro mudou; confira novamente.");
  if(r.status==="paid"){if(!message)throw Error("Cartão removido: pagamento permanece registrado. Confira manualmente; não repetir a ativação.");await publishStored(message,actor,r);return;}
  if(matches(actor,r.before)){
   await actor.update({[`flags.${SYSTEM_ID}.techniqueOperations.${key}.status`]:"failed"});
   if(message)await message.update({[`flags.${SYSTEM_ID}.-=techniquePrepared`]:null,[`flags.${SYSTEM_ID}.-=techniqueRequest`]:null,[`flags.${SYSTEM_ID}.techniqueResponse`]:{ok:false,status:"failed",paid:false,text:"Ativação encerrada após conferência: nenhum recurso gasto."},content:"<p>Ativação encerrada pelo mestre, sem gasto de recursos. Confira a ficha antes de ativar novamente.</p>"});return;
  }
  if(r.after&&matches(actor,r.after)){
   await actor.update({[`flags.${SYSTEM_ID}.techniqueOperations.${key}.status`]:"paid"});
   if(!message)throw Error("Pagamento reconhecido; cartão removido. Confira manualmente.");await publishStored(message,actor,{...r,status:"paid"});return;
  }
  throw Error("Recursos diferentes do registro: preserve as alterações e repare manualmente para os valores anteriores ou posteriores antes de recuperar.");
 });
}
