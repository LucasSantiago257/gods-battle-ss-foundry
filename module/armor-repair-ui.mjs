import {SYSTEM_ID} from "./config.mjs";
import {primaryGM,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {isRepairWorldActor,armorRepairSource,armorRepairTarget,armorRepairState,armorRepairPlan} from "./armor-repair-rules.mjs";
import {repairKey,repairRecord,repairPointState,validateRepairJournal,repairSame} from "./armor-repair-journal.mjs";
import {submitArmorRepairRequest} from "./armor-repair-requests.mjs";
const flags=a=>a.flags?.[SYSTEM_ID]??{};
const escape=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
export function canRepairActor(actor,user=game.user){return !!user&&isRepairWorldActor(actor)&&!!actor.testUserPermission?.(user,"OWNER")&&(user.isGM||!(actor.isToken&&(actor.token?.hidden||actor.token?.object?.visible===false)));}
function actors(extra){
 const all=[extra,...(game.actors?.contents??[]),...(globalThis.canvas?.tokens?.placeables??[]).map(t=>t.actor),...(game.combats?.contents??[]).flatMap(c=>(c.combatants?.contents??[]).map(x=>x.actor))],map=new Map();
 for(const actor of all)if(canRepairActor(actor))map.set(actor.uuid,actor);return map;
}
function pending(actor){return (game.messages?.contents??[]).some(m=>{const r=m.flags?.[SYSTEM_ID]?.armorRepairRequest;if(!r||r.actorUuid!==actor.uuid||m.flags?.[SYSTEM_ID]?.armorRepairResponse)return false;
 if(r.action==="register"&&flags(actor).armorRepairs?.[m.id])return false;
 const op=flags(actor).effectOperations?.[r.action==="apply"||r.action==="undo"?m.id:r.operationId];if(op&&["applied","failed","reviewed"].includes(op.status))return false;
 if(r.action==="end"&&flags(actor).armorRepairs?.[r.recordId]?.status==="ended")return false;return true;});}
function sources(actor){if(!canRepairActor(actor))return [];return (actor.items?.contents??[]).filter(i=>{try{armorRepairSource(i);return true;}catch{return false;}});}
function targets(actor){return [...actors(actor).values()].flatMap(a=>(a.items?.contents??[]).filter(i=>{try{armorRepairTarget(i);return true;}catch{return false;}}));}
function ready(actor,target=actor){
 if(!primaryGM()?.active)throw Error("Mestre offline.");
 for(const a of new Set([actor,target])){if(!canRepairActor(a))throw Error("Reparo indisponível.");assertNoTechniqueInterruption(a);if(flags(a).levelOperation?.status==="prepared"||Object.values(flags(a).damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Conferir operação interrompida.");}
}
async function targetActor(actor,uuid){return actors(actor).get(uuid)??(game.user?.isGM?await fromUuid(uuid):null);}
function itemAt(actor,uuid){const prefix=`${actor.uuid}.Item.`;if(typeof uuid!=="string"||!uuid.startsWith(prefix))return null;const item=actor.items?.get?.(uuid.slice(prefix.length));return item?.uuid===uuid?item:null;}
async function selected(actor,key){
 if(!canRepairActor(actor))throw Error("Reparo indisponível.");const user=game.user,record=repairRecord(actor,key),target=await targetActor(actor,record.targetUuid);
 if(game.user!==user||!canRepairActor(actor)||!canRepairActor(target))throw Error("Reparo indisponível.");
 const item=itemAt(actor,record.sourceUuid),armor=itemAt(target,record.armorUuid);if(!item||!armor)throw Error("Técnica ou armadura indisponível.");return {record,target,item,armor};
}
export async function armorRepairContext(actor){
 const user=game.user,empty={visible:false,active:[],history:[],interruptions:[]};if(!canRepairActor(actor,user))return empty;
 const rows=[],interruptions=[],checked=new Map([[actor.uuid,actor]]);
 for(const key of Object.keys(flags(actor).armorRepairs??{})){
  let record;try{record=repairRecord(actor,key);}catch{rows.push({id:key,name:"Registro de outra ficha ou inválido",statusLabel:"Conferir registro",foreign:true});continue;}
  const target=await targetActor(actor,record.targetUuid);if(target)checked.set(target.uuid,target);if(game.user!==user||!canRepairActor(actor,user))return empty;
  if(!canRepairActor(target,user)){rows.push({id:key,name:"Reparo indisponível",statusLabel:"Alvo indisponível",foreign:true});continue;}
  const item=itemAt(actor,record.sourceUuid),armor=itemAt(target,record.armorUuid),row={id:key,targetUuid:target.uuid,name:armor?.name??"Armadura indisponível",sourceName:item?.name??"Técnica indisponível",hours:record.hours,status:record.status,statusLabel:record.status==="active"?"Ativo":"Encerrado",revision:record.revision,canEnd:record.status==="active"&&!!primaryGM()?.active,reason:record.reason,time:record.time,ticks:Object.values(record.ticks??{}).map(t=>({hour:t.hour,label:t.direction==="undo"?"Desfeita":"Aplicada",repair:t.repair,cost:t.cost,reason:t.reason})).reverse()};
  try{ready(actor,target);if(item&&armor){row.signature=armorRepairState(item,armor);armorRepairSource(item);const a=armorRepairTarget(armor);row.health=a.health;row.maximum=a.maximum;row.canAdjust=record.status==="active";try{const p=armorRepairPlan(item,armor);row.repair=p.repair;row.cost=p.cost;row.canApply=record.status==="active";}catch(e){row.warning=e.message;}
   const op=flags(actor).effectOperations?.[record.last];if(op){try{validateRepairJournal(op);row.canUndo=op.status==="applied"&&op.direction==="apply"&&op.recordId===key&&row.signature===repairPointState(op.plan,"after");}catch{/* Invalid history is never a write source. */}}
  }}catch(e){row.warning=e.message;row.canEnd=false;}
  rows.push(row);
 }
 for(const [id,op]of Object.entries(flags(actor).effectOperations??{}))if(op.status==="prepared"&&["armorRepair","armorRepairTarget"].includes(op.kind)&&op.actorUuid===actor.uuid){
  const payer=op.kind==="armorRepair"?actor:await targetActor(actor,op.payerUuid),target=op.kind==="armorRepair"?await targetActor(actor,op.targetUuid):actor;
  if(payer)checked.set(payer.uuid,payer);if(target)checked.set(target.uuid,target);interruptions.push({id,name:"Reparo interrompido",payerUuid:payer?.uuid,targetUuid:target?.uuid,canRecover:!!primaryGM()?.active&&canRepairActor(payer,user)&&canRepairActor(target,user),canOrphan:!!primaryGM()?.active&&!!user.isGM&&op.kind==="armorRepairTarget"&&(!payer||!flags(payer).effectOperations?.[id])});
 }
 if(game.user!==user||!canRepairActor(actor,user))return empty;
 const safeRows=rows.map(row=>row.targetUuid&&!canRepairActor(checked.get(row.targetUuid),user)?{id:row.id,name:"Reparo indisponível",foreign:true,statusLabel:"Alvo indisponível"}:row);
 for(const row of interruptions){row.canRecover=row.canRecover&&canRepairActor(checked.get(row.payerUuid),user)&&canRepairActor(checked.get(row.targetUuid),user);row.canOrphan=row.canOrphan&&!!game.user.isGM;}
 const waiting=pending(actor);if(waiting)for(const row of safeRows){row.canApply=false;row.canAdjust=false;row.canUndo=false;row.canEnd=false;}
 const hasSources=sources(actor).length>0;let canRegister=false;try{ready(actor);canRegister=hasSources&&!waiting;}catch{}
 return {visible:hasSources||safeRows.length>0||interruptions.length>0,hasSources,canRegister,waiting,offline:!primaryGM()?.active,active:safeRows.filter(r=>r.status!=="ended"),history:safeRows.filter(r=>r.status==="ended"),interruptions};
}
export async function beginArmorRepair(actor){
 ready(actor);const source=sources(actor),armors=targets(actor);if(!source.length||!armors.length)throw Error("Nenhuma técnica/armadura autorizada disponível.");
 const content=`<div class="armor-repair-dialog"><label>Técnica<select name="sourceUuid">${source.map(i=>`<option value="${escape(i.uuid)}">${escape(i.name)}</option>`).join("")}</select></label><label>Armadura<select name="armorUuid">${armors.map(i=>`<option value="${escape(i.uuid)}">${escape(i.parent.name)} · ${escape(i.name)} · ${i.system.health.value}/${i.system.health.max} PV</option>`).join("")}</select></label><details><summary>Notas</summary><textarea name="reason" maxlength="2000"></textarea></details></div>`;
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Novo reparo de armadura"},content,buttons:[{action:"register",label:"Registrar trabalho",callback:(_e,b)=>({sourceUuid:b.form.elements.sourceUuid.value,armorUuid:b.form.elements.armorUuid.value,reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!answer)return;
 const item=source.find(i=>i.uuid===answer.sourceUuid),armor=armors.find(i=>i.uuid===answer.armorUuid);if(!item||!armor||!canRepairActor(item.parent)||!canRepairActor(armor.parent))throw Error("Escolha indisponível.");
 return submitArmorRepairRequest({action:"register",actorUuid:actor.uuid,sourceUuid:item.uuid,armorUuid:armor.uuid,expectedState:armorRepairState(item,armor),reason:answer.reason});
}
function formOptions(form){const e=form.elements,number=(field,label)=>{if(!field||field.value.trim()==="")throw Error(`${label} inválido.`);return Number(field.value);};return {repair:number(e.repair,"PV"),cost:number(e.cost,"CE"),useExtra:e.useExtra.checked,allowOverload:e.allowOverload.checked,reason:e.reason.value};}
export function installArmorRepairPreview(form,item,armor,baseline){
 if(!form)return;const update=()=>{const out=form.querySelector("[data-repair-preview]"),button=form.querySelector('button[data-action="apply"]');try{if(!canRepairActor(item.parent)||!canRepairActor(armor.parent)||armorRepairState(item,armor)!==baseline)throw Error("A prévia mudou. Reabra o ajuste.");const p=armorRepairPlan(item,armor,formOptions(form));if(out)out.textContent=`+${p.repair} PVA · ${p.cost} CE${p.payment.lifeDamage?` · ${p.payment.lifeDamage} PV por excesso`:""}`;if(button)button.disabled=false;}catch(error){if(out)out.textContent=error.message;if(button)button.disabled=true;}};form.addEventListener("input",update);form.addEventListener("change",update);update();
}
export async function applyArmorRepairHour(actor,key,{adjust=false,revision,signature}={}){
 const b=await selected(actor,key);ready(actor,b.target);if(b.record.revision!==revision||armorRepairState(b.item,b.armor)!==signature)throw Error("A prévia do reparo mudou.");let options={};
 if(adjust){const level=armorRepairSource(b.item).level,content=`<div class="armor-repair-dialog"><p>${escape(b.armor.name)} · ${b.armor.system.health.value}/${b.armor.system.health.max} PV · 1 hora</p><label>PV a reparar<input type="number" name="repair" min="0" max="1000000" step="any" value="${level}"></label><label>CE da hora<input type="number" name="cost" min="0" max="1000000" step="1" value="1"></label><p data-repair-preview role="status" aria-live="polite"></p><details><summary>Pagamento e notas</summary><label><input type="checkbox" name="useExtra" checked>Usar CE extra</label><label><input type="checkbox" name="allowOverload">Permitir excesso corporal</label><textarea name="reason" maxlength="2000" aria-label="Notas opcionais"></textarea></details></div>`;
  options=await foundry.applications.api.DialogV2.wait({window:{title:"Ajustar hora de reparo"},content,render:(_e,d)=>installArmorRepairPreview(d.form??d.element?.querySelector("form"),b.item,b.armor,signature),buttons:[{action:"apply",label:"Aplicar hora",callback:(_e,button)=>{const value=formOptions(button.form);armorRepairPlan(b.item,b.armor,value);return value;}},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!options)return;
 }
 if(!canRepairActor(actor)||!canRepairActor(b.target)||repairRecord(actor,key).revision!==revision||armorRepairState(b.item,b.armor)!==signature)throw Error("A prévia do reparo mudou.");armorRepairPlan(b.item,b.armor,options);
 return submitArmorRepairRequest({action:"apply",actorUuid:actor.uuid,recordId:key,expectedRevision:revision,expectedState:signature,options});
}
export async function finishArmorRepairWork(actor,key,revision,{undo=false}={}){
 if(!canRepairActor(actor))throw Error("Reparo indisponível.");const record=repairRecord(actor,key);if(record.revision!==revision)throw Error("O trabalho mudou.");const target=await targetActor(actor,record.targetUuid);
 if(!canRepairActor(actor)||target&&!canRepairActor(target)||!target&&!game.user.isGM)throw Error("Reparo indisponível.");let baseline=null;if(undo){const b=await selected(actor,key);ready(actor,b.target);baseline=armorRepairState(b.item,b.armor);}
 const ok=await foundry.applications.api.DialogV2.confirm({window:{title:undo?"Desfazer última hora":"Encerrar trabalho"},content:`<p>${escape(target?itemAt(target,record.armorUuid)?.name??"Armadura indisponível":"Alvo indisponível")} · ${record.hours} hora(s)</p>`});if(!ok)return;
 if(!canRepairActor(actor)||target&&!canRepairActor(target)||repairRecord(actor,key).revision!==revision)throw Error("O trabalho mudou.");if(undo){const b=await selected(actor,key);if(armorRepairState(b.item,b.armor)!==baseline)throw Error("A prévia mudou.");}
 return submitArmorRepairRequest({action:undo?"undo":"end",actorUuid:actor.uuid,recordId:key,expectedRevision:revision});
}
export async function openArmorRepairRecovery(actor,id){
 repairKey(id);if(!canRepairActor(actor))throw Error("Reparo indisponível.");const op=flags(actor).effectOperations?.[id];if(!op||op.actorUuid!==actor.uuid||!["armorRepair","armorRepairTarget"].includes(op.kind))throw Error("Registro de reparo ausente ou de outra ficha.");
 const payer=op.kind==="armorRepair"?actor:await targetActor(actor,op.payerUuid),target=op.kind==="armorRepair"?await targetActor(actor,op.targetUuid):actor,orphan=op.kind==="armorRepairTarget"&&(!payer||!flags(payer).effectOperations?.[id]);
 if(!canRepairActor(actor)||(target?!canRepairActor(target):!game.user.isGM)||(orphan?!game.user.isGM:!canRepairActor(payer)))throw Error("Reparo indisponível.");
 const original=structuredClone(op),user=game.user;
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Reparo interrompido"},content:'<label>Notas (opcional)<textarea name="reason" maxlength="2000"></textarea></label>',buttons:[...(!orphan&&target?[{action:"recover",label:"Concluir pelo registro",callback:(_e,b)=>({action:"recover",reason:b.form.elements.reason.value})}]:[]),{action:"close",label:orphan?"Encerrar vínculo":"Encerrar sem alterar recursos",callback:(_e,b)=>({action:orphan?"orphan":"close",reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});if(!answer)return;
 if(game.user!==user||!canRepairActor(actor)||(target&&!canRepairActor(target))||(!orphan&&!canRepairActor(payer))||!repairSame(flags(actor).effectOperations?.[id],original))throw Error("O registro ou a permissão mudou.");
 return submitArmorRepairRequest({action:answer.action,actorUuid:orphan?actor.uuid:payer.uuid,operationId:id,reason:answer.reason});
}
export function refreshArmorRepairSheets(){const all=[...(game.actors?.contents??[]),...(globalThis.canvas?.tokens?.placeables??[]).map(t=>t.actor)];for(const actor of new Set(all))for(const app of Object.values(actor?.apps??{}))if(app.rendered)app.render();}
