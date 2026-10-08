// Contrato mínimo para testes unitários. Não substitui execução no servidor Foundry.
class Field {constructor(options = {}) {this.options = options;}}
// Contrato restrito de StringField: branco e escolhas. Não executa o core Foundry.
class StringField extends Field {
  constructor(options = {}) {super({blank: !options.choices, ...options});}
  validate(value) {
    if (typeof value !== "string") throw Error("must be a string");
    if (!this.options.blank && value === "") throw Error("can't be blank");
    if (this.options.choices && !this.options.choices.includes(value)) throw Error("invalid choice");
  }
}
class SchemaField {constructor(fields) {this.fields = fields;}}
export function defaults(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field instanceof SchemaField ? defaults(field.fields) : field.options.initial ?? ""]));
}
export function validateStrings(fields, data, prefix = "system") {
  const errors = [];
  for (const [key, field] of Object.entries(fields)) {
    const path = `${prefix}.${key}`;
    if (field instanceof SchemaField) {
      try {validateStrings(field.fields, data[key], path);} catch (error) {errors.push(error.message);}
    } else if (field instanceof StringField) {
      try {field.validate(data[key]);} catch (error) {errors.push(`${path}: ${error.message}`);}
    }
  }
  if (errors.length) throw Error(errors.join("\n"));
}
export class SheetStub {
  constructor(document) {this.document = document; this.actor = document; this.item = document; this.isEditable = document.isOwner ?? true;}
  async _prepareContext() {return {};}
  _prepareTabs(group) {return Object.fromEntries(this.constructor.TABS[group].tabs.map(tab => [tab.id, {...tab, group, cssClass: tab.id === "overview" ? "active" : ""} ]));}
  async _onDropItem(_event, item) {return this.actor.acceptDrop(item);}
}
export function installStub() {
  globalThis.foundry = {data: {fields: {NumberField: Field, StringField, BooleanField: Field, SchemaField}}, abstract: {TypeDataModel: class {}},
    applications: {api: {HandlebarsApplicationMixin: cls => cls}, sheets: {ActorSheetV2: SheetStub, ItemSheetV2: SheetStub}}};
  globalThis.game = {settings: {get: () => "rank"}, user: {isGM: true}};
  globalThis.Actor = class {prepareDerivedData() {}};
  globalThis.Item = class {prepareDerivedData() {}};
}
installStub();
const {KnightData, ContentData} = await import("../module/models.mjs");
export function knight(overrides = {}) {return {...defaults(KnightData.defineSchema()), ...overrides};}
export function armor() {return defaults(ContentData.defineSchema());}
export function content() {return defaults(ContentData.defineSchema());}
