import {SYSTEM_ID} from "./config.mjs";
import {levelSignature} from "./level-rules.mjs";
export const actionHash=value=>levelSignature({},[{_id:"actions",value}]);
export const ACTION_LABELS={attack:"Ataque",defense:"Defesa",movement:"Movimento",reaction:"Reação"};
const data=doc=>doc?.flags?.[SYSTEM_ID]??{};
export const rawActionUsage=actor=>structuredClone(data(actor).actionUsage??null);
// A rodada do Foundry representa o turno coletivo do livro. Mudar a vez não repõe reservas.
export function actionContext(actor) {
 const contexts=[];
 for(const combat of game.combats?.contents??[]) {
  if(!combat.started||!data(combat).actionControl?.enabled)continue;
  const members=(combat.combatants?.contents??[]).filter(c=>c.actor?.uuid===actor.uuid);
  if(members.length>1)throw Error("Esta ficha tem mais de um combatente no mesmo combate. Use fichas/tokens independentes ou remova a duplicata antes de gastar ações.");
  if(members.length)contexts.push({combatUuid:combat.uuid,combatantId:members[0].id,round:combat.round,epoch:data(combat).actionControl.epoch??"initial"});
 }
 if(contexts.length>1)throw Error("Esta ficha participa de mais de um combate com controle de ações. Encerre/desative um deles antes de gastar ações.");
 return contexts[0]??null;
}
export function actionView(actor) {
 const context=actionContext(actor),raw=rawActionUsage(actor);
 const maxima={attack:Math.max(0,Math.floor(actor.system.combat.attack)),defense:Math.max(0,Math.floor(actor.system.combat.defense)),movement:1,reaction:1};
 const same=context&&raw?.actorUuid===actor.uuid&&actionHash(raw.context)===actionHash(context);
 const spent=Object.fromEntries(Object.keys(ACTION_LABELS).map(key=>[key,same?Math.max(0,Number(raw.spent?.[key])||0):0]));
 const remaining=Object.fromEntries(Object.keys(maxima).map(key=>[key,Math.max(0,maxima[key]-spent[key])]));
 return {context,maxima,spent,remaining,enabled:!!context};
}
export function actionSignature(actor) {return actionHash({context:actionContext(actor),usage:rawActionUsage(actor)});}
export function actionPlan(actor,pool,amount,{all=false,operationId}={}) {
 const view=actionView(actor);if(!view.enabled)return {view,updates:{},before:rawActionUsage(actor),after:rawActionUsage(actor),cost:0};
 if(!ACTION_LABELS[pool])throw Error("Escolha uma reserva de ações válida.");
 if(all&&view.spent[pool]>0)throw Error("Uma técnica exige todas as ações de ataque ou defesa ainda intactas. Escolha a outra reserva ou peça revisão ao mestre para uma exceção conferida.");
 const cost=all?view.maxima[pool]:amount;
 if(!Number.isSafeInteger(cost)||cost<1||cost>view.remaining[pool])throw Error(`Ações de ${ACTION_LABELS[pool]} insuficientes ou quantidade inválida.`);
 const after={actorUuid:actor.uuid,context:view.context,spent:{...view.spent,[pool]:view.spent[pool]+cost},last:operationId};
 return {view,before:rawActionUsage(actor),after,cost,updates:{[`flags.${SYSTEM_ID}.actionUsage`]:after}};
}
export function techniqueActionPlan(actor,options,id) {
 if(!actionContext(actor))return actionPlan(actor,null,0,{operationId:id});
 if(!["attack","defense"].includes(options.actionPool))throw Error("Escolha todas as ações de ataque ou todas as ações de defesa para esta técnica.");
 return actionPlan(actor,options.actionPool,0,{all:true,operationId:id});
}
export function stampCombatRound(combat,changes) {
 if(Object.hasOwn(changes,"round")&&changes.round!==combat.round)changes[`flags.${SYSTEM_ID}.actionControl.epoch`]=foundry.utils.randomID();
}
