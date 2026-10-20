import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {knight,content} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {componentState,componentProfile,techniqueWithComponents,componentOptions,COMPONENT_RULES,attackResistanceComponent} from "../module/technique-components.mjs";
import {techniqueParameters,activationPreview} from "../module/technique-rules.mjs";
import {techniqueSetupUpdates} from "../module/technique-setup.mjs";
const ID="gods-battle-ss";
const entries=Object.entries(COMPONENT_RULES).filter(([,rule])=>(rule.introduced??1)<=3).map(([id,rule])=>({uuid:`Compendium.${ID}.componentes-tecnicas.Item.${id}`,key:rule.key,type:["space","stars","destruction"].includes(rule.kind)?"increment":"bigbang",rank:rule.kind==="space"?3:1,name:rule.label,page:rule.page,detail:rule.kind==="terrain"?"Campo de gelo":""}));
function fixture(){const system=knight();system.resources.cosmo.value=20;prepareKnight(system);const item={type:"technique",name:"Técnica de exercício",system:{...content(),cost:5,costExtra:1},flags:{[ID]:{componentAutomation:true,componentRuleVersion:3,techniqueConstructionId:"saved",techniqueConstructionHistory:{saved:{primary:{label:"Dano",uuid:"Compendium.gods-battle-ss.componentes-tecnicas.Item.13841831d802c5be"},components:structuredClone(entries)}}}}};return {system,item};}
test("regras têm ID/chave/graduação conferidos contra catálogo; nomes não concedem efeitos",async()=>{const docs=[...JSON.parse(await readFile("data/catalog/bigbangs.json","utf8")),...JSON.parse(await readFile("data/catalog/increments.json","utf8"))];for(const[id,rule]of Object.entries(COMPONENT_RULES)){const doc=docs.find(d=>d._id===id);assert.ok(doc);assert.equal(doc.flags[ID].source.key,rule.key);}const {item}=fixture();item.flags[ID].techniqueConstructionHistory.saved.components[0].uuid="Compendium.other.componentes-tecnicas.Item.69e4c648b940a68e";assert.throws(()=>componentProfile(item),/Referência/);});
test("adesão é opcional e nenhuma descrição textual antiga é interpretada",()=>{const {system,item}=fixture();item.flags={};item.system.bigbangs="Esgotar; Terreno Favorável";const t=techniqueWithComponents(item);assert.equal(componentState(item).enabled,false);assert.equal(techniqueParameters(system,t).cost,6);assert.throws(()=>techniqueParameters(system,t,{exhaust:1}),/não possui/);assert.equal(item.system.cost,5);});
test("Esgotar cobra dois CE por ND; essência/terreno somam ND; espaço soma alcance sem repetir CE fixa",()=>{const {system,item}=fixture(),t=techniqueWithComponents(item),p=activationPreview(system,t,{exhaust:2,oppositeEssence:true,favorableTerrain:true,componentReason:"Alvo/terreno conferidos"});assert.equal(p.parameters.cost,10);assert.equal(p.parameters.difficulty,20);assert.equal(p.normal.damageLevel,6);assert.equal(p.normal.damage,61);assert.equal(p.critical.damage,71);assert.equal(p.parameters.components.range,7.5);assert.equal(p.payment.fromCurrent,10);assert.equal(item.system.range,3);assert.equal(item.system.damageLevel,2);});
test("opções desligadas não aplicam bônus contextuais; graduações de Espaço mantêm1,5/3/4,5",()=>{const {system,item}=fixture();for(const rank of [1,2,3]){item.flags[ID].techniqueConstructionHistory.saved.components.at(-1).rank=rank;const p=activationPreview(system,techniqueWithComponents(item));assert.equal(p.parameters.cost,6);assert.equal(p.normal.damageLevel,2);assert.equal(p.parameters.components.rangeBonus,rank*1.5);}});
test("tipo, graduação, repetição, mistura primordial e terreno sem parâmetro são recusados",()=>{for(const kind of ["type","rank","duplicate","mixed","terrain"]){const {item}=fixture(),list=item.flags[ID].techniqueConstructionHistory.saved.components;if(kind==="type")list[0].type="increment";if(kind==="rank")list.at(-1).rank=4;if(kind==="duplicate")list.push({...list[0]});if(kind==="mixed")list.push({key:"bigbang:primordial:Controle"});if(kind==="terrain")list[2].detail="";assert.throws(()=>componentProfile(item),undefined,kind);}});
test("opções inválidas ou sem componente são rejeitadas; notas são opcionais",()=>{const {item}=fixture(),t=techniqueWithComponents(item);for(const options of [{exhaust:-1},{exhaust:1.5},{oppositeEssence:"true"},{componentReason:42},{componentReason:"x".repeat(1001)}])assert.throws(()=>componentOptions(t,options));assert.throws(()=>componentOptions({...t,componentProfile:{enabled:true,rules:[]}}, {exhaust:1}),/não possui/);});
test("outros componentes permanecem listados como manuais sem ganho inventado",()=>{const {system,item}=fixture();item.flags[ID].techniqueConstructionHistory.saved.components.push({uuid:`Compendium.${ID}.componentes-tecnicas.Item.e63322f3195be739`,key:"bigbang:extra:Brasas",name:"Brasas",page:"225"});const p=activationPreview(system,techniqueWithComponents(item));assert.equal(p.normal.damage,21);assert.deepEqual(p.parameters.components.manual,[{name:"Brasas",page:"225"}]);});
test("configuração habilita somente composição válida e conserva ND/alcance base",()=>{const {system,item}=fixture(),answer={...item.system,reviewed:true,componentAutomation:true};const updates=techniqueSetupUpdates({system},item,answer);assert.equal(updates[`flags.${ID}.componentAutomation`],true);assert.equal(updates["system.range"],3);assert.equal(updates["system.damageLevel"],2);assert.throws(()=>techniqueSetupUpdates({system},item,{...answer,effectKind:"control"}),/primordial Dano/);item.flags={};assert.throws(()=>techniqueSetupUpdates({system},item,answer),/composição salva/);assert.equal(techniqueSetupUpdates({system},item,{...answer,componentAutomation:false})[`flags.${ID}.componentAutomation`],false);});
test("modo por status usa ND do usuário antes de extras e mantém parâmetros manuais",()=>{const {system,item}=fixture();system.profile.status="gold";item.system.techniqueMode="status";item.system.damageLevel=99;const p=activationPreview(system,techniqueWithComponents(item),{exhaust:2});assert.equal(p.normal.damageLevel,6);assert.equal(p.normal.damage,121);assert.equal(item.system.damageLevel,99);});
test("Essência e Terreno aplicam bônus escolhidos com notas vazias",()=>{
 const {system,item}=fixture();const p=activationPreview(system,techniqueWithComponents(item),{oppositeEssence:true,favorableTerrain:true});assert.equal(p.normal.damageLevel,4);assert.equal(p.parameters.cost,6);assert.equal(p.parameters.difficulty,16);assert.equal(p.payment.fromCurrent,6);
});


test("Controle sobre as Estrelas acrescenta somente 1/2/3 PC sem repetir custo ou dano",()=>{
 for(const rank of [1,2,3]){const {system,item}=fixture();const entry=item.flags[ID].techniqueConstructionHistory.saved.components.find(c=>c.key==='increment:Controle sobre as Estrelas');entry.rank=rank;
 const before=structuredClone(item.system),p=activationPreview(system,techniqueWithComponents(item));
 assert.equal(p.parameters.powerCosmic,system.combat.cosmicPower+rank);assert.equal(p.parameters.components.powerCosmicBonus,rank);assert.equal(p.normal.damage,21);assert.equal(p.parameters.cost,6);assert.equal(p.parameters.difficulty,16);assert.equal(p.normal.armorDamage,10);assert.deepEqual(item.system,before);
 }
});

test("copias antigas preservam PC ate configurar novo grupo e desligar reverte sem editar base",()=>{
 const {system,item}=fixture();delete item.flags[ID].componentRuleVersion;
 const legacy=activationPreview(system,techniqueWithComponents(item));assert.equal(legacy.parameters.powerCosmic,system.combat.cosmicPower);assert.ok(legacy.parameters.components.manual.some(c=>c.name==='Controle sobre as Estrelas'));
 const updates=techniqueSetupUpdates({system},item,{...item.system,componentAutomation:true});assert.equal(updates[`flags.${ID}.componentRuleVersion`],4);
 item.flags[ID].componentRuleVersion=2;assert.equal(activationPreview(system,techniqueWithComponents(item)).parameters.powerCosmic,system.combat.cosmicPower+1);
 item.flags[ID].componentAutomation=false;assert.equal(activationPreview(system,techniqueWithComponents(item)).parameters.powerCosmic,system.combat.cosmicPower);
});

test("Estrelas recusa graduacao, tipo, chave, duplicata e versao invalidos",()=>{
 for(const invalid of ['rank','type','key','duplicate','version']){const {item}=fixture(),state=item.flags[ID],list=state.techniqueConstructionHistory.saved.components,entry=list.find(c=>c.key==='increment:Controle sobre as Estrelas');
 if(invalid==='rank')entry.rank=4;if(invalid==='type')entry.type='bigbang';if(invalid==='key')entry.key='outro';if(invalid==='duplicate')list.push({...entry});if(invalid==='version')state.componentRuleVersion=99;
 assert.throws(()=>componentProfile(item),undefined,invalid);}
});


test("Destruição aplica somente penalidade de resistencia por graduacao, com legado preservado",()=>{
 for(const rank of [1,2,3]){const {system,item}=fixture(),state=item.flags[ID],entry=state.techniqueConstructionHistory.saved.components.find(c=>c.key==='increment:Controle sobre s Destruição');entry.rank=rank;
 const p=activationPreview(system,techniqueWithComponents(item));assert.equal(p.parameters.components.resistanceModifier,-rank);assert.equal(p.parameters.components.resistanceComponent.rank,rank);assert.equal(p.parameters.components.resistanceComponent.modifier,-rank);assert.equal(p.parameters.cost,6);assert.equal(p.normal.damage,21);assert.equal(p.parameters.powerCosmic,system.combat.cosmicPower+1);
 state.componentRuleVersion=2;const old=activationPreview(system,techniqueWithComponents(item));assert.equal(old.parameters.components.resistanceModifier,0);assert.equal(old.parameters.components.resistanceComponent,null);assert.ok(old.parameters.components.manual.some(c=>c.name==='Controle sobre a Destruição'));assert.equal(old.parameters.powerCosmic,p.parameters.powerCosmic);
 }
});

const weakenEntry=()=>({uuid:`Compendium.${ID}.componentes-tecnicas.Item.83074cf01c6e5681`,key:"bigbang:extra:Enfraquecer",type:"bigbang",rank:1,name:"Enfraquecer",page:"227"});
function withWeaken(){const f=fixture();f.item.flags[ID].componentRuleVersion=4;f.item.flags[ID].techniqueConstructionHistory.saved.components.push(weakenEntry());return f;}
test("Enfraquecer usa graduação efetiva da natureza, não modificador nem associação de Asterismo",()=>{
 for(const [nature,key] of [["physical","for"],["mental","sen"],["natural","vel"],["manipulation","cos"]]){const {system,item}=withWeaken();item.system.nature=nature;system.attributes[key].value=2;system.attributes[key].effective=4;system.attributes[key].mod=99;system.skills.asterism.associated=key==="vig"?"cos":"vig";
 const p=activationPreview(system,techniqueWithComponents(item)),saved=p.parameters.components.resistanceComponent,part=saved.entries.find(e=>e.id==="83074cf01c6e5681");
 assert.equal(part.attribute,key);assert.equal(part.attributeRank,4);assert.equal(part.modifier,-4);assert.equal(saved.modifier,-5);assert.equal(p.parameters.cost,6);assert.equal(p.parameters.difficulty,16);assert.equal(p.normal.damage,21);assert.equal(p.normal.armorDamage,10);
 const validated=attackResistanceComponent({nature,effectKind:"damage",componentResistance:saved});assert.equal(validated.modifier,-5);assert.match(validated.label,/Enfraquecer/);
 }
});
test("grupo antigo conserva Enfraquecer manual até salvar configuração atual",()=>{const {system,item}=withWeaken(),state=item.flags[ID];for(const version of [1,2,3]){state.componentRuleVersion=version;const p=activationPreview(system,techniqueWithComponents(item));assert.ok(p.parameters.components.manual.some(e=>e.name==="Enfraquecer"));assert.notEqual(p.parameters.components.resistanceComponent?.version,2);}assert.equal(techniqueSetupUpdates({system},item,{...item.system,componentAutomation:true})[`flags.${ID}.componentRuleVersion`],4);});
test("Enfraquecer isolado aceita graduação zero e não altera a cópia",()=>{const {system,item}=withWeaken();item.flags[ID].techniqueConstructionHistory.saved.components=[weakenEntry()];system.attributes.for.effective=0;const before=structuredClone(item);const p=activationPreview(system,techniqueWithComponents(item));assert.equal(p.parameters.components.resistanceModifier,0);assert.equal(p.parameters.components.resistanceComponent.entries.length,1);assert.deepEqual(item,before);});
test("graduação inválida de Enfraquecer recusa prévia",()=>{for(const rank of [-1,1.5,13,NaN]){const {system,item}=withWeaken();system.attributes.for.effective=rank;assert.throws(()=>activationPreview(system,techniqueWithComponents(item)),/Enfraquecer/);}});
test("metadados de Enfraquecer recusam soma, natureza, graduação, chave e duplicata adulteradas",()=>{const {system,item}=withWeaken(),saved=activationPreview(system,techniqueWithComponents(item)).parameters.components.resistanceComponent;for(const mutate of [s=>s.modifier=-99,s=>s.entries.at(-1).attribute="vig",s=>s.entries.at(-1).attributeRank=99,s=>s.entries.at(-1).key="outro",s=>s.entries.push({...s.entries.at(-1)}),s=>s.entries.at(-1).modifier=0,s=>s.entries.at(-1).rank=2]){const copy=structuredClone(saved);mutate(copy);assert.throws(()=>attackResistanceComponent({nature:"physical",effectKind:"damage",componentResistance:copy}),/Componente de resistência inválido/);}});


import {hasMovendo,techniqueMovement} from "../module/technique-movement.mjs";
import {componentSupport} from "../module/component-support.mjs";
const moveComponent={uuid:`Compendium.${ID}.componentes-tecnicas.Item.3db91f91d5c36fe8`,key:"bigbang:extra:Movendo",type:"bigbang",rank:1};
test("Movendo exige ID/chave/tipo/graduação e escolha explícita; nome não habilita movimento",async()=>{
 const docs=JSON.parse(await readFile("data/catalog/bigbangs.json","utf8")),doc=docs.find(d=>d._id==="3db91f91d5c36fe8");assert.equal(doc.flags[ID].source.key,moveComponent.key);assert.ok(doc.flags[ID].source.pages.includes(229));
 const {item}=fixture();item.flags[ID].techniqueConstructionHistory.saved.components=[structuredClone(moveComponent)];assert.equal(hasMovendo(item),true);assert.equal(techniqueMovement(item),null);assert.equal(techniqueMovement(item,"partial").mode,"partial");
 for(const change of [c=>c.uuid="Compendium.other.componentes-tecnicas.Item.3db91f91d5c36fe8",c=>c.key="name:Movendo",c=>c.rank=2,c=>c.type="ability"]){const copy=structuredClone(item);change(copy.flags[ID].techniqueConstructionHistory.saved.components[0]);assert.equal(hasMovendo(copy),false);assert.throws(()=>techniqueMovement(copy,"partial"),/composição/);}
 const duplicate=structuredClone(item);duplicate.flags[ID].techniqueConstructionHistory.saved.components.push(moveComponent);assert.equal(hasMovendo(duplicate),false);
 assert.equal(componentSupport(moveComponent,"control").kind,"activation");assert.equal(componentSupport(moveComponent,"damage",true).kind,"manual");assert.equal(componentSupport(moveComponent,"residual").kind,"manual");
});
test("Configurar salva Movendo independente do grupo de dano e rejeita adesão sem componente",()=>{
 const {system,item}=fixture(),actor={system};item.flags[ID].techniqueConstructionHistory.saved.components=[structuredClone(moveComponent)];const answer={classification:"bronze",nature:"physical",effectKind:"damage",techniqueMode:"manual",cost:3,costExtra:0,damageLevel:2,power:10,range:3,componentAutomation:false,movementMode:"total"};
 const documentLike={system:item.system};Object.defineProperty(documentLike,"flags",{get:()=>item.flags});const updates=techniqueSetupUpdates(actor,documentLike,answer);assert.equal(updates[`flags.${ID}.techniqueMovementMode`],"total");assert.equal(updates[`flags.${ID}.componentAutomation`],false);assert.equal(updates["system.cost"],3);
 item.flags[ID].techniqueConstructionHistory.saved.components=[];assert.throws(()=>techniqueSetupUpdates(actor,item,answer),/Movendo/);assert.equal(techniqueSetupUpdates(actor,item,{...answer,movementMode:"standard"})[`flags.${ID}.techniqueMovementMode`],"standard");
});


import {printedMovendo,movementChoices} from "../module/technique-movement.mjs";
test("Movendo nas cinco referências do livro mantém apenas o modo impresso e exige adesão",async()=>{
 const rows=JSON.parse(await readFile("data/catalog/techniques.json","utf8")),matching=rows.filter(d=>printedMovendo(d));assert.equal(matching.length,5);
 for(const item of matching){const mode=printedMovendo(item).mode;assert.match(item.system.description,new RegExp("movimento\\s+"+(mode==="partial"?"parcial":"total")));assert.deepEqual(Object.keys(movementChoices(item)),["standard",mode]);assert.equal(techniqueMovement(item),null);
  const copy=structuredClone(item);copy.system.effectKind="damage";assert.equal(techniqueMovement(copy,mode).mode,mode);assert.throws(()=>techniqueMovement(copy,mode==="partial"?"total":"partial"),/modo.*livro/);
 }
});
test("nomes livres, origem desconhecida e referência Movendo removida/duplicada não habilitam a cópia",async()=>{
 const rows=JSON.parse(await readFile("data/catalog/techniques.json","utf8")),base=rows.find(d=>d._id==="6c8301ddd7284f94");
 for(const change of [d=>d.flags[ID].source.key="other",d=>d.flags[ID].source.references=[],d=>d.flags[ID].source.references.push({uuid:moveComponent.uuid}),d=>d.flags[ID].source.reference.manualOnly=true,d=>d.flags[ID].source.references.push({uuid:`Compendium.${ID}.componentes-tecnicas.Item.953cf77664309d03`})]){const d=structuredClone(base);change(d);assert.equal(printedMovendo(d),null);assert.equal(hasMovendo(d),false);}
 const custom={name:base.name,system:{effectKind:"damage",bigbangs:"Movendo"},flags:{}};assert.equal(hasMovendo(custom),false);assert.deepEqual(Object.keys(movementChoices(custom)),["standard"]);
});
