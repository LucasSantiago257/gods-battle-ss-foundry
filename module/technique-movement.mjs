import {SYSTEM_ID} from "./config.mjs";
const primaries=new Set(["13841831d802c5be","953cf77664309d03","ac34d9f38628bd92","49b31d7e766c2fd9"].map(id=>`Compendium.${SYSTEM_ID}.componentes-tecnicas.Item.${id}`));
const uuid=`Compendium.${SYSTEM_ID}.componentes-tecnicas.Item.3db91f91d5c36fe8`;
export const TECHNIQUE_MOVEMENT={standard:"Reserva de luta padrão",partial:"Movendo · Movimento Parcial",total:"Movendo · Movimento Total"};
// Printed action modes, pinned to existing catalog source keys and canonical component UUID.
const printedModes=new Map([
 ["technique:mental:BRONZE:VELOCIDADE","partial"],
 ["technique:physical:BRONZE:VELOCIDADE","partial"],
 ["technique:physical:PRATA:LANÇA DOURADA","total"],
 ["technique:cosmic:BRONZE:TELETRANSPORTE","partial"],
 ["technique:natural:BRONZE:VELOCIDADE (Ar)","partial"]
]);
export function printedMovendo(item){
 const f=item?.flags?.[SYSTEM_ID]??{},source=f.source,mode=printedModes.get(source?.key);
 if(f.techniqueConstructionId||!mode||source?.reference?.manualOnly||!Array.isArray(source?.references)||source.references.filter(r=>r?.uuid===uuid).length!==1||source.references.filter(r=>primaries.has(r?.uuid)).length>1)return null;
 return {mode,key:source.key};
}
export function movementChoices(item){
 const printed=printedMovendo(item);
 return printed?{standard:TECHNIQUE_MOVEMENT.standard,[printed.mode]:TECHNIQUE_MOVEMENT[printed.mode]}:hasMovendo(item)?{...TECHNIQUE_MOVEMENT}:{standard:TECHNIQUE_MOVEMENT.standard};
}
export function hasMovendo(item){
 const f=item?.flags?.[SYSTEM_ID]??{},record=f.techniqueConstructionHistory?.[f.techniqueConstructionId];
 if(!f.techniqueConstructionId)return !!printedMovendo(item);
 if(!record||!primaries.has(record.primary?.uuid)||!Array.isArray(record.components)||record.components.some(c=>!c||typeof c.key!=="string"||c.key.startsWith("bigbang:primordial:")))return false;
 const matching=record.components.filter(c=>c.uuid===uuid||c.key==="bigbang:extra:Movendo");
 return matching.length===1&&matching[0].uuid===uuid&&matching[0].key==="bigbang:extra:Movendo"&&matching[0].type==="bigbang"&&matching[0].rank===1;
}
export function techniqueMovement(item,mode=item?.flags?.[SYSTEM_ID]?.techniqueMovementMode??"standard"){
 if(mode==="standard")return null;
 if(printedMovendo(item)&&printedMovendo(item).mode!==mode)throw Error("O modo de Movendo desta técnica do livro é diferente; use o modo impresso ou a reserva padrão.");
 if(!["partial","total"].includes(mode)||!hasMovendo(item)||!["damage","control","sustained"].includes(item.system.effectKind))throw Error("Movendo exige composição salva ou técnica do livro com referência válida e Movimento Parcial ou Total configurado; outros casos permanecem manuais.");
 return {mode,label:mode==="partial"?"Movimento Parcial":"Movimento Total",page:"229"};
}
