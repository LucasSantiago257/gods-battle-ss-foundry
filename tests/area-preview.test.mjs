import test from "node:test";
import assert from "node:assert/strict";
import {knight,content} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {rangeScene} from "./distance-stub.mjs";
import {areaTargetSelection} from "../module/area-targets.mjs";
import {areaMeasurements,refreshAreaSelection,sameAreaSelection} from "../module/area-preview.mjs";
import {installTechniquePreview,activationFormOptions} from "../module/technique-ui.mjs";
function fixture(){
 const s=knight();s.skills.asterism.value=3;s.resources.cosmo.value=20;
 const actor={uuid:"Actor.hero",name:"Hero",type:"knight",system:prepareKnight(s),flags:{}},a={uuid:"Actor.a",name:"A",type:"knight"},b={uuid:"Actor.b",name:"B",type:"knight"},f=rangeScene(actor,a);f.target.x=200;
 const second={...f.target,id:"second",uuid:"Scene.range.Token.second",actor:b,x:400};f.scene.tokens.set(second.id,second);
 const placeable=document=>({document,actor:document.actor,isVisible:true,get center(){return document.getCenterPoint();}}),source=placeable(f.source),first=placeable(f.target),last=placeable(second);
 const canvas={ready:true,scene:f.scene,grid:f.scene.grid,tokens:{placeables:[source,first,last],controlled:[source]}},selection=areaTargetSelection([first,last]);
 return {...f,actor,second,source,first,last,canvas,selection};
}
test("mede cada alvo original e compara alcance sem mudar custo, dano ou seleção",()=>{
 const f=fixture(),before=structuredClone(f.selection),actorBefore=structuredClone(f.actor.system),rows=areaMeasurements(f.actor,f.selection,3,f.canvas);
 assert.equal(rows[0].distanceText,"3 m");assert.match(rows[0].statusText,/Dentro/);assert.equal(rows[1].distanceText,"6 m");assert.match(rows[1].statusText,/Excede em 3 m/);assert.ok(rows.every(r=>!r.changed));assert.deepEqual(f.selection,before);assert.deepEqual(f.actor.system,actorBefore);
});
test("atualiza posições dos mesmos tokens sem trocar alvos por seleção nova",()=>{
 const f=fixture();f.target.x=300;assert.equal(areaMeasurements(f.actor,f.selection,3,f.canvas)[0].changed,true);
 const updated=refreshAreaSelection(f.selection,f.canvas);assert.equal(updated[0].position.x,300);assert.equal(f.selection[0].position.x,200);assert.equal(sameAreaSelection(f.selection,updated),true);assert.equal(areaMeasurements(f.actor,updated,3,f.canvas)[0].changed,false);
 const swapped=structuredClone(updated);swapped[0].actorUuid="Actor.other";assert.equal(sameAreaSelection(f.selection,swapped),false);assert.equal(sameAreaSelection(f.selection,[...updated].reverse()),false);
});
test("origem ambígua, unidade ou elevação diferente mantém medição manual",()=>{
 for(const change of [f=>f.scene.grid.units="ft",f=>f.source.document.elevation=1,f=>{f.canvas.tokens.placeables.push({...f.source,document:{...f.source.document,uuid:"Scene.range.Token.copy"}});f.canvas.tokens.controlled=[];}]){
  const f=fixture();change(f);const rows=areaMeasurements(f.actor,f.selection,3,f.canvas);assert.ok(rows.every(r=>r.distanceText==="—"));assert.ok(rows.every(r=>!r.changed));
 }
 const f=fixture();assert.match(areaMeasurements(f.actor,f.selection,0,f.canvas)[0].statusText,/alcance positivo/);
});
test("alvo oculto/removido ou ficha trocada não é substituído silenciosamente",()=>{
 const f=fixture();f.last.isVisible=false;f.second.actor.name="Nome oculto novo";
 const row=areaMeasurements(f.actor,f.selection,3,f.canvas)[1];assert.equal(row.distanceText,"—");assert.equal(row.name,"B");assert.equal(row.changed,true);assert.throws(()=>refreshAreaSelection(f.selection,f.canvas),/visíveis/);
 f.canvas.tokens.placeables=f.canvas.tokens.placeables.filter(t=>t!==f.last);assert.throws(()=>refreshAreaSelection(f.selection,f.canvas),/indisponível/);
});
test("sem cena pronta, a prévia continua manual e não altera snapshots",()=>{
 const f=fixture();f.canvas.ready=false;const next=refreshAreaSelection(f.selection,f.canvas);assert.deepEqual(next,f.selection);assert.notEqual(next,f.selection);assert.ok(areaMeasurements(f.actor,f.selection,3,f.canvas).every(r=>!r.changed&&r.distanceText==="—"));
});
test("API de medição falha sem fabricar distâncias ou bloquear grupo válido",()=>{
 const f=fixture();f.canvas.grid.measurePath=()=>{throw Error("grid unavailable");};const rows=areaMeasurements(f.actor,f.selection,3,f.canvas);assert.ok(rows.every(r=>r.distanceText==="—"&&!r.changed));assert.equal(sameAreaSelection(f.selection,refreshAreaSelection(f.selection,f.canvas)),true);
});
test("botão atualiza snapshot, desbloqueia ativação e conserva valores de área",()=>{
 const f=fixture(),old=globalThis.canvas;globalThis.canvas=f.canvas;
 try{
  const values=Object.fromEntries(["cost","difficulty","damage","error"].map(key=>[key,{dataset:{techniquePreview:key}}])),rows=f.selection.flatMap(entry=>["name","distanceText","statusText"].map(field=>({dataset:{areaField:field,areaToken:entry.tokenUuid}}))),refresh={addEventListener(_event,fn){this.click=fn;}},activate={},events={};
  const form={elements:{},querySelectorAll:selector=>selector.includes("data-area-field")?rows:Object.values(values),querySelector:selector=>selector.includes("refreshArea")?refresh:selector.includes("activate")?activate:null,addEventListener:(event,fn)=>events[event]=fn};
  installTechniquePreview(form,f.actor.system,content(),f.actor,null,f.selection);assert.equal(values.cost.textContent,"4 CE");assert.equal(values.damage.textContent,"10.5");
  f.target.x=300;events.input();assert.equal(activate.disabled,true);assert.match(values.error.textContent,/Atualizar prévia/);
  refresh.click();assert.equal(activate.disabled,false);assert.equal(form.areaTargets[0].position.x,300);assert.equal(activationFormOptions(form).areaTargets[0].position.x,300);assert.equal(values.damage.textContent,"10.5");assert.equal(values.difficulty.textContent,"16");
  f.last.isVisible=false;refresh.click();assert.equal(activate.disabled,true);assert.equal(rows.find(r=>r.dataset.areaToken===f.second.uuid&&r.dataset.areaField==="distanceText").textContent,"—");
 }finally{globalThis.canvas=old;}
});
