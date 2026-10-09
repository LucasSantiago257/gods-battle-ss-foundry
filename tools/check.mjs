import {readFile, readdir, access, mkdir, writeFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import path from "node:path";
import Handlebars from "handlebars";
import {knight, content} from "../tests/foundry-stub.mjs";
import {prepareKnight, armorValues} from "../module/rules.mjs";
import {KnightSheet, ContentSheet} from "../module/sheets.mjs";
import {ITEM_TYPES} from "../module/config.mjs";
import {levelSignature} from "../module/level-rules.mjs";
import {techniqueSetupContext} from "../module/technique-setup.mjs";
import {beginTechniqueBuilder} from "../module/technique-builder.mjs";
import {componentUuid} from "../module/technique-builder-rules.mjs";
import {COMPONENT_RULES,techniqueWithComponents} from "../module/technique-components.mjs";
import {CONDITION_RULES} from "../module/condition-rules.mjs";

const manifest = JSON.parse(await readFile("system.json", "utf8"));
for (const file of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map(l => l.path)]) await access(file);
if (manifest.id !== "gods-battle-ss") throw Error("ID inesperado no manifesto.");
if (Object.keys(ITEM_TYPES).join() !== Object.keys(manifest.documentTypes.Item).join()) throw Error("Tipos de Item inconsistentes.");
for (const dir of ["module", "tests", "tools"]) for (const file of await readdir(dir)) if (file.endsWith(".mjs")) {
  const result = spawnSync(process.execPath, ["--check", `${dir}/${file}`], {encoding: "utf8"});
  if (result.status) throw Error(result.stderr);
}
const templates = {};
for (const file of await readdir("templates")) {
  const source = await readFile(`templates/${file}`, "utf8");
  templates[file] = Handlebars.compile(source);
  Handlebars.registerPartial(`systems/gods-battle-ss/templates/${file}`, source);
}
const s = knight(); s.attributes.for.value = 4; s.attributes.vig.value = 3; s.attributes.cos.value = 3; s.attributes.sen.value = 2; s.attributes.vel.value = 2;
s.profile.sanctuary = "Athena"; s.profile.master = "Mestre do Santuário"; s.skills.combat.value = 2; s.skills.sports.value = 2; s.fighting.punch = 2; s.fighting.defense = 1;
s.creationGuide.styleApplied = "saint";
const a = content(); a.equipped = true; a.constellation = "Constelação protetora"; a.armor = armorValues(a); a.health.max = a.armor.hp;
const technique = content(); technique.description = "Uma técnica de exemplo para conferir custo e resistência.";
const actor = {system: prepareKnight(s, [{type: "armor", system: a}]), isOwner: true, img: "assets/cosmos.svg", name: "Cavaleiro de exemplo", items: {contents: [
  {id: "demoarmor", name: "Armadura de Bronze", uuid: "Actor.demo.Item.demoarmor", sort: 0, type: "armor", img: "assets/cosmos.svg", system: a},
  {id: "demotech", name: "Técnica de Bronze — exemplo", uuid: "Actor.demo.Item.demotech", sort: 1, type: "technique", img: "assets/cosmos.svg", system: technique}
]}};
const context = await new KnightSheet(actor)._prepareContext({});
const rendered = templates["knight.hbs"](context);
if (!rendered.includes("system.attributes.for.value") || !rendered.includes("Percepção Extrassensorial")) throw Error("Ficha incompleta na renderização.");
if (!rendered.includes('data-action="useTechnique"')) throw Error("Botão de ativação ausente.");
for (const type of Object.keys(ITEM_TYPES)) {
  const data = content(); if (type === "armor") data.armor = armorValues(data);
  templates["content.hbs"](await new ContentSheet({name: "Teste", img: "", type, isOwner: true, system: data})._prepareContext({}));
}
// O template deve escapar nomes e descrições fornecidos pelo usuário.
context.actor.name = '<img src=x onerror="alert(1)">';
if (templates["knight.hbs"](context).includes('<img src=x onerror="alert(1)">')) throw Error("Nome não escapado.");
templates["chat.hbs"]({label: "Força", results: [10, 1, 6], total: 18, difficulty: 15});
const unsafe = '<img src=x onerror="alert(1)">';
const attackCard = templates["technique-chat.hbs"]({name: unsafe, description: unsafe, results: [10, 6], modifier: 4, total: 16, difficulty: 12,
  success: true, cost: 2, payment: {fromCurrent: 2, fromExtra: 0}, effectLabel: "Dano", isDamage: true, damageLevel: 2, damage: 21, armorDamage: 10, powerCosmic: 11, outcome: "Sucesso"});
const resistanceCard = templates["chat.hbs"]({label: "Vigor", kind: "Resistência", attackName: "Técnica de exemplo", results: [8], highest: 8, tens: 0, ones: 0, modifier: 3, total: 11, difficulty: 11,
  outcome: "Sucesso", resistance: {damage: 10.5, armorDamage: 0, effectsResisted: true}});
for (const html of [attackCard, templates["technique-dialog.hbs"]({name: unsafe,targetName:unsafe}),templates["technique-setup.hbs"]({name:unsafe,printedCost:unsafe})]) if (html.includes(unsafe)) throw Error("Texto da técnica não escapado.");
await mkdir("dist", {recursive: true});
const css = await readFile("styles/sheets.css", "utf8");
const controlCard=templates["chat.hbs"]({label:"Sentidos",kind:"Resistência",attackName:"Ilusão estelar",results:[5],highest:5,tens:0,ones:0,modifier:0,total:5,difficulty:20,outcome:"Falha crítica",resistance:{control:{resisted:false,baseRounds:3,rounds:6,doubleDuration:true,retryCost:1}}});
const controlDialog=templates["control-dialog.hbs"]({name:"Ilusão estelar",targetName:"Defensor de exercício",classification:"silver",rounds:6,baseRounds:3,doubleDuration:true,startRound:2,currentRound:4,retryCost:1});
if(controlCard.includes('data-action="applyDamage"')||!controlCard.includes('data-action="registerControl"')||controlDialog.includes('type="checkbox"'))throw Error("Controle renderiza dano ou aceite indevido.");
for(const html of [templates["control-dialog.hbs"]({name:unsafe,targetName:unsafe}),templates["chat.hbs"]({attackName:unsafe,resistance:{control:{rounds:6,retryCost:1}}})])if(html.includes(unsafe))throw Error("Texto de Controle não escapado.");
await writeFile("dist/control-preview.html",`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>${css}body{background:#07101e;color:#e6edfa;font-family:Segoe UI,sans-serif;padding:24px}.preview-dialog{background:#142035;border:1px solid #52637e;padding:20px;max-width:680px;margin:24px auto}.preview-dialog label{display:block;margin:10px 0}.preview-dialog input,.preview-dialog textarea{max-width:100%;padding:6px}.preview-dialog textarea{width:100%}.note{color:#e8bc83}*{box-sizing:border-box}</style><body><main class="preview-dialog" id="control-card">${controlCard}</main><form class="preview-dialog" id="control-dialog">${controlDialog}<button type="button">Registrar duração</button><button type="button">Cancelar</button></form></body></html>`);
const gameplaySystem=knight();gameplaySystem.profile.level=25;gameplaySystem.profile.status="gold";gameplaySystem.skills.asterism.value=3;gameplaySystem.resources.cosmo.value=20;prepareKnight(gameplaySystem);
const gameplayTechnique={...content(),classification:"gold",techniqueMode:"status",cost:8};
const gameplayDialog=templates["technique-dialog.hbs"]({name:"Técnica de exercício",cost:8,current:20,extra:0,reserve:0,targetName:"Defensor de exercício"});
const setupDialog=templates["technique-setup.hbs"](techniqueSetupContext({system:gameplaySystem},{name:"Técnica de exercício",system:gameplayTechnique}));
if(!gameplayDialog.includes('data-technique-preview="damage"')||!setupDialog.includes('name="techniqueMode"'))throw Error("Configuração/prévia ausente.");
await writeFile("dist/gameplay-preview.html",`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>${css}body{background:#07101e;color:#e6edfa;font-family:Segoe UI,sans-serif;padding:24px}.preview-dialog{background:#142035;border:1px solid #52637e;border-radius:8px;padding:20px;max-width:680px;margin:16px auto}.form-group{display:flex;align-items:center;gap:16px;margin:12px 0}.form-group label{flex:1}.form-group input,.form-group select{max-width:300px}input,select,button{padding:7px}.technique-preview{padding:12px;border:1px solid #c2a963}.note{color:#e8bc83}*{box-sizing:border-box}</style><body><form id="activation" class="preview-dialog">${gameplayDialog}<button type="button" data-action="activate">Gastar CE e rolar</button></form><form id="setup" class="preview-dialog">${setupDialog}<button type="button">Salvar configuração revisada</button></form><script type="module">import {installTechniquePreview} from "../module/technique-ui.mjs";installTechniquePreview(document.querySelector("#activation"),${JSON.stringify(gameplaySystem)},${JSON.stringify(gameplayTechnique)});window.__gameplayReady=true;</script></body></html>`);
const audited = JSON.parse(await readFile("data/catalog/cosmo-special.json", "utf8")).find(e => e.name === "Olho de Fogo");
const bookContext = await new ContentSheet({...audited, system: {...content(), ...audited.system}, isOwner: false})._prepareContext({});
const bookHtml = templates["content.hbs"](bookContext);
if (!bookHtml.includes("Fotógrafo de Cosmo") || !bookHtml.includes("Sensitivo")) throw Error("Ocorrências auditadas não renderizadas.");
bookContext.bookReference.occurrences[0].text = unsafe;
if (templates["content.hbs"](bookContext).includes(unsafe)) throw Error("Referência de livro não escapada.");
const bookSvg = Buffer.from(await readFile("assets/cosmos.svg")).toString("base64");
const techniqueEntry = JSON.parse(await readFile("data/catalog/techniques.json", "utf8")).find(e => e.name === "Veneno");
const techniqueContext = await new ContentSheet({...techniqueEntry, system: {...content(), ...techniqueEntry.system}, parent: {type: "knight"}, isOwner: true})._prepareContext({});
const techniqueHtml = templates["content.hbs"](techniqueContext);
if (techniqueHtml.includes('data-action="useTechnique"') || !techniqueHtml.includes("Selecione a natureza") || techniqueHtml.includes('name="system.techniqueReviewed"') || !techniqueHtml.includes('data-action="openReference"')) throw Error("Parâmetros/referências de técnica não renderizados ou aceite antigo presente.");
const originalUUID = techniqueContext.bookReference.references[0].uuid;
techniqueContext.bookReference.references[0].uuid = unsafe;
if (templates["content.hbs"](techniqueContext).includes(unsafe)) throw Error("UUID de referência não escapado.");
techniqueContext.bookReference.references[0].uuid = originalUUID;
await writeFile("dist/technique-book-preview.html", `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>${css}body{background:#07101e;font-family:Segoe UI,sans-serif;padding:24px}.gods-battle{width:620px;height:760px;margin:auto;overflow:hidden}*{box-sizing:border-box}</style><body><main class="gods-battle">${techniqueHtml.replaceAll("systems/gods-battle-ss/assets/cosmos.svg", `data:image/svg+xml;base64,${bookSvg}`)}</main></body></html>`);
await writeFile("dist/book-preview.html", `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>${css}body{background:#07101e;font-family:Segoe UI,sans-serif;padding:24px}.gods-battle{width:620px;height:760px;margin:auto;overflow:hidden}*{box-sizing:border-box}</style><body><main class="gods-battle">${bookHtml.replaceAll("systems/gods-battle-ss/assets/cosmos.svg", `data:image/svg+xml;base64,${bookSvg}`)}</main></body></html>`);
await writeFile("dist/chat-preview.html", `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>${css}body{font-family:Segoe UI,sans-serif;background:#eee;padding:24px}.battle-chat{background:white;max-width:360px;padding:16px;margin:16px;border:1px solid #777}.technique-description{white-space:pre-wrap;overflow-wrap:anywhere}</style><body>${attackCard}${resistanceCard}</body></html>`);
const svg = await readFile("assets/cosmos.svg", "utf8");
const activationActor={...actor,name:"Cavaleiro em combate",flags:{"gods-battle-ss":{techniqueOperations:{paidDemo:{requestId:"paidDemo",status:"paid",cardPublished:true,name:"Fulgor estelar",payment:{cost:5,lifeDamage:0},before:{current:10,extra:0,health:23},after:{current:5,extra:0,health:23},time:1},pendingDemo:{requestId:"pendingDemo",status:"prepared",name:"Técnica interrompida",payment:{cost:3,lifeDamage:2},before:{current:1,extra:0,health:23},after:{current:0,extra:0,health:21},time:2}}}}};
const activationContext=await new KnightSheet(activationActor)._prepareContext({});
for(const tab of Object.values(activationContext.tabs))tab.cssClass=tab.id==="combat"?"active":"";
const activationHtml=templates["knight.hbs"](activationContext);
if(!activationHtml.includes('data-action="recoverTechnique"')||!activationHtml.includes("Paga e publicada")||!activationHtml.includes("Interrompida"))throw Error("Registro de ativações ausente.");
activationContext.techniqueLedger[0].name=unsafe;if(templates["knight.hbs"](activationContext).includes(unsafe))throw Error("Histórico de ativações não escapado.");
await writeFile("dist/activation-ledger-preview.html",`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>${css}body{background:#07101e;font-family:Segoe UI,sans-serif;padding:24px}.gods-battle{width:920px;height:850px;margin:auto;overflow:hidden}*{box-sizing:border-box}</style><body><main class="gods-battle">${activationHtml.replaceAll("assets/cosmos.svg",`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`)}</main></body></html>`);
const actionSystem=structuredClone(s);actionSystem.profile.level=3;prepareKnight(actionSystem);actionSystem.resources.cosmo.value=4;actionSystem.creationGuide.status="complete";
const actionContext={combatUuid:"Combat.example",combatantId:"exampleActor",round:2,epoch:"exampleRound"};
const actionActor={...actor,uuid:"Actor.example",name:"Cavaleiro em combate",system:actionSystem,flags:{"gods-battle-ss":{actionUsage:{actorUuid:"Actor.example",context:actionContext,spent:{attack:1,defense:0,movement:1,reaction:0},last:"example"},actionOperations:{pendingAction:{actorUuid:"Actor.example",requestId:"pendingAction",status:"prepared",label:"Soco",pool:"attack",cost:1,time:1,after:{context:actionContext}}},actionAdjustments:{exampleAdjust:{time:2,reason:"Manobra conferida pelo mestre",after:{spent:{attack:1,defense:0,movement:1,reaction:0}}}}}}};
const actionCombat={uuid:"Combat.example",started:true,round:2,flags:{"gods-battle-ss":{actionControl:{enabled:true,epoch:"exampleRound"}}},combatants:{contents:[{id:"exampleActor",actor:actionActor}]}};
game.combat=actionCombat;game.combats={contents:[actionCombat]};
const actionContextUI=await new KnightSheet(actionActor)._prepareContext({});for(const tab of Object.values(actionContextUI.tabs))tab.cssClass=tab.id==="combat"?"active":"";
const actionHtml=templates["knight.hbs"](actionContextUI);if(!actionHtml.includes('data-action="adjustActions"')||!actionHtml.includes('data-action="recoverAction"')||!actionHtml.includes("2 / 3"))throw Error("Reservas/histórico de ações não renderizados.");
actionContextUI.actionAdjustments[0].reason=unsafe;if(templates["knight.hbs"](actionContextUI).includes(unsafe))throw Error("Ajuste de ações não escapado.");
const actionDialog=templates["technique-dialog.hbs"]({name:"Fulgor de exercício",cost:2,current:4,extra:0,reserve:0,actions:actionContextUI.actionControl});
await writeFile("dist/actions-preview.html",`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>${css}body{background:#07101e;color:#e6edfa;font-family:Segoe UI,sans-serif;padding:24px}.gods-battle{width:920px;height:850px;margin:auto;overflow:hidden}.preview-dialog{background:#142035;border:1px solid #52637e;padding:20px;max-width:680px;margin:24px auto}.preview-dialog label{display:block}.preview-dialog input,.preview-dialog select{max-width:100%;padding:6px}.preview-dialog .note{color:#e8bc83}*{box-sizing:border-box}</style><body><main class="gods-battle">${actionHtml.replaceAll("assets/cosmos.svg",`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`)}</main><form id="activation" class="preview-dialog">${actionDialog}<button type="button" data-action="activate">Confirmar ações, CE e rolar</button></form><script type="module">import {installTechniquePreview} from "../module/technique-ui.mjs";const actor=${JSON.stringify({uuid:actionActor.uuid,system:actionSystem,flags:actionActor.flags})};globalThis.game={combats:{contents:[${JSON.stringify({...actionCombat,combatants:{contents:[{id:"exampleActor",actor:{uuid:actionActor.uuid}}]}})}]}};installTechniquePreview(document.querySelector("#activation"),actor.system,${JSON.stringify(technique)},actor);window.__actionsReady=true;</script></body></html>`);
delete game.combat;delete game.combats;
const effectActor={...actor,name:"Alvo de exercício",uuid:"Actor.effectExample",flags:{"gods-battle-ss":{persistentEffects:{effectDemo:{id:"effectDemo",actorUuid:"Actor.effectExample",kind:"brasas",label:"Brasas",description:"Chamas persistentes conferidas pelo mestre.",reason:"Resistência falhou; duração final de duas rodadas.",page:"225",damage:10,source:{name:"Chamas de exercício",classification:"silver"},combatUuid:"Combat.effects",combatantId:"effectMember",firstRound:2,lastRound:3,status:"active",time:1,ticks:{round2:{round:2,damage:10,before:100,after:90,reason:"Dano final conferido."}}}},effectOperations:{pendingEffect:{status:"prepared",round:3}}}}};
effectActor.system=structuredClone(actor.system);effectActor.system.resources.health.value=90;effectActor.system.resources.health.manualMax=100;prepareKnight(effectActor.system,effectActor.items.contents);
game.combat={uuid:"Combat.effects",started:true,round:3,combatants:{contents:[{id:"effectMember",actor:effectActor}]}};game.combats={contents:[game.combat]};
const effectsContext=await new KnightSheet(effectActor)._prepareContext({});for(const tab of Object.values(effectsContext.tabs))tab.cssClass=tab.id==="combat"?"active":"";
const effectsHtml=templates["knight.hbs"](effectsContext),effectsDialog=templates["effect-dialog.hbs"]({targetName:effectActor.name,round:3,sources:[{itemUuid:"Actor.example.Item.fire",label:"Usuário de exercício · Chamas · 10 PV/rodada"}]});
if(!effectsHtml.includes('data-action="resolveEffect"')||!effectsHtml.includes('data-action="recoverEffect"')||!effectsDialog.includes('name="firstOffset"'))throw Error("Efeitos/duração/recuperação não renderizados.");
effectsContext.persistentEffects[0].description=unsafe;if(templates["knight.hbs"](effectsContext).includes(unsafe)||templates["effect-dialog.hbs"]({targetName:unsafe,sources:[{itemUuid:unsafe,label:unsafe}]}).includes(unsafe))throw Error("Texto/UUID de efeitos não escapado.");
await writeFile("dist/effects-preview.html",`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>${css}body{background:#07101e;color:#e6edfa;font-family:Segoe UI,sans-serif;padding:24px}.gods-battle{width:920px;height:850px;margin:auto;overflow:hidden}.preview-dialog{background:#142035;border:1px solid #52637e;padding:20px;max-width:680px;margin:24px auto}.preview-dialog label{display:block;margin:10px 0}.preview-dialog input,.preview-dialog select,.preview-dialog textarea{max-width:100%;padding:6px}.preview-dialog textarea{width:100%}.note{color:#e8bc83}*{box-sizing:border-box}</style><body><main class="gods-battle">${effectsHtml.replaceAll("assets/cosmos.svg",`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`)}</main><form class="preview-dialog" id="effect-dialog">${effectsDialog}<button type="button">Conferir e registrar</button></form></body></html>`);
delete game.combat;delete game.combats;
const componentSystem=knight();componentSystem.profile.level=11;componentSystem.profile.status="silver";componentSystem.skills.asterism.value=2;prepareKnight(componentSystem);componentSystem.resources.cosmo.value=20;
const conditionActor={...actor,name:"Cavaleiro em revisão",uuid:"Actor.conditionExample",system:structuredClone(actor.system),flags:{"gods-battle-ss":{conditionEffects:{tiredExample:{actorUuid:"Actor.conditionExample",status:"active",key:"tired",count:2,label:"Cansado",page:"393",ruleVersion:1,reviewedManual:true,origin:"Privação de descanso",until:"Após descanso confirmado",reason:"Revisei os ajustes manuais antes de aplicar",time:1},limbExample:{actorUuid:"Actor.conditionExample",status:"active",key:"incapacitated",count:1,label:"Membro debilitado",page:"397",ruleVersion:1,reviewedManual:true,origin:"Dano localizado conferido",details:"Braço esquerdo; limitações de uso conferidas na mesa",until:"Final da luta conferido",reason:"Resistência e duração revisadas pelo mestre",time:2}}}}};
prepareKnight(conditionActor.system,conditionActor.items.contents,"rank",{actorUuid:conditionActor.uuid,flags:conditionActor.flags});const conditionContext=await new KnightSheet(conditionActor)._prepareContext({});for(const tab of Object.values(conditionContext.tabs))tab.cssClass=tab.id==="combat"?"active":"";
const conditionHtml=templates["knight.hbs"](conditionContext),conditionDialog=templates["condition-dialog.hbs"]({name:conditionActor.name,rules:Object.entries(CONDITION_RULES).map(([key,r])=>({key,...r}))});
if(!conditionHtml.includes('data-action="endCondition"')||conditionContext.conditionControl.modifier!==-6||conditionDialog.includes('name="reviewedManual"'))throw Error("Condições não renderizadas ou aceite antigo presente.");conditionContext.conditionControl.records[0].details=unsafe;if(templates["knight.hbs"](conditionContext).includes(unsafe)||templates["condition-dialog.hbs"]({name:unsafe,rules:[{key:unsafe,label:unsafe}]}).includes(unsafe))throw Error("Texto de condições não escapado.");
await writeFile("dist/conditions-preview.html",`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>${css}body{background:#07101e;color:#e6edfa;font-family:Segoe UI,sans-serif;padding:24px}.gods-battle{width:920px;height:850px;margin:auto;overflow:hidden}.preview-dialog{background:#142035;border:1px solid #52637e;padding:20px;max-width:680px;margin:24px auto}.preview-dialog label{display:block;margin:10px 0}.preview-dialog input,.preview-dialog select,.preview-dialog textarea{max-width:100%;padding:6px}.preview-dialog textarea{width:100%}.note{color:#e8bc83}*{box-sizing:border-box}</style><body><main class="gods-battle">${conditionHtml.replaceAll("assets/cosmos.svg",`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`)}</main><form class="preview-dialog" id="condition-dialog">${conditionDialog}</form></body></html>`);
const componentItem={name:"Fulgor de exercício",system:{...content(),cost:5,costExtra:1,techniqueMode:"status"},flags:{"gods-battle-ss":{componentAutomation:true,techniqueConstructionId:"preview",techniqueConstructionHistory:{preview:{primary:{uuid:componentUuid("13841831d802c5be")},components:Object.entries(COMPONENT_RULES).map(([id,r])=>({uuid:componentUuid(id),key:r.key,type:r.kind==="space"?"increment":"bigbang",rank:r.kind==="space"?2:1,name:r.label,page:r.page,detail:r.kind==="terrain"?"Campo de gelo":""}))}}}}};
const componentTechnique=techniqueWithComponents(componentItem),componentDialog=templates["technique-dialog.hbs"]({name:componentItem.name,cost:6,current:20,extra:0,reserve:0,targetName:"Defensor de exercício",components:componentTechnique.componentProfile,hasExhaust:true,hasEssence:true,hasTerrain:true});
const componentSetup=templates["technique-setup.hbs"](techniqueSetupContext({system:componentSystem},componentItem));if(!componentSetup.includes('name="componentAutomation"')||!componentDialog.includes('name="exhaust"'))throw Error("Componentes assistidos não renderizados.");
await writeFile("dist/components-preview.html",`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>${css}body{background:#07101e;color:#e6edfa;font-family:Segoe UI,sans-serif;padding:24px}.preview-dialog{background:#142035;border:1px solid #52637e;padding:20px;max-width:680px;margin:24px auto}.preview-dialog label{display:block;margin:8px 0}.preview-dialog input,.preview-dialog select{max-width:100%;padding:6px}.note{color:#e8bc83}*{box-sizing:border-box}</style><body><form id="activation" class="preview-dialog">${componentDialog}<button type="button" data-action="activate">Confirmar CE e rolar</button></form><form id="setup" class="preview-dialog">${componentSetup}</form><script type="module">import {installTechniquePreview} from "../module/technique-ui.mjs";installTechniquePreview(document.querySelector("#activation"),${JSON.stringify(componentSystem)},${JSON.stringify(componentTechnique)});window.__componentsReady=true;</script></body></html>`);
const components=[...JSON.parse(await readFile("data/catalog/bigbangs.json","utf8")),...JSON.parse(await readFile("data/catalog/increments.json","utf8"))];
const componentDocs=new Map(components.map(doc=>[componentUuid(doc._id),{...doc,uuid:componentUuid(doc._id),toObject:()=>structuredClone(doc)}]));
game.packs=new Map([["gods-battle-ss.componentes-tecnicas",{testUserPermission:()=>true}]]);globalThis.fromUuid=async uuid=>componentDocs.get(uuid);foundry.utils={randomID:()=>"builderExample01"};
const builderActor={type:"knight",isOwner:true,system:gameplaySystem,items:{contents:[]}};
gameplaySystem.skills.training.value=3;gameplaySystem.skills.cosmoUse.value=3;prepareKnight(gameplaySystem);
const builderItem={id:"builderItem00001",name:"Fulgor estelar",img:"assets/cosmos.svg",type:"technique",isOwner:true,parent:builderActor,system:{...content(),techniqueMode:"status",classification:"gold"},flags:{},update:async patch=>{builderItem.flags["gods-battle-ss"]={customTechnique:true,techniqueDraft:patch["flags.gods-battle-ss.techniqueDraft"]};}};
builderActor.items.contents.push(builderItem);await beginTechniqueBuilder(builderItem);
const builderDraft=builderItem.flags["gods-battle-ss"].techniqueDraft;
Object.assign(builderDraft,{reviewed:true,incrementReviewed:true,components:{component0000001:{uuid:componentUuid("02cba36e32fda2f8"),rank:1,detail:"Apoio ao aliado"},component0000002:{uuid:componentUuid(components.find(d=>d.type==="increment")._id),rank:2,detail:"Escolha conferida pelo mestre"}}});
const builderContext=await new ContentSheet(builderItem)._prepareContext({}),builderHtml=templates["content.hbs"](builderContext);
if(builderContext.builder.totalCost!==5||!builderHtml.includes('data-action="finishTechniqueBuilder"')||!builderHtml.includes("Graduação do incremento")||builderHtml.includes('name="system.cost"'))throw Error("Construtor incompleto ou editor de parâmetros exposto durante rascunho.");
builderContext.builder.components[0].description=unsafe;builderContext.builder.fields[0].value=unsafe;
if(templates["content.hbs"](builderContext).includes(unsafe))throw Error("Texto do construtor não escapado.");
await writeFile("dist/technique-builder-preview.html",`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>${css}body{background:#07101e;font-family:Segoe UI,sans-serif;padding:24px}.gods-battle{width:620px;height:850px;margin:auto;overflow:hidden}*{box-sizing:border-box}</style><body><main class="gods-battle">${builderHtml.replaceAll("assets/cosmos.svg",`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`)}</main></body></html>`);
const levelSystem=structuredClone(s);levelSystem.profile.level=4;levelSystem.creationGuide.status="complete";levelSystem.progression.xp=40;prepareKnight(levelSystem,actor.items.contents);
const levelDraft={id:"demoLevel0000001",from:4,to:5,baseline:levelSignature(levelSystem,actor.items.contents),attributes:{for:1,sen:1},skills:{},fighting:{punch:1,defense:1},advanceSense:true,reviewedContent:false,reviewedManual:false,acceptExceptions:false,reason:"",evolution:""};
const levelActor={...actor,name:"Cavaleiro em evolução",system:levelSystem,flags:{"gods-battle-ss":{levelDraft}}};
const levelContext=await new KnightSheet(levelActor)._prepareContext({});
const levelHtml=templates["knight.hbs"](levelContext);
if(!levelHtml.includes("Confirmar evolução")||!levelHtml.includes("Comparação antes / depois")||!levelHtml.includes("flags.gods-battle-ss.levelDraft.skills.asterism"))throw Error("Assistente de evolução incompleto.");
await writeFile("dist/level-preview.html",`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>${css}body{background:#07101e;font-family:Segoe UI,sans-serif;padding:24px}.gods-battle{width:920px;height:850px;margin:auto;overflow:hidden}*{box-sizing:border-box}</style><body><main class="gods-battle">${levelHtml.replaceAll("assets/cosmos.svg",`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`)}</main></body></html>`);
const html = rendered.replaceAll("assets/cosmos.svg", `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`);
await writeFile("dist/preview.html", `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prévia das fichas — A Batalha dos Deuses</title><style>${css}
body{margin:0;background:#07101e;padding:24px;font-family:Segoe UI,sans-serif}.preview-note{max-width:920px;margin:0 auto 12px;color:#c4cfe0;font-size:13px}.gods-battle{max-width:920px;height:850px;margin:auto;border:1px solid #43526b;border-radius:12px;overflow:hidden}.gods-battle input:disabled{opacity:.8}*{box-sizing:border-box}</style></head><body><p class="preview-note">Prévia visual da ficha ${manifest.version} · dados ilustrativos · sem conexão com o Foundry. As abas podem ser navegadas.</p><main class="gods-battle">${html}</main><script>
document.querySelectorAll('[data-action="tab"]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.battle-tabs button,.sheet-body>.tab').forEach(el=>el.classList.toggle('active',el.dataset.tab===button.dataset.tab));}));
document.querySelectorAll('input,select,textarea').forEach(el=>el.disabled=true);
document.querySelectorAll('button:not([data-action="tab"])').forEach(el=>el.disabled=true);
</script></body></html>`, "utf8");
console.log("Manifesto, JavaScript e templates verificados; prévia em dist/preview.html.");

