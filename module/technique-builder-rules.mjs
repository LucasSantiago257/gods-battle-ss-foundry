import {SYSTEM_ID,NATURES} from "./config.mjs";
import {TECHNIQUE_TIERS,TECHNIQUE_MODES,effectiveTechnique,activationPreview} from "./technique-rules.mjs";
export const PRIMORDIALS={damage:{label:"Dano",id:"13841831d802c5be"},control:{label:"Controle",id:"953cf77664309d03"},sustained:{label:"Sustentada",id:"ac34d9f38628bd92"},residual:{label:"Cosmo Residual",id:"49b31d7e766c2fd9"}};
export const componentUuid=id=>`Compendium.${SYSTEM_ID}.componentes-tecnicas.Item.${id}`;
export const validComponentUuid=uuid=>/^Compendium\.gods-battle-ss\.componentes-tecnicas\.Item\.[a-f0-9]{16}$/.test(uuid);
const key=doc=>doc.flags?.[SYSTEM_ID]?.source?.key??"";
const integer=(value,label,max=100)=>{if(!Number.isSafeInteger(value)||value<0||value>max)throw Error(`${label}: número inválido.`);return value;};
export function composeTechnique(system,draft,entries=[],otherTechniqueCount=0) {
 if(!draft.name?.trim()||draft.name.length>100)throw Error("Informe um nome de até 100 caracteres.");
 const tier=TECHNIQUE_TIERS[draft.classification],primary=PRIMORDIALS[draft.primary];
 if(!tier||!primary||!NATURES[draft.nature]||!TECHNIQUE_MODES[draft.techniqueMode])throw Error("Selecione classe, natureza, primordial e modo válidos.");
 const extraSlots=integer(draft.extraSlots??0,"Slots extras",20),extraCost=integer(draft.extraCost??0,"CE fixa extra"),warnings=[],manual=[];
 const seen=new Set(),components=[];
 for(const {slot,doc,rank=1,detail=""}of entries){
  if(!validComponentUuid(doc.uuid)||seen.has(doc.uuid))throw Error("Componente inválido ou repetido.");seen.add(doc.uuid);
  if(!["bigbang","increment"].includes(doc.type))throw Error("Escolha somente Big Bangs e incrementos.");
  if(doc.uuid===componentUuid(primary.id))throw Error("O primordial selecionado já ocupa o slot primordial.");
  if(doc.type==="bigbang"&&rank!==1||doc.type==="increment"&&(!Number.isSafeInteger(rank)||rank<1||rank>3))throw Error("Graduação inválida: Big Bang ocupa um slot; incremento usa graduação1–3.");
  const source=doc.flags?.[SYSTEM_ID]?.source;if(!source||!key(doc).startsWith(doc.type==="bigbang"?"bigbang:":"increment:"))throw Error("Referência de componente ausente.");
  const maxRank=doc.type==="increment"?(source.reference?.maxRank??3):1;
  if(rank>maxRank)throw Error(`${doc.name}: graduação máxima ${maxRank}.`);
  components.push({slot,uuid:doc.uuid,name:doc.name,type:doc.type,rank,maxRank,benefit:doc.type==="increment"?source.reference?.benefits?.[rank-1]??"":"",detail,key:key(doc),page:doc.system.page,description:doc.system.description,requirements:doc.system.requirements,author:source.author,license:source.license,
   slots:doc.type==="bigbang"?1:0,cost:doc.type==="bigbang"&&key(doc)==="bigbang:extra:Apoiar"?0:1});
 }
 const bangs=components.filter(c=>c.type==="bigbang"),increments=components.filter(c=>c.type==="increment"),capacity=tier.cost+extraSlots;
 const used=bangs.length,cost=tier.cost+bangs.reduce((sum,c)=>sum+c.cost,0),fixed=increments.length+extraCost;
 if(used>capacity)warnings.push(`Slots extras ${used}/${capacity}: técnica secreta ou aumento de capacidade exige justificativa (p.223).`);
 if(extraSlots)warnings.push("Slots além da classe exigem conferir Virtude Adicionar Big Bang ou exceção da campanha.");
 if(increments.length>3)warnings.push("Mais de três tipos de incrementos: conferir limite da p.217 e exceção da campanha.");
 if(increments.length&&!draft.incrementReviewed)warnings.push("Confira aquisição de Mestre, tipos e graduações dos incrementos do personagem (p.217). Escolher no construtor não concede a virtude.");
 if(increments.some(c=>c.rank>Math.min(3,1+Math.floor(Math.max(0,system.profile.level-1)/10))))warnings.push("Graduação do incremento acima da progressão usual: conferir avanço a cada dez níveis e aquisição (p.217).");
 const minLevel={bronze:1,silver:11,gold:21}[draft.classification],skillRank={bronze:1,silver:2,gold:3}[draft.classification];
 if(system.profile.level<minLevel||system.skills.cosmoUse.value<skillRank||system.skills.training.value<skillRank)warnings.push(`Aprendizado ${primary.label}/${draft.classification}: conferir nível${minLevel}, Utilização do Cosmo${skillRank} e Treinamento${skillRank} (p.199).`);
 if(draft.nature!==system.profile.nature)warnings.push("Natureza diferente da principal: conferir Dois Cosmos/aprendizado (p.198).");
 if(otherTechniqueCount+1>(system.attributes.cos.effective??system.attributes.cos.value))warnings.push("Quantidade de técnicas supera Cosmo; conferir capacidade e aprendizado (p.201).");
 if(!draft.reviewed)warnings.push("Confirme a revisão da composição, requisitos, efeitos e desenvolvimento.");
 const mixed=bangs.some(c=>c.key.startsWith("bigbang:primordial:"));
 const effectKind=draft.primary==="residual"||mixed?"manual":draft.primary;
 if(effectKind==="manual")manual.push("Cosmo Residual ou primordiais mistos exigem resolução própria. Esta composição mantém aplicação manual (pp.223–225).");
 if(bangs.length||increments.length)manual.push("Os custos/slots são calculados; efeitos específicos e testes de confirmação dos componentes exigem revisão manual. Leia cada referência.");
 if(components.some(c=>c.key==="bigbang:extra:Apoiar"))manual.push("Apoiar custa0CE e ocupa1slot. Sua evolução de classe/capacidade exige conferência; o construtor não promove a técnica silenciosamente (p.225).");
 manual.push("Conferir mestre/armadura que ensina, aprovação e seis meses de desenvolvimento por slot (pp.199/222). Criar o Item não comprova aprendizado.");
 const range=draft.range===0?tier.range:draft.range;if(!Number.isFinite(range)||range<0)throw Error("Alcance inválido.");
 const duration=draft.duration?.trim()|| (draft.primary==="damage"?"Instantânea":`Turno da ação + ${tier.cost-1}`);
 const technique={techniqueMode:draft.techniqueMode,classification:draft.classification,nature:draft.nature,effectKind,cost,costExtra:fixed,damageLevel:integer(draft.damageLevel??0,"ND manual"),power:integer(draft.power??0,"Poder manual",1000),range,duration};
 const effective=effectiveTechnique(system,technique);if(effectKind==="damage"&&(effective.damageLevel<1||effective.power<1))throw Error("Dano exige ND e Poder positivos.");
 const preview=effectKind==="manual"?null:activationPreview(system,technique);
 const blueprint=structuredClone(draft);delete blueprint.id;delete blueprint.baseline;
 return {technique,components,primary:{...primary,uuid:componentUuid(primary.id)},cost,fixed,totalCost:cost+fixed,difficulty:10+cost+fixed,capacity,used,warnings,manual,preview,
  canApply:!!draft.reviewed&&(!warnings.length||!!(draft.allowExceptions&&draft.reason?.trim())),blueprint,updates:{name:draft.name.trim(),...Object.fromEntries(Object.entries(technique).map(([field,value])=>[`system.${field}`,value])),"system.description":draft.description??"","system.bigbangs":[`Primordial: ${primary.label}`,...bangs.map(c=>c.name)].join("\n"),"system.increments":increments.map(c=>`${c.name} · graduação${c.rank}`).join("\n"),"system.techniqueReviewed":true}};
}
