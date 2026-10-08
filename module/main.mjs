import {SYSTEM_ID, ITEM_TYPES} from "./config.mjs";
import {KnightData, ContentData} from "./models.mjs";
import {BattleActor, BattleItem} from "./documents.mjs";
import {KnightSheet, ContentSheet} from "./sheets.mjs";
import {createStarterCompendium} from "./starter.mjs";
import {renderTechniqueChat} from "./techniques.mjs";
import {openCatalog} from "./catalog.mjs";
import {evaluatePassives} from "./passives.mjs";
import {attackTarget} from "./combat.mjs";
import {renderCombatChat,enqueueDamageRequest,notifyDamageResponse,resumeDamageRequests} from "./damage.mjs";
import {beginCreation} from "./creation.mjs";
import {openTestActors,importTestActors} from "./combat-examples.mjs";
import {beginLevelUp,requestLevelUp,enqueueLevelRequest,resumeLevelRequests} from "./level-up.mjs";

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
  await foundry.applications.handlebars.loadTemplates([`systems/${SYSTEM_ID}/templates/fields.hbs`, `systems/${SYSTEM_ID}/templates/items.hbs`, `systems/${SYSTEM_ID}/templates/level-guide.hbs`, `systems/${SYSTEM_ID}/templates/technique-builder.hbs`]);
  game.godsBattle = {createStarterCompendium, openCatalog, explainPassives: actor => evaluatePassives(actor.system,actor.items.contents),attackTarget,beginCreation,openTestActors,importTestActors,beginLevelUp,requestLevelUp};
});

Hooks.on("preCreateActor", (actor, data = {}) => {
  if (actor.type !== "knight") return;
  actor.updateSource({"system.schemaVersion": 3, "system.automation.enabled": data.system?.automation?.enabled ?? !data.system?.schemaVersion, "prototypeToken.actorLink": true, "prototypeToken.bar1.attribute": "resources.health", "prototypeToken.bar2.attribute": "resources.cosmo"});
  if(!data.system?.schemaVersion && !data.system?.creationGuide) actor.updateSource({"system.creationGuide.status":"draft","system.creationGuide.initializeResources":true});
});
Hooks.on("renderChatMessageHTML", renderTechniqueChat);
Hooks.on("renderChatMessageHTML",renderCombatChat);
Hooks.on("createChatMessage",enqueueDamageRequest);
Hooks.on("createChatMessage",enqueueLevelRequest);
Hooks.on("updateChatMessage",notifyDamageResponse);
Hooks.once("ready",resumeDamageRequests);
Hooks.once("ready",resumeLevelRequests);
Hooks.on("updateUser",()=>resumeDamageRequests());
Hooks.on("updateUser",()=>resumeLevelRequests());
Hooks.on("preCreateItem", (item,data = {}) => {if (item.parent?.type === "knight" && !data.system?.acquisitionLevel) item.updateSource({"system.acquisitionLevel":item.parent.system.profile.level});});
