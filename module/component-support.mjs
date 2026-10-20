import {COMPONENT_RULES} from "./technique-components.mjs";
const prefix="Compendium.gods-battle-ss.componentes-tecnicas.Item.";
export function componentSupport(component,primary,mixed=false){
 const manual={kind:"manual",label:"Aplicação manual",detail:"Custo e slots são calculados; o efeito deste componente exige aplicação pela mesa."};
 if(["damage","control","sustained"].includes(primary)&&!mixed&&component.uuid===prefix+"3db91f91d5c36fe8"&&component.key==="bigbang:extra:Movendo"&&component.type==="bigbang"&&component.rank===1)return {kind:"activation",label:"Movimento configurável em Ativar",detail:"Após concluir, selecione Movendo Parcial ou Total em Configurar → Ações na ativação. Consome movimento e CE juntos; não desloca o token nem executa os demais efeitos. Área permanece manual."};
 if(primary!=="damage"||mixed)return {...manual,detail:"Este primordial ou composição mista não usa o grupo automático de Dano. Consulte os fluxos próprios e a referência do componente."};
 const id=typeof component.uuid==="string"&&component.uuid.startsWith(prefix)?component.uuid.slice(prefix.length):null,rule=id&&Object.hasOwn(COMPONENT_RULES,id)?COMPONENT_RULES[id]:null;
 if(rule&&component.uuid===prefix+id&&component.key===rule.key){
  const increment=["space","stars","destruction"].includes(rule.kind),valid=component.type===(increment?"increment":"bigbang")&&Number.isSafeInteger(component.rank)&&component.rank>=1&&component.rank<=(increment?3:1);
  if(valid)return {kind:"activation",label:"Cálculo disponível em Ativar",detail:rule.kind==="weaken"?"Após concluir, habilite o grupo em Configurar. Calcula a penalidade nesta resistência; extensão a outros ataques continua manual.":"Após concluir, habilite o grupo em Configurar. A ativação calcula somente a parcela descrita no grupo; opções de contexto são escolhidas ao ativar."};
 }
 if(component.uuid===prefix+"e63322f3195be739"&&component.key==="bigbang:extra:Brasas"&&component.type==="bigbang"&&component.rank===1)return {kind:"rounds",label:"Rodadas assistidas · registro separado",detail:"Após ativar e resolver a resistência, registre Brasas no painel Efeitos com duração do alvo. A ativação não cria o registro automaticamente."};
 return manual;
}
export function componentSupportSummary(components,primary){
 const mixed=components.some(c=>c.key?.startsWith("bigbang:primordial:"));
 const rows=components.map(c=>({slot:c.slot,...componentSupport(c,primary,mixed)}));
 return {rows,activation:rows.filter(r=>r.kind==="activation").length,rounds:rows.filter(r=>r.kind==="rounds").length,manual:rows.filter(r=>r.kind==="manual").length};
}
