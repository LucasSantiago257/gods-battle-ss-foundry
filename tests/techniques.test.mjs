import test from "node:test";
import assert from "node:assert/strict";
import {knight, content} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {techniqueParameters, techniqueOutcome, cosmoPayment, resistancePreview, techniqueReadiness,effectiveTechnique,activationPreview} from "../module/technique-rules.mjs";
import {useTechnique, resistanceActor, renderTechniqueChat,techniqueTarget,resistanceForAttack} from "../module/techniques.mjs";
import {techniqueSetupUpdates,setupTechnique} from "../module/technique-setup.mjs";
import {installTechniquePreview} from "../module/technique-ui.mjs";
import {rollTest} from "../module/rolls.mjs";
import {executeTechniqueRequest,notifyTechniqueResponse} from "../module/technique-activation.mjs";
import {controlDuration} from "../module/control-rules.mjs";

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
  globalThis.ui = {notifications: {warn: text => notices.push(text), error: text => notices.push(text),info:()=>{}}};
  const owner={id:"owner",isGM:false},gm={id:"gm",isGM:true,active:true};game.user=owner;game.users={activeGM:gm,get:id=>id===gm.id?gm:id===owner.id?owner:null};const messages=new Map();game.messages={get:id=>messages.get(id),get contents(){return [...messages.values()];}};
  game.settings.get = scope => scope === "core" ? "gmroll" : "rank";
  foundry.applications.api.DialogV2 = {wait: async () => answer && ({extra: 0, elevate: 0, bonus: 0, advantage: 0, useExtra: true, allowOverload: false, ...answer}), confirm: async () => confirm};
  foundry.applications.handlebars = {renderTemplate: async (path, context) => {renders.push({path, context}); return "cartão";}};
  globalThis.Roll = class {
    constructor(formula) {this.formula = formula;}
    async evaluate() {
      if (this.formula.includes("d10")) {evaluations++; this.dice = [{results: faces.map(result => ({result}))}]; this.terms = [{number: Math.max(...faces)}];}
      else this.terms = [{number: Number(this.formula)}]; return this;
    }
    static fromTerms(t) {const total=t[0].number + (t[1].operator === "+" ? 1 : -1) * t[2].number;return {total,toJSON:()=>({total})};}
    static fromData(data){return {...data,toJSON:()=>structuredClone(data)};}
  };
  foundry.dice = {terms: {OperatorTerm: class {constructor(data) {Object.assign(this, data);}}}};
  globalThis.ChatMessage = {getSpeaker: () => ({}), applyRollMode: (message, mode) => {message.rollMode = mode;}, create: async data => {
    if(!data.flags?.["gods-battle-ss"]?.techniqueRequest){sent.push(data);return data;}
    const message={...structuredClone(data),id:`request${messages.size+1}`,author:owner,update:async patch=>{
      if(chatFail&&patch.rolls)throw Error("Falha simulada no chat");apply(message,{...patch,...(patch.rolls?{rolls:patch.rolls.map(roll=>roll.toJSON())}:{})});if(patch.rolls)sent.push(message);
    }};messages.set(message.id,message);game.user=gm;try{await executeTechniqueRequest(message,owner.id);}finally{game.user=owner;notifyTechniqueResponse(message);}return message;
  }};
  const apply=(object,data)=>{for(const[key,value]of Object.entries(data)){const parts=key.split(".");let cursor=object;for(const p of parts.slice(0,-1))cursor=cursor[p]??={};const last=parts.at(-1);if(last.startsWith("-="))delete cursor[last.slice(2)];else if(value&&typeof value==="object"&&!Array.isArray(value)&&cursor[last]&&typeof cursor[last]==="object")merge(cursor[last],value);else cursor[last]=structuredClone(value);}};
  const merge=(to,from)=>{for(const[k,v]of Object.entries(from)){if(v&&typeof v==="object"&&!Array.isArray(v)&&to[k]&&typeof to[k]==="object")merge(to[k],v);else to[k]=structuredClone(v);}};
  const actor = {uuid:"Actor.test",flags:{},isOwner: true, type: "knight", system: system(),testUserPermission:user=>user.isGM||user.id===owner.id,update: async data => {
    if (updateFail) throw Error("Falha simulada ao salvar");if(Object.keys(data).some(key=>key.startsWith("system.")))updates.push(data);
    apply(actor,data);
  }};
  const item = {id: "tech", uuid: "Actor.test.Item.tech",isOwner:true,type: "technique", name: "Teste", system: content(), parent: actor};
  actor.items = {get: id => id === item.id ? item : null, contents: [item]};
  globalThis.fromUuid=async uuid=>uuid===actor.uuid?actor:null;
  return {actor, item, sent, updates, notices, renders, evaluations: () => evaluations};
}
test("ativação cobra uma vez, envia mesmo total e respeita privacidade", async () => {
  const r = runtime(); await useTechnique(r.actor, r.item);
  assert.equal(r.evaluations(), 1); assert.equal(r.updates.length, 1); assert.equal(r.actor.system.resources.cosmo.value, 8);
  assert.equal(r.sent[0].rollMode, "gmroll"); assert.equal(r.sent[0].rolls[0].total, r.renders.at(-1).context.total);
  assert.ok(r.sent[0].flags["gods-battle-ss"].attack);
});
test("técnica importada exige parâmetros válidos sem declaração de revisão", async () => {
 const r=runtime();
 r.item.flags={"gods-battle-ss":{source:{reference:{reviewRequired:true}}}};
 r.item.system={...r.item.system,power:0,damageLevel:0,cost:0};
 await useTechnique(r.actor,r.item);
 assert.equal(r.renders.length,0); assert.equal(r.evaluations(),0); assert.equal(r.updates.length,0);
 assert.match(r.notices[0],/custo total/);
 assert.match(techniqueReadiness(r.item),/custo total/);
 r.item.system.cost=2;assert.match(techniqueReadiness(r.item),/Poder e Nível/);
 r.item.system.power=10;r.item.system.damageLevel=2;r.item.system.nature="";
 assert.match(techniqueReadiness(r.item),/natureza/);
 r.item.system.nature="mental";assert.equal(techniqueReadiness(r.item),null);
 await useTechnique(r.actor,r.item);assert.equal(r.evaluations(),1);assert.equal(r.updates.length,1);
 r.item.flags["gods-battle-ss"].source.reference.manualOnly=true;
 await useTechnique(r.actor,r.item);assert.equal(r.updates.length,1);assert.match(r.notices.at(-1),/cooperativa/);
});
test("controle admite parâmetros de dano pendentes; efeito manual nunca usa rolagem genérica", () => {
 const t={...content(),effectKind:"control",damageLevel:0,power:0};
 const p=techniqueParameters(system(),t);
 assert.equal(techniqueOutcome(system(),t,p,p.difficulty).damage,0);
 t.effectKind="manual";assert.throws(()=>techniqueParameters(system(),t),/aplicação manual/);
 assert.match(techniqueReadiness({system:t}),/aplicação manual/);
 assert.equal(techniqueReadiness({system:content()}),null);
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
test("resistência de Controle publica duração sem gerar journal de dano zero",async()=>{
 const r=runtime({faces:[5]});foundry.applications.api.DialogV2.wait=async()=>({bonus:0,advantage:0,difficulty:1});const before=structuredClone(r.actor.system);
 const attack={name:"Controle",effectKind:"control",messageId:"root",targetUuid:r.actor.uuid,powerCosmic:20,damage:0,armorDamage:0,control:controlDuration({effectKind:"control",classification:"gold"})};
 await rollTest(r.actor,"resistance","vig",{difficulty:20,resistanceAttack:attack});const f=r.sent[0].flags["gods-battle-ss"];assert.equal(f.resolvedDamage,undefined);assert.equal(f.controlResolution.rootMessageId,"root");assert.equal(f.controlResolution.rounds,8);assert.equal(f.controlResolution.retryCost,2);assert.equal(r.renders.at(-1).context.resistance.control.doubleDuration,true);assert.deepEqual(r.actor.system,before);assert.equal(r.updates.length,0);
});

test("modo por status acompanha Bronze/Prata/Ouro, preserva manual e não promove pelo nível",()=>{
 const s=system(),t={...content(),power:77,damageLevel:9,techniqueMode:"status"},original=structuredClone(t);
 for(const [status,nd,power]of [["bronze",2,10],["silver",3,15],["gold",4,20]]){
  s.profile.status=status;s.profile.level=25;prepareKnight(s);const effective=effectiveTechnique(s,t);
  assert.equal(effective.damageLevel,nd);assert.equal(effective.power,power);
  const p=techniqueParameters(s,t);assert.equal(techniqueOutcome(s,t,p,p.difficulty).damage,nd*power+25);
 }
 assert.deepEqual(t,original);t.techniqueMode="manual";assert.equal(effectiveTechnique(s,t).power,77);
 s.profile.status="divine";t.techniqueMode="status";assert.throws(()=>techniqueParameters(s,t),/status exige/);
});
test("condensar soma uma vez ao custo, prévia não gasta e controle eleva somente PC",()=>{
 const s=system();s.profile.status="gold";s.profile.level=25;s.resources.cosmo.value=20;prepareKnight(s);
 const t={...content(),cost:8,techniqueMode:"status",classification:"gold"},before=structuredClone(s);
 const p=activationPreview(s,t,{condense:3});assert.equal(p.parameters.cost,11);assert.equal(p.parameters.difficulty,21);
 assert.equal(p.normal.damage,105);assert.equal(p.critical.damage,125);assert.equal(p.normal.armorDamage,30);assert.deepEqual(s,before);
 t.effectKind="control";const c=activationPreview(s,t,{condense:1,elevate:2});assert.equal(c.parameters.cost,11);
 assert.equal(c.parameters.powerCosmic,s.combat.cosmicPower+2);assert.equal(c.normal.damage,0);
 t.effectKind="damage";t.techniqueMode="manual";t.classification="bronze";t.damageLevel=10;
 const threshold=activationPreview(s,t);assert.equal(threshold.normal.armorDamage,10);assert.equal(threshold.critical.armorDamage,70);
 assert.throws(()=>techniqueParameters(s,t,{condense:-1}));assert.throws(()=>techniqueParameters(s,t,{condense:0.5}));
});
test("catálogo automático exige custo, sem aceite nem ND/Poder manuais",()=>{
 const item={parent:{type:"knight",system:system()},system:{...content(),techniqueMode:"status",cost:3,power:0,damageLevel:0},flags:{"gods-battle-ss":{source:{reference:{reviewRequired:true}}}}};
 assert.equal(techniqueReadiness(item),null);item.system.techniqueReviewed=false;assert.equal(techniqueReadiness(item),null);
 item.system.cost=0;assert.match(techniqueReadiness(item),/custo total/);item.system.cost=3;item.parent.system.profile.status="god";
 assert.match(techniqueReadiness(item),/status exige/);
});
const setupAnswer={classification:"bronze",nature:"mental",effectKind:"damage",techniqueMode:"status",cost:3,costExtra:1,range:3,power:77,damageLevel:9,reviewed:true};
test("configuração conserva parâmetros manuais, notas e custo completo do livro",()=>{
 const r=runtime(),before=structuredClone(r.item.system),updates=techniqueSetupUpdates(r.actor,r.item,setupAnswer);
 assert.equal(updates["system.cost"],3);assert.equal(updates["system.costExtra"],1);assert.equal(updates["system.techniqueReviewed"],true);
 assert.equal(updates["system.power"],undefined);assert.equal(updates["system.damageLevel"],undefined);assert.equal(updates["system.notes"],undefined);assert.deepEqual(r.item.system,before);
 assert.equal(techniqueSetupUpdates(r.actor,r.item,{...setupAnswer,techniqueMode:"manual"})["system.power"],77);
 for(const change of [{cost:0},{cost:1.5},{nature:""},{range:-1}])assert.throws(()=>techniqueSetupUpdates(r.actor,r.item,{...setupAnswer,...change}));
 r.item.flags={"gods-battle-ss":{source:{reference:{manualOnly:true}}}};assert.throws(()=>techniqueSetupUpdates(r.actor,r.item,setupAnswer),/cooperativa/);
 });
test("configuração da cópia salva duração de Controle sem exigir notas",()=>{
 const r=runtime(),updates=techniqueSetupUpdates(r.actor,r.item,{...setupAnswer,effectKind:"control",controlRounds:7});assert.equal(updates["system.controlRounds"],7);
 for(const controlRounds of [-1,0.5,501])assert.throws(()=>techniqueSetupUpdates(r.actor,r.item,{...setupAnswer,effectKind:"control",controlRounds}));
});
test("configuração cancelada ou cópia alterada não grava; revisão salva só a cópia",async()=>{
 const r=runtime(),changes=[];r.item.isOwner=true;r.item.update=async data=>changes.push(data);
 foundry.applications.api.DialogV2.wait=async()=>null;await setupTechnique(r.item);assert.equal(changes.length,0);
 foundry.applications.api.DialogV2.wait=async()=>setupAnswer;await setupTechnique(r.item);assert.equal(changes.length,1);assert.equal(r.updates.length,0);
 foundry.applications.api.DialogV2.wait=async()=>{r.item.system.notes="Nova anotação";return setupAnswer;};
 await setupTechnique(r.item);assert.equal(changes.length,1);assert.equal(r.item.system.notes,"Nova anotação");assert.match(r.notices.at(-1),/cópia mudou/);
});
test("prévia responde a elevação/condensação e pagamento, sem tocar recursos",()=>{
 const s=system(),before=structuredClone(s),listeners={},outputs=Object.fromEntries(["cost","difficulty","damage","error"].map(key=>[key,{dataset:{techniquePreview:key},textContent:""}])),button={disabled:false};
 const form={elements:{extra:{value:0},elevate:{value:0},condense:{value:0},bonus:{value:0},advantage:{value:0},useExtra:{checked:true},allowOverload:{checked:false}},querySelectorAll:()=>Object.values(outputs),querySelector:()=>button,addEventListener:(key,callback)=>listeners[key]=callback};
 installTechniquePreview(form,s,content());assert.equal(outputs.difficulty.textContent,"12");assert.equal(outputs.damage.textContent,"21");
 form.elements.elevate.value=2;form.elements.condense.value=1;listeners.input();assert.equal(outputs.cost.textContent,"5 CE");assert.equal(outputs.difficulty.textContent,"15");assert.equal(outputs.damage.textContent,"41");
 form.elements.extra.value=20;listeners.change();assert.equal(button.disabled,true);assert.match(outputs.error.textContent,/insuficiente/);
 form.elements.allowOverload.checked=true;listeners.change();assert.equal(button.disabled,false);assert.deepEqual(s,before);
});
test("alvo marcado vincula cartão e resistência mesmo com outro token controlado",async()=>{
 const r=runtime(),target={uuid:"Actor.defender",name:"Defensor",type:"knight",isOwner:true};game.user.targets=new Set([{actor:target}]);
 globalThis.fromUuid=async uuid=>uuid===target.uuid?target:uuid===r.actor.uuid?r.actor:null;
 await useTechnique(r.actor,r.item);assert.equal(r.sent[0].flags["gods-battle-ss"].attack.targetUuid,target.uuid);
 globalThis.fromUuid=async uuid=>uuid===target.uuid?target:null;
 assert.equal(await resistanceForAttack({targetUuid:target.uuid},[{actor:r.actor}],r.actor),target);
 target.isOwner=false;await assert.rejects(()=>resistanceForAttack({targetUuid:target.uuid}),/proprietário/);
 assert.throws(()=>techniqueTarget([{actor:target},{actor:target}]),/somente um alvo/);
});
test("múltiplos alvos bloqueiam antes de rolar ou gastar CE",async()=>{
 const r=runtime();game.user.targets=new Set([{actor:r.actor},{actor:r.actor}]);await useTechnique(r.actor,r.item);
 assert.equal(r.evaluations(),0);assert.equal(r.updates.length,0);assert.equal(r.renders.length,0);
 assert.match(r.notices.at(-1),/somente um alvo/);game.user.targets=new Set();
});
test("mudança na técnica durante diálogo ou status durante rolagem invalida pagamento",async()=>{
 const old=console.error;console.error=()=>{};
 try{
  const a=runtime();foundry.applications.api.DialogV2.wait=async()=>{a.item.system.power=20;return {};};await useTechnique(a.actor,a.item);assert.equal(a.updates.length,0);assert.equal(a.evaluations(),0);
  const b=runtime(),evaluate=Roll.prototype.evaluate;Roll.prototype.evaluate=async function(){const result=await evaluate.call(this);if(this.formula.includes("d10"))b.actor.system.profile.status="gold";return result;};
  await useTechnique(b.actor,b.item);assert.equal(b.updates.length,0);assert.equal(b.sent.length,0);assert.match(b.notices.at(-1),/nenhum recurso/);
 }finally{console.error=old;}
});
test("resistência usa PC do cartão e recusa ficha diferente do alvo",async()=>{
 const r=runtime();r.actor.uuid="Actor.defender";foundry.applications.api.DialogV2.wait=async()=>({difficulty:1,bonus:0,advantage:0});
 await rollTest(r.actor,"resistance","vig",{difficulty:15,resistanceAttack:{targetUuid:r.actor.uuid,name:"Ataque",damage:20,armorDamage:10,powerCosmic:15}});
 assert.equal(r.sent[0].flags["gods-battle-ss"].difficulty,15);assert.equal(r.updates.length,0);
 await assert.rejects(()=>rollTest(r.actor,"resistance","vig",{difficulty:15,resistanceAttack:{targetUuid:"Actor.other"}}),/alvo marcado/);
});

test("resistência de Sustentada e Controle legado separa efeito de dano mesmo com números herdados",()=>{
 const s=system();for(const effectKind of ["sustained","control","manual","unknown"]){for(const [total,resisted]of [[9,false],[10,false],[19,false],[20,true],[31,true]]){const r=resistancePreview(s,[],{effectKind,damage:50,armorDamage:30,powerCosmic:20},total);assert.equal(r.application,effectKind);assert.equal(r.isSustained,effectKind==="sustained");assert.equal(r.effectsResisted,resisted);assert.equal(r.doubleDuration,total<10);assert.equal(r.damage,undefined);assert.equal(r.armorDamage,undefined);assert.ok(r.manualEffect);}}
 for(const effectKind of [undefined,"damage"]){const r=resistancePreview(s,[],{effectKind,damage:10,armorDamage:30,powerCosmic:20},5);assert.equal(r.application,"damage");assert.equal(r.damage,40);}
});
test("resistência de Sustentada e Controle sem metadados não publica resolvedDamage nem altera recursos",async()=>{
 for(const effectKind of ["sustained","control","manual"]){const r=runtime({faces:[5]});foundry.applications.api.DialogV2.wait=async()=>({bonus:0,advantage:0,difficulty:1});const before=structuredClone(r.actor.system);await rollTest(r.actor,"resistance","vig",{difficulty:20,resistanceAttack:{name:"Efeito",effectKind,messageId:"root",targetUuid:r.actor.uuid,powerCosmic:20,damage:50,armorDamage:30}});const f=r.sent[0].flags["gods-battle-ss"];assert.equal(f.difficulty,20);assert.equal(f.resolvedDamage,undefined);assert.equal(f.controlResolution,undefined);assert.ok(f.resistance.manualEffect);assert.deepEqual(r.actor.system,before);assert.equal(r.updates.length,0);}
});
