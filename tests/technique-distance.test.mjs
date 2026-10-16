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
  const form={elements:{},querySelectorAll:()=>[output],querySelector:s=>s.includes("measureTechnique")?button:activate,addEventListener:()=>{}};
  installTechniquePreview(form,system,{...content(),range:3},null,f.target);assert.match(output.textContent,/coloque um token/);
  // Advisory measurement can refresh even when the actor has no combat reservations.
  installTechniquePreview(form,system,{...content(),range:3},f.actor,f.target);assert.match(output.textContent,/4,5 m/);
  f.target.center.x=100;button.click();assert.match(output.textContent,/1,5 m/);assert.match(output.textContent,/Dentro/);
  f.target.isVisible=false;button.click();assert.match(output.textContent,/manual/);assert.equal(activate.disabled,false);assert.deepEqual(system,before);
 }finally{globalThis.canvas=oldCanvas;}
});
