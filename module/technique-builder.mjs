import {SYSTEM_ID,NATURES} from "./config.mjs";
import {TECHNIQUE_TIERS,TECHNIQUE_MODES} from "./technique-rules.mjs";
import {PRIMORDIALS,componentUuid,validComponentUuid,composeTechnique} from "./technique-builder-rules.mjs";
import {levelSignature} from "./level-rules.mjs";
const busy=new WeakSet(),actorBusy=new WeakSet();
const flags=item=>item.flags?.[SYSTEM_ID]??{};
export const techniqueConstruction=item=>{const f=flags(item);return f.techniqueConstructionHistory?.[f.techniqueConstructionId]??null;};
const own=item=>item?.type==="technique"&&item.parent?.type==="knight"&&item.isOwner&&item.parent.isOwner;
const signature=item=>levelSignature({},[{_id:item.id,name:item.name,system:item.system.toObject?item.system.toObject():item.system}]);
const decision=draft=>levelSignature({},[{_id:draft.id,draft}]);
const actorState=actor=>levelSignature(actor.system.toObject?actor.system.toObject(false):actor.system,[]);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function references(draft) {
 const pack=game.packs.get(`${SYSTEM_ID}.componentes-tecnicas`);
 if(!pack?.testUserPermission(game.user,"OBSERVER"))throw Error("O mestre precisa permitir consulta aos Big Bangs e incrementos.");
 return Promise.all(Object.entries(draft.components??{}).map(async([slot,c])=>{
  if(!validComponentUuid(c.uuid))throw Error("Origem de componente inválida.");
  const doc=await fromUuid(c.uuid);if(!doc)throw Error("Componente não encontrado.");
  return {slot,doc:{...doc.toObject(),uuid:doc.uuid},rank:c.rank,detail:c.detail??""};
 }));
}
const countOther=item=>item.parent.items.contents.filter(i=>i.type==="technique"&&i.id!==item.id).length;
async function plan(item,draft){return composeTechnique(item.parent.system,draft,await references(draft),countOther(item));}
export async function beginTechniqueBuilder(item) {
 if(!own(item)||busy.has(item))return;
 if(flags(item).source)return ui.notifications.warn("Para compor livremente, crie uma técnica personalizada; a cópia do livro mantém configuração e referência próprias.");
 if(flags(item).techniqueDraft)return item.sheet.render(true);
 busy.add(item);
 try{
  const s=item.system,previous=techniqueConstruction(item)?.blueprint;
  const draft={name:item.name,classification:s.classification in TECHNIQUE_TIERS?s.classification:"bronze",nature:s.nature||item.parent.system.profile.nature,primary:"damage",techniqueMode:s.techniqueMode??"status",power:s.power,damageLevel:s.damageLevel,range:0,duration:"",description:s.description,extraSlots:0,extraCost:s.costExtra??0,components:{},incrementReviewed:false,...structuredClone(previous??{}),id:foundry.utils.randomID(),baseline:signature(item),reviewed:false,allowExceptions:false,reason:""};
  await item.update({[`flags.${SYSTEM_ID}.customTechnique`]:true,[`flags.${SYSTEM_ID}.techniqueDraft`]:draft});
 }catch(error){ui.notifications.error(error.message);}finally{busy.delete(item);}
}
export async function createPersonalTechnique(actor) {
 if(!actor?.isOwner||actor.type!=="knight"||actorBusy.has(actor))return;
 actorBusy.add(actor);
 try{
  const existing=actor.items.contents.find(item=>flags(item).techniqueDraft);
  if(existing)return existing.sheet.render(true);
  const [item]=await actor.createEmbeddedDocuments("Item",[{name:"Técnica personalizada",type:"technique",img:`systems/${SYSTEM_ID}/assets/cosmos.svg`,system:{effectKind:"manual",techniqueMode:"status",techniqueReviewed:false},flags:{[SYSTEM_ID]:{customTechnique:true}}}]);
  await beginTechniqueBuilder(item);item.sheet.render(true);return item;
 }catch(error){ui.notifications.error(error.message);}finally{actorBusy.delete(actor);}
}
export async function techniqueBuilderContext(item) {
 const draft=flags(item).techniqueDraft;if(!draft)return null;
 const prefix=`flags.${SYSTEM_ID}.techniqueDraft`;
 const field=(path,label,value,choices,type="number")=>({name:`${prefix}.${path}`,label,value,type,isNumber:type==="number",isCheckbox:type==="checkbox",isTextarea:type==="textarea",isSelect:!!choices,choices:choices?Object.entries(choices).map(([key,label])=>({value:key,label,selected:key===value})):undefined});
 const context={...draft,components:[],fields:[field("name","Nome da técnica",draft.name,null,"text"),field("classification","Classe / nível da técnica",draft.classification,{bronze:"Bronze",silver:"Prata",gold:"Ouro"}),field("nature","Natureza",draft.nature,Object.fromEntries(Object.entries(NATURES).map(([key,v])=>[key,v.label]))),field("primary","Big Bang primordial",draft.primary,Object.fromEntries(Object.entries(PRIMORDIALS).map(([key,v])=>[key,v.label]))),field("techniqueMode","ND/Poder",draft.techniqueMode,TECHNIQUE_MODES),field("damageLevel","ND no modo manual",draft.damageLevel),field("power","Poder no modo manual",draft.power),field("range","Alcance em metros (0 usa a classe)",draft.range),field("duration","Duração (vazio usa regra primordial)",draft.duration,null,"text"),field("description","Descrição narrativa e parâmetros especiais",draft.description,null,"textarea"),field("extraSlots","Slots além da classe (requer conferência)",draft.extraSlots),field("extraCost","CE fixa extra além dos componentes",draft.extraCost),field("incrementReviewed","Conferi aquisição/graduações de Mestre e incrementos",draft.incrementReviewed,null,"checkbox"),field("reviewed","Conferi composição, requisitos, efeitos e desenvolvimento",draft.reviewed,null,"checkbox"),field("allowExceptions","Registrar pendências como exceções da campanha",draft.allowExceptions,null,"checkbox"),field("reason","Justificativa das exceções",draft.reason,null,"textarea")]};
 try{
  const p=await plan(item,draft);Object.assign(context,p);
  context.components=p.components.map(c=>({...c,fields:[...(c.type==="increment"?[{...field(`components.${c.slot}.rank`,`Graduação do incremento (máximo ${c.maxRank})`,c.rank),min:1,max:c.maxRank}]:[]),field(`components.${c.slot}.detail`,"Parâmetro / escolha deste componente",c.detail,null,"text")]}));
  if(signature(item)!==draft.baseline)context.error="A técnica mudou após abrir o rascunho. Descarte-o e confira os novos dados.";
 }catch(error){context.error=error.message;}
 return context;
}
export async function addTechniqueComponent(item) {
 if(!own(item)||busy.has(item))return;const draft=flags(item).techniqueDraft;if(!draft)return;
 busy.add(item);
 try{
  const pack=game.packs.get(`${SYSTEM_ID}.componentes-tecnicas`);if(!pack?.testUserPermission(game.user,"OBSERVER"))throw Error("O mestre precisa permitir consulta ao compêndio.");
  const index=await pack.getIndex({fields:["type","system.page"]}),entries=index.contents.filter(e=>["bigbang","increment"].includes(e.type)).toSorted((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
  const options=entries.map(e=>`<option value="${e._id}">${escape(e.name)} · p.${escape(e.system.page)}</option>`).join("");
  const selected=await foundry.applications.api.DialogV2.wait({window:{title:"Adicionar Big Bang ou incremento"},content:`<label>Componente<select name="component">${options}</select></label><p>Big Bangs extras ocupam slots; incrementos usam aquisição/graduação do personagem. Leia a referência antes de concluir.</p>`,buttons:[{action:"add",label:"Adicionar e abrir referência",default:true,callback:(_e,b)=>b.form.elements.component.value},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
  if(!selected)return;if(!entries.some(e=>e._id===selected))throw Error("Escolha inválida.");
  const current=flags(item).techniqueDraft;if(!current||current.id!==draft.id)throw Error("Rascunho mudou.");
  const uuid=componentUuid(selected);if(uuid===componentUuid(PRIMORDIALS[current.primary].id)||Object.values(current.components??{}).some(c=>c.uuid===uuid))throw Error("Este Big Bang/incremento já está selecionado.");
  const doc=await pack.getDocument(selected);if(flags(item).techniqueDraft?.id!==draft.id)throw Error("Rascunho mudou.");
  await item.update({[`flags.${SYSTEM_ID}.techniqueDraft.components.${foundry.utils.randomID()}`]:{uuid,rank:1,detail:""},[`flags.${SYSTEM_ID}.techniqueDraft.reviewed`]:false});doc.sheet.render(true);
 }catch(error){ui.notifications.error(error.message);}finally{busy.delete(item);}
}
export async function removeTechniqueComponent(item,slot) {
 if(!own(item)||busy.has(item)||!/^[a-zA-Z0-9]{16}$/.test(slot)||!flags(item).techniqueDraft?.components?.[slot])return;
 busy.add(item);try{await item.update({[`flags.${SYSTEM_ID}.techniqueDraft.components.-=${slot}`]:null,[`flags.${SYSTEM_ID}.techniqueDraft.reviewed`]:false});}catch(error){ui.notifications.error(error.message);}finally{busy.delete(item);}
}
export async function discardTechniqueBuilder(item) {
 if(!own(item)||busy.has(item)||!flags(item).techniqueDraft)return;
 const id=flags(item).techniqueDraft.id;
 busy.add(item);try{if(await foundry.applications.api.DialogV2.confirm({window:{title:"Descartar composição"},content:"<p>Descartar apenas o rascunho? A técnica e suas notas permanecem. Uma técnica nova continua manual até ser configurada.</p>"})){if(flags(item).techniqueDraft?.id!==id)throw Error("Rascunho mudou; confira novamente.");await item.update({[`flags.${SYSTEM_ID}.-=techniqueDraft`]:null});}}catch(error){ui.notifications.error(error.message);}finally{busy.delete(item);}
}
export async function finishTechniqueBuilder(item) {
 if(!own(item)||busy.has(item))return;const draft=flags(item).techniqueDraft;if(!draft)return;
 busy.add(item);
 try{
  const baseline=signature(item),choice=decision(draft),actorBefore=actorState(item.parent),countBefore=countOther(item),p=await plan(item,draft);
  if(baseline!==draft.baseline)throw Error("A técnica mudou; descarte e confira o novo rascunho.");
  if(!draft.reviewed||!p.canApply)throw Error("Confira os requisitos/pendências ou registre uma exceção justificada.");
  if(!await foundry.applications.api.DialogV2.confirm({window:{title:"Concluir técnica personalizada"},content:`<p>Salvar ${escape(draft.name)}? Slots extras${p.used}/${p.capacity}, custo${p.totalCost}CE, dificuldade${p.difficulty}. ${p.technique.effectKind==="manual"?"A composição mantém aplicação manual.":"Ativação genérica disponível após a revisão."}</p><p>A ficha, seus recursos e notas da cópia são preservados. Efeitos específicos continuam conforme as referências.</p>`}))return;
  if(!own(item)||!item.parent.items.get(item.id)||signature(item)!==baseline||!flags(item).techniqueDraft||decision(flags(item).techniqueDraft)!==choice||actorState(item.parent)!==actorBefore||countOther(item)!==countBefore)throw Error("A ficha ou composição mudou durante a confirmação. Confira novamente.");
  const record={id:draft.id,time:Date.now(),userId:game.user.id,blueprint:p.blueprint,components:p.components,primary:p.primary,cost:p.cost,fixed:p.fixed,totalCost:p.totalCost,difficulty:p.difficulty,used:p.used,capacity:p.capacity,warnings:p.warnings,manual:p.manual,reason:draft.reason??""};
  await item.update({...p.updates,[`flags.${SYSTEM_ID}.techniqueConstructionId`]:draft.id,[`flags.${SYSTEM_ID}.techniqueConstructionHistory.${draft.id}`]:record,[`flags.${SYSTEM_ID}.-=techniqueDraft`]:null});
 }catch(error){ui.notifications.error(error.message);}finally{busy.delete(item);}
}
