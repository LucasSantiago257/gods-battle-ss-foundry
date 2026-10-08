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
test("drop na própria ficha deixa ordenação com a classe nativa", async () => {
  let updates = 0; const actor = {isOwner: true, acceptDrop: async () => ({update: async () => updates++})};
  await new KnightSheet(actor)._onDropItem({}, {type: "armor", parent: actor}); assert.equal(updates, 0);
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
