import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {resolvePool} from "./rules.mjs";
import {canReadChat} from "./combat-rules.mjs";
import {controlResistance,sameControlAttack,hasControlOrigin} from "./control-rules.mjs";
import {effectState,encounterForEffect} from "./effect-rules.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {optionalNote} from "./form-values.mjs";
const flags=doc=>doc?.flags?.[SYSTEM_ID]??{};
const author=m=>m.author?.id??m.user?.id;
const publicCard=m=>m&&m.isContentVisible&&!m.blind&&!(m.whisper?.length)&&canReadChat(game.user,m);
function available(actor){
 if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode registrar Controle.");
 assertNoTechniqueInterruption(actor);
 if(flags(actor).levelOperation?.status==="prepared"||Object.values(flags(actor).damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Recupere a operação interrompida antes de registrar Controle.");
}
export async function controlSource(message,actor) {
 available(actor);const r=flags(message),origin=r.controlResolution,root=game.messages?.get(origin?.rootMessageId),a=flags(root).attack;
 if(!publicCard(message)||!publicCard(root))throw Error("O vínculo de Controle usa cartões públicos; efeitos de resultados privados podem ser registrados pelo mestre na ficha.");
 if(!origin||origin.actorUuid!==actor.uuid||!a?.targetUuid||a.targetUuid!==actor.uuid||a.effectKind!=="control"||!sameControlAttack(a,Object.fromEntries(Object.entries(r.attack??{}).filter(([key])=>key!=="messageId")))||r.attack?.messageId!==root.id)throw Error("Resistência não corresponde ao Controle e alvo marcados.");
 if(flags(root).techniqueResponse?.status!=="published"||flags(root).technique?.success!==true||flags(root).techniqueResolution?.operationId!==root.id||flags(root).techniqueResolution?.actorUuid!==a.attackerUuid)throw Error("Ativação ainda não foi paga e publicada.");
 const caster=await fromUuid(a.attackerUuid),operation=flags(caster).techniqueOperations?.[root.id];available(actor);
 if(caster?.type!=="knight"||caster.uuid!==a.attackerUuid||operation?.actorUuid!==caster.uuid||operation.status!=="paid"||operation.controlAttackSignature!==actionHash(a))throw Error("Origem do Controle ausente ou alterada; use registro manual do efeito.");
 const requester=game.users.get(author(message)),user=game.users.get(author(root));
 if(!requester||!actor.testUserPermission(requester,"OWNER")||!user||!caster.testUserPermission(user,"OWNER"))throw Error("Autores sem permissão para estas fichas.");
 const total=r.test?.total;if(!Number.isFinite(total)||message.rolls?.[0]?.total!==total||r.difficulty!==a.powerCosmic||!Array.isArray(r.test.results)||resolvePool(r.test.results,r.test.modifier).total!==total)throw Error("Resultado da resistência inválido ou alterado.");
 const control=controlResistance(a,total);
 if(!control||control.resisted||origin.rounds!==control.rounds||origin.doubleDuration!==control.doubleDuration)throw Error("Controle resistido ou duração da resistência alterada.");
 const start=a.control.start,context=encounterForEffect(actor,start?.combatUuid),members=start?.members?.filter(m=>m.actorUuid===actor.uuid)??[];
 if(!start?.started||!Number.isSafeInteger(start.round)||start.round<1||context.round<start.round||game.combat?.uuid!==start.combatUuid||members.length!==1||members[0].id!==context.combatantId)throw Error("Encontro, rodada ou combatente não corresponde à ativação. Registre o efeito manualmente.");
 if(hasControlOrigin(actor,root.id))throw Error("Este Controle já foi registrado nesta ficha; o histórico impede reaplicação do mesmo resultado.");
 const signature=actionHash({actor:effectState(actor),resistance:r,total,root:flags(root),casterUuid:caster.uuid,operation,authors:[author(message),author(root)],visibility:[message.blind,message.whisper,root.blind,root.whisper],context});
 return {signature,root,control,context,start,attack:a};
}
export async function registerControl(message) {
 if(!isPrimaryGM())throw Error("Somente o mestre responsável pode registrar Controle.");
  const actor=await fromUuid(flags(message).controlResolution?.actorUuid);available(actor);
 const baseline=effectState(actor),source=await controlSource(message,actor);
 if(effectState(actor)!==baseline)throw Error("A ficha mudou. Abra o registro novamente.");
 const content=await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/control-dialog.hbs`,{name:source.attack.name,targetName:actor.name,classification:source.control.classification,rounds:source.control.rounds,baseRounds:source.control.baseRounds,doubleDuration:source.control.doubleDuration,startRound:source.start.round,currentRound:source.context.round,retryCost:source.control.retryCost});
 const guard=async()=>{available(actor);const current=await controlSource(message,actor);if(effectState(actor)!==baseline||current.signature!==source.signature)throw Error("Ficha, origem, resistência ou rodada mudou. Abra o registro novamente.");available(actor);};await guard();
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Registrar Controle no alvo"},content,buttons:[{action:"register",label:"Registrar duração",default:true,callback:(_e,b)=>({rounds:Number(b.form.elements.rounds.value),description:b.form.elements.description.value,reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
 if(!answer)return;
 return runMasterOperation(async()=>{
  if(!Number.isSafeInteger(answer.rounds)||answer.rounds<1||answer.rounds>1000)throw Error("Informe duração inteira de 1 a 1000 rodadas.");
  const description=optionalNote(answer.description),reason=optionalNote(answer.reason);await guard();
  const id=foundry.utils.randomID();if(!/^[a-zA-Z0-9]{1,32}$/.test(id))throw Error("Identificador de efeito inválido.");
  const record={id,kind:"manual",label:`Controle: ${source.attack.name}`,description,reason,page:"205/207/208/224",damage:0,source:null,rounds:answer.rounds,firstOffset:0,firstRound:source.start.round,lastRound:source.start.round+answer.rounds-1,actorUuid:actor.uuid,combatUuid:source.context.combatUuid,combatantId:source.context.combatantId,status:"active",ticks:{},time:Date.now(),userId:game.user.id,controlOrigin:{rootMessageId:source.root.id,resistanceMessageId:message.id,attackerUuid:source.attack.attackerUuid,itemUuid:source.attack.itemUuid,classification:source.control.classification,nature:source.attack.nature,powerCosmic:source.attack.powerCosmic,baseRounds:source.control.baseRounds,suggestedRounds:source.control.rounds,finalRounds:answer.rounds,doubleDuration:source.control.doubleDuration,retryCost:source.control.retryCost}};
  await actor.update({[`flags.${SYSTEM_ID}.persistentEffects.${id}`]:record});return record;
 });
}
export function renderControlChat(message,html) {
 const button=html.querySelector('[data-action="registerControl"]');if(!button)return;
 if(!game.user.isGM||!publicCard(message)||!flags(message).controlResolution||!flags(message).attack?.targetUuid||!publicCard(game.messages?.get(flags(message).controlResolution.rootMessageId))){button.remove();return;}
 button.addEventListener("click",async()=>{button.disabled=true;try{await registerControl(message);}catch(error){ui.notifications.error(error.message);}finally{button.disabled=false;}});
}
