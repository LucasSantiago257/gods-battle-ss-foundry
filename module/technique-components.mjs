import {optionalNote} from "./form-values.mjs";
import {SYSTEM_ID,NATURES,ATTRIBUTES} from "./config.mjs";
import {effectiveAttribute} from "./passives.mjs";
export const COMPONENT_RULES={
 "83074cf01c6e5681":{key:"bigbang:extra:Enfraquecer",label:"Enfraquecer",page:"227",kind:"weaken",introduced:4},
 "69e4c648b940a68e":{key:"bigbang:extra:Esgotar",label:"Esgotar",page:"228",kind:"exhaust"},
 "b7b2a3b6f95c71fe":{key:"bigbang:extra:Essência Alvo",label:"Essência Alvo",page:"228",kind:"essence"},
 "83665b3c116a7f30":{key:"bigbang:extra:Terreno Favorável",label:"Terreno Favorável",page:"230",kind:"terrain"},
 "de15bef11745f7c2":{key:"increment:Controle sobre s Destruição",label:"Controle sobre a Destruição",page:"219",kind:"destruction",introduced:3},
 "1c0a9862d3c417fd":{key:"increment:Controle sobre as Estrelas",label:"Controle sobre as Estrelas",page:"219",kind:"stars",introduced:2},
 "5f24c377be178c53":{key:"increment:Controle sobre o Espaço",label:"Controle sobre o Espaço",page:"217–218",kind:"space"}
};
export function componentState(item) {const f=item.flags?.[SYSTEM_ID]??{};return {enabled:f.componentAutomation===true,ruleVersion:f.componentRuleVersion??1,constructionId:f.techniqueConstructionId,construction:f.techniqueConstructionHistory?.[f.techniqueConstructionId]};}
export function componentProfile(item,{enabled=componentState(item).enabled,ruleVersion=componentState(item).ruleVersion}={}) {
 const state=componentState(item),record=state.construction;
 if(!enabled)return {enabled:false,rules:[],manual:[]};
 if(![1,2,3,4].includes(ruleVersion))throw Error("Grupo de componentes inválido. Configure a técnica novamente.");
 if(!record||!Array.isArray(record.components)||record.primary?.uuid!==`Compendium.${SYSTEM_ID}.componentes-tecnicas.Item.13841831d802c5be`||item.system.effectKind!=="damage"||record.components.some(c=>c.key?.startsWith("bigbang:primordial:")))throw Error("Este grupo automático exige composição salva com primordial Dano. Outros efeitos continuam manuais.");
 const seen=new Set(),rules=[],manual=[];
 for(const c of record.components){
  const id=c.uuid?.split(".").at(-1),rule=COMPONENT_RULES[id];
  if(!rule||(rule.introduced??1)>ruleVersion){manual.push({name:c.name,page:c.page});continue;}
  if(c.uuid!==`Compendium.${SYSTEM_ID}.componentes-tecnicas.Item.${id}`||c.key!==rule.key||seen.has(id))throw Error("Referência de componente automático inválida/repetida. Refaça a composição.");
  seen.add(id);
  const increment=["space","stars","destruction"].includes(rule.kind);
  if(c.type!==(increment?"increment":"bigbang")||!Number.isInteger(c.rank)||c.rank<1||c.rank>(increment?3:1))throw Error("Tipo/graduação de componente inválida.");
  if(rule.kind==="terrain"&&!c.detail?.trim())throw Error("Especifique o ambiente de Terreno Favorável no construtor antes de automatizar.");
  rules.push({...rule,id,rank:c.rank,detail:c.detail??""});
 }
 if(!rules.length)throw Error("A composição não contém componentes deste grupo automático.");
 return {enabled:true,ruleVersion,rules,manual};
}
export function techniqueWithComponents(item) {return {...(item.system.toObject?item.system.toObject():item.system),componentProfile:componentProfile(item)};}
export function componentOptions(technique,options={},system=null) {
 const profile=technique.componentProfile??{enabled:false,rules:[]};
 const exhaust=options.exhaust??0,essence=options.oppositeEssence??false,terrain=options.favorableTerrain??false;
 if(!Number.isSafeInteger(exhaust)||exhaust<0||typeof essence!=="boolean"||typeof terrain!=="boolean")throw Error("Parâmetros de componentes inválidos.");
 const has=kind=>profile.enabled&&profile.rules.some(r=>r.kind===kind);
 if(exhaust&&!has("exhaust")||essence&&!has("essence")||terrain&&!has("terrain"))throw Error("A técnica não possui esse componente automático habilitado.");
 optionalNote(options.componentReason,1000);
 const levelBonus=exhaust+(essence?1:0)+(terrain?1:0),extraCost=exhaust*2,rangeBonus=has("space")?profile.rules.find(r=>r.kind==="space").rank*1.5:0;
 const powerCosmicBonus=has("stars")?profile.rules.find(r=>r.kind==="stars").rank:0;
 const destruction=has("destruction")?profile.rules.find(r=>r.kind==="destruction"):null;
 const weaken=has("weaken")?profile.rules.find(r=>r.kind==="weaken"):null;
 const attribute=weaken?NATURES[technique.nature]?.key:null,attributeRank=weaken&&attribute&&system?effectiveAttribute(system,attribute):null;
 if(weaken&&(!Number.isSafeInteger(attributeRank)||attributeRank<0||attributeRank>12))throw Error("Enfraquecer exige graduação válida do atributo-chave da natureza da técnica.");
 const destructionPart=destruction?{version:1,id:destruction.id,key:destruction.key,rank:destruction.rank,modifier:-destruction.rank}:null;
 const weakenPart=weaken?{id:weaken.id,key:weaken.key,rank:1,attribute,attributeRank,modifier:-attributeRank}:null;
 const parts=[destructionPart,weakenPart].filter(Boolean),resistanceModifier=parts.reduce((sum,p)=>sum+p.modifier,0);
 const resistanceComponent=weaken?{version:2,modifier:resistanceModifier,entries:parts}:destructionPart;
 return {levelBonus,extraCost,rangeBonus,powerCosmicBonus,resistanceModifier,resistanceComponent,range:(technique.range??0)+rangeBonus,entries:profile.rules?.map(r=>({...r,applied:r.kind==="exhaust"?exhaust:r.kind==="essence"?Number(essence):r.kind==="terrain"?Number(terrain):r.kind==="stars"?powerCosmicBonus:r.kind==="destruction"?-r.rank:r.kind==="weaken"?-attributeRank:rangeBonus,...(r.kind==="weaken"?{detail:`${ATTRIBUTES[attribute]} ${attributeRank}; nesta resistência, sem estado persistente`}:{})}))??[],manual:profile.manual??[]};
}

export function attackResistanceComponent(attack) {
 const saved=attack?.componentResistance;if(saved==null)return null;
 const invalid=()=>{throw Error("Componente de resistência inválido no cartão. Resolva a técnica novamente.");};
 if(attack.effectKind!=="damage")return invalid();
 const destructionId="de15bef11745f7c2",weakenId="83074cf01c6e5681";
 const destruction=part=>part?.version===1&&part.id===destructionId&&part.key===COMPONENT_RULES[destructionId].key&&Number.isInteger(part.rank)&&part.rank>=1&&part.rank<=3&&part.modifier===-part.rank;
 if(saved.version===1){if(!destruction(saved))return invalid();return {label:COMPONENT_RULES[destructionId].label,page:"219",modifier:saved.modifier,rank:saved.rank};}
 if(saved.version!==2||!Array.isArray(saved.entries)||saved.entries.length<1||saved.entries.length>2)return invalid();
 const seen=new Set(),labels=[],pages=[];
 for(const part of saved.entries){
  if(!part||seen.has(part.id))return invalid();seen.add(part.id);
  if(part.id===destructionId){if(!destruction(part))return invalid();labels.push(COMPONENT_RULES[destructionId].label);pages.push("219");}
  else if(part.id===weakenId){
   if(part.key!==COMPONENT_RULES[weakenId].key||part.rank!==1||!ATTRIBUTES[part.attribute]||part.attribute!==NATURES[attack.nature]?.key||!Number.isSafeInteger(part.attributeRank)||part.attributeRank<0||part.attributeRank>12||part.modifier!==-part.attributeRank)return invalid();
   labels.push(`Enfraquecer (${ATTRIBUTES[part.attribute]} ${part.attributeRank})`);pages.push("227");
  }else return invalid();
 }
 if(!seen.has(weakenId)||!Number.isSafeInteger(saved.modifier)||saved.modifier!==saved.entries.reduce((sum,p)=>sum+p.modifier,0))return invalid();
 return {label:labels.join(" + "),page:pages.join(", "),modifier:saved.modifier};
}
