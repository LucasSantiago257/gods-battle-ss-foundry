import {ATTRIBUTES,SKILLS,FIGHTING,STYLES,SYSTEM_ID} from "./config.mjs";
import {prepareKnight} from "./rules.mjs";
import {effectiveAttribute,passiveDefinition,passiveWarnings} from "./passives.mjs";

export const EVOLUTIONS={aesir:{label:"Aesir",skills:1,page:"550–551"},gold:{label:"Cavaleiro de Ouro",skills:2,page:"556"},judges:{label:"Juiz do Inferno",skills:3,page:"562–563"},marinas:{label:"General Marina",skills:1,page:"569"},dryads:{label:"Dríade",skills:2,page:"575"},berserkers:{label:"Berserker",skills:0,page:"582"}};
export const EXTRA_SPECIALIZATIONS={protector:"Protetor",assassin:"Assassino",telekinetic:"Telecinético"};
export const LEVEL_XP=[0,5,10,20,30,40,50,60,70,80,90,105,120,135,150,165,180,195,210,225,250,275,300,325,350,380,410,440,470,500,550];
const SENSES={5:{ordinal:6,stage:"expanded",initiative:3,attack:3},10:{ordinal:6,stage:"mastered",initiative:4,attack:5},15:{ordinal:6,stage:"full",initiative:5,attack:5},20:{ordinal:7,stage:"awakened",initiative:6,attack:10},25:{ordinal:7,stage:"expanded",initiative:7,attack:10},30:{ordinal:7,stage:"mastered",initiative:8,attack:10}};
const stages=["awakened","expanded","mastered","full","omega"];
const integer=(value,label,max=10000)=>{if(!Number.isInteger(value)||value<0||value>max)throw Error(`${label}: valor inválido.`);return value;};
const sourceKey=item=>item.flags?.[SYSTEM_ID]?.source?.key??"";
export const extraSpecialization=system=>Object.entries(EXTRA_SPECIALIZATIONS).find(([,label])=>label.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase()===system.profile.specialization.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase())?.[0];

export function levelMilestones(system,draft) {
 const to=draft.to,route=to>20?draft.evolution:system.profile.style;
 if(!/^[a-zA-Z0-9]{16}$/.test(draft.id)||draft.from!==system.profile.level||!Number.isInteger(to)||to!==system.profile.level+1||to>30)throw Error("Evolua um nível por vez, até o nível 30, com um rascunho válido.");
 if(to>20&&!EVOLUTIONS[route])throw Error("Escolha a evolução dos níveis 21–30.");
 return {from:system.profile.level,to,route,routeLabel:EVOLUTIONS[route]?.label??STYLES[route].label,skillPoints:Math.max(1,effectiveAttribute(system,"sen")+(EVOLUTIONS[route]?.skills??STYLES[route].skills)),
  attributePoints:to%5===0?2:0,fightPoints:to%5===0?2:0,virtue:to%4===0,technique:[11,21,30].includes(to),powerKind:to===5?"specialization":to%2===0?"gift":"ability",xp:LEVEL_XP[to],sense:SENSES[to]??null};
}
export function eligibleLevelPower(system,draft,item) {
 const m=levelMilestones(system,draft),key=sourceKey(item),kind=item.system.abilityKind;
 if(item.type!=="ability"||item.system.level>m.to)return false;
 if(kind==="improvement")return key.startsWith(`${system.profile.style}:improvement:`);
 if(m.to===5)return kind==="specialization"&&(key.startsWith(`${system.profile.style}:`)||Object.keys(EXTRA_SPECIALIZATIONS).some(route=>key.startsWith(`${route}:`)));
 const spec=m.to<=20&&m.powerKind==="gift"?extraSpecialization(system):null;
 return kind===m.powerKind&&item.system.level>1&&key.startsWith(`${spec??m.route}:`);
}
export function levelSignature(system,items) {
 const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==="object"?Object.fromEntries(Object.keys(value).filter(key=>key!=="_stats").sort().map(key=>[key,canonical(value[key])])):value;
 const text=JSON.stringify(canonical({system,items:items.toSorted((a,b)=>String(a._id??a.id).localeCompare(String(b._id??b.id)))}));
 let hash=14695981039346656037n;for(let i=0;i<text.length;i++)hash=BigInt.asUintN(64,(hash^BigInt(text.charCodeAt(i)))*1099511628211n);
 return hash.toString(16);
}
export function planLevel(system,items,draft,selected={},resistanceMode="rank") {
 system=structuredClone(system);items=structuredClone(items);prepareKnight(system,items,resistanceMode);
 const m=levelMilestones(system,draft),next=structuredClone(system),previewItems=structuredClone(items),updates={},warnings=[],manual=[],grants=[],rankUpdates=[];
 const set=(path,value)=>{updates[`system.${path}`]=value;const parts=path.split(".");let target=next;for(const key of parts.slice(0,-1))target=target[key];target[parts.at(-1)]=value;};
 const bank=key=>integer(system.progression[key]??0,key);
 let attributeSpent=0,skillSpent=0,fightSpent=0;
 for(const key of Object.keys(ATTRIBUTES)){
  const add=integer(draft.attributes?.[key]??0,ATTRIBUTES[key],10),base=system.attributes[key].value,effective=effectiveAttribute(system,key);
  if(add&&effective+add>10)throw Error(`${ATTRIBUTES[key]} supera o limite de 10 graduações.`);
  for(let step=0;step<add;step++)attributeSpent+=effective+step>=5?2:1;
  if(add)set(`attributes.${key}.value`,base+add);
 }
 if(attributeSpent>bank("attributeBank")+m.attributePoints)throw Error("Distribuição excede os pontos de atributo disponíveis.");
 set("profile.level",m.to);
 if(m.to>20){set("progression.evolution",m.route);set("progression.epicActions",integer(system.progression.epicActions??0,"Ações épicas")+1);set("progression.epicCosmo",integer(system.progression.epicCosmo??0,"CE épica")+1);}
 const choose=(slot,allowed)=>{
  const doc=selected[slot];if(!doc){warnings.push(`Escolha ${slot==="power"?"a habilidade/dádiva ou Melhoria":slot==="virtue"?"a nova virtude":"a técnica"}, ou registre a aquisição pendente.`);return;}
  if(!allowed(doc))throw Error(`Escolha de ${slot} não corresponde ao nível/estilo.`);
  const old=items.find(item=>item.system.originUuid===doc.uuid||sourceKey(item)&&sourceKey(item)===sourceKey(doc));
  if(doc.system.abilityKind==="improvement"){
   const count=items.filter(item=>sourceKey(item)===sourceKey(doc)).reduce((n,item)=>n+(item.system.rank??1),0);
   if(count>=5)throw Error("Melhoria já foi adquirida cinco vezes.");
   if(old){const rank=(old.system.rank??1)+1;rankUpdates.push({id:old._id??old.id,before:old.system.rank,after:rank});previewItems.find(item=>(item._id??item.id)===(old._id??old.id)).system.rank=rank;return;}
  }else if(old&&!passiveDefinition(doc)?.repeatable){warnings.push(`${doc.name}: já existe uma cópia; ela será preservada, sem concessão duplicada.`);return;}
  const data=structuredClone(doc);delete data._id;delete data.id;delete data.uuid;delete data._stats;
  data.system.originUuid=doc.uuid;data.system.acquisitionLevel=m.to;data.system.equipped=false;
  data.flags??={};data.flags[SYSTEM_ID]??={};data.flags[SYSTEM_ID].levelOperation=draft.id;
  grants.push(data);previewItems.push({...data,id:`preview-${slot}`});
  const spec=Object.keys(EXTRA_SPECIALIZATIONS).find(route=>sourceKey(doc).startsWith(`${route}:`));
  if(m.to===5&&spec)set("profile.specialization",EXTRA_SPECIALIZATIONS[spec]);
  warnings.push(...passiveWarnings(next,data).map(w=>`${doc.name}: ${w}`));
 };
 choose("power",doc=>eligibleLevelPower(system,draft,doc));
 if(m.virtue)choose("virtue",doc=>doc.type==="virtue");
 if(m.technique)choose("technique",doc=>doc.type==="technique"&&(doc.system.classification===(m.to===11?"silver":"gold")));
 for(const key of Object.keys(SKILLS)){
  const add=integer(draft.skills?.[key]??0,SKILLS[key].label,10);skillSpent+=add;
  if(system.skills[key].value+add>10)throw Error(`${SKILLS[key].label} supera 10 graduações.`);
  if(add)set(`skills.${key}.value`,system.skills[key].value+add);
 }
 if(skillSpent>bank("skillBank")+m.skillPoints)throw Error("Distribuição excede os pontos de perícia disponíveis.");
 for(const key of Object.keys(FIGHTING)){
  const add=integer(draft.fighting?.[key]??0,FIGHTING[key],5);fightSpent+=add;
  if(system.fighting[key]+add>5)throw Error(`${FIGHTING[key]} supera cinco graduações.`);
  if(add)set(`fighting.${key}`,system.fighting[key]+add);
 }
 if(fightSpent>bank("fightBank")+m.fightPoints)throw Error("Distribuição excede os pontos de luta disponíveis.");
 set("progression.skillBank",bank("skillBank")+m.skillPoints-skillSpent);set("progression.attributeBank",bank("attributeBank")+m.attributePoints-attributeSpent);set("progression.fightBank",bank("fightBank")+m.fightPoints-fightSpent);
 prepareKnight(next,previewItems,resistanceMode);
 if(m.sense){
  const advanced=next.sense.ordinal>m.sense.ordinal||next.sense.ordinal===m.sense.ordinal&&stages.indexOf(next.sense.stage)>=stages.indexOf(m.sense.stage);
  if(draft.advanceSense&&!advanced){
   if(m.sense.ordinal===7&&(effectiveAttribute(next,STYLES[next.profile.style].key)<7||next.sense.ordinal<7&&next.sense.stage!=="full"))warnings.push("7º Sentido: conferir atributo-chave 7 e 6º Sentido Pleno (p.475); requer exceção se ausentes.");
   set("sense.ordinal",m.sense.ordinal);set("sense.stage",m.sense.stage);set("sense.initiative",Math.max(next.sense.initiative,m.sense.initiative));set("combat.attackLevel",Math.max(next.combat.attackLevel,m.sense.attack));
  }
  manual.push("Conferir os bônus adicionais do Sentido na cópia/ficha, incluindo nível, percepção, Domínio e parâmetros das técnicas (pp.473–480). Sentidos superiores já registrados são preservados.");
 }
 if(m.to%5===0)manual.push("Conferir crescimento dos benefícios da especialização. Eles não são concedidos novamente como cópias (pp.55–56,125–138).");
 if(m.to%10===0)manual.push("Conferir Determinação/Orgulho, Poder Cósmico e eventual troca de virtude; não alterados automaticamente (pp.55,161).");
 if(m.technique)manual.push("A técnica importada precisa de configuração/revisão na cópia antes de ativar (pp.198–202). Nível não promove status ou armadura (p.508).");
 if(system.profile.style==="beastmaster")manual.push("Conferir evolução sincronizada da besta; a ficha do companheiro não é alterada (p.117).");
 if(system.progression.xp<m.xp)warnings.push(`Experiência ${system.progression.xp}; tabela pede ${m.xp} para nível ${m.to} (p.507). Avanço por decisão do mestre exige justificativa.`);
 if(m.to>=11&&system.profile.status==="bronze"&&m.powerKind==="ability")warnings.push("Ainda Bronze: conferir restrição de treinamento das habilidades sem mudança de status e exceções da p.509.");
 if(m.route==="aesir"&&system.profile.style!=="asgardian")warnings.push("Aesir segue treinamento Asgardiano até nível 20 (p.550). Conferir exceção.");
 if(system.profile.level>20&&(system.progression.epicActions??0)!==system.profile.level-20)warnings.push("Níveis anteriores acima de 20 foram registrados fora do assistente; conferir ajustes prévios de ações/CE. Não há concessão retroativa.");
 if(Object.values(selected).some(Boolean)&&!draft.reviewedContent)warnings.push("Confirme leitura dos requisitos e escolhas dos itens selecionados.");
 if(manual.length&&!draft.reviewedManual)warnings.push("Confirme a revisão dos ganhos que exigem aplicação manual.");
 prepareKnight(next,previewItems,resistanceMode);
 for(const[key,skill]of Object.entries(next.skills))if((draft.skills?.[key]??0)>0&&skill.value>effectiveAttribute(next,skill.attribute))warnings.push(`${SKILLS[key].label} supera o atributo associado; confira exceção.`);
 const unique=[...new Set(warnings)];
 return {milestones:m,updates,grants,rankUpdates,projected:next,warnings:unique,manual,attributeSpent,skillSpent,fightSpent,
  canApply:!unique.length||!!(draft.acceptExceptions&&draft.reason?.trim()),summary:[
   {label:"Nível",before:system.profile.level,after:next.profile.level},{label:"PV máximos",before:system.resources.health.max,after:next.resources.health.max},{label:"CE máxima",before:system.resources.cosmo.max,after:next.resources.cosmo.max},
   {label:"Ações de ataque",before:system.combat.attack,after:next.combat.attack},{label:"Ações de defesa",before:system.combat.defense,after:next.combat.defense},{label:"Modificador de nível",before:system.combat.levelModifier,after:next.combat.levelModifier},
   {label:"Virtudes disponíveis",before:system.creation.virtueBudget,after:next.creation.virtueBudget}
  ]};
}
