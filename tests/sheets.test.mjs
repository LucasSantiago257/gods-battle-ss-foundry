import test from "node:test";
import assert from "node:assert/strict";
import {knight, armor, content} from "./foundry-stub.mjs";
import {KnightSheet, ContentSheet} from "../module/sheets.mjs";
import {BattleActor} from "../module/documents.mjs";
import {ITEM_TYPES} from "../module/config.mjs";
import {prepareKnight, armorValues} from "../module/rules.mjs";

test("contexto de cavaleiro inclui 18 perícias e recursos derivados", async () => {
  const actor = {system: prepareKnight(knight()), items: {contents: []}, name: "Teste", img: "", isOwner: true};
  const context = await new KnightSheet(actor)._prepareContext({});
  assert.equal(context.skills.length, 18); assert.equal(context.attributes.length, 5); assert.equal(context.system.resources.health.max, 21);
  assert.equal(Object.keys(context.tabs).length, 7);
});
test("todas as fichas de conteúdo geram campos sem perder tipo", async () => {
  for (const type of Object.keys(ITEM_TYPES)) {
    const s = content(); if (type === "armor") s.armor = armorValues(s);
    const context = await new ContentSheet({system: s, type, isOwner: true})._prepareContext({});
    assert.ok(context.fields.length > 4); assert.equal(context.typeLabel, ITEM_TYPES[type]);
  }
});
test("drop externo preserva UUID da origem e entra sem equipar", async () => {
  let update;
  const actor = {isOwner: true, acceptDrop: async () => ({update: async data => {update = data;}})};
  const sheet = new KnightSheet(actor); await sheet._onDropItem({}, {type: "armor", uuid: "Compendium.world.armors.Item.abc"});
  assert.deepEqual(update, {"system.originUuid": "Compendium.world.armors.Item.abc", "system.equipped": false});
});
test("leitura do Item usa descrição da cópia e preserva ocorrências originais para observadores", async () => {
 const item={type:"ability", isOwner:false, system:{...content(), description:"Regra editada nesta cópia", page:"122, 465"},
  flags:{"gods-battle-ss":{source:{author:"Dhoko de Libra", license:"CC BY-NC-SA 4.0", occurrences:[{name:"Visão Aérea", category:"Domador de Bestas", pages:[122], text:"Regra original"}]}}}};
 const before=JSON.stringify(item);const context=await new ContentSheet(item)._prepareContext({});
 assert.equal(context.editable,false);assert.equal(context.bookReference.description,item.system.description);
 assert.equal(context.bookReference.occurrences[0].text,"Regra original");assert.equal(context.bookReference.occurrences[0].pages,"122");
 assert.equal(JSON.stringify(item),before);
});
test("drop na própria ficha deixa ordenação com a classe nativa", async () => {
  let updates = 0; const actor = {isOwner: true, acceptDrop: async () => ({update: async () => updates++})};
  await new KnightSheet(actor)._onDropItem({}, {type: "armor", parent: actor}); assert.equal(updates, 0);
});
test("referência de componente respeita permissão e não admite UUID fora do catálogo", async () => {
 let resolved=0,opened=0,visible=false;
 let packVisible=false;
 globalThis.ui={notifications:{warn:()=>{}}};game.packs=new Map([["gods-battle-ss.componentes-tecnicas",{testUserPermission:()=>packVisible}]]);
 globalThis.fromUuid=async()=>{resolved++;return {testUserPermission:()=>visible,sheet:{render:()=>opened++}};};
 const target={dataset:{uuid:"Compendium.gods-battle-ss.componentes-tecnicas.Item.0123456789abcdef"}};
 await ContentSheet.openReference({},target);assert.equal(resolved,0);
 packVisible=true;await ContentSheet.openReference({},target);assert.equal(resolved,1);assert.equal(opened,0);
 visible=true;await ContentSheet.openReference({},target);assert.equal(opened,1);
 target.dataset.uuid="Actor.other.Item.private";await ContentSheet.openReference({},target);assert.equal(resolved,2);
});
test("ficha sem edição não aceita drop", async () => {
  let created = false; const actor = {isOwner: false, acceptDrop: () => {created = true;}};
  await new KnightSheet(actor)._onDropItem({}, {type: "armor"}); assert.equal(created, false);
});
test("equipar arma uma única armadura, e remover não equipa outra", async () => {
  const actor = new BattleActor(); actor.isOwner = true;
  const first = {id: "one", type: "armor", parent: actor, system: {...armor(), equipped: true}}, second = {id: "two", type: "armor", parent: actor, system: armor()};
  actor.items = [first, second]; let result;
  actor.updateEmbeddedDocuments = async (_type, updates) => {result = updates;};
  await actor.equipArmor(second); assert.deepEqual(result, [{_id: "one", "system.equipped": false}, {_id: "two", "system.equipped": true}]);
  second.system.equipped = true; await actor.equipArmor(second); assert.ok(result.every(u => !u["system.equipped"]));
});
