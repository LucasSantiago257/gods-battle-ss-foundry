import {ATTRIBUTES, SKILLS, FIGHTING, STYLES, STATUS, STAGES, NATURES, ARMORS, CONDITIONS} from "./config.mjs";
import {EFFECT_KINDS,TECHNIQUE_MODES} from "./technique-rules.mjs";
import {ABILITY_KINDS} from "./catalog.mjs";
import {migrateKnightSource} from "./migrations.mjs";
const {NumberField, StringField, BooleanField, SchemaField} = foundry.data.fields;
const num = (initial = 0, min = 0, max) => new NumberField({required: true, nullable: false, initial, integer: true, min, ...(max === undefined ? {} : {max})});
// Listas como "Automático" usam "" como escolha válida; blank deve ser explícito.
const text = (initial = "", choices) => new StringField({required: true, nullable: false,
  blank: !choices || Object.hasOwn(choices, ""), initial, ...(choices ? {choices: Object.keys(choices)} : {})});
const flag = () => new BooleanField({initial: false});
const schema = obj => new SchemaField(obj);
const resource = value => schema({value: new NumberField({required: true, nullable: false, initial: value, min: -100000}), max: num(value), manualMax: num(), bonus: num(0, -100000), unlimited: flag()});

export class KnightData extends foundry.abstract.TypeDataModel {
  static migrateData(source) {super.migrateData(source); return migrateKnightSource(source);}
  static defineSchema() {
    return {
      schemaVersion: num(3, 1), automation: schema({enabled: new BooleanField({initial:true}), healthBonus: num(), resistanceBonus: num(), techniqueND: num(), physicalDamage: num(), testSen: num(), resistanceCos: num(), resistanceSen: num()}),
      profile: schema({level: num(1, 1, 100), style: text("saint", STYLES), status: text("bronze", STATUS), nature: text("physical", NATURES), specialization: text(),
        nationality: text(), age: text(), height: text(), weight: text(), appearance: text(), essence: text("Bom"), personality: text(), sign: text(), quality: text(), flaw: text(),
        sanctuary: text(), deity: text(), master: text(), trainingPlace: text(), biography: text(), companionUuid: text()}),
      attributes: schema(Object.fromEntries(Object.keys(ATTRIBUTES).map(k => [k, schema({value: num(1, 0, 12), effective: num(1, 0, 12), bonus: num(0, -100), mod: num(0, -100)})]))),
      skills: schema(Object.fromEntries(Object.keys(SKILLS).map(k => [k, schema({value: num(0, 0, 10), bonus: num(0, -100), effectBonus: num(), associated: text("", {"": "Automático", ...ATTRIBUTES}), attribute: text("for", ATTRIBUTES), mod: num(), total: num(0, -1000)})]))),
      fighting: schema(Object.fromEntries(Object.keys(FIGHTING).map(k => [k, num(0, 0, 5)]))),
      resources: schema({health: resource(21), cosmo: resource(1), maximum: schema({value: num(0, 0, 20), max: num(20, 20, 20)}),
        cosmoExtra: num(), cosmoReserved: num(), cosmoOverload: num(), determination: schema({value: num(1), max: num(1), objective: text()}), pride: schema({value: num(), max: num(), objective: text()})}),
      combat: schema({levelBonus: num(0, -100), attackBonus: num(0, -100), defenseBonus: num(0, -100), protectionBonus: num(0, -100), powerBonus: num(0, -100),
        resistanceBonus: num(0, -100), initiativeBonus: num(0, -100), domainBonus: num(0, -100), attention: num(0, -5, 5), attackLevel: num(3), damageBonus: num(), woundCategory: num(0, 0, 3), asterismPenalty: num(0, -100, 0),
        levelModifier: num(), attack: num(), defense: num(), protection: num(), cosmicPower: num(), initiative: num(), passiveEvasion: num(), passiveDuel: num(), intuition: num(),
        domain: new NumberField({initial: 4.5}), physicalDamageBonus: num(), techniqueDamageBonus: num(), divineSpeed: num(), resistances: schema({vig: num(), vel: num(), sen: num(), cos: num()})}),
      movement: schema({walk: new NumberField({initial: 6}), run: new NumberField({initial: 18}), jump: new NumberField({initial: 3}), lift: num(10), break: num(5)}),
      creation: schema({training: num(8), total: num(5), budget: num(14), virtueBudget: num(2), skillBudget: num(9)}),
      creationGuide: schema({status:text("draft",{"":"Edição normal",draft:"Rascunho",complete:"Concluída"}),step:num(1,1,6),styleApplied:text("",{"":"Ainda não aplicado",...STYLES}),extraSkill:text("",{"":"Selecionar",...SKILLS}),fightChoice:text("punch",{punch:"Soco",kick:"Chute"}),acceptExceptions:flag(),exceptionReason:text(),initializeResources:new BooleanField({initial:true})}),
      conditions: schema(Object.fromEntries(Object.keys(CONDITIONS).map(k => [k, flag()]))),
      sense: schema({ordinal: num(6, 6, 9), stage: text("awakened", STAGES), levelBonus: num(), domainBonus: num(), initiative: num(2), speedSuperated: flag(), aura: text(), characteristics: text()}),
      progression: schema({xp: num(), skillBank:num(),attributeBank:num(),fightBank:num(),epicActions:num(),epicCosmo:num(),evolution:text("",{"":"Ainda não escolhida",aesir:"Aesir",gold:"Cavaleiro de Ouro",judges:"Juiz do Inferno",marinas:"General Marina",dryads:"Dríade",berserkers:"Berserker"}),missions: num(), combats: num(), legend: num(0, 0, 5), refinements: num(), godComplex: num(0, 0, 5), skillSpent: num(), trainingAdjust: num(0, -100),
        legion: text(), disciples: text(), strengthening: text(), history: text()})
    };
  }
}

export class ContentData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      schemaVersion: num(1, 1), rulesEnabled: new BooleanField({initial:true}), rulesAccepted: flag(), acquisitionLevel: num(), attributeChoice1: text("", {"":"Selecionar",...ATTRIBUTES}), attributeChoice2: text("", {"":"Selecionar",...ATTRIBUTES}), description: text(), page: text(), sourceVersion: text("PDF V49.1.1"), originUuid: text(), requirements: text(),
      equipped: flag(), class: text("bronze", ARMORS), version: num(1, 1, 5), constellation: text(), affinity: num(0, 0, 20), state: text("active"),
      health: resource(30), protectionBonus: num(0, -100), cosmoBonus: num(0, -100), accessories: text(),
      armor: schema({hp: num(30), pa: num(3), ce: num(3), minimum: num(1), unlimited: flag()}),
      nature: text("physical", {"": "Selecionar na cópia", ...NATURES}), classification: text("bronze"), techniqueMode:text("manual",TECHNIQUE_MODES), effectKind: text("damage", EFFECT_KINDS), power: num(10), damageLevel: num(2), cost: num(2), costExtra: num(), range: new NumberField({initial: 3, min: 0}), techniqueReviewed: flag(),
      duration: text("Instantânea"), resistance: text(), bigbangs: text(), increments: text(), category: text(), level: num(1, 1), action: text(), combination: text(),
      abilityKind: text("ability", ABILITY_KINDS), costText: text(),
      uses: schema({value: num(), max: num(), reset: text("dia")}), rank: num(1, 1, 10), active: flag(), notes: text()
    };
  }
}
