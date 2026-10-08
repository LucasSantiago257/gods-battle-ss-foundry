import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {knight,content} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {composeTechnique,componentUuid} from "../module/technique-builder-rules.mjs";
import {beginTechniqueBuilder,createPersonalTechnique,techniqueBuilderContext,techniqueConstruction,addTechniqueComponent,removeTechniqueComponent,discardTechniqueBuilder,finishTechniqueBuilder} from "../module/technique-builder.mjs";
import {techniqueParameters,techniqueReadiness} from "../module/technique-rules.mjs";
const ID="gods-battle-ss",catalog=[...JSON.parse(await readFile("data/catalog/bigbangs.json","utf8")),...JSON.parse(await readFile("data/catalog/increments.json","utf8"))];
const lookup=key=>{const doc=catalog.find(d=>d.flags[ID].source.key===key);assert.ok(doc,key);return {...structuredClone(doc),uuid:componentUuid(doc._id)};};
const entries=(...keys)=>keys.map((key,i)=>({slot:`slot${String(i).padStart(12,"0")}`,doc:lookup(key),rank:1}));
const system=()=>{const s=knight();s.profile.level=25;s.profile.status="gold";s.skills.cosmoUse.value=3;s.skills.training.value=3;s.resources.cosmo.value=20;s.skills.asterism.value=3;return prepareKnight(s);};
const draft=changes=>({name:"Fulgor",classification:"gold",nature:"physical",primary:"damage",techniqueMode:"status",power:77,damageLevel:9,range:0,duration:"",description:"Criação da campanha",extraSlots:0,extraCost:0,reviewed:true,incrementReviewed:true,...changes});
test("composições reproduzem os três custos de exemplo da p.223",()=>{
 for(const [tier,primary,keys,cost]of [["silver","control",["bigbang:extra:Inibir Sentidos"],4],["gold","control",["bigbang:primordial:Dano","bigbang:extra:Assumir Querido"],6],["gold","damage",["bigbang:extra:Esgotar","bigbang:extra:Conjunto","bigbang:extra:Finalizador"],7]]){
  const p=composeTechnique(system(),draft({classification:tier,primary}),entries(...keys));assert.equal(p.cost,cost);assert.equal(p.difficulty,10+cost);assert.equal(p.used,keys.length);assert.equal(p.canApply,true);
 }
});
test("Apoiar ocupa slot sem CE; incremento custa por tipo, separado da graduação/slots",()=>{
 const inc=catalog.filter(d=>d.type==="increment").slice(0,2),e=entries("bigbang:extra:Apoiar",...inc.map(d=>d.flags[ID].source.key));e[1].rank=3;
 const p=composeTechnique(system(),draft({extraCost:2}),e);assert.equal(p.used,1);assert.equal(p.cost,4);assert.equal(p.fixed,4);assert.equal(p.totalCost,8);assert.equal(p.components[0].cost,0);assert.equal(p.components[1].rank,3);
 assert.equal(techniqueParameters(system(),{...content(),...p.technique}).cost,8);assert.equal(techniqueParameters(system(),{...content(),...p.technique},{condense:1}).cost,9);
 assert.match(p.manual.join(" "),/Apoiar/);assert.equal(p.components[1].author,"Dhoko de Libra");assert.ok(p.components[1].license);assert.ok(p.components[1].page);
});
test("classe determina slots/custo/alcance; status do usuário determina dano",()=>{
 const s=system(),p=composeTechnique(s,draft({classification:"bronze"}));assert.equal(p.capacity,2);assert.equal(p.cost,2);assert.equal(p.technique.range,3);assert.equal(p.preview.normal.damage,105);assert.equal(p.preview.critical.damage,125);
 const manual=composeTechnique(s,draft({techniqueMode:"manual"}));assert.equal(manual.preview.normal.damage,718);assert.equal(manual.technique.power,77);
 s.profile.status="divine";assert.throws(()=>composeTechnique(s,draft()),/status exige/);
});
test("requisitos, slots, tipos e revisão exigem conferência ou exceção justificada",()=>{
 const s=system();s.profile.level=1;s.skills.training.value=0;
 assert.equal(composeTechnique(s,draft()).canApply,false);
 const e=entries(...catalog.filter(d=>d.flags[ID].source.key.startsWith("bigbang:extra:")).slice(0,3).map(d=>d.flags[ID].source.key));
 const p=composeTechnique(system(),draft({classification:"bronze"}),e);assert.equal(p.canApply,false);assert.match(p.warnings.join(" "),/3\/2/);
 assert.equal(composeTechnique(system(),draft({classification:"bronze",allowExceptions:true,reason:"Técnica secreta aprovada"}),e).canApply,true);
 assert.equal(composeTechnique(system(),draft({reviewed:false,allowExceptions:true,reason:"Exceção"})).canApply,false);
 const inc=entries(...catalog.filter(d=>d.type==="increment").slice(0,4).map(d=>d.flags[ID].source.key));assert.equal(composeTechnique(system(),draft(),inc).canApply,false);
 assert.match(composeTechnique(system(),draft({incrementReviewed:false}),inc).warnings.join(" "),/Mestre/);
 assert.match(composeTechnique(system(),draft(),[],99).warnings.join(" "),/Quantidade/);
});
test("primordiais mistos/Residual são manuais; entradas inválidas não compõem",()=>{
 const e=entries("bigbang:primordial:Controle");assert.equal(composeTechnique(system(),draft(),e).technique.effectKind,"manual");assert.equal(composeTechnique(system(),draft({primary:"residual"})).preview,null);
 for(const change of [{name:""},{classification:"god"},{extraSlots:0.5},{range:-1},{power:-1}])assert.throws(()=>composeTechnique(system(),draft(change)));
 assert.throws(()=>composeTechnique(system(),draft(),[e[0],e[0]]));assert.throws(()=>composeTechnique(system(),draft(),entries("bigbang:primordial:Dano")));
 const inc=entries(catalog.find(d=>d.type==="increment").flags[ID].source.key);inc[0].rank=4;assert.throws(()=>composeTechnique(system(),draft(),inc));
 const unique=entries("increment:Controle Cósmico");unique[0].rank=2;assert.throws(()=>composeTechnique(system(),draft(),unique),/máxima 1/);
 e[0].doc.uuid="Actor.injection";assert.throws(()=>composeTechnique(system(),draft(),e));
});
function runtime(){
 const notices=[],updates=[];globalThis.ui={notifications:{warn:t=>notices.push(t),error:t=>notices.push(t)}};game.user={id:"owner",isGM:false};
 let serial=0;foundry.utils={randomID:()=>`random${String(++serial).padStart(10,"0")}`};foundry.applications.api.DialogV2={confirm:async()=>true,wait:async()=>null};
 const docs=new Map(catalog.map(d=>[componentUuid(d._id),{...structuredClone(d),uuid:componentUuid(d._id),toObject:()=>structuredClone(d),sheet:{render:()=>{}}}]));
 game.packs=new Map([[`${ID}.componentes-tecnicas`,{testUserPermission:()=>true,getIndex:async()=>({contents:catalog}),getDocument:async id=>docs.get(componentUuid(id))}]]);globalThis.fromUuid=async uuid=>docs.get(uuid);
 const actor={type:"knight",isOwner:true,system:system(),items:{contents:[],get:id=>actor.items.contents.find(i=>i.id===id)}};
 const make=(data={})=>{const item={id:`item${++serial}`,name:"Fulgor",type:"technique",isOwner:true,system:{...content(),notes:"Minha nota",originUuid:"origem preservada"},flags:{},parent:actor,sheet:{render:()=>{}},...data};item.update=async patch=>{
  updates.push(structuredClone(patch));for(const [path,value]of Object.entries(patch)){const parts=path.split(".");let at=item;for(const part of parts.slice(0,-1))at=at[part]??= {};const last=parts.at(-1);if(last.startsWith("-="))delete at[last.slice(2)];else at[last]=structuredClone(value);}return item;
 };actor.items.contents.push(item);return item;};
 actor.createEmbeddedDocuments=async(_type,list)=>list.map(data=>make({...data,system:{...content(),...data.system}}));
 const item=make();return{actor,item,make,updates,notices};
}
async function ready(r){await beginTechniqueBuilder(r.item);Object.assign(r.item.flags[ID].techniqueDraft,draft());return r.item.flags[ID].techniqueDraft;}
test("rascunho salva/retoma sem alterar parâmetros e impede ativação",async()=>{
 const r=runtime(),before=structuredClone(r.item.system);await beginTechniqueBuilder(r.item);await beginTechniqueBuilder(r.item);assert.equal(r.updates.length,1);assert.deepEqual(r.item.system,before);assert.match(techniqueReadiness(r.item),/rascunho/);
 const c=await techniqueBuilderContext(r.item);assert.ok(c.fields.some(f=>f.name.endsWith(".primary")));assert.ok(c.preview);assert.equal(c.canApply,false);
});
test("conclusão é uma gravação atômica da cópia; conserva recursos, IDs, notas/origem e histórico",async()=>{
 const r=runtime(),d=await ready(r),before=structuredClone(r.actor.system),id=r.item.id;d.components={component0000001:{uuid:componentUuid("02cba36e32fda2f8"),rank:1,detail:"Escolha narrativa"}};
 await finishTechniqueBuilder(r.item);assert.equal(r.updates.length,2);assert.equal(r.item.id,id);assert.deepEqual(r.actor.system,before);assert.equal(r.item.system.notes,"Minha nota");assert.equal(r.item.system.originUuid,"origem preservada");assert.equal(r.item.flags[ID].techniqueDraft,undefined);assert.equal(r.item.system.cost,4);assert.equal(r.item.system.techniqueMode,"status");assert.equal(techniqueConstruction(r.item).components[0].detail,"Escolha narrativa");assert.ok(r.item.flags[ID].techniqueConstructionHistory[d.id]);
 await beginTechniqueBuilder(r.item);assert.equal(r.item.flags[ID].techniqueDraft.components.component0000001.rank,1);assert.equal(r.item.flags[ID].techniqueDraft.reviewed,false);
 await removeTechniqueComponent(r.item,"component0000001");r.item.flags[ID].techniqueDraft.reviewed=true;await finishTechniqueBuilder(r.item);assert.equal(techniqueConstruction(r.item).components.length,0);assert.equal(Object.keys(techniqueConstruction(r.item).blueprint.components).length,0);assert.equal(r.item.flags[ID].techniqueConstructionHistory[d.id].components.length,1);assert.equal(Object.keys(r.item.flags[ID].techniqueConstructionHistory).length,2);
});
test("cancelamento e mudança na ficha/rascunho durante confirmação não gravam",async()=>{
 for(const change of [null,"draft","actor","item"]){const r=runtime();await ready(r);foundry.applications.api.DialogV2.confirm=async()=>{if(change==="draft")r.item.flags[ID].techniqueDraft.extraCost++;if(change==="actor")r.actor.system.resources.cosmo.value--;if(change==="item")r.item.system.notes="Nova nota";return change!==null;};await finishTechniqueBuilder(r.item);assert.equal(r.updates.length,1);assert.ok(r.item.flags[ID].techniqueDraft);if(change)assert.match(r.notices.at(-1),/mudou/);}
});
test("falha de gravação mantém rascunho e dados; cópia publicada/permissões são respeitadas",async()=>{
 const r=runtime();await ready(r);const before=structuredClone(r.item.system);r.item.update=async()=>{throw Error("Falha de gravação");};await finishTechniqueBuilder(r.item);assert.ok(r.item.flags[ID].techniqueDraft);assert.deepEqual(r.item.system,before);assert.match(r.notices.at(-1),/Falha de gravação/);
 const a=runtime();a.item.flags[ID]={source:{key:"technique:book"}};await beginTechniqueBuilder(a.item);assert.equal(a.updates.length,0);
 a.item.flags={};a.actor.isOwner=false;await createPersonalTechnique(a.actor);await beginTechniqueBuilder(a.item);assert.equal(a.updates.length,0);
});
test("seleção deduplica componentes, remoção invalida revisão, referências exigem permissão",async()=>{
 const r=runtime();await ready(r);foundry.applications.api.DialogV2.wait=async()=>"02cba36e32fda2f8";await addTechniqueComponent(r.item);const d=r.item.flags[ID].techniqueDraft,slot=Object.keys(d.components)[0];assert.equal(d.reviewed,false);await addTechniqueComponent(r.item);assert.equal(Object.keys(d.components).length,1);assert.match(r.notices.at(-1),/já está selecionado/);
 await removeTechniqueComponent(r.item,slot);assert.equal(Object.keys(d.components).length,0);
 game.packs.get(`${ID}.componentes-tecnicas`).testUserPermission=()=>false;assert.match((await techniqueBuilderContext(r.item)).error,/permitir consulta/);
});
test("criação evita duplo clique e retoma rascunho existente; descarte não apaga técnica",async()=>{
 const r=runtime();let resolve;const create=r.actor.createEmbeddedDocuments;r.actor.createEmbeddedDocuments=(...args)=>new Promise(done=>resolve=()=>create(...args).then(done));const first=createPersonalTechnique(r.actor);await createPersonalTechnique(r.actor);resolve();const item=await first;assert.equal(r.actor.items.contents.length,2);await createPersonalTechnique(r.actor);assert.equal(r.actor.items.contents.length,2);
 await discardTechniqueBuilder(item);assert.equal(item.flags[ID].techniqueDraft,undefined);assert.equal(r.actor.items.contents.length,2);
 await ready(r);foundry.applications.api.DialogV2.confirm=async()=>{r.item.flags[ID].techniqueDraft.id="new";return true;};await discardTechniqueBuilder(r.item);assert.ok(r.item.flags[ID].techniqueDraft);assert.match(r.notices.at(-1),/mudou/);
});

