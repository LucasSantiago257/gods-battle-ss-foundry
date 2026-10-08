import test from "node:test";
import assert from "node:assert/strict";
import {knight, content, validateStrings} from "./foundry-stub.mjs";
import {KnightData, ContentData} from "../module/models.mjs";
import {prepareKnight} from "../module/rules.mjs";

test("cavaleiro novo aceita dados padrão com todas as perícias automáticas", () => {
  const schema = KnightData.defineSchema(), s = knight();
  assert.doesNotThrow(() => validateStrings(schema, s));
  prepareKnight(s);
  assert.doesNotThrow(() => validateStrings(schema, s));
  assert.equal(s.skills.academics.associated, "");
  assert.equal(s.skills.academics.attribute, "sen");
  assert.equal(s.skills.armor.attribute, "cos");
});
test("associação pode ser salva manualmente e voltar a Automático em cada perícia", () => {
  const schema = KnightData.defineSchema(), s = knight();
  for (const skill of Object.values(s.skills)) {
    skill.associated = "vel";
    assert.doesNotThrow(() => validateStrings(schema, s));
    skill.associated = "";
    assert.doesNotThrow(() => validateStrings(schema, s));
  }
});
test("validação continua rejeitando estilos vazios e associações desconhecidas", () => {
  const schema = KnightData.defineSchema(), s = knight();
  s.profile.style = "";
  assert.throws(() => validateStrings(schema, s), /profile\.style: can't be blank/);
  s.profile.style = "saint"; s.skills.academics.associated = "unknown";
  assert.throws(() => validateStrings(schema, s), /skills\.academics\.associated: invalid choice/);
});
test("conteúdo novo aceita descrições, origem e campos opcionais vazios", () => {
  const s = content();
  assert.doesNotThrow(() => validateStrings(ContentData.defineSchema(), s));
  assert.equal(s.description, "");
  assert.equal(s.originUuid, "");
});
