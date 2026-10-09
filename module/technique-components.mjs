import {optionalNote} from "./form-values.mjs";
import {SYSTEM_ID} from "./config.mjs";
export const COMPONENT_RULES={
 "69e4c648b940a68e":{key:"bigbang:extra:Esgotar",label:"Esgotar",page:"228",kind:"exhaust"},
 "b7b2a3b6f95c71fe":{key:"bigbang:extra:Essência Alvo",label:"Essência Alvo",page:"228",kind:"essence"},
 "83665b3c116a7f30":{key:"bigbang:extra:Terreno Favorável",label:"Terreno Favorável",page:"230",kind:"terrain"},
 "5f24c377be178c53":{key:"increment:Controle sobre o Espaço",label:"Controle sobre o Espaço",page:"217–218",kind:"space"}
};
export function componentState(item) {const f=item.flags?.[SYSTEM_ID]??{};return {enabled:f.componentAutomation===true,constructionId:f.techniqueConstructionId,construction:f.techniqueConstructionHistory?.[f.techniqueConstructionId]};}
export function componentProfile(item,{enabled=componentState(item).enabled}={}) {
 const state=componentState(item),record=state.construction;
 if(!enabled)return {enabled:false,rules:[],manual:[]};
 if(!record||!Array.isArray(record.components)||record.primary?.uuid!==`Compendium.${SYSTEM_ID}.componentes-tecnicas.Item.13841831d802c5be`||item.system.effectKind!=="damage"||record.components.some(c=>c.key?.startsWith("bigbang:primordial:")))throw Error("Este grupo automático exige composição salva com primordial Dano. Outros efeitos continuam manuais.");
 const seen=new Set(),rules=[],manual=[];
 for(const c of record.components){
  const id=c.uuid?.split(".").at(-1),rule=COMPONENT_RULES[id];
  if(!rule){manual.push({name:c.name,page:c.page});continue;}
  if(c.uuid!==`Compendium.${SYSTEM_ID}.componentes-tecnicas.Item.${id}`||c.key!==rule.key||seen.has(id))throw Error("Referência de componente automático inválida/repetida. Refaça a composição.");
  seen.add(id);
  if(c.type!==(rule.kind==="space"?"increment":"bigbang")||!Number.isInteger(c.rank)||c.rank<1||c.rank>(rule.kind==="space"?3:1))throw Error("Tipo/graduação de componente inválida.");
  if(rule.kind==="terrain"&&!c.detail?.trim())throw Error("Especifique o ambiente de Terreno Favorável no construtor antes de automatizar.");
  rules.push({...rule,id,rank:c.rank,detail:c.detail??""});
 }
 if(!rules.length)throw Error("A composição não contém componentes deste grupo automático.");
 return {enabled:true,rules,manual};
}
export function techniqueWithComponents(item) {return {...(item.system.toObject?item.system.toObject():item.system),componentProfile:componentProfile(item)};}
export function componentOptions(technique,options={}) {
 const profile=technique.componentProfile??{enabled:false,rules:[]};
 const exhaust=options.exhaust??0,essence=options.oppositeEssence??false,terrain=options.favorableTerrain??false;
 if(!Number.isSafeInteger(exhaust)||exhaust<0||typeof essence!=="boolean"||typeof terrain!=="boolean")throw Error("Parâmetros de componentes inválidos.");
 const has=kind=>profile.enabled&&profile.rules.some(r=>r.kind===kind);
 if(exhaust&&!has("exhaust")||essence&&!has("essence")||terrain&&!has("terrain"))throw Error("A técnica não possui esse componente automático habilitado.");
 optionalNote(options.componentReason,1000);
 const levelBonus=exhaust+(essence?1:0)+(terrain?1:0),extraCost=exhaust*2,rangeBonus=has("space")?profile.rules.find(r=>r.kind==="space").rank*1.5:0;
 return {levelBonus,extraCost,rangeBonus,range:(technique.range??0)+rangeBonus,entries:profile.rules?.map(r=>({...r,applied:r.kind==="exhaust"?exhaust:r.kind==="essence"?Number(essence):r.kind==="terrain"?Number(terrain):rangeBonus}))??[],manual:profile.manual??[]};
}
