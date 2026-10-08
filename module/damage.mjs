import {SYSTEM_ID} from "./config.mjs";
import {damageSnapshot,snapshotMatches,canReadChat} from "./combat-rules.mjs";
import {defendAttack} from "./combat.mjs";
let queue=Promise.resolve();
const localBusy=new Set();
export function primaryGM() {return game.users?.activeGM;}
function resolution(message) {
  const r=message.flags?.[SYSTEM_ID]?.resolvedDamage;
  if (!r || !/^[a-zA-Z0-9_-]+$/.test(r.rootMessageId) || ![r.body,r.armor].every(n=>Number.isFinite(n)&&n>=0)) throw Error("Cartão de dano inválido; resolva o combate novamente.");
  return r;
}
export async function requestDamage(message,action="apply") {
  if (!message.isContentVisible || !["apply","undo"].includes(action) || localBusy.has(message.id)) return;
  const gm=primaryGM();if(!gm?.active) return ui.notifications.warn("É necessário um mestre ativo para aplicar ou desfazer dano.");
  localBusy.add(message.id);
  try {
    const r=resolution(message),actor=await fromUuid(r.actorUuid);
    if (!actor?.isOwner) throw Error("Somente o mestre ou proprietário do defensor pode aplicar dano.");
    const snapshot=damageSnapshot(actor,r.body,r.armor,r.armorId);
    let override=null;
    if(action==="apply") {
      const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Conferir aplicação de dano"},content:`<p>PV corporais: ${snapshot.before.health}; PV da armadura: ${snapshot.before.armor??"sem dano à armadura"}.</p><label>Dano corporal<input name="body" type="number" step="any" min="0" value="${r.body}"></label><label>Dano à armadura<input name="armor" type="number" step="any" min="0" value="${r.armor}"></label><label>Motivo de ajuste, se houver<input name="reason" type="text"></label>`,buttons:[{action:"apply",label:"Confirmar aplicação",default:true,callback:(_e,b)=>({body:Number(b.form.elements.body.value),armor:Number(b.form.elements.armor.value),reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
      if (!answer) return;
      damageSnapshot(actor,answer.body,answer.armor,r.armorId);
      if(answer.body!==r.body || answer.armor!==r.armor) {if(!answer.reason.trim())throw Error("Informe o motivo do ajuste.");override=answer;}
    } else if(!await foundry.applications.api.DialogV2.confirm({window:{title:"Desfazer aplicação"},content:"<p>Restaurar os valores anteriores? Alterações posteriores impedem o desfazer.</p>"})) return;
    return await ChatMessage.create({content:"<p>Solicitação de dano enviada ao mestre. Aguarde a confirmação no registro.</p>",whisper:[...new Set([game.user.id,gm.id])],flags:{[SYSTEM_ID]:{damageRequest:{messageId:message.id,action,expected:snapshot.before,override}}}});
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
    const r=resolution(source);actor=await fromUuid(r.actorUuid);
    if(actor?.type!=="knight" || !actor.testUserPermission(requester,"OWNER")) throw Error("Sem permissão para alterar o defensor.");
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
      if(request.override && (!request.override.reason?.trim() || request.override.reason.length>2000)) throw Error("Ajuste sem justificativa válida.");
      const snapshot=damageSnapshot(actor,values.body,values.armor,r.armorId);
      if(JSON.stringify(snapshot.before)!==JSON.stringify(request.expected)) throw Error("Os recursos mudaram desde a confirmação. Confira novamente.");
      record={...snapshot,status:"prepared",direction:"apply",requestId:message.id,userId,reason:request.override?.reason??"",previousKey:actor.flags?.[SYSTEM_ID]?.damageLast??null,time:Date.now()};
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
  queue=queue.catch(()=>{}).then(()=>executeDamageRequest(message,userId)).catch(error=>console.error(`${SYSTEM_ID}: solicitação de dano`,error));
  return queue;
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
export function renderCombatChat(message,html) {
  for(const [action,callback] of [["defendAttack",()=>defendAttack(message)],["applyDamage",()=>requestDamage(message,"apply")],["undoDamage",()=>requestDamage(message,"undo")]]) {
    const button=html.querySelector(`[data-action="${action}"]`);if(!button)continue;
    if(!message.isContentVisible) {button.remove();continue;}
    button.addEventListener("click",async()=>{button.disabled=true;try{await callback();}catch(error){ui.notifications.error(error.message);}finally{button.disabled=false;}});
  }
}
