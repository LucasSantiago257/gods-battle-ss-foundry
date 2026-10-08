import {SYSTEM_ID, ATTRIBUTES, STYLES, SKILLS, FIGHTING, NATURES, ARMORS, ITEM_TYPES, STATUS, STAGES, CONDITIONS} from "./config.mjs";
import {rollTest} from "./rolls.mjs";
import {createStarterCompendium} from "./starter.mjs";
import {useTechnique} from "./techniques.mjs";
import {EFFECT_KINDS, techniqueReadiness} from "./technique-rules.mjs";
import {ABILITY_KINDS, openCatalog} from "./catalog.mjs";
import {calculationSummary} from "./calculations.mjs";
import {evaluatePassives, passiveDefinition, passiveWarnings} from "./passives.mjs";
import {attackTarget} from "./combat.mjs";
import {CREATION_STEPS,creationReview} from "./creation-rules.mjs";
import {beginCreation,chooseCreationItem,applyInitialStyle,finishCreation} from "./creation.mjs";
import {recoverDamageOperation} from "./damage.mjs";
import {openTestActors,importTestActors} from "./combat-examples.mjs";

export function field(name, label, value, choices, type = "number", hint = "") {
  return {name, label, value, hint, isSelect: !!choices, isCheckbox: type === "checkbox", isTextarea: type === "textarea", isNumber: type === "number", type,
    choices: choices ? Object.entries(choices).map(([v, t]) => ({value: v, label: typeof t === "string" ? t : t.label, selected: String(v) === String(value)})) : []};
}
const tf = (name, label, value, hint = "") => field(name, label, value, null, "text", hint);
const nf = (name, label, value, hint = "") => field(name, label, value, null, "number", hint);
const area = (name, label, value) => field(name, label, value, null, "textarea");

export class KnightSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["gods-battle", "knight-sheet"], tag: "form", position: {width: 920, height: 800},
    form: {submitOnChange: true, closeOnSubmit: false},
    actions: {rollTest: KnightSheet.rollAction, createItem: KnightSheet.createItem, editItem: KnightSheet.editItem,
      deleteItem: KnightSheet.deleteItem, equipArmor: KnightSheet.equipArmor, useItem: KnightSheet.useItem, useTechnique: KnightSheet.activateTechnique, attackTarget:KnightSheet.attackTarget,
      beginCreation:KnightSheet.beginCreation,guideStep:KnightSheet.guideStep,chooseCreationItem:KnightSheet.chooseCreationItem,applyInitialStyle:KnightSheet.applyInitialStyle,finishCreation:KnightSheet.finishCreation,recoverDamage:KnightSheet.recoverDamage,openCatalog: KnightSheet.openCatalog, seedCompendium: KnightSheet.seedCompendium,openTestActors:KnightSheet.openTestActors,importTestActors:KnightSheet.importTestActors}
  };
  static PARTS = {sheet: {template: `systems/${SYSTEM_ID}/templates/knight.hbs`, scrollable: [".sheet-body"]}};
  static TABS = {primary: {initial: "overview", tabs: [
    {id: "overview", label: "Visão geral"}, {id: "combat", label: "Combate"}, {id: "skills", label: "Perícias"},
    {id: "techniques", label: "Técnicas"}, {id: "powers", label: "Poderes"}, {id: "equipment", label: "Armadura"}, {id: "story", label: "História e evolução"}
  ]}};
  async _onRender(context, options) {
    await super._onRender(context, options);
    const body = this.element.querySelector(".sheet-body");
    // Encaminha o payload nativo ao ActorSheetV2, sem depender de opções appv1.
    body.addEventListener("dragover", event => {if (this.isEditable) event.preventDefault();});
    body.addEventListener("drop", event => {
      event.preventDefault(); event.stopPropagation();
      if (this.isEditable) this._onDrop(event).catch(error => {console.error(error); ui.notifications.error("Não foi possível importar o conteúdo.");});
    });
    body.addEventListener("dragstart", event => {
      const row = event.target.closest("[data-item-id]");
      if (!row) return;
      event.stopPropagation();
      if (!this.isEditable) return event.preventDefault();
      const item = this.actor.items.get(row.dataset.itemId);
      if (item) event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
    });
  }
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const s = this.actor.system;
    const f = (path, label, value, choices) => field(`system.${path}`, label, value, choices);
    const n = (path, label, value, hint) => nf(`system.${path}`, label, value, hint);
    const t = (path, label, value) => tf(`system.${path}`, label, value);
    const groups = Object.fromEntries(Object.entries(ITEM_TYPES).map(([type, label]) => [type, {type, label, items: []}]));
    for (const item of this.actor.items.contents.toSorted((a, b) => a.sort - b.sort)) groups[item.type]?.items.push({id: item.id, uuid: item.uuid, name: item.name, img: item.img, equipped: item.system.equipped,
      isArmor: item.type === "armor", isTechnique: item.type === "technique", needsReview: item.type === "technique" && !!techniqueReadiness(item), uses: item.system.uses, hasUses: item.system.uses.max > 0, subtitle: item.type === "armor" ? `${ARMORS[item.system.class].label} V${item.system.version} · PV ${item.system.health.value}/${item.system.health.max} · PA ${item.system.armor.pa}` : item.type === "technique" ? techniqueReadiness(item) ? "Configure a cópia / confira a aplicação manual" : `${item.system.classification} · ${EFFECT_KINDS[item.system.effectKind]} · CE ${item.system.cost + item.system.costExtra} · ND ${item.system.damageLevel}` : item.system.category,
      origin: item.system.originUuid} );
    return Object.assign(context, {
      actor: this.actor, system: s, editable: this.isEditable, isGM: game.user.isGM, tabs: this._prepareTabs("primary"), groups,
      calculations: calculationSummary(s, game.settings.get(SYSTEM_ID, "resistanceMode")),
      passiveLedger: evaluatePassives(s,this.actor.items.contents).ledger,
      damageLedger:Object.entries(this.actor.flags?.[SYSTEM_ID]?.damageOperations??{}).map(([key,r])=>({key,...r,statusLabel:{applied:"Aplicado",undone:"Desfeito",prepared:"Interrompido",repair:"Revisão necessária",failed:"Não aplicado"}[r.status]??r.status,canRecover:game.user.isGM&&["prepared","repair"].includes(r.status)})).toSorted((a,b)=>b.time-a.time).slice(0,20),
      creationGuide: s.creationGuide.status==="draft" ? {...creationReview(s,this.actor.items.contents,this.actor.name),step:s.creationGuide.step,current:CREATION_STEPS[s.creationGuide.step-1],steps:CREATION_STEPS.map((step,index)=>({...step,index:index+1,active:index+1===s.creationGuide.step})),
        fields:[field("system.creationGuide.extraSkill","Perícia livre do estilo",s.creationGuide.extraSkill,{"":"Selecionar",...Object.fromEntries(Object.entries(SKILLS).map(([key,def])=>[key,def.label]))}),field("system.creationGuide.fightChoice","Santo / Asgardiano: luta inicial",s.creationGuide.fightChoice,{punch:"Soco",kick:"Chute"}),field("system.creationGuide.acceptExceptions","Aceitar pendências como exceções da campanha",s.creationGuide.acceptExceptions,null,"checkbox"),tf("system.creationGuide.exceptionReason","Justificativa das exceções",s.creationGuide.exceptionReason),field("system.creationGuide.initializeResources","Preencher PV e CE atuais ao concluir",s.creationGuide.initializeResources,null,"checkbox")]} : null,
      canBeginCreation:this.isEditable && s.profile.level===1 && s.creationGuide.status==="",
      resistancePolicy: game.settings.get(SYSTEM_ID, "resistanceMode") === "rank" ? "Graduação + modificador de nível (provisório)" : "Modificador do atributo + modificador de nível",
      attributes: Object.entries(ATTRIBUTES).map(([key, label]) => ({key, label, ...s.attributes[key]})),
      overview: [f("profile.level", "Nível", s.profile.level), f("profile.style", "Estilo", s.profile.style, STYLES), f("profile.status", "Status do cavaleiro", s.profile.status, STATUS), f("profile.nature", "Natureza do Cosmo", s.profile.nature, NATURES),
        t("profile.specialization", "Especialização", s.profile.specialization), field("system.automation.enabled", "Automatizar bônus conferidos (revise os ajustes manuais antes de ativar)", s.automation.enabled, null, "checkbox"), n("resources.health.manualMax", "PV máximo manual", s.resources.health.manualMax, "0 usa estilo, crescimento a partir do nível 2 e Vigor."),
        n("resources.health.bonus", "PV extras", s.resources.health.bonus), n("resources.cosmo.bonus", "CE extras na capacidade", s.resources.cosmo.bonus), n("resources.cosmoExtra", "CE extra acumulada", s.resources.cosmoExtra),
        n("resources.cosmoReserved", "CE reservada", s.resources.cosmoReserved, "Parte da CE atual protegida do gasto automático."), n("resources.cosmoOverload", "CE queimada além do corpo", s.resources.cosmoOverload, "Excesso acumulado: ajuste manualmente após recuperação conforme o livro.")],
      movement: [{label: "Movimento", value: `${s.movement.walk} m`}, {label: "Corrida", value: `${s.movement.run} m`}, {label: "Salto", value: `${s.movement.jump} m`}, {label: "Erguer", value: `${s.movement.lift} kg`}, {label: "Quebrar", value: `${s.movement.break} cm`}],
      totals: [{label: "Ataques", value: s.combat.attack}, {label: "Defesas", value: s.combat.defense}, {label: "PA", value: s.combat.protection}, {label: "Poder Cósmico", value: s.combat.cosmicPower},
        {label: "Iniciativa", value: s.combat.initiative}, {label: "Mod. de nível", value: s.combat.levelModifier}, {label: "Esquiva passiva", value: s.combat.passiveEvasion}, {label: "Duelo passivo", value: s.combat.passiveDuel},
        {label: "Intuição", value: s.combat.intuition}, {label: "Domínio", value: `${s.combat.domain} m`}],
      combatFields: [n("combat.asterismPenalty", "Penalidade no próximo Asterismo", s.combat.asterismPenalty, "Falha crítica aplica −10; o próximo teste consome a penalidade."), n("combat.attackLevel", "Nível de Ataque (manual)", s.combat.attackLevel), n("combat.damageBonus", "Bônus aplicado ao dano", s.combat.damageBonus), n("combat.attackBonus", "Ataques extras", s.combat.attackBonus),
        n("combat.defenseBonus", "Defesas extras", s.combat.defenseBonus), n("combat.protectionBonus", "PA extra", s.combat.protectionBonus), n("combat.levelBonus", "Modificador de nível extra", s.combat.levelBonus),
        n("combat.powerBonus", "Poder Cósmico extra", s.combat.powerBonus), n("combat.resistanceBonus", "Resistência extra", s.combat.resistanceBonus), n("combat.initiativeBonus", "Iniciativa extra", s.combat.initiativeBonus),
        n("combat.domainBonus", "Domínio extra", s.combat.domainBonus), n("combat.attention", "Atenção / Intuição", s.combat.attention), n("combat.woundCategory", "Categoria de dano", s.combat.woundCategory)],
      fighting: Object.entries(FIGHTING).map(([key, label]) => n(`fighting.${key}`, label, s.fighting[key])),
      resistances: ["vig", "vel", "sen", "cos"].map(key => ({key, label: ATTRIBUTES[key], value: s.combat.resistances[key]})),
      conditions: Object.entries(CONDITIONS).map(([key, label]) => field(`system.conditions.${key}`, label, s.conditions[key], null, "checkbox")),
      skills: Object.entries(SKILLS).map(([key, def]) => ({key, label: def.label, ...s.skills[key], attributeLabel: ATTRIBUTES[s.skills[key].attribute],
        associations: field(`system.skills.${key}.associated`, "Atributo", s.skills[key].associated, {"": "Automático", ...ATTRIBUTES}).choices})),
      senseFields: [n("sense.ordinal", "Sentido (6 a 9)", s.sense.ordinal), f("sense.stage", "Estágio", s.sense.stage, STAGES), n("sense.levelBonus", "Bônus de nível do sentido", s.sense.levelBonus),
        n("sense.domainBonus", "Bônus de Domínio do sentido", s.sense.domainBonus), n("sense.initiative", "Iniciativa do sentido", s.sense.initiative), field("system.sense.speedSuperated", "Velocidade superada (+)", s.sense.speedSuperated, null, "checkbox"),
        t("sense.aura", "Aura", s.sense.aura), area("system.sense.characteristics", "Características do sentido", s.sense.characteristics)],
      progression: [n("progression.xp", "Experiência", s.progression.xp), n("progression.missions", "Missões", s.progression.missions), n("progression.combats", "Combates", s.progression.combats), n("progression.legend", "Lenda", s.progression.legend),
        n("progression.refinements", "Pontos de refino", s.progression.refinements), n("progression.godComplex", "Complexo de Deus", s.progression.godComplex), n("progression.skillSpent", "Pontos de perícia gastos", s.progression.skillSpent),
        n("progression.trainingAdjust", "Atributos extras de criação", s.progression.trainingAdjust), t("progression.legion", "Legião / PL", s.progression.legion), t("profile.companionUuid", "UUID da besta / companheiro", s.profile.companionUuid),
        area("system.progression.disciples", "Discípulos", s.progression.disciples), area("system.progression.strengthening", "Fortalecimentos", s.progression.strengthening), area("system.progression.history", "Histórico de evolução", s.progression.history)],
      biography: [t("profile.nationality", "Nacionalidade", s.profile.nationality), t("profile.age", "Idade", s.profile.age), t("profile.height", "Altura", s.profile.height), t("profile.weight", "Peso", s.profile.weight),
        t("profile.appearance", "Aparência", s.profile.appearance), t("profile.essence", "Essência", s.profile.essence), t("profile.personality", "Personalidade", s.profile.personality), t("profile.sign", "Signo", s.profile.sign),
        t("profile.quality", "Qualidade", s.profile.quality), t("profile.flaw", "Defeito", s.profile.flaw), t("profile.sanctuary", "Santuário", s.profile.sanctuary), t("profile.deity", "Deus", s.profile.deity),
        t("profile.master", "Mestre", s.profile.master), t("profile.trainingPlace", "Local de treino", s.profile.trainingPlace), area("system.profile.biography", "Biografia e ideais", s.profile.biography), tf("img", "URL do retrato", this.actor.img)],
      will: [n("resources.determination.value", "Determinação atual", s.resources.determination.value), n("resources.determination.max", "Determinação máxima", s.resources.determination.max), t("resources.determination.objective", "Proteger / objetivo", s.resources.determination.objective),
        n("resources.pride.value", "Orgulho atual", s.resources.pride.value), n("resources.pride.max", "Orgulho máximo", s.resources.pride.max), t("resources.pride.objective", "Orgulho / objetivo", s.resources.pride.objective)]
    });
  }
  async _onDropItem(event, item) {
    if (!this.isEditable || !ITEM_TYPES[item.type]) return;
    const sameActor = item.parent === this.actor;
    const result = await super._onDropItem(event, item);
    if (result && !sameActor) await result.update({"system.originUuid": item.uuid, "system.equipped": false});
    return result;
  }
  static async rollAction(_event, target) { await rollTest(this.actor, target.dataset.kind, target.dataset.key); }
  static async attackTarget() {if(this.isEditable) await attackTarget(this.actor);}
  static async openTestActors() {return openTestActors();}
  static async importTestActors() {return importTestActors();}
  static async beginCreation() {if(this.isEditable) await beginCreation(this.actor);}
  static async guideStep(_event,target) {if(!this.isEditable)return;const step=Number(target.dataset.step);if(!CREATION_STEPS[step-1])return;await this.actor.update({"system.creationGuide.step":step});this.changeTab(CREATION_STEPS[step-1].tab,"primary");}
  static async chooseCreationItem(_event,target) {if(this.isEditable)try{await chooseCreationItem(this.actor,target.dataset.slot);}catch(error){ui.notifications.error(error.message);}}
  static async applyInitialStyle() {if(this.isEditable)try{await applyInitialStyle(this.actor);}catch(error){ui.notifications.error(error.message);}}
  static async finishCreation() {if(this.isEditable)try{await finishCreation(this.actor);}catch(error){ui.notifications.error(error.message);}}
  static async recoverDamage(_event,target) {if(this.isEditable&&game.user.isGM)try{await recoverDamageOperation(this.actor,target.dataset.operation);}catch(error){ui.notifications.error(error.message);}}
  static async activateTechnique(_event, target) {
    if (!this.isEditable) return;
    await useTechnique(this.actor, this.actor.items.get(target.closest("[data-item-id]").dataset.itemId));
  }
  static async createItem(_event, target) {
    if (!this.isEditable || !ITEM_TYPES[target.dataset.itemType]) return;
    const [item] = await this.actor.createEmbeddedDocuments("Item", [{name: `Nova ${ITEM_TYPES[target.dataset.itemType]}`, type: target.dataset.itemType, img: `systems/${SYSTEM_ID}/assets/cosmos.svg`}]);
    item.sheet.render(true);
  }
  static editItem(_event, target) { this.actor.items.get(target.closest("[data-item-id]").dataset.itemId)?.sheet.render(true); }
  static async deleteItem(_event, target) {
    if (!this.isEditable) return;
    const id = target.closest("[data-item-id]").dataset.itemId;
    const confirmed = await foundry.applications.api.DialogV2.confirm({window: {title: "Remover conteúdo da ficha"}, content: "<p>Remover esta cópia? O compêndio de origem será preservado.</p>"});
    if (confirmed) await this.actor.deleteEmbeddedDocuments("Item", [id]);
  }
  static async equipArmor(_event, target) { await this.actor.equipArmor(this.actor.items.get(target.closest("[data-item-id]").dataset.itemId)); }
  static async useItem(_event, target) {
    if (!this.isEditable) return;
    const item = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    if (item.system.uses.value <= 0) return ui.notifications.warn("Sem usos disponíveis.");
    await item.update({"system.uses.value": item.system.uses.value - 1});
  }
  static async seedCompendium() { await createStarterCompendium(); }
  static async openCatalog(_event, target) {await openCatalog(target.dataset.pack);}
}

export class ContentSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  static DEFAULT_OPTIONS = {classes: ["gods-battle", "content-sheet"], tag: "form", position: {width: 620, height: 760}, form: {submitOnChange: true, closeOnSubmit: false}, actions: {useTechnique: ContentSheet.activateTechnique, openReference: ContentSheet.openReference}};
  static PARTS = {sheet: {template: `systems/${SYSTEM_ID}/templates/content.hbs`, scrollable: [".content-body"]}};
  async _prepareContext(options) {
    const context = await super._prepareContext(options), s = this.item.system;
    const n = (key, label, hint) => nf(`system.${key}`, label, s[key], hint);
    const t = (key, label) => tf(`system.${key}`, label, s[key]);
    const fields = [tf("img", "URL da imagem", this.item.img), t("page", "Página do livro"), t("sourceVersion", "Versão da fonte"), area("system.requirements", "Pré-requisitos", s.requirements)];
    if (this.item.type === "armor") fields.push(field("system.class", "Classe", s.class, ARMORS), n("version", "Versão (V1 a V5)"), t("constellation", "Constelação"), n("affinity", "Afinidade (penalidade)"),
      nf("system.health.value", "PV atuais da armadura", s.health.value), nf("system.health.manualMax", "PV máximo manual", s.health.manualMax, "0 usa a tabela de classe e versão."), nf("system.health.bonus", "PV extras", s.health.bonus),
      n("protectionBonus", "PA extra"), n("cosmoBonus", "CE extra"), field("system.state", "Estado", s.state, {active: "Viva", recovering: "Em recuperação", dead: "Morta"}), area("system.accessories", "Acessórios e recipiente", s.accessories));
    if (this.item.type === "technique") fields.push(field("system.classification", "Classe da técnica", s.classification, {bronze: "Bronze", silver: "Prata", gold: "Ouro"}), field("system.nature", "Natureza", s.nature, {"": "Selecionar na cópia", ...NATURES}),
      field("system.effectKind", "Big Bang primordial", s.effectKind, EFFECT_KINDS),
      n("power", "Poder da técnica"), n("damageLevel", "Nível de Dano"), n("cost", "Custo publicado (já inclui Big Bangs)"), n("costExtra", "CE adicional desta cópia"), n("range", "Alcance (metros)"), t("duration", "Duração"), t("resistance", "Resistência"),
      area("system.bigbangs", "Big Bangs / componentes", s.bigbangs), area("system.increments", "Incrementos / graduações", s.increments));
    if (["ability", "divineCosmo", "bigbang", "increment", "virtue", "artifact"].includes(this.item.type)) fields.push(t("category", "Categoria / origem"), n("level", "Nível / requisito"), n("rank", "Graduação / refino"), t("action", "Ação"), t("resistance", "Resistência"), t("duration", "Duração"), t("combination", "Combinação"), n("power", "Poder equivalente"));
    if (this.item.type === "ability") fields.push(field("system.abilityKind", "Tipo", s.abilityKind, ABILITY_KINDS));
    if (["ability", "divineCosmo", "virtue", "bigbang", "increment", "technique"].includes(this.item.type)) fields.push(t("costText", "Custo / consumo descrito"));
    fields.push(nf("system.uses.value", "Usos atuais", s.uses.value), nf("system.uses.max", "Usos máximos (0: sem contador)", s.uses.max), tf("system.uses.reset", "Recarga", s.uses.reset), area("system.description", "Descrição e efeitos", s.description), area("system.notes", "Notas desta cópia", s.notes));
    const source = this.item.flags?.[SYSTEM_ID]?.source;
    const definition = passiveDefinition(this.item);
    if (definition) {
      fields.unshift(field("system.rulesEnabled", "Aplicar os efeitos conferidos desta cópia", s.rulesEnabled, null, "checkbox"), field("system.rulesAccepted", "Aceitar exceção aos pré-requisitos após conferência", s.rulesAccepted, null, "checkbox"), nf("system.acquisitionLevel", "Nível em que foi adquirido", s.acquisitionLevel));
      if (definition.requiresActive) fields.unshift(field("system.active", "Melhoria ativa (conferi a ação necessária)",s.active,null,"checkbox"));
      if (definition.rules.some(r=>r.target.startsWith("choice"))) fields.unshift(field("system.attributeChoice1","Primeiro ponto de atributo",s.attributeChoice1,{"":"Selecionar",...ATTRIBUTES}),field("system.attributeChoice2","Segundo ponto de atributo",s.attributeChoice2,{"":"Selecionar",...ATTRIBUTES}));
    }
    if (this.item.type === "technique" && source?.reference?.reviewRequired && !source.reference.manualOnly) fields.unshift(field("system.techniqueReviewed", "Revisei natureza, efeito, custo, Poder, ND, alcance e regras desta cópia", s.techniqueReviewed, null, "checkbox"));
    const bookReference = source ? {description: s.description, pages: s.page, author: source.author, license: source.license,
      references: Array.isArray(source.references) ? source.references.filter(r => /^Compendium\.gods-battle-ss\.componentes-tecnicas\.Item\.[a-f0-9]{16}$/.test(r.uuid)) : [],
      occurrences: Array.isArray(source.occurrences) ? source.occurrences.map(o => ({name: o.name, category: o.category, pages: Array.isArray(o.pages) ? o.pages.join(", ") : "", text: o.text})) : []} : null;
    return Object.assign(context, {item: this.item, editable: this.isEditable, fields, typeLabel: ITEM_TYPES[this.item.type], armor: this.item.type === "armor" ? s.armor : null,
      technique: this.item.type === "technique" ? {cost: s.cost + s.costExtra, difficulty: 10 + s.cost + s.costExtra, damage: s.power * s.damageLevel, reviewMessage: techniqueReadiness(this.item), canActivate: this.isEditable && this.item.parent?.type === "knight" && !techniqueReadiness(this.item)} : null, origin: s.originUuid, bookReference,
      ruleReference: definition ? {...definition, statusLabel: {automated:"Automatizada",partial:"Parcialmente automatizada",manual:"Aplicação manual"}[definition.status], warnings: this.item.parent?.type === "knight" ? passiveWarnings(this.item.parent.system,this.item) : []} : null});
  }
  static async activateTechnique() {if (this.isEditable) await useTechnique(this.item.parent, this.item);}
  static async openReference(_event, target) {
    const uuid = target.dataset.uuid;
    if (!/^Compendium\.gods-battle-ss\.componentes-tecnicas\.Item\.[a-f0-9]{16}$/.test(uuid)) return;
    const pack = game.packs.get("gods-battle-ss.componentes-tecnicas");
    if (!pack?.testUserPermission(game.user, "OBSERVER")) return ui.notifications.warn("O mestre precisa permitir a consulta deste compêndio.");
    const document = await fromUuid(uuid);
    if (document?.testUserPermission(game.user, "OBSERVER")) document.sheet.render(true);
  }
}
