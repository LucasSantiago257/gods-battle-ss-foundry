import {SYSTEM_ID} from "./config.mjs";

export const TEST_ACTOR_PACK = {name:"fichas-teste",label:"Fichas de teste — Combate",type:"Actor"};
const image = `systems/${SYSTEM_ID}/assets/cosmos.svg`;
const specs = [
  {id:"demoSaint0000001",key:"saint",name:"TESTE — Aster, Santo",ranks:{for:4,vig:3,vel:2,cos:3,sen:2},hp:23,ce:6,nature:"physical",fighting:{punch:2,defense:1},technique:"Impacto de treino",role:"Atacante de soco. Use contra o Guardião para conferir ataque, defesa e dano físico."},
  {id:"demoGuard0000001",key:"guardian",name:"TESTE — Doran, Guardião",ranks:{for:2,vig:4,vel:2,cos:3,sen:3},hp:28,ce:6,nature:"physical",fighting:{weapons:1,defense:2},technique:"Golpe de treino",role:"Defensor com armadura de Bronze e duas graduações de Esquiva/Bloqueio. Desequipe a armadura para comparar a resistência sem proteção."},
  {id:"demoSage00000001",key:"sage",name:"TESTE — Lyra, Sábia",ranks:{for:1,vig:3,vel:2,cos:4,sen:4},hp:23,ce:7,nature:"mental",fighting:{psychic:2,defense:1},technique:"Pulso mental de treino",role:"Atacante de técnica mental. Ative Pulso mental de treino e resolva a resistência do Guardião pelo chat."}
];

// Personagens fictícios para exercitar o fluxo, sem efeitos de virtudes ou regras especiais.
// Não são exemplos completos de criação: parâmetros ajustados estão identificados na biografia.
export const TEST_ACTORS = specs.map(spec => ({
  _id:spec.id,name:spec.name,type:"knight",img:image,folder:null,sort:0,effects:[],ownership:{default:0},
  flags:{[SYSTEM_ID]:{testActor:spec.key}},
  prototypeToken:{name:spec.name,actorLink:true,texture:{src:image},bar1:{attribute:"resources.health"},bar2:{attribute:"resources.cosmo"}},
  system:{schemaVersion:3,automation:{enabled:true},profile:{level:1,style:spec.key,status:"bronze",nature:spec.nature,
    biography:`${spec.role}\nFicha fictícia de teste de combate, não uma criação completa para campanha. Técnica personalizada Bronze: ND 2, Poder 10, custo 2 CE. Nível de ataque físico ajustado para 5 neste exercício, para produzir dano contra PA 3. Sem virtudes/dádivas especiais. PV e CE começam preenchidos. Importar novamente pelo atalho preserva cópias editadas; para outro exercício, importe uma nova cópia pelo compêndio.`,
    trainingPlace:"Arena de testes"},
    attributes:Object.fromEntries(Object.entries(spec.ranks).map(([key,value])=>[key,{value}])),
    skills:{asterism:{value:2},training:{value:1},cosmoUse:{value:1},combat:{value:2}},fighting:spec.fighting,
    resources:{health:{value:spec.hp},cosmo:{value:spec.ce}},combat:{attackLevel:5},
    creationGuide:{status:"",initializeResources:false},
  },
  items:[
    {_id:"demoArmor0000001",name:"Armadura de Bronze — treino",type:"armor",img:image,effects:[],system:{equipped:true,class:"bronze",version:1,health:{value:30},state:"active",description:"Armadura de treino: 30 PV, PA 3, +3 CE. Modelo de Bronze, sem poderes especiais.",sourceVersion:"Exemplo de teste",notes:"Ficha fictícia para testes de combate."}},
    {_id:"demoTech00000001",name:spec.technique,type:"technique",img:image,effects:[],system:{nature:spec.nature,classification:"bronze",effectKind:"damage",damageLevel:2,power:10,cost:2,costExtra:0,range:10,techniqueReviewed:true,description:"Técnica personalizada de treino para conferir ativação, consumo de CE, resistência e aplicação/desfazer de dano. Não representa uma técnica nomeada do livro.",sourceVersion:"Exemplo de teste",notes:"Parâmetros de teste explícitos; sem Big Bangs extras ou efeitos especiais."}}
  ]
}));

export function testActorDocuments() {
  return TEST_ACTORS.map(source=>{
    const actor=structuredClone(source);actor._key=`!actors!${actor._id}`;
    for(const item of actor.items) item._key=`!actors.items!${actor._id}.${item._id}`;
    return actor;
  });
}

export function openTestActors() {
  const pack=game.packs.get(`${SYSTEM_ID}.${TEST_ACTOR_PACK.name}`);
  if(!pack) return ui.notifications.warn("Compêndio de testes indisponível. Atualize o sistema e reinicie o mundo.");
  pack.render(true);return pack;
}

let importing=false;
export async function importTestActors() {
  if(!game.user.isGM) return ui.notifications.warn("Somente o mestre pode importar o grupo de teste.");
  if(importing) return;
  importing=true;
  try {
    const pack=game.packs.get(`${SYSTEM_ID}.${TEST_ACTOR_PACK.name}`);
    if(!pack) throw Error("Compêndio de testes indisponível. Atualize o sistema e reinicie o mundo.");
    const documents=await pack.getDocuments();
    const sources=documents.filter(doc=>TEST_ACTORS.some(source=>source._id===doc.id));
    if(sources.length!==TEST_ACTORS.length) throw Error("Grupo de teste incompleto; confira a instalação do sistema.");
    const existing=game.actors.contents.filter(actor=>TEST_ACTORS.some(source=>source.flags[SYSTEM_ID].testActor===actor.flags?.[SYSTEM_ID]?.testActor));
    const missing=sources.filter(doc=>!existing.some(actor=>actor.flags[SYSTEM_ID].testActor===doc.flags[SYSTEM_ID].testActor));
    if(!missing.length) {ui.notifications.info("O grupo de teste já existe. Recursos, notas e alterações foram preservados.");return existing;}
    let folder=game.folders.contents.find(folder=>folder.type==="Actor"&&folder.flags?.[SYSTEM_ID]?.testActors);
    if(!folder) folder=await Folder.create({name:"TESTES — Combate",type:"Actor",flags:{[SYSTEM_ID]:{testActors:true}}});
    const created=await Actor.createDocuments(missing.map(doc=>{
      const data=doc.toObject();delete data._id;delete data._stats;data.folder=folder.id;data.ownership={default:0};
      data.flags[SYSTEM_ID].testActorOrigin=doc.uuid;
      return data;
    }));
    ui.notifications.info(`${created.length} fichas criadas em TESTES — Combate. Arraste-as para a cena e atribua os jogadores nas permissões.`);
    return [...existing,...created];
  } catch(error) {ui.notifications.error(error.message);} finally {importing=false;}
}
