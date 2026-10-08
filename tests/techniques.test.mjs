import test from "node:test";
import assert from "node:assert/strict";
import {knight, content} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {techniqueParameters, techniqueOutcome, cosmoPayment, resistancePreview} from "../module/technique-rules.mjs";
import {useTechnique, resistanceActor, renderTechniqueChat} from "../module/techniques.mjs";
import {rollTest} from "../module/rolls.mjs";

const system = () => {const s = knight(); s.skills.asterism.value = 2; s.resources.cosmo.value = 10; return prepareKnight(s);};
test("Asterismo usa natureza da técnica e respeita associação manual", () => {
  const s = system(); s.attributes.for.value = 5; s.attributes.sen.value = 2; prepareKnight(s);
  const t = {...content(), nature: "mental"};
  const p = techniqueParameters(s, t); assert.equal(p.attribute, "sen");
  assert.equal(p.modifier, s.skills.asterism.mod + s.attributes.sen.mod);
  s.skills.asterism.associated = "for"; assert.equal(techniqueParameters(s, t).attribute, "for");
});
test("custo soma componentes uma vez e perícia nunca excede cinco dados", () => {
  const s = system(); s.skills.asterism.value = 10; prepareKnight(s);
  const t = {...content(), cost: 4, costExtra: 2};
  const p = techniqueParameters(s, t, {extra: 1, elevate: 2, advantage: 1});
  assert.equal(p.cost, 9); assert.equal(p.difficulty, 19); assert.equal(p.dice, 5);
  s.skills.asterism.value = 0; prepareKnight(s); assert.equal(techniqueParameters(s, t, {advantage: -1}).dice, 1);
  assert.equal(techniqueParameters(s, t).modifier, 0);
  for (const extra of [-1, 0.5, NaN]) assert.throws(() => techniqueParameters(s, t, {extra}));
});
test("CE extra é gasta primeiro e reserva não é consumida", () => {
  const s = system(); s.resources.cosmo.value = 5; s.resources.cosmoReserved = 3; s.resources.cosmoExtra = 2;
  const p = cosmoPayment(s, 4); assert.equal(p.fromExtra, 2); assert.equal(p.fromCurrent, 2);
  assert.equal(p.updates["system.resources.cosmo.value"], 3); assert.equal(s.resources.cosmo.value, 5);
  assert.throws(() => cosmoPayment(s, 5), /insuficiente/);
  assert.throws(() => cosmoPayment(s, 3, {useExtra: false}), /insuficiente/);
});
test("queima cumulativa reproduz exemplo do livro: 63 PV e depois 70 PV", () => {
  const s = system(); s.profile.level = 7; s.resources.cosmo.value = 5; s.resources.health.value = 100;
  const first = cosmoPayment(s, 14, {allowOverload: true}); assert.equal(first.lifeDamage, 63);
  s.resources.cosmo.value = 0; s.resources.cosmoOverload = 9; s.resources.health.value = 37;
  const next = cosmoPayment(s, 1, {allowOverload: true}); assert.equal(next.lifeDamage, 70);
  assert.equal(next.updates["system.resources.health.value"], -33);
});
test("CE ilimitada não debita recursos", () => {
  const s = system(); s.resources.cosmo.unlimited = true;
  assert.deepEqual(cosmoPayment(s, 100).updates, {});
});
test("dano reproduz Saga: ND4 × poder20 + nível25 = 105; armadura30", () => {
  const s = system(); s.profile.level = 25; prepareKnight(s);
  const t = {...content(), classification: "gold", damageLevel: 4, power: 20, cost: 4};
  const p = techniqueParameters(s, t);
  const success = techniqueOutcome(s, t, p, p.difficulty); assert.equal(success.damage, 105); assert.equal(success.armorDamage, 30);
  assert.equal(techniqueOutcome(s, t, p, p.difficulty + 10).damage, 105);
  assert.equal(techniqueOutcome(s, t, p, p.difficulty + 11).damage, 125);
  assert.equal(techniqueOutcome(s, t, p, p.difficulty - 10).nextPenalty, 0);
  assert.equal(techniqueOutcome(s, t, p, p.difficulty - 11).nextPenalty, -10);
  assert.equal(techniqueOutcome(s, t, p, p.difficulty - 1).damage, 0);
});
test("elevação altera ND para dano e PC para controle; escalas planetária e galáctica", () => {
  const s = system(), t = content();
  const p = techniqueParameters(s, t, {elevate: 1});
  assert.equal(techniqueOutcome(s, t, p, p.difficulty).damage, 31);
  assert.equal(p.powerCosmic, s.combat.cosmicPower);
  t.effectKind = "control"; const control = techniqueParameters(s, t, {elevate: 2});
  assert.equal(control.powerCosmic, s.combat.cosmicPower + 2);
  assert.equal(techniqueOutcome(s, t, control, control.difficulty).damage, 0);
  t.effectKind = "damage";
  for (const [nd, expected] of [[10, 10], [11, 70], [20, 70], [21, 100]]) {
    t.damageLevel = nd; const base = techniqueParameters(s, t);
    assert.equal(techniqueOutcome(s, t, base, base.difficulty).armorDamage, expected);
  }
});
test("resistência preserva limites críticos, armadura a zero e dano sem armadura", () => {
  const s = system(), a = content(); a.equipped = true; a.health.value = 0;
  const items = [{type: "armor", system: a}], attack = {damage: 105, armorDamage: 30, powerCosmic: 20};
  for (const [total, body, armor] of [[20,52.5,0], [30,52.5,0], [31,0,0], [10,105,30], [9,210,30]]) {
    const p = resistancePreview(s, items, attack, total); assert.equal(p.damage, body); assert.equal(p.armorDamage, armor);
  }
  assert.equal(resistancePreview(s, items, attack, 9).doubleDuration, true);
  a.health.value = -1; assert.equal(resistancePreview(s, items, attack, 19).damage, 210);
  assert.equal(resistancePreview(s, items, attack, 19).armorDamage, 0);
  assert.equal(s.resources.health.value, 21);
});

function runtime({answer = {}, faces = [10, 10], confirm = true, updateFail = false, chatFail = false} = {}) {
  const sent = [], updates = [], notices = [], renders = []; let evaluations = 0;
  globalThis.ui = {notifications: {warn: text => notices.push(text), error: text => notices.push(text)}};
  game.settings.get = scope => scope === "core" ? "gmroll" : "rank";
  foundry.applications.api.DialogV2 = {wait: async () => answer && ({extra: 0, elevate: 0, bonus: 0, advantage: 0, useExtra: true, allowOverload: false, ...answer}), confirm: async () => confirm};
  foundry.applications.handlebars = {renderTemplate: async (path, context) => {renders.push({path, context}); return "cartão";}};
  globalThis.Roll = class {
    constructor(formula) {this.formula = formula;}
    async evaluate() {
      if (this.formula.includes("d10")) {evaluations++; this.dice = [{results: faces.map(result => ({result}))}]; this.terms = [{number: Math.max(...faces)}];}
      else this.terms = [{number: Number(this.formula)}]; return this;
    }
    static fromTerms(t) {return {total: t[0].number + (t[1].operator === "+" ? 1 : -1) * t[2].number};}
  };
  foundry.dice = {terms: {OperatorTerm: class {constructor(data) {Object.assign(this, data);}}}};
  globalThis.ChatMessage = {getSpeaker: () => ({}), applyRollMode: (message, mode) => {message.rollMode = mode;}, create: async message => {if (chatFail) throw Error("Falha simulada no chat"); sent.push(message); return message;}};
  const actor = {isOwner: true, type: "knight", system: system(), update: async data => {
    if (updateFail) throw Error("Falha simulada ao salvar"); updates.push(data);
    for (const [key, value] of Object.entries(data)) {
      const parts = key.split("."); let cursor = actor; for (const p of parts.slice(0,-1)) cursor = cursor[p]; cursor[parts.at(-1)] = value;
    }
  }};
  const item = {id: "tech", uuid: "Actor.test.Item.tech", type: "technique", name: "Teste", system: content(), parent: actor};
  actor.items = {get: id => id === item.id ? item : null, contents: [item]};
  return {actor, item, sent, updates, notices, renders, evaluations: () => evaluations};
}
test("ativação cobra uma vez, envia mesmo total e respeita privacidade", async () => {
  const r = runtime(); await useTechnique(r.actor, r.item);
  assert.equal(r.evaluations(), 1); assert.equal(r.updates.length, 1); assert.equal(r.actor.system.resources.cosmo.value, 8);
  assert.equal(r.sent[0].rollMode, "gmroll"); assert.equal(r.sent[0].rolls[0].total, r.renders.at(-1).context.total);
  assert.ok(r.sent[0].flags["gods-battle-ss"].attack);
});
test("falha crítica gasta CE e aplica −10; próxima ativação consome penalidade", async () => {
  const r = runtime({faces: [1, 1]}); await useTechnique(r.actor, r.item);
  assert.equal(r.actor.system.resources.cosmo.value, 8); assert.equal(r.actor.system.combat.asterismPenalty, -10);
  assert.equal(r.sent[0].flags["gods-battle-ss"].attack, undefined);
  foundry.applications.api.DialogV2.wait = async () => ({bonus: 100}); await useTechnique(r.actor, r.item);
  assert.equal(r.actor.system.combat.asterismPenalty, 0);
});
test("cancelamento, CE insuficiente e rejeição de PV não gastam nem rolam", async () => {
  for (const settings of [{answer: null}, {answer: {extra: 100}}, {answer: {extra: 100, allowOverload: true}, confirm: false}]) {
    const r = runtime(settings); await useTechnique(r.actor, r.item);
    assert.equal(r.evaluations(), 0); assert.equal(r.updates.length, 0); assert.equal(r.sent.length, 0);
  }
});
test("queima de PV confirmada cobra valor cumulativo anunciado", async () => {
  const r = runtime({answer: {allowOverload: true}}); r.actor.system.resources.cosmo.value = 0;
  await useTechnique(r.actor, r.item); assert.equal(r.actor.system.resources.health.value, 19);
  assert.equal(r.actor.system.resources.cosmoOverload, 2);
});
test("duplo clique é bloqueado durante ativação; observador não pode ativar", async () => {
  const r = runtime(); let resolve; foundry.applications.api.DialogV2.wait = () => new Promise(done => {resolve = done;});
  const first = useTechnique(r.actor, r.item); await new Promise(done => setImmediate(done));
  await useTechnique(r.actor, r.item); resolve({}); await first;
  assert.equal(r.updates.length, 1); assert.equal(r.notices.length, 1);
  r.actor.isOwner = false; await useTechnique(r.actor, r.item); assert.equal(r.updates.length, 1);
});
test("falha ao salvar impede chat; falha de chat após pagamento informa gasto", async () => {
  const old = console.error; console.error = () => {};
  try {
    const a = runtime({updateFail: true}); await useTechnique(a.actor, a.item); assert.equal(a.sent.length, 0); assert.equal(a.actor.system.resources.cosmo.value, 10);
    const b = runtime({chatFail: true}); await useTechnique(b.actor, b.item); assert.equal(b.actor.system.resources.cosmo.value, 8); assert.match(b.notices[0], /recursos foram gastos/);
  } finally {console.error = old;}
});
test("defensor selecionado precisa ser único e proprietário; personagem é alternativa", () => {
  const a = {type: "knight", isOwner: true}; assert.equal(resistanceActor([], a), a); assert.equal(resistanceActor([{actor: a}], null), a);
  assert.throws(() => resistanceActor([{actor:a}, {actor:a}], a)); assert.throws(() => resistanceActor([{actor:{...a,isOwner:false}}], a));
});
test("mensagem oculta ou ataque inválido não oferecem resistência", () => {
  let removed = 0; const html = {querySelector: () => ({remove: () => removed++})};
  renderTechniqueChat({isContentVisible: false, flags: {}}, html);
  renderTechniqueChat({isContentVisible: true, flags: {"gods-battle-ss": {attack: {nature: "physical", damage: NaN}}}}, html);
  assert.equal(removed, 2);
});
test("teste genérico de Asterismo consome penalidade e pode gerar nova falha crítica", async () => {
  const r = runtime(); r.actor.system.combat.asterismPenalty = -10;
  foundry.applications.api.DialogV2.wait = async () => ({difficulty: 10, bonus: 100, advantage: 0});
  await rollTest(r.actor, "skill", "asterism"); assert.equal(r.actor.system.combat.asterismPenalty, 0);
  foundry.applications.api.DialogV2.wait = async () => ({difficulty: 100, bonus: 0, advantage: 0});
  await rollTest(r.actor, "skill", "asterism"); assert.equal(r.actor.system.combat.asterismPenalty, -10);
});
test("resistência pelo chat usa dificuldade informada e não altera PV", async () => {
  const r = runtime(); foundry.applications.api.DialogV2.wait = async () => ({difficulty: 15, bonus: 0, advantage: 0});
  const before = r.actor.system.resources.health.value;
  await rollTest(r.actor, "resistance", "vig", {difficulty: 15, resistanceAttack: {name: "Ataque", damage: 20, armorDamage: 10, powerCosmic: 15}});
  assert.ok(r.sent[0].flags["gods-battle-ss"].resistance); assert.equal(r.actor.system.resources.health.value, before); assert.equal(r.updates.length, 0);
});
