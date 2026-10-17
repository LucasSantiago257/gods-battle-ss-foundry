// pp.210/404. Technical cap bounds one request; it is not a rule of the book.
export const AREA_LIMIT=20;
export function areaRules(system,technique,options={}) {
 const targets=options.areaTargets;if(targets===undefined)return null;
 if(technique.effectKind!=="damage")throw Error("Técnicas em área desta manobra exigem primordial Dano (p.210).");
 if(!Number.isSafeInteger(system.skills.asterism.value)||system.skills.asterism.value<3)throw Error("Técnicas em área exigem Asterismo3 (p.210).");
 if(!Array.isArray(targets)||targets.length<2||targets.length>AREA_LIMIT)throw Error(`Área: selecione de2 a${AREA_LIMIT} alvos distintos.`);
 if(new Set(targets.map(t=>t?.actorUuid)).size!==targets.length)throw Error("Dois tokens da mesma ficha não podem receber parcelas de área separadas. Use fichas independentes.");
 if(options.distanceSnapshot!==undefined)throw Error("Distância e geometria de cada alvo da área ainda são manuais. Desative a redução por distância.");
 if(options.oppositeEssence)throw Error("Essência Alvo em área exige resolução individual; não aplique o bônus ao grupo inteiro.");
 return {version:1,count:targets.length,extraCost:targets.length,difficultyExtra:2*targets.length,page:"210/404"};
}
export function areaMember(attack,actorUuid) {
 const targets=attack?.areaTargets;if(targets===undefined)return null;
 if(attack.effectKind!=="damage"||!Array.isArray(targets)||targets.length<2||targets.length>AREA_LIMIT||new Set(targets.map(t=>t?.actorUuid)).size!==targets.length||attack.area?.count!==targets.length)throw Error("Lista de alvos da área inválida; resolva a técnica novamente.");
 const member=targets.find(t=>t?.actorUuid===actorUuid);
 if(!member||typeof member.tokenUuid!=="string"||typeof member.name!=="string")throw Error("Este cavaleiro não é um alvo desta área.");
 return member;
}
export function areaAttackFor(attack,actorUuid) {
 const member=areaMember(attack,actorUuid);if(!member)throw Error("Este cartão não contém uma área.");
 return {...attack,targetUuid:member.actorUuid,targetName:member.name,turnSnapshot:member.turnSnapshot,areaTargetTokenUuid:member.tokenUuid};
}
