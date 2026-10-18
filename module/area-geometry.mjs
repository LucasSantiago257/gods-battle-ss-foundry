// Local visual reference only: never selects targets or changes activation rules.
const metric=new Set(["m","metro","metros","meter","meters","metre","metres"]);
const manual=reason=>({available:false,reason,entries:[]});
const point=p=>p&&[p.x,p.y].every(Number.isFinite);
export function insideArea(x,y,radius,shape,direction=0,angle=90){
 if(![x,y,radius,direction,angle].every(Number.isFinite)||radius<=0||!["circle","cone"].includes(shape)||angle<=0||angle>360)return null;
 const distance=Math.hypot(x,y);
 if(distance>radius+radius*1e-9)return false;
 if(shape==="circle"||angle===360||distance===0)return true;
 const delta=((Math.atan2(y,x)*180/Math.PI-((direction%360)+360)%360)%360+540)%360-180;
 return Math.abs(delta)<=angle/2+1e-9;
}
export function areaGeometry(actor,selection,range,options={},canvas=globalThis.canvas){
 const {shape="none"}=options;
 if(shape==="none")return manual("");
 if(!["circle","cone"].includes(shape))return manual("Escolha círculo ou cone para a referência.");
 const direction=shape==="cone"?Number(String(options.direction??"").trim().replace(",",".")||NaN):0,angle=shape==="cone"?Number(String(options.angle??"").trim().replace(",",".")||NaN):360;
 if(!Number.isFinite(direction)||!Number.isFinite(angle)||angle<=0||angle>360)return manual("Informe direção numérica e abertura maior que 0 e até 360 graus.");
 const scene=canvas?.scene,tokens=canvas?.tokens?.placeables??[];
 if(!canvas?.ready||!scene)return manual("Cena indisponível para desenhar a referência.");
 if(!metric.has(String(scene.grid?.units??"").trim().toLowerCase())||![scene.grid?.size,scene.grid?.distance,range].every(n=>Number.isFinite(n)&&n>0))return manual("Referência exige cena em metros, escala e alcance positivos.");
 const visible=t=>tokens.includes(t)&&t.isVisible===true&&t.document?.parent?.uuid===scene.uuid;
 const matches=t=>visible(t)&&actor?.uuid&&t.actor?.uuid===actor.uuid;
 const controlled=(canvas.tokens?.controlled??[]).filter(matches),sources=controlled.length?controlled:tokens.filter(matches);
 if(sources.length!==1)return manual("Selecione uma única origem visível deste cavaleiro.");
 const source=sources[0],origin=source.center,radius=range*scene.grid.size/scene.grid.distance;
 if(!point(origin)||!Number.isFinite(source.document.elevation)||!Number.isFinite(radius)||radius<=0)return manual("Origem ou escala indisponível.");
 const entries=selection.map((entry,index)=>{
  const token=tokens.find(t=>t.document?.uuid===entry.tokenUuid&&t.actor?.uuid===entry.actorUuid);
  const row={tokenUuid:entry.tokenUuid,index:index+1,inside:null};
  if(!visible(token)||!point(token?.center))return {...row,reason:"Referência indisponível"};
  if(token.document.elevation!==source.document.elevation)return {...row,reason:"Elevação diferente: conferir na mesa"};
  const x=token.center.x-origin.x,y=token.center.y-origin.y;
  if(![x,y].every(Number.isFinite))return {...row,reason:"Posição indisponível"};
  return {...row,x,y,inside:insideArea(x,y,radius,shape,direction,angle)};
 });
 return {available:true,shape,direction:((direction%360)+360)%360,angle,radius,entries,reason:"Referência plana entre centros; paredes, cobertura e acerto conferidos na mesa. Não altera os alvos ou o dano."};
}
export function renderAreaGeometry(container,geometry){
 if(!container)return;
 container.replaceChildren();container.hidden=!geometry.available;
 if(!geometry.available)return;
 const doc=container.ownerDocument,ns="http://www.w3.org/2000/svg";
 const make=(tag,attrs={},text)=>{const e=doc.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))e.setAttribute(key,String(value));if(text!==undefined)e.textContent=text;return e;};
 const entries=geometry.entries.filter(e=>e.inside!==null),extent=Math.max(geometry.radius,...entries.flatMap(e=>[Math.abs(e.x),Math.abs(e.y)])),r=geometry.radius/extent*440;
 const svg=make("svg",{viewBox:"-500 -500 1000 1000",role:"img","aria-label":"Referência de área: U é o usuário; números correspondem à lista de alvos"});
 svg.append(make("title",{},"Referência de área; centros dos alvos numerados conforme a tabela"));
 if(geometry.shape==="circle"||geometry.angle===360)svg.append(make("circle",{cx:0,cy:0,r,class:"area-reference-shape"}));
 else{const a=(geometry.direction-geometry.angle/2)*Math.PI/180,b=(geometry.direction+geometry.angle/2)*Math.PI/180;svg.append(make("path",{d:`M 0 0 L ${r*Math.cos(a)} ${r*Math.sin(a)} A ${r} ${r} 0 ${geometry.angle>180?1:0} 1 ${r*Math.cos(b)} ${r*Math.sin(b)} Z`,class:"area-reference-shape"}));}
 for(const entry of [{x:0,y:0,index:"U",inside:true},...entries]){const g=make("g",{transform:`translate(${entry.x/extent*440} ${entry.y/extent*440})`,class:entry.index==="U"?"area-reference-origin":entry.inside?"area-reference-inside":"area-reference-outside"});g.append(make("circle",{r:32}),make("text",{y:12,"text-anchor":"middle"},String(entry.index)));svg.append(g);}
 container.append(svg);
}
