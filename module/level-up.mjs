import {SYSTEM_ID,ATTRIBUTES,SKILLS,FIGHTING} from "./config.mjs";
import {EVOLUTIONS,levelMilestones,eligibleLevelPower,levelSignature,planLevel} from "./level-rules.mjs";
import {primaryGM,runMasterOperation,assertNoTechniqueInterruption} from "./master-queue.mjs";
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const busy=new WeakSet();
const flag=(actor,key)=>actor.flags?.[SYSTEM_ID]?.[key];
const source=actor=>({system:actor.system.toObject?actor.system.toObject():structuredClone(actor.system),items:actor.items.contents.map(item=>item.toObject?item.toObject():structuredClone(item))});
const signature=actor=>{const data=source(actor);return levelSignature(data.system,data.items);};
const draftSignature=draft=>levelSignature({},[{_id:draft.id,draft}]);
const packFor={power:"habilidades",virtue:"virtudes",technique:"tecnicas"};
async function selectedDocuments(draft) {
 const selected={};
 for(const[slot,pack]of Object.entries(packFor)){
  const uuid=draft[slot];if(!uuid)continue;
  if(!new RegExp(`^Compendium\\.${SYSTEM_ID}\\.${pack}\\.Item\\.[a-zA-Z0-9]{16}$`).test(uuid))throw Error("Origem da escolha de evolução inválida.");
  const doc=await fromUuid(uuid);if(!doc)throw Error("Uma escolha não foi encontrada no compêndio.");
  selected[slot]={...doc.toObject(),uuid:doc.uuid};
 }
 return selected;
}
export async function beginLevelUp(actor) {
 if(!actor?.isOwner||busy.has(actor))return;
 if(actor.isToken)return ui.notifications.warn("Abra o personagem na aba Atores para evoluir a ficha vinculada ao mundo.");
 if(actor.system.creationGuide.status==="draft")return ui.notifications.warn("Conclua a criação antes de subir de nível.");
 if(actor.system.profile.level>=30)return ui.notifications.warn("O assistente atende até o nível 30; níveis seguintes exigem revisão manual.");
 if(flag(actor,"levelOperation")?.status==="prepared")return ui.notifications.warn("Uma evolução foi interrompida. O mestre precisa conferir o registro antes de continuar.");
 if(flag(actor,"levelDraft"))return actor.sheet?.render(true);
 busy.add(actor);
 try{
  const from=actor.system.profile.level;
  await actor.update({[`flags.${SYSTEM_ID}.levelDraft`]:{id:foundry.utils.randomID(),from,to:from+1,baseline:signature(actor),evolution:actor.system.progression.evolution??"",attributes:{},skills:{},fighting:{},advanceSense:true,reviewedContent:false,reviewedManual:false,acceptExceptions:false,reason:""}});
 }finally{busy.delete(actor);}
}
export async function levelUpContext(actor) {
 const draft=flag(actor,"levelDraft");if(!draft)return null;
 const context={...draft,fields:[],choices:[],warnings:[],manual:[],summary:[]};
 const prefix=`flags.${SYSTEM_ID}.levelDraft`;
 const input=(path,label,value,type="number",choices)=>({name:`${prefix}.${path}`,label,value,type,isNumber:type==="number",isCheckbox:type==="checkbox",isTextarea:type==="textarea",isSelect:!!choices,choices:choices?Object.entries(choices).map(([key,label])=>({value:key,label,selected:value===key})):undefined});
 if(draft.to>20)context.fields.push(input("evolution","Evolução dos níveis 21–30",draft.evolution,"text",{"":"Selecionar",...Object.fromEntries(Object.entries(EVOLUTIONS).map(([key,value])=>[key,value.label]))}));
 context.fields.push(input("advanceSense","Aplicar estágio de Sentido se houver marco, preservando estágios superiores",draft.advanceSense,"checkbox"),input("reviewedContent","Conferi descrições, requisitos e escolhas do conteúdo selecionado",draft.reviewedContent,"checkbox"),input("reviewedManual","Conferi os ganhos que exigem revisão manual",draft.reviewedManual,"checkbox"),input("acceptExceptions","Registrar pendências como exceções autorizadas da campanha",draft.acceptExceptions,"checkbox"),input("reason","Justificativa das pendências / decisão do mestre",draft.reason,"textarea"));
 context.attributeFields=Object.entries(ATTRIBUTES).map(([key,label])=>input(`attributes.${key}`,`${label} · atual ${actor.system.attributes[key].value}`,draft.attributes?.[key]??0));
 context.skillFields=Object.entries(SKILLS).map(([key,definition])=>input(`skills.${key}`,`${definition.label} · atual ${actor.system.skills[key].value}`,draft.skills?.[key]??0));
 context.fightFields=Object.entries(FIGHTING).map(([key,label])=>input(`fighting.${key}`,`${label} · atual ${actor.system.fighting[key]}`,draft.fighting?.[key]??0));
 try{
  const data=source(actor),selected=await selectedDocuments(draft),plan=planLevel(data.system,data.items,draft,selected,game.settings.get(SYSTEM_ID,"resistanceMode"),{actorUuid:actor.uuid,flags:actor.flags});
  Object.assign(context,plan,{skillBudget:plan.milestones.skillPoints+(actor.system.progression.skillBank??0),attributeBudget:plan.milestones.attributePoints+(actor.system.progression.attributeBank??0),fightBudget:plan.milestones.fightPoints+(actor.system.progression.fightBank??0)});
  context.choices=[{slot:"power",label:draft.to===5?"Especialização / Melhoria":"Habilidade / Dádiva / Melhoria",name:selected.power?.name??"Pendente"}];
  if(plan.milestones.virtue)context.choices.push({slot:"virtue",label:"Nova virtude",name:selected.virtue?.name??"Pendente"});
  if(plan.milestones.technique)context.choices.push({slot:"technique",label:"Nova técnica",name:selected.technique?.name??"Pendente"});
  if(signature(actor)!==draft.baseline)context.error="A ficha mudou após abrir o rascunho. Descarte-o e recomece para conferir os novos dados.";
 }catch(error){context.error=error.message;}
 return context;
}
export async function chooseLevelItem(actor,slot) {
 if(!actor.isOwner||busy.has(actor)||!packFor[slot])return;
 const draft=flag(actor,"levelDraft");if(!draft)return;
 const milestones=levelMilestones(actor.system,draft);if(slot==="virtue"&&!milestones.virtue||slot==="technique"&&!milestones.technique)return;
 const pack=game.packs.get(`${SYSTEM_ID}.${packFor[slot]}`);
 if(!pack?.testUserPermission(game.user,"OBSERVER"))return ui.notifications.warn("O mestre precisa permitir acesso ao compêndio.");
 busy.add(actor);
 try{
  const index=await pack.getIndex({fields:["type","system.level","system.abilityKind","system.classification","flags.gods-battle-ss.source.key"]});
  const entries=index.contents.filter(entry=>slot==="power"?eligibleLevelPower(actor.system,draft,entry):slot==="virtue"?entry.type==="virtue":entry.type==="technique"&&entry.system.classification===(draft.to===11?"silver":"gold")).toSorted((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
  const options=entries.map(entry=>`<option value="${entry._id}">${escape(entry.name)} · nível ${entry.system.level??1}</option>`).join("");
  const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Escolher para evolução"},content:`<label>Conteúdo disponível<select name="entry">${options}</select></label><p>A cópia só será criada ao confirmar a evolução. Abra a referência para ler requisitos; itens atuais serão preservados.</p>`,buttons:[{action:"choose",label:"Selecionar",default:true,callback:(_e,b)=>b.form.elements.entry.value},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
  if(!answer||!entries.some(entry=>entry._id===answer))return;
  const doc=await pack.getDocument(answer);if(flag(actor,"levelDraft")?.id!==draft.id||flag(actor,"levelOperation")?.status==="prepared")throw Error("O rascunho mudou ou já está sendo aplicado.");
  await actor.update({[`flags.${SYSTEM_ID}.levelDraft.${slot}`]:doc.uuid,[`flags.${SYSTEM_ID}.levelDraft.reviewedContent`]:false});doc.sheet.render(true);
 }finally{busy.delete(actor);}
}
export async function discardLevelDraft(actor) {
 if(!actor.isOwner||busy.has(actor))return;
 if(flag(actor,"levelOperation")?.status==="prepared")return ui.notifications.warn("O mestre precisa conferir a evolução interrompida.");
 if(await foundry.applications.api.DialogV2.confirm({window:{title:"Descartar rascunho"},content:"<p>Descartar apenas as escolhas de evolução ainda não aplicadas? A ficha e seus itens permanecem como estão.</p>"})){
  if(flag(actor,"levelOperation")?.status==="prepared")return ui.notifications.warn("A aplicação já começou; aguarde o mestre.");
  await actor.update({[`flags.${SYSTEM_ID}.-=levelDraft`]:null});
 }
}
export async function requestLevelUp(actor) {
 if(!actor.isOwner||busy.has(actor))return;
 const gm=primaryGM();if(!gm?.active)return ui.notifications.warn("É necessário um mestre ativo para confirmar a evolução.");
 busy.add(actor);
 try{
  const draft=flag(actor,"levelDraft");if(!draft)return;
  const decision=draftSignature(draft);
  if(signature(actor)!==draft.baseline)throw Error("A ficha mudou; descarte o rascunho e recomece a revisão.");
  const data=source(actor),plan=planLevel(data.system,data.items,draft,await selectedDocuments(draft),game.settings.get(SYSTEM_ID,"resistanceMode"),{actorUuid:actor.uuid,flags:actor.flags});
  if(!plan.canApply)throw Error("Confira os requisitos e pendências ou registre a exceção antes de concluir.");
  if(!await foundry.applications.api.DialogV2.confirm({window:{title:`Evoluir para nível ${draft.to}`},content:`<p>Confirmar ${escape(actor.name)}: nível ${draft.from} → ${draft.to}?</p><p>${plan.grants.length} cópia(s) nova(s); ${plan.rankUpdates.length} Melhoria(s) atualizada(s). PV e CE atuais, armadura, XP e ajustes manuais serão preservados. Pontos não distribuídos ficam em saldo.</p><p>${plan.warnings.length} pendência(s) registrada(s). A solicitação será processada pelo mestre ativo.</p>`}))return;
  if(signature(actor)!==draft.baseline||!flag(actor,"levelDraft")||draftSignature(flag(actor,"levelDraft"))!==decision)throw Error("A ficha ou escolhas mudaram durante a confirmação. Confira novamente.");
  return ChatMessage.create({content:"<p>Solicitação de evolução enviada ao mestre. Aguarde a confirmação na ficha.</p>",whisper:[...new Set([game.user.id,gm.id])],flags:{[SYSTEM_ID]:{levelRequest:{actorUuid:actor.uuid,draftId:draft.id,baseline:draft.baseline,draftSignature:decision}}}});
 }catch(error){ui.notifications.error(error.message);}finally{busy.delete(actor);}
}
function matchingBase(actor,operation) {
 if(!flag(actor,"levelDraft")||draftSignature(flag(actor,"levelDraft"))!==operation.draftSignature)return false;
 const data=source(actor);data.items=data.items.filter(item=>item.flags?.[SYSTEM_ID]?.levelOperation!==operation.id);
 for(const change of operation.ranks){const item=data.items.find(item=>(item._id??item.id)===change.id);if(item&&item.system.rank===change.after)item.system.rank=change.before;}
 return levelSignature(data.system,data.items)===operation.baseline;
}
export async function applyLevelOperation(actor,requester) {
 if(primaryGM()?.id!==game.user.id||!actor.testUserPermission(requester,"OWNER"))throw Error("Sem permissão para evoluir este cavaleiro.");
 assertNoTechniqueInterruption(actor);
 const draft=flag(actor,"levelDraft");if(!draft)throw Error("Evolução já aplicada ou rascunho ausente.");
 const decision=draftSignature(draft);
 if(flag(actor,"levelOperation")?.status==="prepared")throw Error("Evolução interrompida exige conferência do mestre.");
 if(actor.system.creationGuide.status==="draft"||signature(actor)!==draft.baseline)throw Error("A ficha mudou; recomece a revisão.");
 const data=source(actor),plan=planLevel(data.system,data.items,draft,await selectedDocuments(draft),game.settings.get(SYSTEM_ID,"resistanceMode"),{actorUuid:actor.uuid,flags:actor.flags});
 if(!plan.canApply)throw Error("Revisão incompleta; conferir pendências.");
 if(signature(actor)!==draft.baseline||!flag(actor,"levelDraft")||draftSignature(flag(actor,"levelDraft"))!==decision)throw Error("A ficha ou escolhas mudaram durante a conferência.");
 const operation={id:draft.id,status:"prepared",from:draft.from,to:draft.to,baseline:draft.baseline,draftSignature:decision,time:Date.now(),userId:requester.id,ranks:plan.rankUpdates,summary:plan.summary,warnings:plan.warnings,manual:plan.manual,reason:draft.reason??"",choices:plan.grants.map(item=>({name:item.name,uuid:item.system.originUuid})),balances:{skills:plan.projected.progression.skillBank,attributes:plan.projected.progression.attributeBank,fighting:plan.projected.progression.fightBank}};
 const created=[];
 await actor.update({[`flags.${SYSTEM_ID}.levelOperation`]:operation});
 try{
  if(plan.grants.length){const docs=await actor.createEmbeddedDocuments("Item",plan.grants);created.push(...docs.map(item=>({id:item.id,signature:levelSignature({},[item.toObject()])})));}
  if(plan.rankUpdates.length)await actor.updateEmbeddedDocuments("Item",plan.rankUpdates.map(change=>({_id:change.id,"system.rank":change.after})));
  if(!matchingBase(actor,operation))throw Error("A ficha foi alterada durante a evolução. Confira o registro.");
  const completed={...operation,status:"applied",createdIds:created.map(item=>item.id)};
  await actor.update({...plan.updates,[`flags.${SYSTEM_ID}.levelHistory.${draft.id}`]:completed,[`flags.${SYSTEM_ID}.levelOperation`]:completed,[`flags.${SYSTEM_ID}.-=levelDraft`]:null});
  return completed;
 }catch(error){
  let safe=actor.system.profile.level===draft.from;
  for(const item of created){const current=actor.items.get(item.id);if(current&&levelSignature({},[current.toObject()])!==item.signature)safe=false;}
  for(const change of plan.rankUpdates){const current=actor.items.get(change.id);if(current&&!([change.before,change.after].includes(current.system.rank)))safe=false;}
  if(safe){try{
   if(created.length)await actor.deleteEmbeddedDocuments("Item",created.map(item=>item.id));
   if(plan.rankUpdates.length)await actor.updateEmbeddedDocuments("Item",plan.rankUpdates.map(change=>({_id:change.id,"system.rank":change.before})));
   await actor.update({[`flags.${SYSTEM_ID}.levelOperation`]:{...operation,status:"failed",error:error.message}});
  }catch{safe=false;}}
  if(!safe)await actor.update({[`flags.${SYSTEM_ID}.levelOperation`]:{...operation,status:"prepared",error:error.message,createdIds:created.map(item=>item.id)}});
  throw error;
 }
}
export async function executeLevelRequest(message,userId) {
 if(primaryGM()?.id!==game.user.id)return;
 const request=message.flags?.[SYSTEM_ID]?.levelRequest;if(!request||message.flags?.[SYSTEM_ID]?.levelResponse)return;
 const author=message.author?.id??message.user?.id,requester=game.users.get(userId);if(author!==userId||!requester)return;
 let response;
 try{
  if(!/^Actor\.[a-zA-Z0-9]+$/.test(request.actorUuid))throw Error("Personagem inválido.");
  const actor=await fromUuid(request.actorUuid),draft=flag(actor,"levelDraft");
  if(!draft||draft.id!==request.draftId||draft.baseline!==request.baseline||request.draftSignature!==draftSignature(draft))throw Error("Rascunho mudou ou evolução já foi aplicada.");
  const result=await applyLevelOperation(actor,requester);response={ok:true,text:`${actor.name}: evolução ${result.from} → ${result.to} concluída.`};
 }catch(error){response={ok:false,text:error.message};}
 await message.update({[`flags.${SYSTEM_ID}.levelResponse`]:response,content:`<p>${escape(response.text)}</p>`});
}
export function enqueueLevelRequest(message,_options,userId) {if(!message.flags?.[SYSTEM_ID]?.levelRequest)return;return runMasterOperation(()=>executeLevelRequest(message,userId)).catch(error=>console.error("Evolução assistida",error));}
export async function resumeLevelRequests() {
 if(primaryGM()?.id!==game.user.id)return;
 for(const message of game.messages.contents.filter(message=>message.flags?.[SYSTEM_ID]?.levelRequest&&!message.flags?.[SYSTEM_ID]?.levelResponse))await enqueueLevelRequest(message,{},message.author?.id??message.user?.id);
}
export async function clearInterruptedLevel(actor) {
 if(primaryGM()?.id!==game.user.id||flag(actor,"levelOperation")?.status!=="prepared")return;
 if(!await foundry.applications.api.DialogV2.confirm({window:{title:"Conferir evolução interrompida"},content:"<p>Confira nível, pontos e itens do registro, reparando manualmente o que já foi aplicado. Liberar não remove itens nem restaura valores. Depois abra um novo rascunho sobre os dados conferidos.</p><p>Confirmar que a revisão foi concluída?</p>"}))return;
 await actor.update({[`flags.${SYSTEM_ID}.levelOperation.status`] : "reviewed",[`flags.${SYSTEM_ID}.-=levelDraft`]:null});
}
