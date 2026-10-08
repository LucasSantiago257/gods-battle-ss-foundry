// Contrato mínimo para testes unitários. Não substitui execução no servidor Foundry.
class Field {constructor(options = {}) {this.options = options;}}
class SchemaField {constructor(fields) {this.fields = fields;}}
export function defaults(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field instanceof SchemaField ? defaults(field.fields) : field.options.initial ?? ""]));
}
export class SheetStub {
  constructor(document) {this.document = document; this.actor = document; this.item = document; this.isEditable = document.isOwner ?? true;}
  async _prepareContext() {return {};}
  _prepareTabs(group) {return Object.fromEntries(this.constructor.TABS[group].tabs.map(tab => [tab.id, {...tab, group, cssClass: tab.id === "overview" ? "active" : ""} ]));}
  async _onDropItem(_event, item) {return this.actor.acceptDrop(item);}
}
export function installStub() {
  globalThis.foundry = {data: {fields: {NumberField: Field, StringField: Field, BooleanField: Field, SchemaField}}, abstract: {TypeDataModel: class {}},
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
