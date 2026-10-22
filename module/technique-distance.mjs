// Scene measurements do not mutate resources or tokens.
const canonical=value=>JSON.stringify(value,(_key,v)=>v&&typeof v==="object"&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
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
export function techniqueDistanceLabel(measurement,range,automated=false) {
 if(!measurement.available)return measurement.text;
 const prefix=`Distância ${number(measurement.distance)} m entre centros`;
 if(!Number.isFinite(range)||range<=0)return `${prefix}. Configure o alcance da técnica para comparar.`;
 const excess=measurement.distance-range;
 return `${prefix} · alcance ${number(range)} m · ${excess>1e-8?`Excede em ${number(excess)} m · ${automated?"redução calculada":"ajuste manual"}`:"Dentro do alcance"}`;
}

export function distanceSnapshot(source,target) {
 const scene=source?.parent,grid=scene?.grid;
 if(!scene||target?.parent!==scene||scene.tokens?.get(source.id)!==source||scene.tokens?.get(target.id)!==target)throw Error("Os tokens da medida não estão mais na mesma cena.");
 if(!metric.has(String(grid?.units??"").trim().toLowerCase())||!Number.isFinite(grid.distance)||grid.distance<=0)throw Error("Medição automática exige cena em metros e escala válida.");
 if(!Number.isFinite(source.elevation)||source.elevation!==target.elevation)throw Error("Elevações diferentes exigem distância manual.");
 const point=doc=>{const p=doc.getCenterPoint();if(![p.x,p.y].every(Number.isFinite))throw Error("Centro de token inválido.");return {x:p.x,y:p.y};};
 const position=doc=>({x:doc.x,y:doc.y,width:doc.width,height:doc.height,elevation:doc.elevation,hidden:doc.hidden===true,actorUuid:doc.actor?.uuid,center:point(doc)});
 const a=position(source),b=position(target);
 if(![a.x,a.y,a.width,a.height,b.x,b.y,b.width,b.height].every(Number.isFinite)||a.width<=0||a.height<=0||b.width<=0||b.height<=0)throw Error("Posição/dimensões dos tokens inválidas.");
 const distance=grid.measurePath([a.center,b.center]).distance;
 if(!Number.isFinite(distance)||distance<0)throw Error("A grade não retornou distância válida.");
 return {version:1,sceneUuid:scene.uuid,sourceUuid:source.uuid,targetUuid:target.uuid,grid:{type:grid.type??null,size:grid.size??null,distance:grid.distance,units:grid.units,diagonals:grid.diagonals??null},source:a,target:b,distance};
}
export function previewDistanceSnapshot(actor,target,canvas=globalThis.canvas) {
 const measured=techniqueDistance(actor,target,canvas);
 if(!measured.available)throw Error(measured.text);
 const source=canvas.tokens.placeables.find(t=>t.document.uuid===measured.sourceUuid);
 return distanceSnapshot(source.document,target.document);
}
export async function validatedDistanceContext(snapshot,actor,target,requester) {
 if(snapshot===undefined)return null;
 const valid=value=>typeof value==="string"&&/^Scene\.[a-zA-Z0-9]+\.Token\.[a-zA-Z0-9]+$/.test(value);
 if(!valid(snapshot?.sourceUuid)||!valid(snapshot?.targetUuid))throw Error("Referência dos tokens de distância inválida.");
 const source=await fromUuid(snapshot.sourceUuid),destination=await fromUuid(snapshot.targetUuid);
 const validate=()=>{
  if(!source||!destination||source.actor?.uuid!==actor.uuid||destination.actor?.uuid!==target?.uuid||!source.testUserPermission(requester,"OWNER")||!source.parent.testUserPermission(requester,"LIMITED")||game.scenes.get(source.parent.id)!==source.parent)throw Error("Origem/alvo da distância ou permissão mudou.");
  if(!requester.isGM&&(source.hidden||destination.hidden))throw Error("Tokens ocultos exigem conferência manual do mestre.");
  const current=distanceSnapshot(source,destination);
  if(canonical(current)!==canonical(snapshot))throw Error("Tokens ou grade mudaram desde a prévia de distância. Atualize a medida e ative novamente.");
 };
 validate();return {validate};
}
