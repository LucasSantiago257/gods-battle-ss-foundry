import test from "node:test";
import assert from "node:assert/strict";
import {knight,content} from "./foundry-stub.mjs";
import {prepareKnight,testParameters} from "../module/rules.mjs";
import {evaluatePassives,passiveWarnings} from "../module/passives.mjs";
import {BOOK_RULES} from "../module/book-rules.mjs";
function item(key,id=key,overrides={}) {return {id,name:BOOK_RULES[key].name,type:key.startsWith("virtue:")?"virtue":"ability",flags:{"gods-battle-ss":{source:{key}}},system:{...content(),...overrides}};}
test("358 entradas têm cobertura e páginas; definições não executam expressões",()=>{
 assert.equal(Object.keys(BOOK_RULES).length,358);
 for (const d of Object.values(BOOK_RULES)) {assert.ok(d.pages.length);assert.ok(['automated','partial','manual'].includes(d.status));for(const r of d.rules)assert.ok(Number.isFinite(r.value));}
});
test("Vitalidade soma fixo e por nível sem duplicação ao preparar ou importar cópia",()=>{
 const s=knight();s.automation.enabled=true;s.profile.level=4;
 const v=item('virtue:GERAL:VITALIDADE'); prepareKnight(s,[v]); const first=s.resources.health.max;
 assert.equal(first,20+30+4+28);prepareKnight(s,[v,v]);assert.equal(s.resources.health.max,first);
 prepareKnight(s,[]);assert.equal(s.resources.health.max,54);
});
test("escolhas de atributo não alteram a base e ficam pendentes até preenchidas",()=>{
 const s=knight();s.automation.enabled=true;const v=item('virtue:GERAL:AUMENTO DE ATRIBUTO');
 prepareKnight(s,[v]);assert.equal(s.attributes.for.effective,1);assert.ok(passiveWarnings(s,v).length);
 v.system.attributeChoice1=v.system.attributeChoice2='for';prepareKnight(s,[v]);prepareKnight(s,[v]);assert.equal(s.attributes.for.value,1);assert.equal(s.attributes.for.effective,3);assert.equal(s.attributes.for.mod,6);
 v.system.rulesEnabled=false;prepareKnight(s,[v]);assert.equal(s.attributes.for.effective,1);
});
test("virtudes explicitamente repetíveis acumulam e bônus manuais permanecem",()=>{
 const s=knight();s.automation.enabled=true;s.combat.attackBonus=3;
 const key='virtue:COMBATE:COMBO';prepareKnight(s,[item(key,'a'),item(key,'b')]);assert.equal(s.combat.attack,8);
});
test("pré-requisitos informam sem declaração; efeitos seguem opção de aplicação",()=>{
 const s=knight();s.automation.enabled=true;const v=item('sage:ability:3:DANÇARINO');s.skills.asterism.value=2;
 prepareKnight(s,[v]);assert.equal(s.skills.asterism.effectBonus,2);
 v.system.rulesAccepted=true;prepareKnight(s,[v]);assert.equal(s.skills.asterism.effectBonus,2);
});
test("modificadores do mesmo tipo não acumulam; virtude e habilidade somam",()=>{
 const s=knight();s.automation.enabled=true;s.skills.asterism.value=1;
 const a=item('sage:ability:3:DANÇARINO','a',{rulesAccepted:true}),b=item('marinas:ability:25:DANÇARINO','b',{rulesAccepted:true});
 const v=item('virtue:TÉCNICA:DANÇARINO ESTELAR');prepareKnight(s,[a,b,v]);assert.equal(s.skills.asterism.effectBonus,4);
 assert.ok(evaluatePassives(s,[a,b,v]).ledger.flatMap(r=>r.contributions).some(r=>!r.applied));
});
test("Gigante e sua habilidade natural compartilham o mesmo benefício",()=>{
 const s=knight();s.automation.enabled=true;prepareKnight(s,[item('virtue:GERAL:GIGANTE'),item('natural:Gigante:Gigante')]);assert.equal(s.resources.health.max,23);
});
test("armadura poderosa recalcula máximo, preservando PV correntes e máximo manual",()=>{
 const s=knight();s.automation.enabled=true;const a={type:'armor',system:content()};a.system.health.value=7;
 const v=item('virtue:GERAL:ARMADURA PODEROSA');prepareKnight(s,[a,v]);prepareKnight(s,[a,v]);assert.equal(a.system.health.max,60);assert.equal(a.system.health.value,7);
 a.system.health.manualMax=88;prepareKnight(s,[a,v]);assert.equal(a.system.health.max,88);
});
test("virtude de resistência contra técnicas não altera outros testes de resistência",()=>{
 const s=knight();s.automation.enabled=true;prepareKnight(s,[item('virtue:GERAL:VIGOR CÓSMICO')]);
 assert.equal(testParameters(s,'resistance','cos').modifier,2);assert.equal(testParameters(s,'resistance','cos','rank',{technique:true}).modifier,7);
 assert.equal(testParameters(s,'resistance','vig','rank',{technique:true}).modifier,2);
});
