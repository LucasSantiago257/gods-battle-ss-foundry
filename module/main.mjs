import {SYSTEM_ID, ITEM_TYPES} from "./config.mjs";
import {KnightData, ContentData} from "./models.mjs";
import {BattleActor, BattleItem} from "./documents.mjs";
import {KnightSheet, ContentSheet} from "./sheets.mjs";
import {createStarterCompendium} from "./starter.mjs";
import {renderTechniqueChat} from "./techniques.mjs";
import {openCatalog} from "./catalog.mjs";

Hooks.once("init", async () => {
  game.settings.register(SYSTEM_ID, "resistanceMode", {name: "Resistência: parcela do atributo", hint: "Provisório: a fórmula das páginas 207/434 usa graduação; o exemplo usa modificador. A escolha vale para todo o mundo.",
    scope: "world", config: true, type: String, default: "rank", choices: {rank: "Graduação do atributo (fórmula impressa)", modifier: "Modificador do atributo (exemplo)"}, onChange: () => window.location.reload()});
  CONFIG.Actor.documentClass = BattleActor;
  CONFIG.Item.documentClass = BattleItem;
  CONFIG.Actor.dataModels.knight = KnightData;
  for (const type of Object.keys(ITEM_TYPES)) CONFIG.Item.dataModels[type] = ContentData;
  const registry = foundry.applications.apps.DocumentSheetConfig;
  registry.registerSheet(Actor, SYSTEM_ID, KnightSheet, {types: ["knight"], makeDefault: true, label: "Ficha de Cavaleiro"});
  registry.registerSheet(Item, SYSTEM_ID, ContentSheet, {types: Object.keys(ITEM_TYPES), makeDefault: true, label: "Conteúdo — A Batalha dos Deuses"});
  await foundry.applications.handlebars.loadTemplates([`systems/${SYSTEM_ID}/templates/fields.hbs`, `systems/${SYSTEM_ID}/templates/items.hbs`]);
  game.godsBattle = {createStarterCompendium, openCatalog};
});

Hooks.on("preCreateActor", (actor, data = {}) => {
  if (actor.type !== "knight") return;
  actor.updateSource({"system.schemaVersion": 2, "system.automation.enabled": data.system?.automation?.enabled ?? !data.system?.schemaVersion, "prototypeToken.actorLink": true, "prototypeToken.bar1.attribute": "resources.health", "prototypeToken.bar2.attribute": "resources.cosmo"});
});
Hooks.on("renderChatMessageHTML", renderTechniqueChat);
