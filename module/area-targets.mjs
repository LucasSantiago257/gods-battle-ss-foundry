import {AREA_LIMIT} from "./area-rules.mjs";
const tokenRef=value=>typeof value==="string"&&/^Scene\.[a-zA-Z0-9]+\.Token\.[a-zA-Z0-9]+$/.test(value);
const position=doc=>({x:doc.x,y:doc.y,width:doc.width,height:doc.height,elevation:doc.elevation});
const entry=doc=>({tokenUuid:doc.uuid,actorUuid:doc.actor?.uuid,position:position(doc)});
const same=(a,b)=>["x","y","width","height","elevation"].every(key=>Number.isFinite(a?.[key])&&a[key]===b[key]);
export function areaTargetSelection(tokens){
 const list=[...tokens];if(list.length<2||list.length>AREA_LIMIT)throw Error(`Selecione de2 a${AREA_LIMIT} alvos de área.`);
 if(new Set(list.map(t=>t.actor?.uuid)).size!==list.length)throw Error("Não marque dois tokens da mesma ficha para uma área.");
 const scene=list[0]?.document?.parent;
 return list.map(t=>{
  const d=t.document;
  if(t.actor?.type!=="knight"||t.isVisible!==true||!d||!tokenRef(d.uuid)||d.parent!==scene||scene.tokens?.get(d.id)!==d||!same(position(d),position(d)))throw Error("Os alvos da área precisam ser tokens visíveis de cavaleiros na mesma cena.");
  return {...entry(d),name:t.actor.name};
 });
}
export async function validatedAreaContext(targets,requester){
 if(targets===undefined)return null;
 if(!Array.isArray(targets)||targets.length<2||targets.length>AREA_LIMIT)throw Error("Lista de alvos da área inválida.");
 const docs=[];for(const t of targets){if(!tokenRef(t?.tokenUuid))throw Error("Referência de alvo da área inválida.");docs.push(await fromUuid(t.tokenUuid));}
 const scene=docs[0]?.parent;
 const validate=()=>{
  if(!scene||game.scenes.get(scene.id)!==scene||!scene.testUserPermission(requester,"LIMITED"))throw Error("Cena ou acesso aos alvos da área mudou.");
  for(let i=0;i<docs.length;i++){const d=docs[i],t=targets[i];if(!d||d.parent!==scene||scene.tokens.get(d.id)!==d||d.actor?.type!=="knight"||d.actor.uuid!==t.actorUuid||!same(position(d),t.position)||!requester.isGM&&d.hidden)throw Error("Alvo ou posição da área mudou desde a prévia. Abra a ativação novamente.");}
 };
 validate();return {validate,docs};
}
