import {refreshArmorRepairSheets} from "./armor-repair-ui.mjs";
import {enqueueArmorRepairRequest,resumeArmorRepairRequests,renderArmorRepairRequest,notifyArmorRepairResponse} from "./armor-repair-requests.mjs";
import {refreshAreaProgress} from "./area-progress.mjs";
import {renderControlChat} from "./control.mjs";
import {SYSTEM_ID, ITEM_TYPES} from "./config.mjs";
import {KnightData, ContentData} from "./models.mjs";
import {BattleActor, BattleItem} from "./documents.mjs";
import {KnightSheet, ContentSheet} from "./sheets.mjs";
import {createStarterCompendium} from "./starter.mjs";
import {renderTechniqueChat} from "./techniques.mjs";
import {openCatalog} from "./catalog.mjs";
import {evaluatePassives} from "./passives.mjs";
import {attackTarget} from "./combat.mjs";
import {refreshDamageCards,renderCombatChat,enqueueDamageRequest,notifyDamageResponse,resumeDamageRequests} from "./damage.mjs";
import {beginCreation} from "./creation.mjs";
import {openTestActors,importTestActors} from "./combat-examples.mjs";
import {beginLevelUp,requestLevelUp,enqueueLevelRequest,resumeLevelRequests} from "./level-up.mjs";
import {enqueueTechniqueRequest,notifyTechniqueResponse,resumeTechniqueRequests} from "./technique-activation.mjs";
import {enqueueActionRequest,notifyActionResponse,resumeActionRequests,toggleActionControl,refreshActionSheets} from "./actions.mjs";
import {stampCombatRound} from "./action-rules.mjs";

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
  await foundry.applications.handlebars.loadTemplates([`systems/${SYSTEM_ID}/templates/fields.hbs`, `systems/${SYSTEM_ID}/templates/items.hbs`, `systems/${SYSTEM_ID}/templates/level-guide.hbs`, `systems/${SYSTEM_ID}/templates/technique-builder.hbs`, `systems/${SYSTEM_ID}/templates/effects-panel.hbs`, `systems/${SYSTEM_ID}/templates/effect-record.hbs`, `systems/${SYSTEM_ID}/templates/armor-repair-record.hbs`, `systems/${SYSTEM_ID}/templates/armor-repairs-panel.hbs`]);
  game.godsBattle = {createStarterCompendium, openCatalog, explainPassives: actor => evaluatePassives(actor.system,actor.items.contents),attackTarget,beginCreation,openTestActors,importTestActors,beginLevelUp,requestLevelUp,toggleActionControl};
});

Hooks.on("preCreateActor", (actor, data = {}) => {
  if (actor.type !== "knight") return;
  actor.updateSource({"system.schemaVersion": 3, "system.automation.enabled": data.system?.automation?.enabled ?? !data.system?.schemaVersion, "prototypeToken.actorLink": true, "prototypeToken.bar1.attribute": "resources.health", "prototypeToken.bar2.attribute": "resources.cosmo"});
  if(!data.system?.schemaVersion && !data.system?.creationGuide) actor.updateSource({"system.creationGuide.status":"draft","system.creationGuide.initializeResources":true});
});
Hooks.on("renderChatMessageHTML", renderTechniqueChat);
Hooks.on("renderChatMessageHTML",renderCombatChat);
Hooks.on("renderChatMessageHTML",renderControlChat);
Hooks.on("renderChatMessageHTML",renderArmorRepairRequest);
Hooks.on("createChatMessage",enqueueDamageRequest);
Hooks.on("createChatMessage",enqueueLevelRequest);
Hooks.on("createChatMessage",enqueueTechniqueRequest);
Hooks.on("createChatMessage",enqueueActionRequest);
Hooks.on("createChatMessage",enqueueArmorRepairRequest);
Hooks.on("updateChatMessage",notifyDamageResponse);
Hooks.on("updateChatMessage",notifyTechniqueResponse);
Hooks.on("updateChatMessage",notifyActionResponse);
Hooks.on("updateChatMessage",notifyArmorRepairResponse);
Hooks.once("ready",resumeDamageRequests);
Hooks.once("ready",resumeLevelRequests);
Hooks.once("ready",resumeTechniqueRequests);
Hooks.once("ready",resumeActionRequests);
Hooks.once("ready",resumeArmorRepairRequests);
Hooks.on("updateUser",()=>resumeDamageRequests());
Hooks.on("updateUser",()=>resumeLevelRequests());
Hooks.on("updateUser",()=>resumeTechniqueRequests());
Hooks.on("updateUser",()=>resumeActionRequests());
Hooks.on("updateUser",()=>resumeArmorRepairRequests());
Hooks.on("preUpdateCombat",stampCombatRound);
Hooks.on("updateCombat",refreshActionSheets);
Hooks.on("deleteCombat",refreshActionSheets);
Hooks.on("createCombatant",refreshActionSheets);
Hooks.on("updateCombatant",refreshActionSheets);
Hooks.on("deleteCombatant",refreshActionSheets);
Hooks.on("preCreateItem", (item,data = {}) => {if (item.parent?.type === "knight" && !data.system?.acquisitionLevel) item.updateSource({"system.acquisitionLevel":item.parent.system.profile.level});});

Hooks.on("updateActor",refreshDamageCards);
Hooks.on("deleteActor",refreshDamageCards);
Hooks.on("updateChatMessage",refreshDamageCards);
Hooks.on("updateUser",refreshDamageCards);
Hooks.on("deleteChatMessage",refreshDamageCards);

// Area progress only reads existing messages and defender journals.
for(const hook of ["createChatMessage","updateChatMessage","deleteChatMessage","createActor","updateActor","deleteActor","updateUser","deleteUser","createToken","updateToken","deleteToken"])Hooks.on(hook,refreshAreaProgress);

for(const hook of ["createActor","updateActor","deleteActor","createItem","updateItem","deleteItem","createToken","updateToken","deleteToken","updateUser"])Hooks.on(hook,refreshArmorRepairSheets);
for(const hook of ["createChatMessage","updateChatMessage","deleteChatMessage"])Hooks.on(hook,message=>{if(message.flags?.[SYSTEM_ID]?.armorRepairRequest)refreshArmorRepairSheets();});
