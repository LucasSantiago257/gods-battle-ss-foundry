import {SYSTEM_ID} from "./config.mjs";
import {effectiveAttribute} from "./passives.mjs";
import {levelSignature} from "./level-rules.mjs";
import {hasActiveCondition} from "./condition-rules.mjs";
export const actionHash=value=>levelSignature({},[{_id:"actions",value}]);
export const ACTION_LABELS=Object.freeze({attack:"Ataque",defense:"Defesa",movement:"Movimento parcial",reaction:"Reação",cosmo:"Ação de Cosmo"});
export const ACTION_RESERVES=Object.freeze(["attack","defense","movement","reaction"]);
const data=doc=>doc?.flags?.[SYSTEM_ID]??{};
export function actionRestrictions(actor) {
 const paralyzed=hasActiveCondition(actor?.uuid,actor?.flags,"paralyzed");
 const stunned=hasActiveCondition(actor?.uuid,actor?.flags,"stunned");
 return {paralyzed,stunned,movement:paralyzed||stunned,attack:paralyzed||stunned,defense:paralyzed||stunned,cosmo:stunned,reaction:stunned,technique:stunned};
}
export function assertActionAllowed(actor,pool) {
 const restrictions=actionRestrictions(actor);
 if(restrictions.stunned&&["movement","attack","defense","cosmo","reaction","technique"].includes(pool))throw Error("Atordoado perde a rodada inteira se recuperando (p. 396); nenhuma ação é permitida.");
 if(pool==="movement"&&restrictions.movement)throw Error("Paralisado impede ações de movimento (p. 395–396). Ação de Cosmo continua permitida.");
 if(["attack","defense"].includes(pool)&&restrictions[pool])throw Error(`Paralisado impede ações de ${ACTION_LABELS[pool].toLowerCase()} (p. 395–396). Ação de Cosmo continua permitida.`);
}
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
 return {context,maxima,spent,remaining,cosmoUses,movementTotal,restrictions:actionRestrictions(actor),enabled:!!context};
}
export function actionSignature(actor) {return actionHash({context:actionContext(actor),usage:rawActionUsage(actor)});}
export function actionPlan(actor,pool,amount,{all=false,operationId}={}) {
 if(["attack","defense","movement","cosmo","reaction"].includes(pool))assertActionAllowed(actor,pool);
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
export function techniqueActionPlan(actor,options,id,movement=null) {
 assertActionAllowed(actor,"technique");
 if(movement){
  if(!["partial","total"].includes(movement.mode))throw Error("Modo de Movendo inválido.");
  if(options?.areaTargets!==undefined)throw Error("Movendo em área exige resolução manual; a exceção de ações não é presumida.");
  if(options?.actionPool!==undefined&&options.actionPool!=="movement")throw Error("Esta técnica usa o movimento configurado em Movendo.");
  if(actionContext(actor)&&options?.actionPool!=="movement")throw Error("Selecione o movimento configurado em Movendo.");
  const plan=consumeActionPlan(actor,{pool:"movement",amount:1,movementMode:movement.mode},id);
  return {...plan,actionLabel:plan.label,movement:movement.mode};
 }
 if(options?.actionPool==="movement")throw Error("Movimento exige Movendo habilitado na composição salva.");
 if(options?.areaTargets!==undefined){
  assertActionAllowed(actor,"attack");assertActionAllowed(actor,"defense");const view=actionView(actor),before=rawActionUsage(actor);
  if(!view.enabled)return {view,before,after:before,updates:{},cost:0};
  if(view.spent.attack||view.spent.defense||view.maxima.attack<1||view.maxima.defense<1)throw Error("Área exige todas as reservas de ataque e defesa intactas (pp.210/404).");
  const after={ruleVersion:2,actorUuid:actor.uuid,context:view.context,spent:{...view.spent,attack:view.maxima.attack,defense:view.maxima.defense},cosmoUses:view.cosmoUses,movementTotal:view.movementTotal,last:id};
  return {view,before,after,cost:view.maxima.attack+view.maxima.defense,updates:{[`flags.${SYSTEM_ID}.actionUsage`]:after},area:true};
 }
 if(["attack","defense"].includes(options?.actionPool))assertActionAllowed(actor,options.actionPool);
 if(!actionContext(actor))return actionPlan(actor,null,0,{operationId:id});
 if(!["attack","defense"].includes(options.actionPool))throw Error("Escolha todas as ações de ataque ou todas as ações de defesa para esta técnica.");
 return actionPlan(actor,options.actionPool,0,{all:true,operationId:id});
}
// Prefer an intact reserve in the activation dialog; the execution plan remains authoritative.
export function techniqueActionChoices(actor) {
 const view=actionView(actor);if(!view.enabled)return [];
 const choices=["attack","defense"].map(key=>{
  let available=true,reason="";try{techniqueActionPlan(actor,{actionPool:key},"preview");}catch(error){available=false;reason=error.message;}
  return {key,label:`Todas as ações de ${ACTION_LABELS[key].toLowerCase()} · ${view.remaining[key]}/${view.maxima[key]}`,available,reason};
 });
 const preferred=choices.find(c=>c.available)?.key??choices[0].key;
 return choices.map(c=>({...c,selected:c.key===preferred}));
}
export function stampCombatRound(combat,changes) {
 if(Object.hasOwn(changes,"round")&&changes.round!==combat.round)changes[`flags.${SYSTEM_ID}.actionControl.epoch`]=foundry.utils.randomID();
}
