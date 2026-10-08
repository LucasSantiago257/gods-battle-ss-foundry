import {SYSTEM_ID} from "./config.mjs";

// Conteúdo pequeno e conferido; nenhuma imagem ou marca d'água do PDF é distribuída.
export const STARTER_ITEMS = [
  {name: "Armadura de Bronze — modelo", type: "armor", system: {page: "149", class: "bronze", constellation: "Personalizar", health: {value: 30}, description: "Modelo de classe Bronze: 30 PV, PA 3, +3 CE e Cosmo mínimo 1. Personalize a constelação e os acessórios."}},
  {name: "Armadura de Prata — modelo", type: "armor", system: {page: "150", class: "silver", health: {value: 50}, description: "Modelo de classe Prata: 50 PV, PA 5 e +5 CE. Confira os requisitos antes de equipar."}},
  {name: "Técnica personalizada — Bronze", type: "technique", system: {page: "197–234", power: 10, damageLevel: 1, cost: 2, requirements: "Confira a natureza, Big Bangs, Asterismo e requisitos de aprendizado.", description: "Modelo editável; não representa uma técnica pronta do catálogo. O custo publicado deve incluir os Big Bangs, evitando contagem em dobro."}},
  {name: "Artefato personalizado — modelo", type: "artifact", system: {page: "607–614", description: "Preencha o poder equivalente, os requisitos e efeitos do artefato. Este modelo não aplica efeitos automaticamente."}},
  {name: "Virtude personalizada — modelo", type: "virtue", system: {page: "161–183", category: "Geral", description: "Preencha uma virtude revisada, seus requisitos e benefícios. Aquisição e aplicação dos benefícios são manuais nesta etapa."}},
  {name: "Habilidade / Dádiva — modelo", type: "ability", system: {page: "428–435", description: "Preencha a origem, ação, duração, resistência, usos e combinação. O contador de usos não aplica os efeitos da habilidade."}}
];
export async function createStarterCompendium() {
  if (!game.user.isGM) return ui.notifications.warn("Somente o mestre pode criar o compêndio inicial.");
  let pack = game.packs.get(`world.${SYSTEM_ID}-starter`);
  if (!pack) pack = await foundry.documents.collections.CompendiumCollection.createCompendium({name: `${SYSTEM_ID}-starter`, label: "A Batalha dos Deuses — Modelos iniciais", type: "Item"});
  await pack.getIndex();
  if (pack.index.size) { pack.render(true); return pack; }
  await Item.createDocuments(STARTER_ITEMS.map(item => ({...item, img: `systems/${SYSTEM_ID}/assets/cosmos.svg`})), {pack: pack.collection});
  pack.render(true);
  ui.notifications.info("Modelos iniciais criados. Arraste conteúdos do compêndio para a ficha.");
  return pack;
}
