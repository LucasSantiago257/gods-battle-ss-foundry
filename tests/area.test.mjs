import test from "node:test";
import assert from "node:assert/strict";
import Handlebars from "handlebars";
import {readFile} from "node:fs/promises";
import {knight,content} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {areaRules,areaMember,areaAttackFor} from "../module/area-rules.mjs";
import {areaTargetSelection,validatedAreaContext} from "../module/area-targets.mjs";
import {techniqueParameters,activationPreview} from "../module/technique-rules.mjs";
import {techniqueActionPlan} from "../module/action-rules.mjs";
import {installTechniquePreview,activationFormOptions} from "../module/technique-ui.mjs";
import {rangeScene} from "./distance-stub.mjs";
const system=()=>{const s=knight();s.skills.asterism.value=3;s.resources.cosmo.value=20;return prepareKnight(s);};
const targets=n=>Array.from({length:n},(_,i)=>({actorUuid:`Actor.t${i}`}));
test("exemplo p.210: quatro alvos custam6CE e dificuldade20 sem contar CE extra duas vezes",()=>{
 const s=system(),t={...content(),damageLevel:3},p=activationPreview(s,t,{areaTargets:targets(4)});
 assert.equal(p.parameters.cost,6);assert.equal(p.parameters.difficulty,20);assert.equal(p.normal.damageTotal,31);assert.equal(p.normal.damage,7.75);assert.equal(p.critical.damage,10.25);assert.equal(p.normal.armorDamage,10);assert.equal(p.critical.armorDamage,10);
 assert.equal(p.parameters.powerCosmic,s.combat.cosmicPower);assert.equal(s.resources.cosmo.value,20);
 const extra=techniqueParameters(s,t,{areaTargets:targets(4),elevate:1,condense:1});assert.equal(extra.cost,8);assert.equal(extra.difficulty,22);
});
test("área exige Asterismo3, Dano e alvos distintos dentro do limite técnico",()=>{
 const s=system(),t=content();s.skills.asterism.value=2;assert.throws(()=>areaRules(s,t,{areaTargets:targets(2)}),/Asterismo3/);s.skills.asterism.value=3;
 for(const effectKind of ["control","sustained","residual","manual"])assert.throws(()=>areaRules(s,{...t,effectKind},{areaTargets:targets(2)}),/primordial Dano/);
 for(const n of [0,1,21])assert.throws(()=>areaRules(s,t,{areaTargets:targets(n)}));
 assert.throws(()=>areaRules(s,t,{areaTargets:[...targets(2),...targets(2)]}),/mesma ficha/);
 assert.throws(()=>areaRules(s,t,{areaTargets:targets(2),distanceSnapshot:{version:1,distance:3}}),/Distância/);
 assert.throws(()=>areaRules(s,t,{areaTargets:targets(2),oppositeEssence:true}),/Essência/);
 assert.equal(areaRules(s,t,{}),null);
});
test("área consome ataque e defesa intactos uma vez e preserva movimento/reação",()=>{
 const actor={uuid:"Actor.hero",system:system(),flags:{}},old=game.combats;
 const combat={uuid:"Combat.area",round:1,started:true,flags:{"gods-battle-ss":{actionControl:{enabled:true,epoch:"x"}}},combatants:{contents:[{id:"hero",actor}]}};game.combats={contents:[combat]};
 try{const p=techniqueActionPlan(actor,{areaTargets:targets(2)},"area");assert.equal(p.after.spent.attack,actor.system.combat.attack);assert.equal(p.after.spent.defense,actor.system.combat.defense);assert.equal(p.after.spent.movement,0);assert.equal(p.after.spent.reaction,0);assert.equal(p.cost,actor.system.combat.attack+actor.system.combat.defense);
 actor.flags={"gods-battle-ss":{actionUsage:p.after}};assert.throws(()=>techniqueActionPlan(actor,{areaTargets:targets(2)},"next"),/intactas/);
 }finally{game.combats=old;}
});
test("seleção e contexto congelam tokens, posições e fichas sem usar nomes da solicitação",async()=>{
 const a={uuid:"Actor.a",type:"knight",name:"A"},b={uuid:"Actor.b",type:"knight",name:"B"},f=rangeScene(a,b),oldScenes=game.scenes,oldFrom=globalThis.fromUuid;
 const list=[f.source,f.target].map(document=>({document,actor:document.actor,isVisible:true})),selected=areaTargetSelection(list);game.scenes=new Map([[f.scene.id,f.scene]]);globalThis.fromUuid=async uuid=>[f.source,f.target].find(d=>d.uuid===uuid);
 try{const context=await validatedAreaContext(selected,{isGM:false});context.validate();assert.equal(context.docs[1].actor.name,"B");f.target.x++;assert.throws(context.validate,/mudou/);f.target.x--;f.target.hidden=true;assert.throws(context.validate,/mudou/);assert.throws(()=>areaTargetSelection([list[0],list[0]]),/mesma ficha/);}finally{game.scenes=oldScenes;globalThis.fromUuid=oldFrom;}
});
test("cada botão recebe parcela e snapshot do próprio alvo; externo é recusado",()=>{
 const attack={effectKind:"damage",damage:10.5,armorDamage:10,area:{count:2},areaTargets:targets(2).map((t,i)=>({...t,tokenUuid:`Scene.a.Token.t${i}`,name:`Alvo${i}`,turnSnapshot:{round:i+1}}))};
 assert.equal(areaAttackFor(attack,"Actor.t1").targetUuid,"Actor.t1");assert.equal(areaAttackFor(attack,"Actor.t1").turnSnapshot.round,2);assert.equal(areaAttackFor(attack,"Actor.t1").damage,10.5);assert.throws(()=>areaMember(attack,"Actor.other"),/não é um alvo/);
 assert.throws(()=>areaMember({...attack,area:{count:3}},"Actor.t0"),/inválida/);assert.equal(areaMember({},"Actor.t0"),null);
});
test("prévia de área desliga distância e envia lista clonada com custo/dano por alvo",()=>{
 const s=system(),actor={uuid:"Actor.hero",system:s,flags:{}},output={dataset:{techniquePreview:"area"}},button={},form={elements:{applyDistance:{checked:true}},querySelectorAll:()=>[output],querySelector:q=>q.includes("activate")?button:null,addEventListener:()=>{}};
 installTechniquePreview(form,s,content(),actor,null,targets(2));assert.equal(form.elements.applyDistance.checked,false);assert.equal(form.elements.applyDistance.disabled,true);assert.match(output.textContent,/2 alvos/);assert.equal(button.disabled,false);
 const options=activationFormOptions(form);options.areaTargets[0].actorUuid="other";assert.equal(form.areaTargets[0].actorUuid,"Actor.t0");
});
test("cartão renderiza dois pares de botões com nomes escapados",async()=>{
 const render=Handlebars.compile(await readFile(new URL("../templates/technique-chat.hbs",import.meta.url),"utf8")),html=render({success:true,isDamage:true,area:{count:2},areaTargets:[{actorUuid:"Actor.a",name:"<script>A</script>"},{actorUuid:"Actor.b",name:"B"}]});
 assert.equal((html.match(/data-area-target=/g)??[]).length,4);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
});
