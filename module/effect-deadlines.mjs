// Display-only deadlines. No resources, records or encounter state are changed.
export function effectDeadline(view){
 const record=view.record??{},base={pendingRounds:0,maintenancePending:false,deadlinePriority:2,deadlineLabel:"",deadlineDetail:""};
 if(view.foreign)return {...base,deadlinePriority:3,deadlineLabel:"Prazo pertence à ficha original"};
 if(record.status!=="active")return base;
 if(record.kind==="residual")return {...base,deadlineLabel:"Sem expiração por rodada",deadlineDetail:"Resistências usam dias da campanha; avançar o combate não avança esses dias."};
 const now=view.context?.round;
 if(!Number.isSafeInteger(now)||now<1)return {...base,deadlinePriority:3,deadlineLabel:"Prazo pausado · conferir encontro ou registro"};
 if(record.kind==="sustained"){
  if(view.oneOff)return {...base,deadlineLabel:"Recarga única já registrada",deadlineDetail:"Sem nova cobrança periódica neste perfil; oposição permanece no fluxo próprio."};
  if(view.phase==="initial")return {...base,deadlinePriority:1,deadlineLabel:`Prazo inicial até a rodada ${record.lastRound}`,deadlineDetail:`${record.lastRound-now+1} rodada(s) do prazo inicial, incluindo a atual. Sem recarga nesta fase.`};
  if(view.canPay)return {...base,maintenancePending:true,deadlinePriority:0,deadlineLabel:`Recarga de 1 CE pendente · rodada ${now}`,deadlineDetail:view.overdue?`Lacuna de ${now-view.nextRound} rodada(s) desde a ${view.nextRound}; sem cobrança retroativa automática.`:"Primeira rodada ainda não coberta pelo pagamento."};
  return {...base,deadlinePriority:1,deadlineLabel:`Recarga coberta até a rodada ${record.sustain.paidUntilRound}`,deadlineDetail:`Próxima recarga: rodada ${view.nextRound}. Não é expiração automática do efeito.`};
 }
 if(!["brasas","manual","armorBreak"].includes(record.kind))return {...base,deadlinePriority:3,deadlineLabel:"Prazo exige conferência do tipo de efeito"};
 if(!Number.isSafeInteger(view.nextRound)||!Number.isSafeInteger(record.firstRound)||!Number.isSafeInteger(record.lastRound)||record.firstRound<1||record.lastRound<record.firstRound||record.lastRound-record.firstRound>=1000)return {...base,deadlinePriority:3,deadlineLabel:"Prazo exige conferência do registro"};
 let remaining=0,pending=0;
 for(let round=record.firstRound;round<=record.lastRound;round++)if(!record.ticks?.[`round${round}`]){remaining++;if(round<=now)pending++;}
 return {...base,pendingRounds:pending,deadlinePriority:pending?0:1,deadlineLabel:pending?`${pending} rodada(s) pendente(s) · prazo até ${record.lastRound}`:`Próxima rodada ${view.nextRound} · prazo até ${record.lastRound}`,deadlineDetail:`${remaining} rodada(s) por registrar, incluindo as pendentes. Avançar o combate não aplica nem dispensa parcelas.`};
}
