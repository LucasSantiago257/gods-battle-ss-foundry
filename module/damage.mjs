import {areaMember} from "./area-rules.mjs";
import {actionHash} from "./action-rules.mjs";
import {optionalNote} from "./form-values.mjs";
import {SYSTEM_ID} from "./config.mjs";
import {damageSnapshot,snapshotMatches,canReadChat,damageTurnSnapshot} from "./combat-rules.mjs";
import {defendAttack,defensePreview} from "./combat.mjs";
import {primaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
export {primaryGM} from "./master-queue.mjs";
const localBusy=new Set();
function resolution(message,{allowEffectDamage=false}={}) {
  const effect=message.flags?.[SYSTEM_ID]?.attack?.effectKind;
  if(!allowEffectDamage&&effect&&effect!=="damage")throw Error("Este cartão resolve um efeito sem dano. Use a aplicação específica da técnica; nenhum PV será alterado por esta resistência.");
  const r=message.flags?.[SYSTEM_ID]?.resolvedDamage;
  if (!r || !/^[a-zA-Z0-9_-]+$/.test(r.rootMessageId) || ![r.body,r.armor].every(n=>Number.isFinite(n)&&n>=0)) throw Error("Cartão de dano inválido; resolva o combate novamente.");
  return r;
}
export async function requestDamage(message,action="apply",{adjust=false}={}) {
  if (!message.isContentVisible || !["apply","undo"].includes(action) || localBusy.has(message.id)) return;
  const gm=primaryGM();if(!gm?.active) return ui.notifications.warn("É necessário um mestre ativo para aplicar ou desfazer dano.");
  localBusy.add(message.id);
  try {
    const r=resolution(message,{allowEffectDamage:action==="undo"}),actor=await fromUuid(r.actorUuid);
    if (!actor || !(game.user.isGM||actor.isOwner)) throw Error("Somente o mestre ou proprietário do defensor pode aplicar dano.");
    const snapshot=damageSnapshot(actor,r.body,r.armor,r.armorId);
    let override=null;
    if(action==="apply"&&adjust) {
      const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Conferir aplicação de dano"},content:`<p>PV corporais: ${snapshot.before.health}; PV da armadura: ${snapshot.before.armor??"sem dano à armadura"}.</p><label>Dano corporal<input name="body" type="number" step="any" min="0" value="${r.body}"></label><label>Dano à armadura<input name="armor" type="number" step="any" min="0" value="${r.armor}"></label><label>Notas (opcional)<input name="reason" type="text"></label>`,buttons:[{action:"apply",label:"Confirmar aplicação",default:true,callback:(_e,b)=>({body:Number(b.form.elements.body.value),armor:Number(b.form.elements.armor.value),reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
      if (!answer) return;
      damageSnapshot(actor,answer.body,answer.armor,r.armorId);
      if(answer.body!==r.body || answer.armor!==r.armor) {optionalNote(answer.reason);override=answer;}
    } else if(action==="undo"&&!await foundry.applications.api.DialogV2.confirm({window:{title:"Desfazer aplicação"},content:"<p>Restaurar os valores anteriores? Alterações posteriores impedem o desfazer.</p>"})) return;
    return await ChatMessage.create({content:"<span aria-hidden=\"true\"></span>",whisper:[...new Set([game.user.id,gm.id])],flags:{[SYSTEM_ID]:{damageRequest:{messageId:message.id,action,expected:snapshot.before,override,silent:true}}}});
  } finally {localBusy.delete(message.id);}
}
export async function executeDamageRequest(message,userId) {
  if (primaryGM()?.id!==game.user.id) return;
  const request=message.flags?.[SYSTEM_ID]?.damageRequest;
  if(!request || message.flags?.[SYSTEM_ID]?.damageResponse) return;
  const requester=game.users.get(userId),author=message.author?.id??message.user?.id;
  if (!requester || author!==userId) return;
  let actor,record,key,committed=false;
  try {
    const source=game.messages.get(request.messageId);
    if (!source || !canReadChat(requester,source) || !["apply","undo"].includes(request.action)) throw Error("Solicitação sem acesso ao resultado.");
    const r=resolution(source,{allowEffectDamage:request.action==="undo"});actor=await fromUuid(r.actorUuid);
    const root=game.messages.get(r.rootMessageId),techniqueTarget=root?.flags?.[SYSTEM_ID]?.attack?.targetUuid;
    if(request.action==="apply"&&root?.flags?.[SYSTEM_ID]?.attack?.effectKind&&root.flags[SYSTEM_ID].attack.effectKind!=="damage")throw Error("A origem desta resistência resolve efeito sem dano. Use o fluxo específico da técnica.");
    areaMember(root?.flags?.[SYSTEM_ID]?.attack,r.actorUuid);
    if(techniqueTarget&&techniqueTarget!==r.actorUuid)throw Error("A resistência não pertence ao alvo marcado da técnica.");
    if(actor?.type!=="knight" || !actor.testUserPermission(requester,"OWNER")) throw Error("Sem permissão para alterar o defensor.");
    assertNoTechniqueInterruption(actor);
    const sourceAuthor=game.users.get(source.author?.id??source.user?.id);
    if (!sourceAuthor || !actor.testUserPermission(sourceAuthor,"OWNER")) throw Error("O resultado precisa ser publicado pelo defensor ou mestre.");
    key=r.rootMessageId;
    const history=actor.flags?.[SYSTEM_ID]?.damageOperations??{},previous=history[key];
    if (previous?.status==="prepared" || previous?.status==="repair") throw Error("Há operação incompleta. O mestre precisa conferir o registro antes de tentar novamente.");
    if(request.action==="undo") {
      if(previous?.status!=="applied" || actor.flags?.[SYSTEM_ID]?.damageLast!==key || !snapshotMatches(actor,previous,"after")) throw Error("O dano não é a última aplicação ou os recursos mudaram; ajuste manualmente.");
      record={...previous,status:"prepared",direction:"undo"};
    } else {
      if(previous?.status==="applied") throw Error("Este ataque já teve dano aplicado a este defensor.");
      const values=request.override??{body:r.body,armor:r.armor};
      if(request.override)optionalNote(request.override.reason);
      const snapshot=damageSnapshot(actor,values.body,values.armor,r.armorId);
      if(JSON.stringify(snapshot.before)!==JSON.stringify(request.expected)) throw Error("Os recursos mudaram desde a confirmação. Confira novamente.");
      const turn=damageTurnSnapshot(actor),turnSnapshot=turn&&r.turnSnapshot&&actionHash(turn)===actionHash(r.turnSnapshot)?turn:null;
      record={...snapshot,turnSnapshot,status:"prepared",direction:"apply",requestId:message.id,userId,reason:request.override?.reason??"",previousKey:actor.flags?.[SYSTEM_ID]?.damageLast??null,time:Date.now()};
    }
    await actor.update({[`flags.${SYSTEM_ID}.damageOperations.${key}`]:record});
    if(primaryGM()?.id!==game.user.id) throw Error("Mestre responsável mudou durante a operação.");
    const from=record.direction==="undo"?"after":"before",to=record.direction==="undo"?"before":"after";
    if(!snapshotMatches(actor,record,from)) throw Error("Recursos mudaram durante a aplicação.");
    const armor=record.armorId?actor.items.get(record.armorId):null;
    if(armor) await armor.update({"system.health.value":record[to].armor});
    if(actor.system.resources.health.value!==record[from].health || (armor && armor.system.health.value!==record[to].armor)) throw Error("Recursos mudaram durante a aplicação.");
    const completed={...record,status:to==="after"?"applied":"undone"};
    await actor.update({"system.resources.health.value":record[to].health,[`flags.${SYSTEM_ID}.damageOperations.${key}`]:completed,[`flags.${SYSTEM_ID}.damageLast`]:completed.status==="applied"?key:record.previousKey});
    record=completed;committed=true;
    await message.update({[`flags.${SYSTEM_ID}.damageResponse`]:{ok:true,status:record.status,body:record.body,armor:record.armorDamage}});
  } catch(error) {
    // Nunca repete operação parcialmente gravada. O journal mantém before/after para conferência e recuperação explícita.
    if(actor && !committed && record?.status==="prepared") {
      const from=record.direction==="undo"?"after":"before",to=record.direction==="undo"?"before":"after",armor=record.armorId?actor.items.get(record.armorId):null;
      try {
        if(actor.system.resources.health.value===record[from].health && (!armor || [record[from].armor,record[to].armor].includes(armor.system.health.value))) {
          if(armor && armor.system.health.value===record[to].armor) await armor.update({"system.health.value":record[from].armor});
          record.status=record.direction==="undo"?"applied":"failed";
        } else record.status="repair";
        await actor.update({[`flags.${SYSTEM_ID}.damageOperations.${key}`]:record});
      } catch { /* journal preparado permanece; não reaplicar */ }
    }
    await message.update({[`flags.${SYSTEM_ID}.damageResponse`]:{ok:false,error:error.message}});
  }
}
export function enqueueDamageRequest(message,_options,userId) {
  if(primaryGM()?.id!==game.user.id || !message.flags?.[SYSTEM_ID]?.damageRequest) return;
  return runMasterOperation(()=>executeDamageRequest(message,userId)).catch(error=>console.error(`${SYSTEM_ID}: solicitação de dano`,error));
}
export function notifyDamageResponse(message) {
  const response=message.flags?.[SYSTEM_ID]?.damageResponse;
  if((message.author?.id??message.user?.id)!==game.user.id || !response) return;
  if(response.ok) ui.notifications.info(response.status==="applied"?"Dano aplicado e registrado.":"Aplicação desfeita.");else ui.notifications.error(response.error);
}
export async function resumeDamageRequests() {
  if(primaryGM()?.id!==game.user.id) return;
  for(const message of game.messages.contents) if(message.flags?.[SYSTEM_ID]?.damageRequest && !message.flags?.[SYSTEM_ID]?.damageResponse) await enqueueDamageRequest(message,{},message.author?.id??message.user?.id);
}
export async function recoverDamageOperation(actor,key) {
 if(!game.user.isGM || primaryGM()?.id!==game.user.id)throw Error('A recuperação deve ser feita pelo mestre responsável pelas aplicações.');
 assertNoTechniqueInterruption(actor);
   const r=actor.flags?.[SYSTEM_ID]?.damageOperations?.[key];
   if(!r || !['prepared','repair'].includes(r.status))throw Error('Não há operação interrompida para recuperar.');
   const from=r.direction==='undo'?'after':'before',to=r.direction==='undo'?'before':'after',armor=r.armorId?actor.items.get(r.armorId):null;
   if(r.armorId&&!armor)throw Error('Armadura do registro não está na ficha.');
   const recoveryState=()=>actionHash({uuid:actor.uuid,system:actor.system,record:actor.flags?.[SYSTEM_ID]?.damageOperations?.[key],armorUuid:actor.items.get(r.armorId)?.uuid,armor:actor.items.get(r.armorId)?.system});
   const baseline=recoveryState();
   if(!await foundry.applications.api.DialogV2.confirm({window:{title:'Conferir operação interrompida'},content:'<p>Recuperar somente se os valores atuais coincidirem com o registro? Se houver alterações posteriores, ajuste os recursos manualmente antes de liberar a operação.</p>'}))return;
 return runMasterOperation(async()=>{
    if(!game.user.isGM||primaryGM()?.id!==game.user.id||recoveryState()!==baseline)throw Error("Mestre, ficha ou registro mudou. Abra a recuperação novamente.");
    assertNoTechniqueInterruption(actor);
    if(snapshotMatches(actor,r,to)) {
      await actor.update({[`flags.${SYSTEM_ID}.damageOperations.${key}.status`]:r.direction==='undo'?'undone':'applied',[`flags.${SYSTEM_ID}.damageLast`]:r.direction==='undo'?r.previousKey:key});return;
    }
    if(actor.system.resources.health.value!==r[from].health || armor&&! [r[from].armor,r[to].armor].includes(armor.system.health.value))throw Error('Recursos diferentes do registro: preserve as alterações e confira manualmente.');
    if(armor&&armor.system.health.value!==r[from].armor)await armor.update({'system.health.value':r[from].armor});
    await actor.update({[`flags.${SYSTEM_ID}.damageOperations.${key}.status`]:r.direction==='undo'?'applied':'failed'});
  });
}
// Public card state; requests remain an internal, automatic transport to the active GM.
export async function damageCardState(message) {
 if(!message?.isContentVisible)return null;
 const r=message.flags?.[SYSTEM_ID]?.resolvedDamage;if(!r)return null;
 const actor=await fromUuid(r.actorUuid);if(!actor)return {label:"Alvo indisponível",state:"unavailable",authorized:false};
 const authorized=!!(game.user.isGM||actor.isOwner),record=actor.flags?.[SYSTEM_ID]?.damageOperations?.[r.rootMessageId];
 const applied=record?.status==="applied",interrupted=["prepared","repair"].includes(record?.status);
 const queued=(game.messages?.contents??[]).some(m=>m.flags?.[SYSTEM_ID]?.damageRequest?.messageId===message.id&&!m.flags?.[SYSTEM_ID]?.damageResponse);
 const processing=localBusy.has(message.id)||queued;
 const effect=message.flags?.[SYSTEM_ID]?.attack?.effectKind,damageAllowed=!effect||effect==="damage",ready=!!primaryGM()?.active;
 const state=interrupted?"interrupted":processing?"processing":applied?"applied":record?.status==="undone"?"undone":"pending";
 const label={interrupted:"Conferir aplicação",processing:"Aplicando…",applied:"Aplicado",undone:"Desfeito",pending:"Pendente"}[state];
 const canApply=authorized&&ready&&!processing&&!interrupted&&!applied&&damageAllowed;
 const canUndo=authorized&&ready&&!processing&&!interrupted&&applied&&actor.flags?.[SYSTEM_ID]?.damageLast===r.rootMessageId&&snapshotMatches(actor,record,"after");
 return {label,state,authorized,canApply,canAdjust:canApply,canUndo:!!canUndo};
}
const cardEpochs=new WeakMap();
async function updateDamageCard(message,root) {
 const epoch=(cardEpochs.get(root)??0)+1;cardEpochs.set(root,epoch);
 let status;try{status=await damageCardState(message);}catch{return;}
 if(!status||cardEpochs.get(root)!==epoch)return;
 const badge=root.querySelector('[data-damage-status]');if(badge){badge.textContent=status.label;if(badge.dataset)badge.dataset.state=status.state;}
 for(const [action,key]of [["applyDamage","canApply"],["adjustDamage","canAdjust"],["undoDamage","canUndo"]]){
  const button=root.querySelector(`[data-action="${action}"]`);if(!button)continue;button.hidden=!status.authorized;button.disabled=!status[key];
 }
}
export async function refreshDamageCards() {
 const roots=globalThis.document?.querySelectorAll?.('[data-damage-card-id]')??[];
 await Promise.allSettled([...roots].map(root=>{const message=game.messages?.get?.(root.dataset.damageCardId);return message?updateDamageCard(message,root):undefined;}));
}
export async function renderCombatChat(message,html) {
  if(message.flags?.[SYSTEM_ID]?.damageRequest?.silent){const root=html.closest?.(".message")??html;if(root.dataset)root.dataset.godsBattleInternalDamage="";root.hidden=true;return;}
  const damageRoot=html;
  if(message.flags?.[SYSTEM_ID]?.resolvedDamage&&damageRoot.dataset)damageRoot.dataset.damageCardId=message.id;

  const quickButton=html.querySelector('[data-action="quickDefendAttack"]');
  let preview=null;
  const refresh=async()=>{
    if(!quickButton)return;
    quickButton.hidden=true;preview=null;
    try{preview=await defensePreview(message);}catch{/* Unavailable previews keep the adjustable action. */}
    if(preview){quickButton.textContent=preview.label;quickButton.hidden=false;}
  };
  for(const [action,callback] of [["quickDefendAttack",()=>{
    if(!preview)throw Error("Defesa direta indisponível. Use Ajustar defesa.");
    return defendAttack(message,{quick:true,expectedState:preview.state,expectedFight:preview.fightHash});
  }],["defendAttack",()=>defendAttack(message)],["applyDamage",()=>requestDamage(message,"apply")],["adjustDamage",()=>requestDamage(message,"apply",{adjust:true})],["undoDamage",()=>requestDamage(message,"undo")]]) {
    const button=html.querySelector(`[data-action="${action}"]`);if(!button)continue;
    if(!message.isContentVisible) {button.remove();continue;}
    button.addEventListener("click",async()=>{button.disabled=true;try{await callback();}catch(error){ui.notifications.error(error.message);}finally{button.disabled=false;if(action==="quickDefendAttack")await refresh();await updateDamageCard(message,damageRoot);}});
  }
  await refresh();await updateDamageCard(message,damageRoot);
}
