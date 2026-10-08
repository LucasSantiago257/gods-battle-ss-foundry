export const SYSTEM_ID = "gods-battle-ss";
export const ATTRIBUTES = {for: "Força", vig: "Vigor", vel: "Velocidade", cos: "Cosmo", sen: "Sentidos"};
export const STYLES = {
  saint: {label: "Santo", key: "for", hp: 20, hpStep: 10, skills: 1, fastActions: true, fastCosmo: false},
  sage: {label: "Sábio", key: "sen", hp: 20, hpStep: 10, skills: 2, fastActions: false, fastCosmo: true},
  guardian: {label: "Guardião", key: "vig", hp: 24, hpStep: 12, skills: 1, fastActions: true, fastCosmo: false},
  artist: {label: "Artista", key: "cos", hp: 20, hpStep: 10, skills: 3, fastActions: false, fastCosmo: true},
  asgardian: {label: "Asgardiano", key: "vel", hp: 24, hpStep: 12, skills: 1, fastActions: true, fastCosmo: false},
  beastmaster: {label: "Domador de Bestas", key: "for", hp: 20, hpStep: 10, skills: 2, fastActions: true, fastCosmo: false}
};
export const SKILLS = {
  academics: {label: "Acadêmicos", attribute: "sen"}, armor: {label: "Armaduras", attribute: "cos"},
  asterism: {label: "Asterismo", attribute: "nature"}, performance: {label: "Atuação", attribute: "vel"},
  combat: {label: "Combate", attribute: "style"}, spying: {label: "Espionar", attribute: "vel"},
  sports: {label: "Esportes", attribute: "for"}, stealth: {label: "Furtividade", attribute: "vel"},
  stars: {label: "Ler Estrelas", attribute: "cos"}, leadership: {label: "Liderança", attribute: "for"},
  medicine: {label: "Medicina", attribute: "sen"}, mythology: {label: "Mitologia", attribute: "sen"},
  perception: {label: "Percepção Extrassensorial", attribute: "cos"}, sealing: {label: "Selamento", attribute: "for"},
  technology: {label: "Tecnologia", attribute: "sen"}, telekinesis: {label: "Telecinese", attribute: "vig"},
  training: {label: "Treinamento", attribute: "vig"}, cosmoUse: {label: "Utilização do Cosmo", attribute: "vig"}
};
export const FIGHTING = {punch: "Soco", kick: "Chute", weapons: "Armas", psychic: "Psíquico / Cosmo", throw: "Arremesso", defense: "Esquiva / Bloqueio"};
export const NATURES = {
  physical: {label: "Físico", key: "for", resistance: "vig"}, mental: {label: "Mental / Ilusório", key: "sen", resistance: "sen"},
  natural: {label: "Controle da Natureza", key: "vel", resistance: "vel"}, manipulation: {label: "Manipulação de Cosmo", key: "cos", resistance: "cos"}
};
export const ARMORS = {
  bronze: {label: "Bronze", hp: 30, pa: 3, ce: 3, min: 1}, silver: {label: "Prata", hp: 50, pa: 5, ce: 5, min: 5},
  gold: {label: "Ouro", hp: 100, pa: 10, ce: 10, min: 0}, divine: {label: "Divina", hp: 150, pa: 15, ce: 15, min: 0},
  kamui: {label: "Kamui", hp: 200, pa: 20, ce: 0, min: 0}
};
export const ITEM_TYPES = {armor: "Armadura", technique: "Técnica", virtue: "Virtude", ability: "Habilidade / Dádiva", bigbang: "Big Bang", increment: "Incremento", artifact: "Artefato", divineCosmo: "Cosmo Divino"};
export const STATUS = {bronze: "Bronze", silver: "Prata", gold: "Ouro", divine: "Divino", god: "Deus"};
export const STAGES = {awakened: "Despertado", expanded: "Expandido", mastered: "Dominado", full: "Pleno", omega: "Superado / Ômega"};
export const CONDITIONS = {surprised: "Surpreso", tired: "Cansado", disoriented: "Desorientado", controlled: "Dominado", afraid: "Amedrontado", paralyzed: "Paralisado", suffocated: "Sufocado", stunned: "Atordoado", incapacitated: "Incapacitado", stable: "Morte estável", imminent: "Morte iminente", dead: "Morto", pulverized: "Pulverizado"};
// Tabela explícita, p. 156/159; a graduação é distinta do modificador.
export const ATTRIBUTE_MODS = [0, 2, 4, 6, 8, 10, 13, 16, 19, 22, 25, 30, 35];
export const SKILL_MODS = [0, 1, 2, 3, 4, 5, 7, 9, 11, 13, 15];
export const MOVEMENT = [0, 6, 9, 12, 15, 18, 25, 30, 60, 90, 120];
export const JUMP = [0, 3, 4.5, 6, 7.5, 9, 12.5, 15, 30, 45, 60];
export const LIFT = [0, 10, 100, 200, 300, 400, 500, 1000, 2000, 3000, 5000];
export const BREAK = [0, 5, 10, 20, 30, 50, 100, 500, 1000, 2000, 3000];
