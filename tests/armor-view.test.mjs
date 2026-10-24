import test from "node:test";
import assert from "node:assert/strict";
import {knight, content} from "./foundry-stub.mjs";
import {armorValues} from "../module/rules.mjs";
import {BattleActor} from "../module/documents.mjs";
import {KnightSheet, ContentSheet} from "../module/sheets.mjs";
import {armorPresentation} from "../module/armor-view.mjs";

function fixture(synthetic = false) {
  const actor = new BattleActor();
  Object.assign(actor, {type:"knight", uuid:synthetic?"Scene.arena.Token.exercise.Actor.knight":"Actor.knight", system:knight(), flags:{}, isOwner:true});
  const items = [];
  actor.items = {contents:items, filter:fn=>items.filter(fn), get:id=>items.find(i=>i.id===id)};
  actor.updateEmbeddedDocuments = async (_type, updates) => {for (const u of updates) actor.items.get(u._id).system.equipped = u["system.equipped"];actor.prepareDerivedData();};
  const add = (id, changes = {}) => {
    const s = Object.assign(content(), changes);s.armor = armorValues(s);
    const item = {id, uuid:`${actor.uuid}.Item.${id}`, type:"armor", name:id, sort:items.length, parent:actor, system:s};items.push(item);actor.prepareDerivedData();return item;
  };
  return {actor,add};
}
const snapshot = actor => JSON.stringify({system:actor.system, flags:actor.flags, items:actor.items.contents.map(i=>i.system)});

test("requisito de classe é qualitativo nos Sentidos e conserva o mínimo numérico interno", async () => {
  for (const [cls, expected] of Object.entries({bronze:"Cosmo 9", silver:"Cosmo 13", gold:"7º Sentido", divine:"7º Sentido Superado", kamui:"9º Sentido"})) {
    const s = content();s.class=cls;s.version=5;s.armor=armorValues(s);
    const item={type:"armor", system:s, isOwner:true};const before=JSON.stringify(item);
    const view=(await new ContentSheet(item)._prepareContext({})).armor;
    assert.equal(view.requirement,expected);assert.equal(view.minimum,s.armor.minimum);assert.equal(view.application,null);assert.equal(JSON.stringify(item),before);
  }
});

for (const synthetic of [false,true]) {
  test(`troca/remoção e PV 0/negativo atualizam estado e PA sem gastar recursos (${synthetic?"sintético":"vinculado"})`, async () => {
    const {actor,add}=fixture(synthetic), first=add("bronze",{equipped:true}), second=add("gold",{class:"gold"});
    actor.system.resources.cosmo.value=37;actor.system.resources.health.value=-2;
    assert.equal(armorPresentation(first).application.key,"applied");assert.equal(armorPresentation(second).application.key,"stored");
    // Even below the listed Sense requirement, existing Equipar remains an ordinary toggle.
    await actor.equipArmor(second);assert.equal(armorPresentation(second).application.key,"applied");assert.equal(armorPresentation(first).application.key,"stored");assert.equal(actor.system.combat.protection,10);
    second.system.health.value=0;actor.prepareDerivedData();assert.equal(armorPresentation(second).application.key,"applied");
    for (const hp of [-.5,-1]) {second.system.health.value=hp;actor.prepareDerivedData();assert.equal(armorPresentation(second).application.key,"depleted");assert.equal(actor.system.combat.protection,0);}
    second.system.health.value=1;second.system.state="dead";actor.prepareDerivedData();assert.equal(armorPresentation(second).application.key,"dead");assert.equal(actor.system.combat.protection,0);
    second.system.state="recovering";actor.prepareDerivedData();assert.equal(armorPresentation(second).application.key,"applied");assert.equal(actor.system.combat.protection,10);
    await actor.equipArmor(second);assert.equal(armorPresentation(second).application.key,"stored");assert.equal(actor.system.combat.protection,0);
    assert.equal(actor.system.resources.cosmo.value,37);assert.equal(actor.system.resources.health.value,-2);
  });
  test(`múltiplas equipadas respeitam ordem do cálculo, não ordenação visual (${synthetic?"sintético":"vinculado"})`, async () => {
    const {actor,add}=fixture(synthetic), first=add("first",{equipped:true}), second=add("second",{equipped:true,class:"silver"});
    first.sort=9;second.sort=0;const before=snapshot(actor);
    const context=await new KnightSheet(actor)._prepareContext({});
    assert.equal(context.groups.armor.items[0].id,second.id);assert.equal(context.groups.armor.items[0].armor.application.key,"other");
    assert.equal(context.groups.armor.items[1].armor.application.key,"applied");assert.equal(actor.system.combat.protection,3);assert.equal(snapshot(actor),before);
    first.system.state="dead";actor.prepareDerivedData();assert.equal(armorPresentation(second).application.key,"applied");assert.equal(actor.system.combat.protection,5);
  });
}

test("apresentação usa máximos derivados de passivas, ajustes e infinito sem recalcular a cópia", async () => {
  const {actor,add}=fixture(), item=add("adjusted",{equipped:true,class:"kamui",protectionBonus:4,cosmoBonus:7});
  actor.system.automation.enabled=true;
  actor.items.contents.push({type:"virtue",system:content(),flags:{"gods-battle-ss":{source:{key:"virtue:GERAL:ARMADURA PODEROSA"}}}});
  actor.prepareDerivedData();assert.equal(item.system.health.max,400);
  let view=(await new ContentSheet(item)._prepareContext({})).armor;assert.equal(view.hp,400);assert.equal(view.pa,24);assert.equal(view.ce,7);assert.equal(view.unlimited,true);assert.equal(view.ceLabel,"∞");
  item.system.health.manualMax=88;item.system.notes="ajuste privado";actor.prepareDerivedData();const before=snapshot(actor);
  view=armorPresentation(item);assert.equal(view.hp,88);assert.equal(view.application.key,"applied");assert.equal(snapshot(actor),before);
});

test("contexto não consulta outros Actors nem atribui aplicação a cópia removida ou de outra ficha", async () => {
  const a=fixture(),b=fixture(true),item=a.add("same",{equipped:true}),other=b.add("same",{equipped:true});
  assert.equal(armorPresentation(item,b.actor).application,null);assert.equal(armorPresentation(other,a.actor).application,null);
  a.actor.items.contents.splice(0,1);assert.equal(armorPresentation(item).application,null);
  delete item.parent;assert.equal(armorPresentation(item).application,null);
  item.isOwner=false;const context=await new ContentSheet(item)._prepareContext({});assert.equal(context.editable,false);assert.equal(context.armor.application,null);
  assert.equal(armorPresentation({type:"technique"}),null);
});

test("CE negativa ajustada é exibida sem sinal duplo e sem alterar o bônus", () => {
  const {add}=fixture(),item=add("manual",{cosmoBonus:-8});const before=JSON.stringify(item.system);
  assert.equal(armorPresentation(item).ceLabel,"-5");assert.equal(JSON.stringify(item.system),before);
});
