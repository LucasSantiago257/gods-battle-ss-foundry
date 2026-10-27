import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {knight,content} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {ARMOR_REPAIR,armorRepairSource,armorRepairTarget,armorRepairState,armorRepairPlan} from "../module/armor-repair-rules.mjs";
const ID="gods-battle-ss",copy=structuredClone;
const catalog=JSON.parse(await readFile(new URL("../data/catalog/techniques.json",import.meta.url),"utf8"));
function fixture({synthetic=false,sameActor=false}={}){
 const caster={uuid:"Actor.caster",type:"knight",name:"Oficina",system:knight(),flags:{[ID]:{unrelated:"preservar"}},update(){throw Error("pure plan wrote Actor");}};
 caster.system.profile.level=11;Object.assign(caster.system.resources,{cosmoExtra:0,cosmoReserved:0,cosmoOverload:0});caster.system.resources.cosmo.value=10;caster.system.resources.cosmo.unlimited=false;caster.system.resources.health.value=100;
 const target=sameActor?caster:{uuid:synthetic?"Scene.practice.Token.cloth.Actor.target":"Actor.target",type:"knight",system:knight(),flags:{},update(){throw Error("pure plan wrote target");}};
 const raw=copy(catalog.find(x=>x._id===ARMOR_REPAIR.id));assert.ok(raw);
 const item={...raw,id:"repair",uuid:`${caster.uuid}.Item.repair`,parent:caster};
 const armor={id:"armor",uuid:`${target.uuid}.Item.armor`,name:"Guardada",type:"armor",system:{...content(),equipped:false,state:"alive",health:{...content().health,value:19}},parent:target,update(){throw Error("pure plan wrote Item");}};
 caster.items={contents:[item],get:id=>caster.items.contents.find(x=>x.id===id)};
 if(sameActor)caster.items.contents.push(armor);else target.items={contents:[armor],get:id=>target.items.contents.find(x=>x.id===id)};
 prepareKnight(target.system,target.items.contents,"rank",{actorUuid:target.uuid,flags:target.flags});
 return {caster,target,item,armor,plan:o=>armorRepairPlan(item,armor,o)};
}
const snapshot=f=>copy({caster:f.caster.system,target:f.target.system,armor:f.armor.system,item:f.item.system,flags:f.caster.flags});
test("fonte real 307–308 calcula uma hora de11PVA/1CE sem exigir Ativar ou escrever",()=>{
 const f=fixture(),before=snapshot(f),p=f.plan();assert.equal(f.item.system.cost,0);assert.equal(p.hours,1);assert.equal(p.repair,11);assert.equal(p.cost,1);assert.equal(p.before.armor.health,19);assert.equal(p.after.armor.health,30);assert.equal(p.after.payer.current,9);assert.equal(p.after.payer.health,100);assert.equal(p.adjusted,false);assert.deepEqual(snapshot(f),before);assert.equal(armorRepairSource(f.item).key,ARMOR_REPAIR.key);
});
test("máximo derivado limita só a cura, não reduz PV já acima do máximo",()=>{
 const f=fixture();f.armor.system.health.value=27;assert.equal(f.plan().repair,3);assert.equal(f.plan().cost,1);f.armor.system.health.value=30;assert.equal(f.plan().repair,0);f.armor.system.health.value=33;assert.equal(f.plan().after.armor.health,33);
});
test("máximo manual e passiva existente são lidos do Item preparado, sem preencher PV",async()=>{
 const f=fixture(),virtues=JSON.parse(await readFile(new URL("../data/catalog/virtues.json",import.meta.url),"utf8")),power=copy(virtues.find(x=>x.name==="Armadura Poderosa"));assert.ok(power);power.id="power";f.target.items.contents.push(power);f.target.system.automation.enabled=true;
 prepareKnight(f.target.system,f.target.items.contents,"rank",{actorUuid:f.target.uuid,flags:f.target.flags});assert.equal(f.plan().before.armor.maximum,60);f.armor.system.health.manualMax=80;prepareKnight(f.target.system,f.target.items.contents,"rank",{actorUuid:f.target.uuid,flags:f.target.flags});assert.equal(f.plan().before.armor.maximum,80);assert.equal(f.plan().after.armor.health,30);assert.equal(f.armor.system.health.value,19);
});
test("ajuste concreto aceita valor fracionário e custo0 já pago, sem justificativa",()=>{
 const f=fixture(),p=f.plan({repair:.25,cost:0,reason:""});assert.equal(p.after.armor.health,19.25);assert.equal(p.adjusted,true);assert.equal(p.after.payer.current,10);assert.equal(p.reason,"");assert.equal(f.plan({repair:0,cost:0}).repair,0);
});
test("armadura guardada/equipada e na própria ficha conservam o mesmo contrato",()=>{
 for(const sameActor of [false,true]){const f=fixture({sameActor});assert.equal(f.plan().repair,11);f.armor.system.equipped=true;assert.equal(f.plan().repair,11);assert.equal(f.armor.system.state,"alive");}
});
test("CEextra e reserva usam o pagamento existente, sem gastar reserva",()=>{
 const f=fixture();f.caster.system.resources.cosmoExtra=2;f.caster.system.resources.cosmoReserved=9;assert.equal(f.plan().payment.fromExtra,1);assert.equal(f.plan().after.payer.current,10);const p=f.plan({useExtra:false});assert.equal(p.payment.fromCurrent,1);assert.equal(p.after.payer.current,9);assert.equal(p.after.payer.extra,2);assert.equal(p.after.payer.reserved,9);
});
test("excesso corporal continua explícito e não repete nem altera recursos no cálculo",()=>{
 const f=fixture();f.caster.system.resources.cosmo.value=2;f.caster.system.resources.cosmoReserved=2;f.caster.system.resources.cosmoOverload=2;assert.throws(()=>f.plan(),/insuficiente/);const p=f.plan({allowOverload:true});assert.equal(p.payment.overload,1);assert.equal(p.payment.lifeDamage,33);assert.equal(p.after.payer.health,67);assert.equal(p.after.payer.overload,3);assert.equal(f.caster.system.resources.health.value,100);
});
test("CEilimitada não reduz recursos, mas mantém o custo nominal da hora",()=>{
 const f=fixture();f.caster.system.resources.cosmo.unlimited=true;const p=f.plan();assert.equal(p.payment.unlimited,true);assert.equal(p.cost,1);assert.deepEqual(p.before.payer,p.after.payer);
});
test("fonte homônima, perfil trocado, rascunho e cópia removida não habilitam reparo",()=>{
 for(const change of [f=>delete f.item.flags[ID].source,f=>f.item.flags[ID].source.key="other",f=>f.item.system.nature="physical",f=>f.item.system.effectKind="damage",f=>f.item.flags[ID].techniqueDraft={},f=>f.caster.items.contents=[]]){const f=fixture();change(f);assert.throws(()=>f.plan());}
 const f=fixture();f.item.name="Nome pessoal";assert.equal(f.plan().source.name,"Nome pessoal");
});
test("morte/negativo/máximo inválido não revivem; zero preserva estado",()=>{
 for(const change of [f=>f.armor.system.state="dead",f=>f.armor.system.health.value=-.5,f=>f.armor.system.health.value=NaN,f=>f.armor.system.health.max=0,f=>f.armor.system.health.max=Infinity]){const f=fixture();change(f);const before=snapshot(f);assert.throws(()=>f.plan());assert.deepEqual(snapshot(f),before);}
 const f=fixture();f.armor.system.health.value=0;assert.equal(f.plan().after.armor.health,11);f.armor.system.state="recovering";assert.equal(f.plan().after.armor.state,"recovering");assert.equal(f.armor.system.health.value,0);
});
test("vínculo sintético é próprio; Item removido, substituído ou de outra ficha recusa",()=>{
 const a=fixture(),s=fixture({synthetic:true});assert.notEqual(a.plan().before.armor.actorUuid,s.plan().before.armor.actorUuid);assert.notEqual(a.plan().baseline,s.plan().baseline);
 for(const change of [f=>f.target.items.contents=[],f=>f.target.items.contents=[{...f.armor}],f=>f.armor.parent=f.caster,f=>f.armor.uuid="",f=>f.armor.uuid="Actor.other.Item.armor"]){const f=fixture();change(f);assert.throws(()=>f.plan());}
});
test("assinatura muda com recursos, nível, máximo e identidade, não com notas/nomes",()=>{
 const f=fixture(),initial=armorRepairState(f.item,f.armor);f.item.name="Título";f.armor.name="Outra legenda";f.armor.system.notes="Nota opcional";assert.equal(armorRepairState(f.item,f.armor),initial);
 for(const change of [f=>f.caster.system.profile.level++,f=>f.caster.system.resources.cosmo.value--,f=>f.caster.system.resources.cosmoReserved++,f=>f.armor.system.health.max++,f=>f.armor.system.health.value++,f=>{f.armor.id="replacement";f.armor.uuid=`${f.target.uuid}.Item.replacement`;}]){const f=fixture(),before=armorRepairState(f.item,f.armor);change(f);assert.notEqual(armorRepairState(f.item,f.armor),before);}
});
test("valores inválidos ou comandos transportados não viram gravações",()=>{
 for(const options of [{repair:-1},{repair:NaN},{repair:Infinity},{cost:-1},{cost:.5},{cost:"1"},{useExtra:"true"},{allowOverload:1},{reason:1},[],null]){const f=fixture(),before=snapshot(f);assert.throws(()=>f.plan(options));assert.deepEqual(snapshot(f),before);}
 const f=fixture(),p=f.plan({updates:{"system.resources.cosmo.value":999},after:{armor:{health:999}},hours:99});assert.equal(p.hours,1);assert.equal(p.after.payer.current,9);assert.equal(p.after.armor.health,30);assert.equal(Object.hasOwn(p.payment,"updates"),false);p.after.armor.health=0;assert.equal(f.armor.system.health.value,19);
});
test("dados de pagamento e nível inválidos não geram plano parcial",()=>{
 for(const change of [f=>f.caster.system.profile.level=0,f=>f.caster.system.profile.level=1.5,f=>f.caster.system.resources.cosmo.value=Infinity,f=>f.caster.system.resources.cosmoExtra=-1,f=>f.caster.system.resources.health.value=NaN,f=>f.caster.system.resources.cosmo.unlimited="false"]){const f=fixture();change(f);assert.throws(()=>f.plan());}
});

test("prévia informa a diferença efetiva, sem anunciar cura que perdeu precisão",()=>{const f=fixture();f.armor.system.health.value=1e20;f.armor.system.health.max=1e21;assert.equal(f.plan().repair,0);assert.equal(f.plan().after.armor.health,1e20);});
