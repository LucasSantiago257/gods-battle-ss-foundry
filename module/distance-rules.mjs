// p.204: one ND per started 1.5 m beyond configured range.
export function distanceReduction(technique,components,options={}) {
 const snapshot=options.distanceSnapshot;
 if(snapshot===undefined)return null;
 if(technique.effectKind!=="damage")throw Error("Redução automática por distância atende apenas primordial Dano. Controle/Sustentada continuam manuais.");
 if(snapshot?.version!==1||!Number.isFinite(snapshot.distance)||snapshot.distance<0||snapshot.distance>1e9)throw Error("Medida de distância inválida. Atualize a medida.");
 const range=components.range;
 if(!Number.isFinite(range)||range<=0)throw Error("Configure alcance positivo antes de calcular redução por distância.");
 const excess=Math.max(0,snapshot.distance-range);
 // Tolerância numérica de 1e-8 m apenas para ruído de ponto flutuante nas fronteiras.
 const levels=Math.max(0,Math.ceil((excess-1e-8)/1.5));
 return {distance:snapshot.distance,range,excess,levels,page:"204"};
}
