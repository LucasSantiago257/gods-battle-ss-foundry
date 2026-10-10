import {SYSTEM_ID} from "./config.mjs";
import {DEPOSIT_MODES,DEPOSIT_RULES,depositRecords,depositKey,depositSource,validDeposit,depositPlan,returnDepositPlan} from "./cosmo-deposit-rules.mjs";
import {effectState,effectSourceState} from "./effect-rules.mjs";
import {actionHash} from "./action-rules.mjs";
import {isPrimaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {optionalNote} from "./form-values.mjs";
const flags=actor=>actor.flags?.[SYSTEM_ID]??{};
const baselineOf=actor=>({state:effectState(actor),userId:game.user.id});
function available(actor,id=null){
 if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode depositar/devolver CE.");
 assertNoTechniqueInterruption(actor,{effectOperationId:id});
 if(flags(actor).levelOperation?.status==="prepared"||Object.values(flags(actor).damageOperations??{}).some(r=>["prepared","repair"].includes(r.status)))throw Error("Confira a operação interrompida de dano/evolução antes de alterar CE.");
}
async function guard(actor,baseline,id=null){
 available(actor,id);const live=await fromUuid(actor.uuid);
 if(live?.uuid!==actor.uuid||live.type!=="knight"||!live.isOwner||effectState(live)!==baseline.state||effectState(actor)!==baseline.state||game.user.id!==baseline.userId)throw Error("Ficha, recursos, depósito ou rodada mudou. Abra novamente.");
 available(actor,id);
}
const snapshot=(actor,key)=>({value:actor.system.resources.cosmo.value,record:structuredClone(depositRecords(actor)[key]??null)});
export function cosmoDepositContext(actor){
 return Object.entries(depositRecords(actor)).map(([id,value])=>{const r=value&&typeof value==="object"?value:{};return {...r,id,modeLabel:Object.hasOwn(DEPOSIT_MODES,r.mode??"")?DEPOSIT_MODES[r.mode]:"Perfil inválido",event:Object.hasOwn(DEPOSIT_RULES,r.contract??"")?DEPOSIT_RULES[r.contract].event:null,state:r.actorUuid!==actor.uuid?"Cópia de outra ficha · sem devolução automática":!validDeposit(actor.uuid,r)?"Registro inconsistente · revisar":r.status==="active"?"Depositado":"Devolvido",canReturn:!!isPrimaryGM()&&actor.isOwner&&validDeposit(actor.uuid,r)&&r.status==="active"};}).toSorted((a,b)=>b.time-a.time);
}
async function commit(actor,key,record,value,operationId,kind,baseline,sourceGuard=()=>{}){
 if(flags(actor).effectOperations?.[operationId])throw Error("Identificador de operação existente.");
 const before=snapshot(actor,key),after={value,record},operation={kind:"cosmoEscrow",action:kind,status:"prepared",actorUuid:actor.uuid,depositId:key,before,after,userId:game.user.id,time:Date.now()};
 await guard(actor,baseline);sourceGuard();
 const expectedFlags=structuredClone(actor.flags??{});expectedFlags[SYSTEM_ID]??={};expectedFlags[SYSTEM_ID].effectOperations??={};expectedFlags[SYSTEM_ID].effectOperations[operationId]=operation;
 const expected={state:effectState({uuid:actor.uuid,system:actor.system,flags:expectedFlags}),userId:baseline.userId};
 await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${operationId}`]:operation});
 await guard(actor,expected,operationId);sourceGuard();
 if(actionHash(snapshot(actor,key))!==actionHash(before))throw Error("Saldo ou depósito alterado antes da gravação.");
 await actor.update({"system.resources.cosmo.value":value,[`flags.${SYSTEM_ID}.cosmoDeposits.${key}`]:record,[`flags.${SYSTEM_ID}.effectOperations.${operationId}.status`]:"applied"});
 return record;
}
export async function depositCosmo(actor){
 available(actor);const baseline=baselineOf(actor),sources=[];
 for(const item of actor.items?.contents??[])try{sources.push({...depositSource(actor,item),baseline:effectSourceState(item)});}catch{}
 if(!sources.length)throw Error("Arraste Rosa Diabólica Real Polén, Ataúde de Gelo ou Benção de Eir do catálogo para a ficha.");
 const context={sources,modes:Object.entries(DEPOSIT_MODES).map(([value,label])=>({value,label})),current:actor.system.resources.cosmo.value,maximum:actor.system.resources.cosmo.max};
 const content=await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/cosmo-deposit-dialog.hbs`,context);await guard(actor,baseline);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Depositar CE em objeto"},content,buttons:[{action:"deposit",label:"Depositar CE",callback:(_e,b)=>{const f=b.form.elements;return {itemUuid:f.itemUuid.value,object:f.object.value,mode:f.mode.value,reason:f.reason.value};}},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
 if(!answer)return;
 return runMasterOperation(async()=>{
  const selected=sources.find(s=>s.itemUuid===answer.itemUuid);if(!selected)throw Error("Escolha uma origem da lista.");
  const item=await fromUuid(selected.itemUuid);await guard(actor,baseline);
  if(!item||effectSourceState(item)!==selected.baseline||effectSourceState(actor.items.get(item.id))!==selected.baseline)throw Error("Origem alterada ou removida. Abra novamente.");
  const plan=depositPlan(actor,item,answer),key=depositKey(foundry.utils.randomID()),id=depositKey(foundry.utils.randomID());
  if(depositRecords(actor)[key])throw Error("Identificador de depósito existente.");
  const record={id:key,actorUuid:actor.uuid,status:"active",contract:plan.source.contract,source:plan.source,amount:plan.amount,mode:plan.mode,object:plan.object,page:plan.source.page,reason:plan.reason,operationId:id,userId:game.user.id,time:Date.now()};
  return commit(actor,key,record,plan.after,id,"deposit",baseline,()=>{if(effectSourceState(item)!==selected.baseline||effectSourceState(actor.items.get(item.id))!==selected.baseline)throw Error("Origem alterada ou removida durante o depósito.");depositSource(actor,item);});
 });
}
export async function returnCosmo(actor,key){
 available(actor);depositKey(key);const record=depositRecords(actor)[key];
 if(!validDeposit(actor.uuid,record)||record.status!=="active")throw Error("Não há depósito próprio ativo para devolver.");
 const baseline=baselineOf(actor),event=DEPOSIT_RULES[record.contract].event;
 const preview=returnDepositPlan(actor,key,{event,reason:""});
 const content=await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/cosmo-return-dialog.hbs`,{...record,event,before:preview.before,after:preview.after,modeLabel:DEPOSIT_MODES[record.mode]});await guard(actor,baseline);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Devolver CE do depósito"},content,buttons:[{action:"return",label:`${event} · devolver ${record.amount} CE`,callback:(_e,b)=>({event,reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
 if(!answer)return;
 return runMasterOperation(async()=>{
  await guard(actor,baseline);const plan=returnDepositPlan(actor,key,answer),id=depositKey(foundry.utils.randomID());
  const afterRecord={...plan.record,status:"returned",return:{event:plan.event,reason:plan.reason,operationId:id,userId:game.user.id,time:Date.now()}};
  return commit(actor,key,afterRecord,plan.after,id,"return",baseline);
 });
}
export async function recoverCosmoDeposit(actor,id){
 depositKey(id);if(!isPrimaryGM()||actor?.type!=="knight"||!actor.isOwner)throw Error("Somente o mestre responsável pode recuperar o depósito.");
 const op=flags(actor).effectOperations?.[id];if(op?.kind!=="cosmoEscrow"||op.status!=="prepared")throw Error("Não há depósito/devolução interrompido.");
 const baseline=baselineOf(actor);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Conferir depósito/devolução"},content:'<p>Reconhece o registro anterior ou posterior sem repetir débito/devolução. Divergências preservam ajustes para conferência manual.</p><label>Notas (opcional)<textarea name="reason" maxlength="2000"></textarea></label>',buttons:[{action:"recover",label:"Conferir registro",callback:(_e,b)=>({close:false,reason:b.form.elements.reason.value})},{action:"close",label:"Encerrar pendência sem alterar CE",callback:(_e,b)=>({close:true,reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
 if(!answer)return;
 return runMasterOperation(async()=>{
  const reason=optionalNote(answer.reason);await guard(actor,baseline,id);depositKey(op.depositId);
  const current=snapshot(actor,op.depositId),own=op.actorUuid===actor.uuid;
  const status=answer.close?"reviewed":own&&actionHash(current)===actionHash(op.after)?"applied":own&&actionHash(current)===actionHash(op.before)?"failed":null;
  if(!status)throw Error("Depósito/CE divergentes ou de outra ficha. Preserve ajustes e confira manualmente.");
  await actor.update({[`flags.${SYSTEM_ID}.effectOperations.${id}.status`]:status,[`flags.${SYSTEM_ID}.effectOperations.${id}.review`]:{reason,userId:game.user.id,time:Date.now()}});return status;
 });
}
