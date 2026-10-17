import test from "node:test";
import assert from "node:assert/strict";
import {techniqueDistance,techniqueDistanceLabel} from "../module/technique-distance.mjs";
import {installTechniquePreview} from "../module/technique-ui.mjs";
import {knight,content} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
function setup(){
 const scene={uuid:"Scene.one",grid:{units:"m",distance:1.5}},actor={uuid:"Actor.user"},calls=[];
 const token=(id,owner,x)=>({actor:owner,isVisible:true,center:{x,y:0},document:{uuid:`Scene.one.Token.${id}`,parent:scene,elevation:0}});
 const source=token("a",actor,0),target=token("b",{uuid:"Actor.target"},300);
 const canvas={ready:true,scene,grid:{measurePath:points=>{calls.push(points);return {distance:points[1].x/100*1.5,cost:999};}},tokens:{placeables:[source,target],controlled:[]}};
 return {scene,actor,calls,source,target,canvas,token};
}
test("mede com API da grade entre centros, usa distance e não custo",()=>{
 const f=setup(),before=structuredClone([f.source.center,f.target.center]);
 const result=techniqueDistance(f.actor,f.target,f.canvas);assert.equal(result.distance,4.5);assert.equal(result.sourceUuid,f.source.document.uuid);assert.equal(result.targetUuid,f.target.document.uuid);
 assert.deepEqual(f.calls,[[{x:0,y:0},{x:300,y:0}]]);assert.deepEqual([f.source.center,f.target.center],before);
});
test("origem exige instância inequívoca e prefere único token selecionado da ficha",()=>{
 const f=setup(),second=f.token("c",f.actor,100);f.canvas.tokens.placeables.push(second);
 assert.match(techniqueDistance(f.actor,f.target,f.canvas).text,/selecione apenas/);
 f.canvas.tokens.controlled=[f.target,second];assert.equal(techniqueDistance(f.actor,f.target,f.canvas).sourceUuid,second.document.uuid);
 f.canvas.tokens.controlled=[f.source,second];assert.equal(techniqueDistance(f.actor,f.target,f.canvas).available,false);
 second.actor={uuid:"Scene.one.Token.c.Actor.synthetic"};f.canvas.tokens.controlled=[];assert.equal(techniqueDistance(f.actor,f.target,f.canvas).sourceUuid,f.source.document.uuid);
});
test("sem cena/alvo/token visível ou mesma cena a medida fica manual",()=>{
 const f=setup();assert.match(techniqueDistance(f.actor,null,f.canvas).text,/marque um alvo/);assert.equal(techniqueDistance(f.actor,f.target,null).available,false);
 f.target.isVisible=false;assert.equal(techniqueDistance(f.actor,f.target,f.canvas).available,false);f.target.isVisible=true;
 f.target.document.parent={uuid:"Scene.other"};assert.equal(techniqueDistance(f.actor,f.target,f.canvas).available,false);f.target.document.parent=f.scene;
 f.canvas.tokens.placeables=[f.source];assert.equal(techniqueDistance(f.actor,f.target,f.canvas).available,false);
 f.canvas.tokens.placeables=[f.target];assert.match(techniqueDistance(f.actor,f.target,f.canvas).text,/coloque um token/);
});
test("unidades, escala e elevação inválidas não fabricam metros",()=>{
 for(const change of [f=>f.scene.grid.units="ft",f=>f.scene.grid.distance=0,f=>f.target.document.elevation=3,f=>f.source.document.elevation=undefined,f=>f.target.center.x=NaN]){
  const f=setup();change(f);assert.equal(techniqueDistance(f.actor,f.target,f.canvas).available,false);assert.equal(f.calls.length,0);
 }
 const f=setup();f.scene.grid.units=" METROS ";assert.equal(techniqueDistance(f.actor,f.target,f.canvas).available,true);
});
test("falha e retorno inválido da API preservam medição manual",()=>{
 for(const value of [NaN,Infinity,-1,undefined]){const f=setup();f.canvas.grid.measurePath=()=>({distance:value});assert.equal(techniqueDistance(f.actor,f.target,f.canvas).available,false);}
 const f=setup();f.canvas.grid.measurePath=()=>{throw Error("scene gone");};assert.equal(techniqueDistance(f.actor,f.target,f.canvas).available,false);
});
test("comparação informa excesso sem aplicar penalidade e exige alcance positivo",()=>{
 const measured={available:true,distance:4.5};assert.match(techniqueDistanceLabel(measured,3),/Excede em 1,5 m/);assert.match(techniqueDistanceLabel(measured,4.5),/Dentro/);assert.match(techniqueDistanceLabel(measured,6),/Dentro/);
 for(const range of [0,-1,NaN,undefined])assert.match(techniqueDistanceLabel(measured,range),/Configure o alcance/);
 assert.equal(techniqueDistanceLabel({available:false,text:"Manual"},3),"Manual");
});
test("botão atualiza distância do alvo original sem mudar recursos ou parâmetros",()=>{
 const f=setup(),system=prepareKnight(knight());system.resources.cosmo.value=10;const before=structuredClone(system),oldCanvas=globalThis.canvas;globalThis.canvas=f.canvas;
 try{
  f.actor.system=system;f.actor.flags={};
  const output={dataset:{techniquePreview:"distance"}},button={addEventListener:(event,callback)=>button.click=callback},activate={};
  const form={elements:{},querySelectorAll:()=>[output],querySelector:s=>s.includes("measureTechnique")?button:s.includes("activate")?activate:null,addEventListener:()=>{}};
  installTechniquePreview(form,system,{...content(),range:3},null,f.target);assert.match(output.textContent,/coloque um token/);
  // Advisory measurement can refresh even when the actor has no combat reservations.
  installTechniquePreview(form,system,{...content(),range:3},f.actor,f.target);assert.match(output.textContent,/4,5 m/);
  f.target.center.x=100;button.click();assert.match(output.textContent,/1,5 m/);assert.match(output.textContent,/Dentro/);
  f.target.isVisible=false;button.click();assert.match(output.textContent,/manual/);assert.equal(activate.disabled,false);assert.deepEqual(system,before);
 }finally{globalThis.canvas=oldCanvas;}
});

import {distanceSnapshot,validatedDistanceContext,previewDistanceSnapshot} from "../module/technique-distance.mjs";
import {distanceReduction} from "../module/distance-rules.mjs";
import {activationPreview,techniqueParameters} from "../module/technique-rules.mjs";
import {rangeScene} from "./distance-stub.mjs";
test("redução por faixas iniciadas de1,5m, tolerância só numérica",()=>{
 for(const [distance,levels] of [[0,0],[3,0],[3.000001,1],[4.5,1],[4.500001,2],[6,2],[6+1e-10,2]])assert.equal(distanceReduction({effectKind:"damage"},{range:3},{distanceSnapshot:{version:1,distance}}).levels,levels);
 for(const distance of [-1,NaN,Infinity,1e10])assert.throws(()=>distanceReduction({effectKind:"damage"},{range:3},{distanceSnapshot:{version:1,distance}}));
 assert.equal(distanceReduction({effectKind:"damage"},{range:0}),null);
 assert.throws(()=>distanceReduction({effectKind:"residual"},{range:3},{distanceSnapshot:{version:1,distance:6}}),/exige primordial/);
 assert.throws(()=>distanceReduction({effectKind:"damage"},{range:0},{distanceSnapshot:{version:1,distance:6}}),/alcance positivo/);
});
test("ND reduzido entra uma vez no dano normal/crítico sem alterar Asterismo/CE/PC",()=>{
 const system=prepareKnight(knight());system.resources.cosmo.value=20;
 const technique={...content(),range:3,damageLevel:5},plain=activationPreview(system,technique),reduced=activationPreview(system,technique,{distanceSnapshot:{version:1,distance:6}});
 assert.equal(reduced.normal.damageLevel,3);assert.equal(reduced.critical.damageLevel,4);assert.equal(reduced.normal.damage,31);assert.equal(reduced.critical.damage,41);
 for(const key of ["cost","difficulty","modifier","powerCosmic"])assert.equal(reduced.parameters[key],plain.parameters[key]);assert.deepEqual(reduced.payment,plain.payment);
 assert.throws(()=>techniqueParameters(system,{...technique,damageLevel:2},{distanceSnapshot:{version:1,distance:6}}),/abaixo de1/);
});
test("alcance de Espaço e elevação de ND compensam distância sem gravar a cópia",()=>{
 const system=prepareKnight(knight()),t={...content(),range:3,damageLevel:3,componentProfile:{enabled:true,rules:[{kind:"space",rank:2}],manual:[]}},before=structuredClone(t);
 const p=techniqueParameters(system,t,{distanceSnapshot:{version:1,distance:7.5},elevate:1});assert.equal(p.distance.range,6);assert.equal(p.distance.levels,1);assert.deepEqual(t,before);
});
test("snapshot de documentos independe do canvas e valida origem, alvo e cena",async()=>{
 const actor={uuid:"Actor.a"},other={uuid:"Actor.b"},f=rangeScene(actor,other),snap=distanceSnapshot(f.source,f.target),oldFrom=globalThis.fromUuid,oldScenes=game.scenes;
 globalThis.fromUuid=async uuid=>[f.source,f.target].find(t=>t.uuid===uuid);game.scenes=new Map([[f.scene.id,f.scene]]);
 try{assert.equal(snap.distance,6);const reordered=Object.fromEntries(Object.entries(snap).reverse());const context=await validatedDistanceContext(reordered,actor,other,{isGM:false});context.validate();f.target.x+=1;assert.throws(context.validate,/mudaram/);f.target.x-=1;f.source.actor=other;assert.throws(context.validate,/Origem/);}finally{globalThis.fromUuid=oldFrom;game.scenes=oldScenes;}
});

import {activationFormOptions} from "../module/technique-ui.mjs";
test("opção de distância altera a prévia e removê-la recupera dano original",()=>{
 const actor={uuid:"Actor.a"},other={uuid:"Actor.b"},f=rangeScene(actor,other),system=prepareKnight(knight());system.resources.cosmo.value=10;actor.system=system;actor.flags={};
 const old=globalThis.canvas,source={actor,isVisible:true,document:f.source,center:f.source.getCenterPoint()},target={actor:other,isVisible:true,document:f.target,center:f.target.getCenterPoint()};
 globalThis.canvas={ready:true,scene:f.scene,grid:f.scene.grid,tokens:{placeables:[source,target],controlled:[source]}};
 try{
  const outputs=Object.fromEntries(["damage","error","distance","distanceReduction"].map(key=>[key,{dataset:{techniquePreview:key}}])),listeners={},button={};
  const form={elements:{applyDistance:{checked:false}},querySelectorAll:()=>Object.values(outputs),querySelector:s=>s.includes("activate")?button:null,addEventListener:(key,fn)=>listeners[key]=fn};
  installTechniquePreview(form,system,{...content(),range:3,damageLevel:5},actor,target);assert.equal(outputs.damage.textContent,"51");assert.equal(activationFormOptions(form).distanceSnapshot,undefined);
  form.elements.applyDistance.checked=true;listeners.input();assert.equal(outputs.damage.textContent,"31");assert.match(outputs.distanceReduction.textContent,/−2 ND/);assert.match(outputs.distance.textContent,/redução calculada/);assert.equal(activationFormOptions(form).distanceSnapshot.distance,6);
  target.center={x:999,y:0};listeners.input();assert.match(outputs.distance.textContent,/6 m entre centros/);assert.equal(outputs.damage.textContent,"31");
  const sent=activationFormOptions(form);sent.distanceSnapshot.distance=0;assert.equal(form.distanceSnapshot.distance,6);
  form.elements.applyDistance.checked=false;listeners.input();assert.equal(outputs.damage.textContent,"51");assert.equal(form.distanceSnapshot,undefined);assert.equal(button.disabled,false);
  form.elements.applyDistance.checked=true;target.isVisible=false;listeners.input();assert.equal(button.disabled,true);assert.match(outputs.error.textContent,/manual/);assert.throws(()=>activationFormOptions(form),/Atualize/);
 }finally{globalThis.canvas=old;}
});

test("redução atravessa escala de armadura antes do crítico sem duplicar",()=>{
 const system=prepareKnight(knight());system.resources.cosmo.value=10;
 const result=activationPreview(system,{...content(),range:3,damageLevel:11,classification:"bronze"},{distanceSnapshot:{version:1,distance:4.5}});
 assert.equal(result.normal.damageLevel,10);assert.equal(result.normal.armorDamage,10);assert.equal(result.critical.damageLevel,11);assert.equal(result.critical.armorDamage,70);
});

test("Controle/Sustentada reduzem apenas PC e preservam Asterismo, custo e duração",()=>{
 const system=prepareKnight(knight());system.resources.cosmo.value=20;
 for(const effectKind of ["control","sustained"]){
  const t={...content(),effectKind,range:3},plain=activationPreview(system,t,{elevate:3}),reduced=activationPreview(system,t,{elevate:3,distanceSnapshot:{version:1,distance:6}});
  assert.equal(reduced.parameters.powerCosmic,plain.parameters.powerCosmic-2);assert.equal(reduced.parameters.distance.powerCosmic,true);assert.equal(reduced.normal.damage,0);assert.equal(reduced.critical.damage,0);assert.deepEqual(reduced.parameters.control,plain.parameters.control);
  for(const key of ["cost","difficulty","modifier"])assert.equal(reduced.parameters[key],plain.parameters[key]);assert.deepEqual(reduced.payment,plain.payment);
 }
});
test("base10 + Modificador de Nível é preservada; bônus negativo não é inventado",()=>{
 const system=prepareKnight(knight()),t={...content(),effectKind:"control",range:3},snapshot={version:1,distance:6};
 const baseline=10+system.combat.levelModifier;
 assert.throws(()=>techniqueParameters(system,t,{distanceSnapshot:snapshot}),/modificador positivo/);
 const exact=techniqueParameters(system,t,{elevate:2,distanceSnapshot:snapshot});assert.equal(exact.powerCosmic,baseline);
 assert.throws(()=>techniqueParameters(system,t,{elevate:1,distanceSnapshot:snapshot}),/modificador positivo/);
 const far={version:1,distance:1e8};assert.throws(()=>techniqueParameters(system,t,{elevate:2,distanceSnapshot:far}),/modificador positivo/);
 system.combat.cosmicPower=baseline-2;assert.equal(techniqueParameters(system,t,{distanceSnapshot:{version:1,distance:3}}).powerCosmic,baseline-2);
});
test("bônus de níveis/ajustes e Elevar integram a parcela positiva sem reduzir ficha",()=>{
 const s=knight();s.profile.level=25;s.combat.powerBonus=-1;const system=prepareKnight(s),before=structuredClone(system),t={...content(),effectKind:"sustained",range:3};
 const base=10+system.combat.levelModifier;assert.equal(system.combat.cosmicPower,base+1);
 assert.equal(techniqueParameters(system,t,{elevate:1,distanceSnapshot:{version:1,distance:6}}).powerCosmic,base);
 assert.throws(()=>techniqueParameters(system,t,{distanceSnapshot:{version:1,distance:6}}),/modificador positivo/);assert.deepEqual(system,before);
});

import {resistancePreview} from "../module/technique-rules.mjs";
import {techniquePreviewLabels} from "../module/technique-ui.mjs";
test("prévia e resistência usam PC reduzido uma vez sem criar dano ou mudar prazo base",()=>{
 const system=prepareKnight(knight());system.resources.cosmo.value=10;
 for(const effectKind of ["control","sustained"]){const t={...content(),effectKind,range:3},options={elevate:3,distanceSnapshot:{version:1,distance:6}},p=techniqueParameters(system,t,options),labels=techniquePreviewLabels(system,t,options);
  assert.match(labels.distanceReduction,/−2 PC já incluído/);assert.equal(labels.powerCosmic,String(system.combat.cosmicPower+1));assert.equal(labels.damage,"0");
  const result=resistancePreview(system,[],{effectKind,powerCosmic:p.powerCosmic,control:p.control},p.powerCosmic);assert.equal(result.effectsResisted,true);assert.equal(result.application,effectKind);assert.equal(result.damage,undefined);if(effectKind==="control")assert.equal(result.control.rounds,0);
 }
});

import Handlebars from "handlebars";
import {readFile} from "node:fs/promises";
test("cartão identifica PC reduzido de Controle e conserva ND dos cartões anteriores",async()=>{
 const render=Handlebars.compile(await readFile(new URL("../templates/technique-chat.hbs",import.meta.url),"utf8"));
 const distance={distance:6,range:3,levels:2};
 assert.match(render({distance:{...distance,powerCosmic:true}}),/−2 PC já incluído/);
 assert.match(render({distance}),/−2 ND já incluído/);
 assert.doesNotMatch(render({}),/Distância/);
});
