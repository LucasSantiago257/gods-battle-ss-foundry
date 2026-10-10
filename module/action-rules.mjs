import {SYSTEM_ID} from "./config.mjs";
import {effectiveAttribute} from "./passives.mjs";
import {levelSignature} from "./level-rules.mjs";
export const actionHash=value=>levelSignature({},[{_id:"actions",value}]);
export const ACTION_LABELS=Object.freeze({attack:"Ataque",defense:"Defesa",movement:"Movimento parcial",reaction:"Reação",cosmo:"Ação de Cosmo"});
export const ACTION_RESERVES=Object.freeze(["attack","defense","movement","reaction"]);
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
 const maxima={attack:Math.max(0,Math.floor(actor.system.combat.attack)),defense:Math.max(0,Math.floor(actor.system.combat.defense)),movement:Math.max(0,Math.floor(effectiveAttribute(actor.system,"vel"))),reaction:1};
 const same=context&&raw?.actorUuid===actor.uuid&&actionHash(raw.context)===actionHash(context);
 const movementTotal=!!same&&(raw.ruleVersion===2?raw.movementTotal===true:Number(raw.spent?.movement)>0);
 const spent=Object.fromEntries(ACTION_RESERVES.map(key=>[key,same?key==="movement"&&movementTotal?Math.max(maxima.movement,Number(raw.spent?.movement)||0):Math.max(0,Number(raw.spent?.[key])||0):0]));
 const remaining=Object.fromEntries(Object.keys(maxima).map(key=>[key,Math.max(0,maxima[key]-spent[key])]));
 const cosmoUses=same?Math.max(0,Number(raw.cosmoUses)||0):0;
 return {context,maxima,spent,remaining,cosmoUses,movementTotal,enabled:!!context};
}
export function actionSignature(actor) {return actionHash({context:actionContext(actor),usage:rawActionUsage(actor)});}
export function actionPlan(actor,pool,amount,{all=false,operationId}={}) {
 const view=actionView(actor);if(!view.enabled)return {view,updates:{},before:rawActionUsage(actor),after:rawActionUsage(actor),cost:0};
 if(!Object.hasOwn(ACTION_LABELS,pool))throw Error("Escolha uma reserva de ações válida.");
 if(pool==="cosmo"){
  if(all||amount!==1||!Number.isSafeInteger(view.cosmoUses)||view.cosmoUses>=1000000)throw Error("Registro de Ação de Cosmo inválido ou limite técnico de histórico atingido.");
  const after={ruleVersion:2,actorUuid:actor.uuid,context:view.context,spent:{...view.spent},cosmoUses:view.cosmoUses+1,movementTotal:view.movementTotal,last:operationId};
  return {view,before:rawActionUsage(actor),after,cost:1,updates:{[`flags.${SYSTEM_ID}.actionUsage`]:after}};
 }
 if(all&&view.spent[pool]>0)throw Error(pool==="movement"?"Movimento total exige a reserva de movimento intacta nesta rodada.":"Uma técnica exige todas as ações de ataque ou defesa ainda intactas. Escolha a outra reserva ou ajuste a reserva após conferir a exceção.");
 const cost=all?view.maxima[pool]:amount;
 if(!Number.isSafeInteger(cost)||cost<1||cost>view.remaining[pool])throw Error(`Ações de ${ACTION_LABELS[pool]} insuficientes ou quantidade inválida.`);
 const after={ruleVersion:2,actorUuid:actor.uuid,context:view.context,spent:{...view.spent,[pool]:view.spent[pool]+cost},cosmoUses:view.cosmoUses,movementTotal:pool==="movement"&&all||view.movementTotal,last:operationId};
 return {view,before:rawActionUsage(actor),after,cost,updates:{[`flags.${SYSTEM_ID}.actionUsage`]:after}};
}
// Movimento legado sem modo continua sendo a declaração total da versão anterior.
export function consumeActionPlan(actor,options,id){
 if(!["movement","reaction","cosmo"].includes(options?.pool)||options.amount!==1)throw Error("Registro de movimento/reação/Cosmo inválido.");
 if(options.pool!=="movement"&&options.movementMode!==undefined)throw Error("Modo de movimento incompatível com esta ação.");
 const mode=options.movementMode??"total";
 if(options.pool==="movement"&&!["partial","total"].includes(mode))throw Error("Escolha Movimento Parcial ou Total.");
 const plan=actionPlan(actor,options.pool,1,{all:options.pool==="movement"&&mode==="total",operationId:id});
 return {...plan,label:options.pool==="movement"?mode==="partial"?"Movimento parcial":"Movimento total":ACTION_LABELS[options.pool],movementMode:options.pool==="movement"?mode:null};
}
export function residualActionPlan(actor,id){
 const plan=actionPlan(actor,"movement",1,{operationId:id});
 if(!plan.view.enabled)return {...plan,actionLabel:"Ação de Cosmo + Movimento Parcial · conferidos na mesa"};
 if(!Number.isSafeInteger(plan.view.cosmoUses)||plan.view.cosmoUses>=1000000)throw Error("Limite técnico de histórico de Ação de Cosmo atingido.");
 const after={...plan.after,cosmoUses:plan.view.cosmoUses+1};
 return {...plan,after,updates:{[`flags.${SYSTEM_ID}.actionUsage`]:after},actionLabel:"1 Ação de Cosmo + 1 Movimento Parcial"};
}
export function techniqueActionPlan(actor,options,id) {
 if(!actionContext(actor))return actionPlan(actor,null,0,{operationId:id});
 if(!["attack","defense"].includes(options.actionPool))throw Error("Escolha todas as ações de ataque ou todas as ações de defesa para esta técnica.");
 return actionPlan(actor,options.actionPool,0,{all:true,operationId:id});
}
export function stampCombatRound(combat,changes) {
 if(Object.hasOwn(changes,"round")&&changes.round!==combat.round)changes[`flags.${SYSTEM_ID}.actionControl.epoch`]=foundry.utils.randomID();
}
