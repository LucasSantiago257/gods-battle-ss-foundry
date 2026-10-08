import test from "node:test";
import assert from "node:assert/strict";
import {knight} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {rollTest} from "../module/rolls.mjs";

test("chat nativo e cartão usam o mesmo total; parada é lançada uma vez", async () => {
  let diceEvaluations = 0, sent, parameters;
  globalThis.Roll = class {
    constructor(formula) {this.formula = formula;}
    async evaluate() {
      if (this.formula.includes("d10")) {
        diceEvaluations++; this.dice = [{results: [10, 1, 6].map(result => ({result}))}]; this.terms = [{number: 10}]; this.total = 10;
      } else {this.total = Number(this.formula); this.terms = [{number: this.total}];}
      return this;
    }
    static fromTerms(terms) {return {total: terms[0].number + (terms[1].operator === "+" ? 1 : -1) * terms[2].number};}
  };
  foundry.dice = {terms: {OperatorTerm: class {constructor(data) {Object.assign(this, data);}}}};
  foundry.applications.api.DialogV2 = {wait: async () => ({difficulty: 15, bonus: 0, advantage: 0})};
  foundry.applications.handlebars = {renderTemplate: async (_path, data) => {parameters = data; return "cartão";}};
  globalThis.ChatMessage = {getSpeaker: () => ({}), applyRollMode: (data, mode) => {data.rollMode = mode;}, create: async data => {sent = data;}};
  game.settings.get = (scope) => scope === "core" ? "gmroll" : "rank";
  const s = knight(); s.attributes.for.value = 3; prepareKnight(s);
  await rollTest({isOwner: true, system: s}, "attribute", "for");
  assert.equal(diceEvaluations, 1); assert.equal(parameters.total, 16); assert.equal(sent.rolls[0].total, 16); assert.equal(sent.rollMode, "gmroll");
});
test("cancelar teste não lança dados", async () => {
  foundry.applications.api.DialogV2 = {wait: async () => null};
  let evaluated = false; globalThis.Roll = class {constructor() {evaluated = true;}};
  await rollTest({isOwner: true, system: prepareKnight(knight())}, "attribute", "for"); assert.equal(evaluated, false);
});
