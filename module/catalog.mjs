import {SYSTEM_ID} from "./config.mjs";

export const ABILITY_KINDS = {ability: "Habilidade", gift: "Dádiva", specialization: "Especialização", improvement: "Melhoria",
  natural: "Habilidade natural", cosmo: "Habilidade especial do Cosmo", myth: "Habilidade de criatura", divine: "Poder / habilidade divina", aura: "Aura (referência)", sense: "Sentido (referência)"};
export const CATALOG_PACKS = [
  {name: "virtudes", label: "Virtudes — A Batalha dos Deuses", sources: ["virtues", "virtues-variants"]},
  {name: "habilidades", label: "Habilidades e Dádivas — A Batalha dos Deuses", sources: ["saint", "sage", "guardian", "artist", "asgardian", "beastmaster",
    "protector", "assassin", "telekinetic", "aesir", "gold", "judges", "marinas", "dryads", "berserkers", "natural", "racial"].map(s => `abilities-${s}`)},
  {name: "cosmo-especial", label: "Combinações de Cosmo — A Batalha dos Deuses", sources: ["cosmo-special", "cosmo-special-extra", "cosmo-special-variants"]},
  {name: "criaturas", label: "Habilidades de Criaturas — A Batalha dos Deuses", sources: ["abilities-creatures"]},
  {name: "poderes-divinos", label: "Poderes e Habilidades Divinas — A Batalha dos Deuses", sources: ["abilities-divinities"]},
  {name: "cosmos-divinos", label: "Cosmos Divinos — A Batalha dos Deuses", sources: ["divine-cosmos"]},
  {name: "sentidos-auras", label: "Sentidos e Auras — A Batalha dos Deuses", sources: ["senses", "auras"]},
  {name: "componentes-tecnicas", label: "Big Bangs e Incrementos — A Batalha dos Deuses", sources: ["bigbangs", "increments"]},
  {name: "tecnicas", label: "Técnicas — A Batalha dos Deuses", sources: ["techniques"]}
];

export async function openCatalog(name = "habilidades") {
  if (!CATALOG_PACKS.some(p => p.name === name)) return;
  const pack = game.packs.get(`${SYSTEM_ID}.${name}`);
  if (!pack) return ui.notifications.warn("Compêndio indisponível. Confira a versão instalada e reinicie o mundo após atualizar.");
  pack.render(true);
  return pack;
}
