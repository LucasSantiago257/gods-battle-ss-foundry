import {SYSTEM_ID,ATTRIBUTES,NATURES} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {primaryGM,isPrimaryGM,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {testParameters} from "./rules.mjs";
import {effectView,effectState} from "./effect-rules.mjs";
import {effectDeadline} from "./effect-deadlines.mjs";
import {controlRetryKey,controlRetryRecordMath,controlRetrySnapshot,controlRetryContext} from "./control-retry-rules.mjs";
import {ownedControlContext,ownedControlPreview,validateOwnedControlJournal,sameControlRetry} from "./control-retry-owned-records.mjs";
import {controlRetryPrivateMessage,submitControlRetryRequest} from "./control-retry-requests.mjs";
const flags=a=>a.flags?.[SYSTEM_ID]??{},classes={bronze:"Bronze",silver:"Prata",gold:"Ouro"},listeners=new WeakMap();
export function canManageControlRetry(actor,user=game.user){return !!user&&actor?.type==="knight"&&typeof actor.uuid==="string"&&/^(Actor\.|Scene\.)/.test(actor.uuid)&&!!actor.testUserPermission?.(user,"OWNER")&&(user.isGM||!(actor.isToken&&(actor.token?.hidden||actor.token?.object?.visible===false)));}
function ready(actor,{id=null,readOnly=false}={}){
 if(!canManageControlRetry(actor))throw Error("Controle indisponível.");const gm=primaryGM();if(!gm?.active||!gm.isGM||game.users?.get?.(gm.id)!==gm||game.users?.get?.(game.user?.id)!==game.user)throw Error("Mestre offline.");
 if(!readOnly){assertNoTechniqueInterruption(actor,{effectOperationId:id});if(flags(actor).levelOperation?.status==="prepared"||Object.values(flags(actor).damageOperations??{}).some(o=>["prepared","repair"].includes(o.status)))throw Error("Confira a operação interrompida.");}
}
async function current(actor,user,options){if(game.user!==user)throw Error("Usuário mudou.");ready(actor,options);if(await fromUuid(actor.uuid)!==actor)throw Error("Ficha removida ou substituída.");if(game.user!==user)throw Error("Usuário mudou.");ready(actor,options);}
export function controlRetryWaiting(actor){
 if(!canManageControlRetry(actor))return false;
 return (game.messages?.contents??[]).some(m=>{if(m.isContentVisible===false)return false;const author=m.author?.id??m.user?.id;if(author!==game.user.id&&!game.user.isGM)return false;try{controlRetryPrivateMessage(m,author);}catch{return false;}
  const r=m.flags?.[SYSTEM_ID]?.controlRetryRequest;if(!r||r.actorUuid!==actor.uuid||m.flags?.[SYSTEM_ID]?.controlRetryResponse)return false;const op=flags(actor).effectOperations?.[r.action==="retry"?m.id:r.operationId];return !op||!["prepared","applied","reviewed"].includes(op.status);
 });
}
function publicationPending(actor,key,id){return Object.entries(flags(actor).effectOperations??{}).some(([oid,o])=>oid!==id&&["controlRetry","controlRetryOwned"].includes(o.kind)&&o.actorUuid===actor.uuid&&(o.effectId??o.recordId)===key&&o.status==="applied"&&!o.published);}
// Dialog staleness is independent of the final option-specific payment authorization.
export function controlRetryDialogState(actor,key){
 if(!canManageControlRetry(actor))throw Error("Controle indisponível.");const snapshot=controlRetrySnapshot(actor,key),context=controlRetryContext(snapshot.record,ownedControlContext(actor,key)),mode=game.settings.get(SYSTEM_ID,"resistanceMode");
 const bases=["vig","vel","sen","cos"].map(attribute=>{try{return {attribute,...testParameters(actor.system,"resistance",attribute,mode,{technique:true,conditions:false})};}catch{return {attribute,invalid:true};}});
 return actionHash({snapshot,context,mode,bases,conditions:{dice:actor.system.automation?.conditionDicePenalty??0,modifier:actor.system.automation?.conditionModifier??0}});
}
function complete(actor,op){
 try{validateOwnedControlJournal(op);if(op.actorUuid!==actor.uuid)return false;if(op.phase==="ready"){const roll=Roll.fromData(structuredClone(op.roll));if(roll.total!==op.plan.result.total||!sameControlRetry(roll.dice?.[0]?.results?.map(r=>r.result),op.plan.result.results))return false;}if(op.status==="applied")return !op.published;if(op.status!=="prepared"||op.phase!=="ready")return false;
  const s=controlRetrySnapshot(actor,op.recordId);if(sameControlRetry(s,op.plan.after))return true;if(!sameControlRetry(s,op.plan.before))return false;ready(actor,{id:op.id});return ownedControlPreview(actor,op.recordId,op.preview.options).signature===op.preview.signature;
 }catch{return false;}
}
function history(actor,r){return Object.entries(r.controlRetries??{}).map(([id,t])=>{const op=flags(actor).effectOperations?.[id];let dice=null;try{validateOwnedControlJournal(op);if(op.status==="applied"&&op.plan.attempt.operationId===id&&sameControlRetry(op.plan.attempt,{operationId:t.operationId,round:t.round,total:t.total,difficulty:t.difficulty,success:t.success,end:t.end,cost:t.cost,fromCurrent:t.fromCurrent,fromExtra:t.fromExtra,unlimited:t.unlimited,attribute:t.attribute}))dice={results:[...op.plan.result.results],modifier:op.plan.result.modifier};}catch{}
 return {round:t.round,total:t.total,difficulty:t.difficulty,cost:t.cost,success:t.success,end:t.end,fromCurrent:t.fromCurrent,fromExtra:t.fromExtra,unlimited:t.unlimited,reason:typeof t.reason==="string"?t.reason:"",dice};}).sort((a,b)=>b.round-a.round);}
export function controlRetryContextForSheet(actor){
 const empty={visible:false,rows:[],interruptions:[],waiting:false,offline:false};if(!canManageControlRetry(actor))return empty;
 const rows=[],interruptions=[],waiting=controlRetryWaiting(actor);let free=false,blocked="";try{ready(actor);free=true;}catch(e){blocked=e.message;}
 for(const [id,r]of Object.entries(flags(actor).persistentEffects??{}))if(r?.kind==="manual"&&r.controlOrigin){
  let math;try{math=controlRetryRecordMath(actor,id);}catch{rows.push({id,isOwnedControl:true,label:"Controle",status:r.status,displayState:"Registro inválido ou de outra ficha",deadlinePriority:3,canEndGM:free&&isPrimaryGM()&&r.status==="active"});continue;}
  const row={id,isOwnedControl:true,label:"Controle",status:r.status,time:r.time,classification:classes[math.origin.classification],difficulty:math.origin.powerCosmic,cost:math.origin.classification==="gold"?2:1,firstRound:r.firstRound,lastRound:r.lastRound,unlimited:actor.system.resources.cosmo.unlimited===true,history:history(actor,r),reason:typeof r.reason==="string"?r.reason:"",displayState:r.status==="ended"?"Encerrado":r.status==="expired"?"Prazo concluído":"Prazo pausado",deadlinePriority:r.status==="active"?3:2,pendingRounds:0};
  try{const view=effectView(actor,r),deadline=effectDeadline(view);Object.assign(row,deadline);if(r.status==="active")row.displayState=deadline.deadlineLabel||view.state;row.nextRound=view.nextRound;if(free&&isPrimaryGM()){row.canResolveGM=view.canResolve;row.canEndGM=r.status==="active";row.quickSignature=effectState(actor);}}catch{}
  if(r.status==="active")try{row.signature=controlRetryDialogState(actor,id);row.round=ownedControlContext(actor,id).round;if(publicationPending(actor,id))throw Error("Resistência anterior aguarda publicação.");row.canRetry=free&&!waiting;}catch(e){row.warning=e.message;}
  rows.push(row);
 }
 for(const [id,op]of Object.entries(flags(actor).effectOperations??{}))if(op?.kind==="controlRetryOwned"&&(op.status==="prepared"||op.status==="applied"&&!op.published))try{controlRetryKey(id);const online=!!primaryGM()?.active;interruptions.push({id,canReview:online,canComplete:online&&complete(actor,op),awaitingPublication:op.status==="applied"});}catch{}
 return {visible:rows.length>0||interruptions.length>0,rows,interruptions,waiting,offline:!primaryGM()?.active,warning:primaryGM()?.active&&!interruptions.length?blocked:undefined};
}
function options(form){const e=form.elements;if(typeof e.bonus?.value!=="string"||!e.bonus.value.trim())throw Error("Informe o modificador.");return {attribute:e.attribute?.value,bonus:Number(e.bonus.value),advantage:Number(e.advantage?.value),useExtra:e.useExtra?.checked===true,onSuccess:e.onSuccess?.value,reason:e.reason?.value??""};}
export function installControlRetryPreview(form,actor,key,{signature,user=game.user}){
 if(!form)return;const update=()=>{const out=form.querySelector("[data-control-retry-preview]"),button=form.querySelector('button[data-action="retry"]');try{ready(actor);if(game.user!==user||controlRetryDialogState(actor,key)!==signature)throw Error("A prévia mudou. Reabra a resistência.");const p=ownedControlPreview(actor,key,options(form));if(out)out.textContent=`${p.pool.dice}d10 · modificador ${p.pool.modifier} · ${p.payment.unlimited?"CE ilimitada":`CE atual ${p.before.resources.current} → ${p.before.resources.current-p.payment.fromCurrent} · extra ${p.before.resources.extra} → ${p.before.resources.extra-p.payment.fromExtra}`}`;if(button)button.disabled=false;}catch(e){if(out)out.textContent=e.message;if(button)button.disabled=true;}};
 const previous=listeners.get(form);if(previous){form.removeEventListener?.("input",previous);form.removeEventListener?.("change",previous);}listeners.set(form,update);form.addEventListener("input",update);form.addEventListener("change",update);update();
}
export async function openOwnedControlRetry(actor,key,{signature}={}){
 ready(actor);controlRetryKey(key);const user=game.user,row=controlRetryContextForSheet(actor).rows.find(r=>r.id===key);if(!row?.canRetry)throw Error(row?.warning??"Tentativa de Controle indisponível.");if(signature!==row.signature)throw Error("A prévia de Controle mudou.");
 const math=controlRetryRecordMath(actor,key),defaultAttribute=NATURES[math.origin.nature]?.resistance??"",s=actor.system.resources;
 const content=await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/control-retry-dialog.hbs`,{round:row.round,lastRound:row.lastRound,cost:row.cost,difficulty:row.difficulty,current:s.cosmo.value,reserved:s.cosmoReserved,extra:s.cosmoExtra,unlimited:s.cosmo.unlimited,attributes:["vig","vel","sen","cos"].map(value=>({value,label:ATTRIBUTES[value],selected:value===defaultAttribute}))});
 await current(actor,user);if(controlRetryDialogState(actor,key)!==signature)throw Error("A prévia de Controle mudou.");
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Nova resistência de Controle"},content,render:(_e,d)=>installControlRetryPreview(d.form??d.element?.querySelector("form"),actor,key,{signature,user}),buttons:[{action:"retry",label:row.unlimited?"Rolar público · CE ilimitada":`Rolar público · ${row.cost} CE`,callback:(_e,b)=>{ready(actor);if(game.user!==user||controlRetryDialogState(actor,key)!==signature)throw Error("A prévia de Controle mudou.");const value=options(b.form),p=ownedControlPreview(actor,key,value);return {options:value,expectedState:p.signature};}},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!answer)return;
 await current(actor,user);const now=controlRetryContextForSheet(actor).rows.find(r=>r.id===key);if(!now?.canRetry||now.signature!==signature||ownedControlPreview(actor,key,answer.options).signature!==answer.expectedState)throw Error("A prévia de Controle mudou.");
 return submitControlRetryRequest({action:"retry",actorUuid:actor.uuid,recordId:key,...answer});
}
export async function openOwnedControlRecovery(actor,id){
 controlRetryKey(id);ready(actor,{readOnly:true});const user=game.user,op=flags(actor).effectOperations?.[id];if(op?.kind!=="controlRetryOwned"||!(op.status==="prepared"||op.status==="applied"&&!op.published))throw Error("Interrupção de Controle indisponível.");const original=structuredClone(op),canComplete=complete(actor,op);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Controle interrompido"},content:'<details><summary>Notas</summary><textarea name="reason" maxlength="2000" aria-label="Notas opcionais"></textarea></details>',buttons:[...(canComplete?[{action:"recover",label:"Concluir pelo registro",callback:(_e,b)=>({action:"recover",reason:b.form.elements.reason.value})}]:[]),{action:"close",label:"Encerrar operação",callback:(_e,b)=>({action:"close",reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!answer)return;
 await current(actor,user,{readOnly:true});if(!sameControlRetry(flags(actor).effectOperations?.[id],original))throw Error("Journal de Controle mudou.");return submitControlRetryRequest({action:answer.action,actorUuid:actor.uuid,operationId:id,reason:answer.reason});
}
export function sanitizeControlRetrySheet(root,actor){if(!canManageControlRetry(actor))for(const e of root?.querySelectorAll?.("[data-control-retry-owned]")??[])e.remove();}
export function refreshControlRetrySheets(){const actors=[...(game.actors?.contents??[]),...(globalThis.canvas?.tokens?.placeables??[]).map(t=>t.actor),...(game.combats?.contents??[]).flatMap(c=>(c.combatants?.contents??[]).map(m=>m.actor))];for(const actor of new Set(actors))for(const app of Object.values(actor?.apps??{}))if(app.rendered){sanitizeControlRetrySheet(app.element,actor);app.render();}}
