import test from "node:test";
import assert from "node:assert/strict";
import {knight, armor} from "./foundry-stub.mjs";
import {prepareKnight, resolvePool, classify, attributeModifier, skillModifier, armorValues, testParameters} from "../module/rules.mjs";

test("parada aproveita maior, contabiliza cada 10 e cada 1", () => {
  assert.equal(resolvePool([10, 8, 1, 5, 10], 8).total, 20);
  assert.equal(resolvePool([1, 1, 1, 5, 10]).total, 6);
  assert.throws(() => resolvePool([])); assert.throws(() => resolvePool([0]));
});
test("limites críticos são estritos e igualdade à dificuldade é sucesso", () => {
  assert.equal(classify(20, 10), "Sucesso"); assert.equal(classify(21, 10), "Sucesso crítico");
  assert.equal(classify(0, 10), "Falha"); assert.equal(classify(-1, 10), "Falha crítica"); assert.equal(classify(10, 10), "Sucesso");
});
test("tabelas distinguem graduação e modificadores", () => {
  assert.equal(attributeModifier(6), 13); assert.equal(attributeModifier(10), 25); assert.equal(skillModifier(10), 15);
});
test("criação usa 8 pontos e CE usa Cosmo, independentemente de Sentidos", () => {
  const s = knight(); s.attributes.cos.value = 4; s.attributes.sen.value = 2; prepareKnight(s);
  assert.equal(s.creation.training, 8); assert.equal(s.creation.budget, 14); assert.equal(s.resources.cosmo.max, 4);
  s.attributes.sen.value = 5; prepareKnight(s); assert.equal(s.resources.cosmo.max, 4);
});
test("PV negativos e gasto corrente permanecem ao recalcular máximos", () => {
  const s = knight(); s.resources.health.value = -5; s.resources.cosmo.value = 0; s.resources.health.manualMax = 77;
  prepareKnight(s); assert.equal(s.resources.health.value, -5); assert.equal(s.resources.health.max, 77); assert.equal(s.resources.cosmo.value, 0);
});
test("equipamento adiciona PA e CE, sem confundir vida e sem acumular ao recalcular", () => {
  const s = knight(), a = armor(); a.equipped = true; a.health.value = 7;
  prepareKnight(s, [{type: "armor", system: a}]); prepareKnight(s, [{type: "armor", system: a}]);
  assert.equal(s.resources.health.max, 21); assert.equal(s.resources.cosmo.max, 4); assert.equal(s.combat.protection, 3); assert.equal(a.health.value, 7);
  a.equipped = false; prepareKnight(s, [{type: "armor", system: a}]); assert.equal(s.resources.cosmo.max, 1); assert.equal(s.combat.protection, 0);
});
test("armadura negativa não bonifica; zero continua recuperável", () => {
  const s = knight(), a = armor(); a.equipped = true; a.health.value = -1; prepareKnight(s, [{type: "armor", system: a}]); assert.equal(s.combat.protection, 0);
  a.health.value = 0; prepareKnight(s, [{type: "armor", system: a}]); assert.equal(s.combat.protection, 3);
});
test("versões não bonificam Ouro e Kamui representa infinito por flag", () => {
  const a = armor(); a.version = 3; assert.equal(armorValues(a).hp, 40); assert.equal(armorValues(a).pa, 5);
  a.class = "gold"; assert.equal(armorValues(a).hp, 100); assert.equal(armorValues(a).pa, 10);
  a.class = "kamui"; assert.equal(armorValues(a).unlimited, true); assert.doesNotThrow(() => JSON.stringify(armorValues(a)));
});
test("política de resistência altera somente a parcela de atributo", () => {
  const s = knight(); s.profile.level = 8; s.attributes.vel.value = 4; prepareKnight(s);
  assert.deepEqual(testParameters(s, "resistance", "vel", "rank"), {dice: 4, modifier: 12});
  assert.deepEqual(testParameters(s, "resistance", "vel", "modifier"), {dice: 4, modifier: 16});
});
test("perícia sem treino usa um dado e não ganha o atributo; grau 10 usa cinco dados", () => {
  const s = knight(); s.attributes.for.value = 5; prepareKnight(s);
  assert.deepEqual(testParameters(s, "skill", "sports"), {dice: 1, modifier: 0});
  s.skills.sports.value = 10; prepareKnight(s); assert.deepEqual(testParameters(s, "skill", "sports"), {dice: 5, modifier: 25});
});
test("tabelas do estilo até 20 e escolhas independentes preservadas", () => {
  const s = knight(); s.profile.level = 20; s.profile.style = "sage"; prepareKnight(s);
  assert.equal(s.combat.attack, 11); assert.equal(s.resources.cosmo.max, 20); assert.equal(s.profile.status, "bronze"); assert.equal(s.sense.ordinal, 6);
  s.profile.level = 21; prepareKnight(s); assert.equal(s.combat.attack, 11); assert.equal(s.resources.cosmo.max, 20);
});
test("troca de estilo e natureza recalcula associações, sem reescrever escolha manual", () => {
  const s = knight(); s.skills.combat.value = 1; s.skills.asterism.value = 1; s.profile.style = "sage"; s.profile.nature = "manipulation"; prepareKnight(s);
  assert.equal(s.skills.combat.attribute, "sen"); assert.equal(s.skills.asterism.attribute, "cos");
  s.skills.combat.associated = "vig"; prepareKnight(s); assert.equal(s.skills.combat.attribute, "vig");
});
