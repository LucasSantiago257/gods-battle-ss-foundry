import {STYLES,SKILLS} from "./config.mjs";
import {effectiveAttribute,passiveWarnings} from "./passives.mjs";
import {techniqueReadiness} from "./technique-rules.mjs";
export const CREATION_STEPS=[
 {label:"Identidade e estilo",tab:"overview",hint:"Preencha nome, estilo e natureza. Confira as escolhas iniciais e aplique os benefícios do estilo uma vez."},
 {label:"Atributos",tab:"overview",hint:"Distribua oito pontos de treino. O ponto do estilo é separado. Confira as graduações efetivas após benefícios de virtudes."},
 {label:"Virtudes e habilidades",tab:"powers",hint:"Escolha uma virtude Geral e a virtude inicial do estilo. Abra as cópias para configurar escolhas e conferir pendências."},
 {label:"Perícias",tab:"skills",hint:"Distribua os pontos disponíveis; cada perícia normalmente é limitada pelo atributo associado. Confira a perícia livre do estilo."},
 {label:"Armadura",tab:"equipment",hint:"Escolha ou arraste uma armadura. Abra para personalizar e use Equipar quando estiver pronta."},
 {label:"Técnica e revisão",tab:"techniques",hint:"Escolha uma técnica inicial, configure seus parâmetros na cópia e confira a revisão antes de concluir."}
];
export const INITIAL_STYLES={
 saint:{skills:['combat','sports','leadership','perception','training'],virtue:'Combate',fighting:{defense:1},choiceRank:2,page:'57–58'},
 sage:{skills:['academics','asterism','mythology','telekinesis','technology'],virtue:'Técnica',fighting:{psychic:2,defense:1},page:'67–68'},
 guardian:{skills:['armor','combat','leadership','sports','mythology'],virtue:'Combate',fighting:{weapons:1,defense:2},page:'78–79'},
 artist:{skills:['performance','cosmoUse','spying','perception','sealing'],virtue:'Livre',fighting:{psychic:2,defense:1},page:'91–92'},
 asgardian:{skills:['combat','asterism','mythology','technology','training'],virtue:'Combate',fighting:{weapons:1,defense:1},choiceRank:1,page:'104–105'},
 beastmaster:{skills:[],virtue:'Combate',fighting:{kick:2,psychic:1},page:'115–118'}
};
export function initialStyleChanges(system,{recordOnly=false}={}) {
 const key=system.profile.style,style=STYLES[key],initial=INITIAL_STYLES[key];
 if(system.creationGuide.styleApplied) {
  if(system.creationGuide.styleApplied!==key) throw Error('O estilo foi alterado após aplicar benefícios. Revise os pontos manualmente antes de aceitar a exceção.');
  return {};
 }
 const updates={'system.creationGuide.styleApplied':key};
 if(!recordOnly) {
  updates[`system.attributes.${style.key}.value`]=system.attributes[style.key].value+1;
  if(Object.values(system.fighting).every(value=>value===0)) {
   for(const [kind,rank] of Object.entries(initial.fighting))updates[`system.fighting.${kind}`]=rank;
   if(initial.choiceRank)updates[`system.fighting.${system.creationGuide.fightChoice}`]=initial.choiceRank;
  }
 }
 return updates;
}
export function creationReview(system,items=[],name='') {
 const guide=system.creationGuide,initial=INITIAL_STYLES[system.profile.style],warnings=[];
 const spent=Object.values(system.attributes).reduce((sum,a)=>sum+a.value-1,0)-(guide.styleApplied?1:0)-system.progression.trainingAdjust;
 const skillBudget=(2+effectiveAttribute(system,'sen'))*3,skillSpent=Object.values(system.skills).reduce((sum,s)=>sum+s.value,0);
 const virtues=items.filter(i=>i.type==='virtue'),techniques=items.filter(i=>i.type==='technique'),armors=items.filter(i=>i.type==='armor');
 if(!name.trim())warnings.push('Preencha o nome do personagem.');
 if(system.profile.level!==1)warnings.push('O assistente atende criação no nível 1.');
 if(!guide.styleApplied)warnings.push('Aplique ou confirme os benefícios iniciais do estilo.');
 if(guide.styleApplied && guide.styleApplied!==system.profile.style)warnings.push('Estilo mudou após a aplicação inicial; revisar benefícios manualmente.');
 if(spent!==8)warnings.push(`Treino: ${spent} de 8 pontos distribuídos.`);
 for(const [key,a] of Object.entries(system.attributes))if(a.value<1 || effectiveAttribute(system,key)>5)warnings.push(`Atributo ${key}: graduação inicial deve ficar entre 1 e 5, salvo exceção.`);
 if(skillSpent!==skillBudget)warnings.push(`Perícias: ${skillSpent} de ${skillBudget} pontos distribuídos.`);
 for(const [key,s] of Object.entries(system.skills))if(s.value>effectiveAttribute(system,s.attribute))warnings.push(`${SKILLS[key].label} supera o atributo associado.`);
 if(!guide.extraSkill && initial.skills.length)warnings.push('Escolha a perícia livre do estilo.');
 if(guide.extraSkill && initial.skills.includes(guide.extraSkill))warnings.push('A perícia livre deve ser diferente das cinco do estilo.');
 if(virtues.length!==2)warnings.push(`Confira as duas virtudes iniciais; a ficha tem ${virtues.length}.`);
 if(!virtues.some(i=>i.system.category==='Geral'))warnings.push('Escolha uma virtude Geral inicial.');
 if(initial.virtue!=='Livre'&&!virtues.some(i=>i.system.category===initial.virtue))warnings.push(`O estilo inicia com uma virtude de ${initial.virtue}.`);
 if(system.profile.style==='artist')warnings.push('Artista: conferir a expressão Virtude Extra da p.92 com a regra geral de duas virtudes da p.161; registrar exceção se aplicável.');
 if(!armors.length)warnings.push('Escolha a armadura inicial.');
 if(armors.length&&!armors.some(i=>i.system.equipped))warnings.push('A armadura inicial ainda não está equipada.');
 if(!techniques.length)warnings.push('Escolha uma técnica inicial.');
 if(!items.some(i=>i.type==='ability'&&i.flags?.['gods-battle-ss']?.source?.key?.startsWith(`${system.profile.style}:ability:1:`)))warnings.push('Escolha ou confira a habilidade inicial do estilo.');
 for(const item of techniques) {const pending=techniqueReadiness(item);if(pending)warnings.push(`${item.name}: ${pending}`);if(item.system.nature!==system.profile.nature)warnings.push(`${item.name}: natureza diferente da escolhida.`);}
 if(techniques.length && (system.skills.cosmoUse.value<1 || system.skills.training.value<1))warnings.push('Técnica Bronze requer Utilização do Cosmo e Treinamento 1; conferir p.199.');
 for(const item of items)warnings.push(...passiveWarnings(system,item).map(w=>`${item.name}: ${w}`));
 if(system.profile.style==='beastmaster')warnings.push('Bestas ainda não têm ficha própria; confira companheiro, luta inicial e perícias do estilo manualmente.');
 return {trainingSpent:spent,trainingRemaining:8-spent,skillBudget,skillSpent,skillRemaining:skillBudget-skillSpent,warnings:[...new Set(warnings)],canFinish:!warnings.length || !!(guide.acceptExceptions&&guide.exceptionReason.trim()),initial};
}
