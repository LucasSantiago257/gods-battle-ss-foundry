// Advisory measurement only: no resource, range penalty, or target mutation.
const metric = new Set(["m", "metro", "metros", "meter", "meters", "metre", "metres"]);
const manual = reason => ({available:false, text:`Distância manual: ${reason}`});
const number = value => Number(value.toFixed(3)).toLocaleString("pt-BR", {maximumFractionDigits:3});
export function techniqueDistance(actor,target,canvas=globalThis.canvas) {
 if(!target)return manual("marque um alvo antes de abrir a ativação.");
 if(!canvas?.ready||!canvas.scene||!canvas.grid?.measurePath)return manual("a cena não está pronta para medição.");
 const tokens=canvas.tokens?.placeables??[],scene=canvas.scene;
 const usable=token=>tokens.includes(token)&&token.isVisible===true&&token.document?.parent?.uuid===scene.uuid;
 if(!usable(target))return manual("o token do alvo original não está visível nesta cena.");
 const matches=token=>usable(token)&&token.actor?.uuid===actor?.uuid;
 const controlled=(canvas.tokens?.controlled??[]).filter(matches);
 const candidates=controlled.length?controlled:tokens.filter(matches);
 if(candidates.length!==1)return manual(candidates.length?"selecione apenas o token que usará a técnica.":"coloque um token visível deste cavaleiro na cena.");
 const source=candidates[0];
 if(!metric.has(String(scene.grid?.units??"").trim().toLowerCase()))return manual("configure a unidade da cena em metros (m).");
 if(!Number.isFinite(scene.grid?.distance)||scene.grid.distance<=0)return manual("a escala da cena é inválida.");
 if(![source.document.elevation,target.document.elevation].every(Number.isFinite)||source.document.elevation!==target.document.elevation)return manual("confira a diferença de elevação entre os tokens.");
 const points=[source.center,target.center];
 if(points.some(p=>!p||![p.x,p.y].every(Number.isFinite)))return manual("a posição dos tokens está indisponível.");
 try {
  const distance=canvas.grid.measurePath(points.map(p=>({x:p.x,y:p.y}))).distance;
  if(!Number.isFinite(distance)||distance<0)return manual("a grade não retornou uma distância válida.");
  return {available:true,distance,sourceUuid:source.document.uuid,targetUuid:target.document.uuid};
 }catch{return manual("não foi possível medir com a grade desta cena.");}
}
export function techniqueDistanceLabel(measurement,range) {
 if(!measurement.available)return measurement.text;
 const prefix=`Medida agora: ${number(measurement.distance)} m entre centros, pela grade da cena`;
 if(!Number.isFinite(range)||range<=0)return `${prefix}. Configure o alcance da técnica para comparar.`;
 const excess=measurement.distance-range;
 return `${prefix}. Alcance configurado: ${number(range)} m. ${excess>1e-8?`Excede em ${number(excess)} m; ajuste de distância ainda manual (p.204).`:"Dentro do alcance configurado."}`;
}
