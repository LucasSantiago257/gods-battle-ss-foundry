import {SYSTEM_ID,NATURES,STATUS} from "./config.mjs";
import {TECHNIQUE_TIERS,TECHNIQUE_MODES,EFFECT_KINDS,effectiveTechnique} from "./technique-rules.mjs";
import {componentState,componentProfile} from "./technique-components.mjs";
const busy=new WeakSet();
const options=(choices,value)=>Object.entries(choices).map(([key,label])=>({key,label,selected:key===value}));
const itemState=item=>JSON.stringify({name:item.name,system:item.system.toObject?item.system.toObject():item.system,components:componentState(item)});
export function techniqueSetupContext(actor,item) {
 const s=item.system,tier=TECHNIQUE_TIERS[s.classification]??TECHNIQUE_TIERS.bronze,status=TECHNIQUE_TIERS[actor.system.profile.status];
 let profile,message="";try{profile=componentProfile(item,{enabled:true});}catch(error){message=error.message;}
 return {name:item.name,classes:options({bronze:"Bronze",silver:"Prata",gold:"Ouro"},s.classification),natures:options({"":"Selecionar",...Object.fromEntries(Object.entries(NATURES).map(([key,value])=>[key,value.label]))},s.nature),effects:options(EFFECT_KINDS,s.effectKind),modes:options(TECHNIQUE_MODES,s.techniqueMode??"manual"),
  canComponents:!!profile,componentMessage:message,components:profile,componentEnabled:componentState(item).enabled,controlRounds:s.controlRounds??0,cost:s.cost,costExtra:s.costExtra,power:s.power||status?.power||0,damageLevel:s.damageLevel||status?.damageLevel||0,range:s.range||tier.range,printedCost:item.flags?.[SYSTEM_ID]?.source?.reference?.costPrinted??s.costText,statusLabel:STATUS[actor.system.profile.status]??actor.system.profile.status,automatic:status?`ND ${status.damageLevel} · Poder ${status.power}`:"ND/Poder deste status exigem configuração manual."};
}
export function techniqueSetupUpdates(actor,item,answer) {
 if(item.flags?.[SYSTEM_ID]?.source?.reference?.manualOnly)throw Error("Técnica cooperativa exige aplicação manual.");
 if(!TECHNIQUE_TIERS[answer.classification]||!NATURES[answer.nature]||!EFFECT_KINDS[answer.effectKind]||!TECHNIQUE_MODES[answer.techniqueMode])throw Error("Escolha classe, natureza, efeito e modo válidos.");
 for(const [key,min] of [["cost",1],["costExtra",0],["damageLevel",0],["power",0]])if(!Number.isSafeInteger(answer[key])||answer[key]<min)throw Error(`${key}: informe uma graduação/custo inteiro válido.`);
 if(!Number.isSafeInteger(answer.controlRounds??0)||(answer.controlRounds??0)<0||(answer.controlRounds??0)>500)throw Error("Duração de Controle: inteiro de 0 a 500.");
 if(!Number.isFinite(answer.range)||answer.range<0)throw Error("Alcance inválido.");
 const configured=effectiveTechnique(actor.system,{...item.system,...answer});
 if(answer.effectKind==="damage"&&(configured.power<1||configured.damageLevel<1))throw Error("Dano exige ND e Poder positivos.");
 if(answer.componentAutomation){if(answer.effectKind!=="damage")throw Error("Este grupo automático exige primordial Dano.");componentProfile(item,{enabled:true});}
 const fields=["classification","nature","effectKind","techniqueMode","cost","costExtra","range"];
 if(answer.techniqueMode==="manual")fields.push("power","damageLevel");
 return {...Object.fromEntries(fields.map(key=>[`system.${key}`,answer[key]])),"system.controlRounds":answer.controlRounds??0,"system.techniqueReviewed":true,[`flags.${SYSTEM_ID}.componentAutomation`]:answer.componentAutomation===true};
}
export async function setupTechnique(item) {
 const actor=item?.parent;
 if(item?.type!=="technique"||actor?.type!=="knight"||!actor.isOwner||!item.isOwner||busy.has(item))return;
 if(item.flags?.[SYSTEM_ID]?.techniqueDraft)return ui.notifications.warn("Conclua ou descarte o rascunho antes de configurar a técnica.");
 if(item.flags?.[SYSTEM_ID]?.source?.reference?.manualOnly)return ui.notifications.warn("Esta técnica cooperativa mantém aplicação manual conforme sua descrição.");
 busy.add(item);
 try{
  const baseline=itemState(item),content=await foundry.applications.handlebars.renderTemplate(`systems/${SYSTEM_ID}/templates/technique-setup.hbs`,techniqueSetupContext(actor,item));
  const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Configurar técnica para combate"},content,buttons:[{action:"configure",label:"Salvar configuração",default:true,callback:(_e,b)=>{
   const e=b.form.elements;return {classification:e.classification.value,nature:e.nature.value,effectKind:e.effectKind.value,techniqueMode:e.techniqueMode.value,cost:Number(e.cost.value),costExtra:Number(e.costExtra.value),range:Number(e.range.value),controlRounds:Number(e.controlRounds?.value??0),power:Number(e.power.value),damageLevel:Number(e.damageLevel.value),componentAutomation:e.componentAutomation?.checked??false};
  }},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
  if(!answer)return;
  if(!actor.isOwner||!item.isOwner||!actor.items.get(item.id)||itemState(item)!==baseline)throw Error("A cópia mudou durante a configuração. Confira novamente.");
  await item.update(techniqueSetupUpdates(actor,item,answer));
 }catch(error){ui.notifications.error(error.message);}finally{busy.delete(item);}
}
