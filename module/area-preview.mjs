import {areaTargetSelection} from "./area-targets.mjs";
import {techniqueDistance} from "./technique-distance.mjs";
import {AREA_LIMIT} from "./area-rules.mjs";
const format=value=>Number(value.toFixed(3)).toLocaleString("pt-BR",{maximumFractionDigits:3});
const tokenFor=(entry,canvas)=>(canvas?.tokens?.placeables??[]).find(t=>t.document?.uuid===entry.tokenUuid&&t.actor?.uuid===entry.actorUuid);
export function sameAreaSelection(a,b){
 return Array.isArray(a)&&Array.isArray(b)&&a.length>=2&&a.length<=AREA_LIMIT&&a.length===b.length&&a.every((entry,i)=>entry?.tokenUuid===b[i]?.tokenUuid&&entry.actorUuid===b[i]?.actorUuid);
}
export function refreshAreaSelection(selection,canvas=globalThis.canvas){
 if(!canvas?.ready)return structuredClone(selection);
 const tokens=selection.map(entry=>tokenFor(entry,canvas));
 if(tokens.some(t=>!t))throw Error("Um alvo original da área está indisponível. Reabra a ativação para mudar os alvos.");
 const current=areaTargetSelection(tokens);
 if(!sameAreaSelection(selection,current))throw Error("A lista original da área mudou. Reabra a ativação.");
 return current;
}
export function areaMeasurements(actor,selection,range,canvas=globalThis.canvas){
 return selection.map(entry=>{
  const token=tokenFor(entry,canvas),ready=canvas?.ready===true;
  const changed=ready&&(!token||token.isVisible!==true||token.document?.parent?.uuid!==canvas.scene?.uuid||["x","y","width","height","elevation"].some(key=>token.document[key]!==entry.position?.[key]));
  const row={tokenUuid:entry.tokenUuid,name:token?.isVisible===true?(token.actor?.name??entry.name??"Alvo"):(entry.name??"Alvo"),changed,distanceText:"—",statusText:"Medição manual: token original indisponível nesta cena."};
  if(!ready)return {...row,statusText:"Medição manual: cena não está pronta."};
  if(!token||token.isVisible!==true)return row;
  const measured=techniqueDistance(actor,token,canvas);
  if(!measured.available)return {...row,statusText:measured.text};
  const distanceText=`${format(measured.distance)} m`;
  if(!Number.isFinite(range)||range<=0)return {...row,distanceText,statusText:"Configure alcance positivo para comparar."};
  const excess=measured.distance-range;
  return {...row,distanceText,statusText:excess>1e-8?`Excede em ${format(excess)} m · ajuste manual`:"Dentro do alcance configurado"};
 });
}
