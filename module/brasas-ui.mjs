import {SYSTEM_ID} from "./config.mjs";
import {primaryGM,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {effectView} from "./effect-rules.mjs";
import {brasasKey,brasasState,brasasSnapshot,brasasParcelPlan,brasasUndoPlan} from "./brasas-rules.mjs";
import {brasasSame,brasasEncounter,brasasApplicationState,validateBrasasJournal} from "./brasas-records.mjs";
import {brasasPrivateMessage,submitBrasasRequest} from "./brasas-requests.mjs";
const previewListeners=new WeakMap();
const flags=a=>a.flags?.[SYSTEM_ID]??{},classes={bronze:"Bronze",silver:"Prata",gold:"Ouro"};
export function canManageBrasas(actor,user=game.user){return !!user&&actor?.type==="knight"&&typeof actor.uuid==="string"&&/^(Actor\.|Scene\.)/.test(actor.uuid)&&!!actor.testUserPermission?.(user,"OWNER")&&(user.isGM||!(actor.isToken&&(actor.token?.hidden||actor.token?.object?.visible===false)));}
function ready(actor,{id=null,readOnly=false}={}){
 if(!canManageBrasas(actor))throw Error("Brasas indisponíveis.");if(!primaryGM()?.active)throw Error("Mestre offline.");
 if(!readOnly){assertNoTechniqueInterruption(actor,{effectOperationId:id});if(flags(actor).levelOperation?.status==="prepared"||Object.values(flags(actor).damageOperations??{}).some(o=>["prepared","repair"].includes(o.status)))throw Error("Confira a operação interrompida.");}
}
async function currentActor(actor,user,options){if(game.user!==user)throw Error("Usuário mudou.");ready(actor,options);if(await fromUuid(actor.uuid)!==actor)throw Error("Ficha removida ou substituída.");if(game.user!==user)throw Error("Usuário mudou.");ready(actor,options);}
export function brasasWaiting(actor){
 if(!canManageBrasas(actor))return false;
 return (game.messages?.contents??[]).some(m=>{
  if(m.isContentVisible===false)return false;
  const author=m.author?.id??m.user?.id;if(author!==game.user.id&&!game.user.isGM)return false;
  try{brasasPrivateMessage(m,author);}catch{return false;}
  const r=m.flags?.[SYSTEM_ID]?.brasasRequest;if(!r||r.actorUuid!==actor.uuid||m.flags?.[SYSTEM_ID]?.brasasResponse)return false;
  const op=flags(actor).effectOperations?.[["apply","undo","end"].includes(r.action)?m.id:r.operationId];
  return !op||!["prepared","applied","reviewed"].includes(op.status);
 });
}
function undoAvailable(actor,key){
 try{const r=flags(actor).persistentEffects?.[key],op=flags(actor).effectOperations?.[r?.brasasLastOperation?.id];validateBrasasJournal(op);
  if(op.status!=="applied"||op.action!=="apply")return false;
  brasasUndoPlan(actor,key,op,{operationId:op.id==="previewUndo"?"previewUndo2":"previewUndo"});return true;
 }catch{return false;}
}
function history(record){
 const events=Object.entries(record.brasasHistory??{}).map(([id,h])=>({id,time:h.time??0,round:h.round,damage:h.damage??h.archivedTick?.damage,hasDamage:Number.isFinite(h.damage??h.archivedTick?.damage),label:h.action==="undo"?"Desfeita":h.action==="end"?"Encerradas":h.status==="skipped"?"Dispensada":"Aplicada",reason:h.reason??"",archivedReason:h.archivedTick?.reason??""}));
 for(const t of Object.values(record.ticks??{}))if(!record.brasasHistory?.[t.operationId])events.push({id:t.operationId??`legacy${t.round}`,time:t.time??0,round:t.round,damage:t.damage,hasDamage:Number.isFinite(t.damage),label:t.status==="skipped"?"Dispensada":"Aplicada",reason:t.reason??""});
 return events.sort((a,b)=>b.time-a.time||(b.round??0)-(a.round??0));
}
function canComplete(actor,op){
 try{validateBrasasJournal(op,op.action==="undo"?flags(actor).effectOperations?.[op.originalId]:null);if(op.actorUuid!==actor.uuid||op.status!=="prepared")return false;
  const s=brasasSnapshot(actor,op.recordId);if(brasasSame(s,op.after))return true;
  if(!brasasSame(s,op.before))return false;ready(actor,{id:op.id});return op.action!=="apply"||brasasSame(brasasEncounter(actor,op.recordId),op.context);
 }catch{return false;}
}
export function brasasContext(actor){
 const empty={visible:false,rows:[],interruptions:[],waiting:false,offline:false};if(!canManageBrasas(actor))return empty;
 const rows=[],interruptions=[],waiting=brasasWaiting(actor);let free=false,blocked="";try{ready(actor);free=true;}catch(error){blocked=error.message;}
 for(const [id,r]of Object.entries(flags(actor).persistentEffects??{}))if(r?.kind==="brasas"){
  let snapshot;try{snapshot=brasasSnapshot(actor,id);}catch{rows.push({id,isBrasas:true,label:"Brasas",foreign:true,displayState:"Registro inválido ou de outra ficha",deadlinePriority:3});continue;}
  const row={id,isBrasas:true,label:"Brasas",status:r.status,time:r.time,amount:r.damage,classification:classes[r.source.classification],health:snapshot.health,firstRound:r.firstRound,lastRound:r.lastRound,signature:brasasState(actor,id),history:history(r),reason:r.reason??"",canEnd:free&&!waiting&&r.status!=="ended",canUndo:free&&!waiting&&undoAvailable(actor,id),pendingRounds:0,deadlinePriority:r.status==="active"?3:2,displayState:r.status==="ended"?"Encerradas":r.status==="expired"?"Prazo concluído":"Prazo pausado"};
  try{const view=effectView(actor,r);row.nextRound=view.nextRound;if(r.status==="active"&&view.context){row.pendingRounds=Math.max(0,Math.min(view.context.round,r.lastRound)-view.nextRound+1);row.deadlinePriority=row.pendingRounds?0:1;row.displayState=row.pendingRounds?`Rodada ${view.nextRound} pendente · até ${r.lastRound}`:`Próxima rodada ${view.nextRound} · até ${r.lastRound}`;row.applySignature=brasasApplicationState(actor,id);row.canAdjust=free&&!waiting&&view.canResolve;row.canSkip=row.canAdjust;if(view.canResolve){brasasParcelPlan(actor,id,{operationId:"preview"});row.canApply=row.canAdjust;}}else if(r.status==="active")row.warning=view.state;
  }catch(error){if(r.status==="active")row.warning=error.message;}
  rows.push(row);
 }
 for(const [id,op]of Object.entries(flags(actor).effectOperations??{}))if(op?.kind==="brasasParcel"&&op.status==="prepared"){
  try{brasasKey(id);ready(actor,{readOnly:true});interruptions.push({id,canReview:true,canComplete:canComplete(actor,op)});}catch{}
 }
 return {visible:rows.length>0||interruptions.length>0,rows,interruptions,waiting,offline:!primaryGM()?.active,warning:primaryGM()?.active&&!interruptions.length?blocked:undefined};
}
function fieldNumber(field){if(typeof field?.value!=="string"||!field.value.trim())throw Error("Informe o dano.");return Number(field.value);}
function formOptions(form){return {damage:fieldNumber(form.elements.damage),reason:form.elements.reason?.value??""};}
export function installBrasasPreview(form,actor,key,{signature,round,user=game.user}){
 if(!form)return;const update=()=>{const out=form.querySelector("[data-brasas-preview]"),button=form.querySelector('button[data-action="apply"]');try{
   ready(actor);if(game.user!==user||brasasApplicationState(actor,key)!==signature)throw Error("A prévia mudou. Reabra o ajuste.");
   const p=brasasParcelPlan(actor,key,{operationId:"preview",...formOptions(form)});if(p.tick.round!==round)throw Error("A rodada mudou.");if(out)out.textContent=`PV ${p.before.health} → ${p.after.health}`;if(button)button.disabled=false;
  }catch(error){if(out)out.textContent=error.message;if(button)button.disabled=true;}};
 const previous=previewListeners.get(form);if(previous){form.removeEventListener?.("input",previous);form.removeEventListener?.("change",previous);}previewListeners.set(form,update);form.addEventListener("input",update);form.addEventListener("change",update);update();
}
export async function applyBrasasParcel(actor,key,{signature,round,adjust=false,skip=false}={}){
 ready(actor);brasasKey(key);if(typeof adjust!=="boolean"||typeof skip!=="boolean"||adjust&&skip)throw Error("Ação de Brasas inválida.");const user=game.user,row=brasasContext(actor).rows.find(r=>r.id===key);
 if(!row)throw Error("Brasas indisponíveis.");if(!row.canAdjust)throw Error(row.status==="expired"?"Duração concluída.":row.status==="ended"?"Brasas encerradas.":row.warning??(row.pendingRounds===0&&row.nextRound?"Aguardando próxima rodada.":row.displayState));if(signature!==row.applySignature||round!==row.nextRound||typeof skip!=="boolean")throw Error("A parcela exibida de Brasas mudou.");let options={skip};
 if(adjust){
  const content=`<div class="brasas-dialog"><p>Rodada ${round} · PV ${row.health}</p><label>Dano corporal<input type="number" name="damage" min="0" max="1000000" step="any" value="${row.amount}"></label><p data-brasas-preview role="status" aria-live="polite"></p><details><summary>Notas</summary><textarea name="reason" maxlength="2000" aria-label="Notas opcionais"></textarea></details></div>`;
  options=await foundry.applications.api.DialogV2.wait({window:{title:"Ajustar Brasas"},content,render:(_e,d)=>installBrasasPreview(d.form??d.element?.querySelector("form"),actor,key,{signature,round,user}),buttons:[{action:"apply",label:"Aplicar",callback:(_e,b)=>{ready(actor);if(game.user!==user)throw Error("Usuário mudou.");const o=formOptions(b.form);brasasParcelPlan(actor,key,{operationId:"preview",...o});return o;}},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!options)return;
 }
 await currentActor(actor,user);const current=brasasContext(actor).rows.find(r=>r.id===key);
 if(!current?.canAdjust||current.applySignature!==signature||current.nextRound!==round)throw Error("A prévia de Brasas mudou.");
 brasasParcelPlan(actor,key,{operationId:"preview",...options});
 return submitBrasasRequest({action:"apply",actorUuid:actor.uuid,recordId:key,expectedState:signature,expectedRound:round,options});
}
export async function finishBrasas(actor,key,{signature,undo=false}={}){
 ready(actor);const user=game.user;brasasKey(key);await currentActor(actor,user);
 const row=brasasContext(actor).rows.find(r=>r.id===key);if(!row||row.signature!==signature||!(undo?row.canUndo:row.canEnd))throw Error("O registro de Brasas mudou.");
 return submitBrasasRequest({action:undo?"undo":"end",actorUuid:actor.uuid,recordId:key,expectedState:signature,reason:""});
}
export async function openBrasasRecovery(actor,id){
 brasasKey(id);ready(actor,{readOnly:true});const user=game.user,op=flags(actor).effectOperations?.[id];if(op?.kind!=="brasasParcel"||op.status!=="prepared")throw Error("Interrupção de Brasas indisponível.");const original=structuredClone(op),complete=canComplete(actor,op);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Brasas interrompidas"},content:'<details><summary>Notas</summary><textarea name="reason" maxlength="2000" aria-label="Notas opcionais"></textarea></details>',buttons:[...(complete?[{action:"recover",label:"Concluir pelo registro",callback:(_e,b)=>({action:"recover",reason:b.form.elements.reason.value})}]:[]),{action:"close",label:"Encerrar operação",callback:(_e,b)=>({action:"close",reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!answer)return;
 await currentActor(actor,user,{readOnly:true});if(!brasasSame(flags(actor).effectOperations?.[id],original))throw Error("O journal de Brasas mudou.");
 return submitBrasasRequest({action:answer.action,actorUuid:actor.uuid,operationId:id,reason:answer.reason});
}
export function sanitizeBrasasSheet(root,actor){if(!canManageBrasas(actor))for(const element of root?.querySelectorAll?.("[data-brasas-owned]")??[])element.remove();}
export function refreshBrasasSheets(){
 const actors=[...(game.actors?.contents??[]),...(globalThis.canvas?.tokens?.placeables??[]).map(t=>t.actor),...(game.combats?.contents??[]).flatMap(c=>(c.combatants?.contents??[]).map(m=>m.actor))];
 for(const actor of new Set(actors))for(const app of Object.values(actor?.apps??{}))if(app.rendered){sanitizeBrasasSheet(app.element,actor);app.render();}
}
