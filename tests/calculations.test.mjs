import test from "node:test";
import assert from "node:assert/strict";
import {knight} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {calculationSummary} from "../module/calculations.mjs";
import {migrateKnightSource} from "../module/migrations.mjs";
import {STYLES} from "../module/config.mjs";

test("PV de todos os estilos cresce somente a partir do segundo nível", () => {
  for (const [key, style] of Object.entries(STYLES)) {
    const s = knight(); s.profile.style = key; s.attributes.vig.value = 3;
    prepareKnight(s); assert.equal(s.resources.health.max, style.hp + 3);
    s.profile.level = 2; prepareKnight(s); assert.equal(s.resources.health.max, style.hp + style.hpStep + 6);
  }
});
test("atributos divinos entram uma vez, sem modificar recursos atuais ou bônus manuais", () => {
  const s = knight(); s.automation.enabled = true;
  for (const a of Object.values(s.attributes)) a.value = 6;
  s.resources.health.value = -3; s.resources.health.bonus = 7;
  prepareKnight(s); prepareKnight(s);
  assert.equal(s.resources.health.max, 43); assert.equal(s.resources.health.value, -3); assert.equal(s.resources.health.bonus, 7);
  assert.equal(s.combat.physicalDamageBonus, 1); assert.equal(s.combat.techniqueDamageBonus, 15);
  assert.equal(s.combat.resistances.vig, 8); assert.equal(s.combat.divineSpeed, 1);
  assert.match(calculationSummary(s)[0].text, /20 base/);
});
test("migração é idempotente e mantém dados antigos sem ativar automação", () => {
  const source = {schemaVersion: 1, resources: {health: {value: -2.5, manualMax: 88}}, attributes: {vig: {value: 8}}};
  const original = structuredClone(source); migrateKnightSource(source); migrateKnightSource(source);
  assert.equal(source.schemaVersion, 3); assert.equal(source.automation.enabled, false); assert.equal(source.creationGuide.status, "");
  assert.deepEqual(source.resources, original.resources); assert.deepEqual(source.attributes, original.attributes);
});
