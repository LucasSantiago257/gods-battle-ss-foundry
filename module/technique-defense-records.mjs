// Value-only bindings, financial snapshots and proof validation for one defender.
import {SYSTEM_ID,ATTRIBUTES} from "./config.mjs";
import {actionHash,actionView,rawActionUsage,actionPlan} from "./action-rules.mjs";
import {canReadChat} from "./combat-rules.mjs";
import {areaAttackFor} from "./area-rules.mjs";
import {techniqueWithComponents} from "./technique-components.mjs";
import {cosmoPayment,paymentAuthorization} from "./technique-rules.mjs";
import {resolvePool} from "./rules.mjs";
import {optionalNote} from "./form-values.mjs";
import {TECHNIQUE_DEFENSE,techniqueDefenseParameters,techniqueDefenseOutcome,techniqueDefenseRemainder} from "./technique-defense-rules.mjs";
const f=a=>a?.flags?.[SYSTEM_ID]??{},clone=structuredClone;
export const defenseSame=(a,b)=>actionHash(a)===actionHash(b);
export function defenseKey(v){if(typeof v!=="string"||!/^[a-zA-Z0-9]{1,32}$/.test(v))throw Error("Identificador de defesa inválido.");return v;}
export function defenseActor(a){if(a?.type!=="knight"||typeof a.uuid!=="string"||!/^(Actor|Scene)\.[A-Za-z0-9.]+$/.test(a.uuid)||a.uuid.length>256)throw Error("Escolha uma ficha real ou token do mundo.");return a.uuid;}
const num=(v,min=-1000000)=>{if(!Number.isFinite(v)||v<min||v>1000000)throw Error("Valor numérico de defesa inválido.");return v;};
const nat=v=>{if(!Number.isSafeInteger(v)||v<0||v>1000000)throw Error("Quantidade de defesa inválida.");return v;};
const pick=(o,keys)=>Object.fromEntries(keys.map(k=>[k,o?.[k]]).filter(([,v])=>v!==undefined));
export function defenseCash(a){const r=a.system.resources;const out={health:num(r.health.value),current:nat(r.cosmo.value),extra:nat(r.cosmoExtra),reserved:nat(r.cosmoReserved),overload:nat(r.cosmoOverload),unlimited:r.cosmo.unlimited,penalty:num(a.system.combat.asterismPenalty),actions:rawActionUsage(a)};if(typeof out.unlimited!=="boolean")throw Error("Saldo de CE inválido.");return out;}
export function defenseMathSystem(s){return {profile:pick(s.profile,["level","status"]),skills:{asterism:pick(s.skills.asterism,["value","mod","total","bonus","associated","effectBonus"])},attributes:Object.fromEntries(Object.keys(ATTRIBUTES).map(k=>[k,pick(s.attributes[k],["value","effective","mod"])])),combat:pick(s.combat,["cosmicPower","asterismPenalty","damageBonus","techniqueDamageBonus","levelModifier"]),automation:pick(s.automation,["techniqueND","conditionModifier","conditionDicePenalty"])};}
export function defenseHasBlocker(a){return (a.items?.contents??[]).some(i=>i.parent===a&&i.type==="virtue"&&i.system?.rulesEnabled!==false&&f(i).source?.key===TECHNIQUE_DEFENSE.blockerKey);}
export function defenseSource(item,a){
 defenseActor(a);if(!item||item.type!=="technique"||item.parent!==a||a.items?.get?.(item.id)!==item||item.uuid!==`${a.uuid}.Item.${defenseKey(item.id)}`||f(item).techniqueDraft||f(item).source?.reference?.manualOnly)throw Error("Cópia de técnica ausente, substituída ou em composição.");
 const t=techniqueWithComponents(item);
 return {itemId:item.id,itemUuid:item.uuid,technique:{...pick(t,["techniqueMode","classification","nature","effectKind","power","damageLevel","cost","costExtra","range","controlRounds"]),componentProfile:{enabled:t.componentProfile.enabled,rules:[]},movement:t.movement}};
}
export function defensePaidOptions(input={},blocker=false){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Opções da defesa inválidas.");
 const out={extra:input.extra??0,elevate:input.elevate??0,condense:input.condense??0,bonus:input.bonus??0,advantage:input.advantage??0,useExtra:input.useExtra??true,allowOverload:input.allowOverload??false,actionPool:input.actionPool??"defense",blocker};
 if(Object.hasOwn(input,"defense"))out.defense=input.defense;
 if(typeof out.useExtra!=="boolean"||typeof out.allowOverload!=="boolean"||!["defense","reaction"].includes(out.actionPool))throw Error("Pagamento ou reserva de defesa inválidos.");
 if(out.actionPool==="reaction"&&!blocker)throw Error("Reação usa Bloqueador de Técnicas; resultados já resolvidos têm registro próprio.");
 return out;
}
export function resolvedDefense({outcome,defense,blocker=false}={}){
 if(!["success","critical","failure","criticalFailure"].includes(outcome)||typeof blocker!=="boolean")throw Error("Informe o resultado já resolvido da defesa.");
 num(defense,0);const success=["success","critical"].includes(outcome),criticalFailure=outcome==="criticalFailure";if(!success&&defense!==0)throw Error("Defesa falha não informa abatimento positivo.");
 return {version:1,kind:"techniqueDefense",outcome:({success:"Sucesso",critical:"Sucesso crítico",failure:"Falha",criticalFailure:"Falha crítica"})[outcome],success,critical:outcome==="critical",criticalFailure,blocker,damageLevel:0,calculatedDefense:defense,defense,adjusted:false,resistanceAllowed:!criticalFailure||blocker,nextPenalty:blocker?0:criticalFailure?-10:0};
}
const noDefense=resolvedDefense({outcome:"success",defense:0});
export function receivedDefenseAttack(a,message,user){
 defenseActor(a);defenseKey(message?.id);if(game.messages?.get?.(message.id)!==message||!canReadChat(user,message))throw Error("Ataque removido, substituído ou sem acesso.");
 const original=f(message).attack;if(!original)throw Error("Este cartão não contém ataque de técnica.");
 const attack=original.areaTargets?areaAttackFor(original,a.uuid):original;
 if(attack.targetUuid&&attack.targetUuid!==a.uuid)throw Error("Este ataque pertence a outro defensor.");
 techniqueDefenseRemainder(attack,noDefense);
 return {rootId:message.id,attack:clone(attack),attackSignature:actionHash(original),attackMath:pick(attack,["effectKind","nature","damage","armorDamage","powerCosmic"])};
}
export function defenseRecordMath(v){if(v==null)return null;return pick(v,["kind","version","actorUuid","rootId","attackSignature","revision","operationId","mode","itemUuid","result","context","userId","time"]);}
export const rawDefenseRecord=(a,id)=>clone(f(a).techniqueDefenses?.[defenseKey(id)]??null);
export const defenseStamp=v=>v?{revision:v.revision,operationId:v.operationId,attackSignature:v.attackSignature,resultSignature:actionHash(v.result)}:null;
export function validateDefenseRecord(v,aUuid,rootId){
 if(!v||v.kind!=="techniqueDefense"||v.version!==1||v.actorUuid!==aUuid||v.rootId!==defenseKey(rootId)||!Number.isSafeInteger(v.revision)||v.revision<1||v.revision>1000000||!["paid","resolved"].includes(v.mode)||typeof v.attackSignature!=="string"||typeof v.userId!=="string"||!Number.isFinite(v.time))throw Error("Defesa de outra ficha ou registro inválido.");
 defenseKey(v.operationId);optionalNote(v.reason);
 if(v.mode==="paid"?(typeof v.itemUuid!=="string"||!v.itemUuid.startsWith(`${aUuid}.Item.`)):v.itemUuid!==null)throw Error("Fonte capturada da defesa inválida.");
 return v;
}
export function defenseClock(a){const v=actionView(a);return {context:v.context,maxima:v.maxima,spent:v.spent,remaining:v.remaining,movementTotal:v.movementTotal,cosmoUses:v.cosmoUses,enabled:v.enabled};}
const armorState=a=>(a.items?.contents??[]).filter(i=>i.type==="armor").map(i=>({id:i.id,uuid:i.uuid,state:i.system.state,equipped:i.system.equipped,health:i.system.health}));
export function defenseReceivedTurn(a,root){
 const t=root.attack.turnSnapshot;if(t==null)return null;
 const c=(game.combats?.contents??[]).find(c=>c.uuid===t.combatUuid),members=(c?.combatants?.contents??[]).filter(m=>m.actor?.uuid===a.uuid);
 return c?.started&&members.length===1?{combatUuid:c.uuid,combatantId:members[0].id,round:c.round,epoch:f(c).actionControl?.epoch??"initial",available:true}:{combatUuid:t.combatUuid,available:false};
}
export function defenseState(a,message,user,{mode="paid",item=null,options={}}={}){
 const root=receivedDefenseAttack(a,message,user),record=rawDefenseRecord(a,root.rootId),clock=defenseClock(a),receivedTurn=defenseReceivedTurn(a,root);
 if(mode==="resolved")return actionHash({actorUuid:a.uuid,root:{rootId:root.rootId,attackSignature:root.attackSignature},record:defenseRecordMath(record),clock,receivedTurn});
 if(mode!=="paid")throw Error("Modo da defesa inválido.");const source=defenseSource(item,a),chosen=defensePaidOptions(options,defenseHasBlocker(a)),s=defenseMathSystem(a.system),parameters=techniqueDefenseParameters(s,source.technique,chosen);
 return actionHash({actorUuid:a.uuid,root:{rootId:root.rootId,attackSignature:root.attackSignature},record:defenseRecordMath(record),clock,receivedTurn,source,system:s,parameters,options:chosen,cash:defenseCash(a),armor:armorState(a)});
}
export function defenseAction(a,options,id){return actionPlan(a,options.actionPool,1,{all:options.actionPool==="defense",operationId:id});}
function validateCash(v){if(!v||typeof v.unlimited!=="boolean")throw Error("Snapshot financeiro inválido.");num(v.health);num(v.penalty);for(const k of ["current","extra","reserved","overload"])nat(v[k]);}
function paymentSystem(before,level){return {profile:{level},resources:{health:{value:before.health},cosmo:{value:before.current,unlimited:before.unlimited},cosmoExtra:before.extra,cosmoReserved:before.reserved,cosmoOverload:before.overload}};}
function actionAfter(op){
 const {action,before}=op,view=action.view;
 if(typeof view.enabled!=="boolean"||view.enabled!==!!view.context||!defenseSame(view.context,op.context))throw Error("Contexto capturado de ações divergente.");
 if(!view.enabled){if(action.cost!==0||!defenseSame(action.before,before.actions)||!defenseSame(action.after,before.actions))throw Error("Plano de ações desativado inválido.");return clone(before.actions);}
 const context=view.context;if(!context||typeof context.combatUuid!=="string"||typeof context.combatantId!=="string"||typeof context.epoch!=="string"||!Number.isSafeInteger(context.round)||context.round<1)throw Error("Contexto de ações inválido.");
 const previous=before.actions,same=previous?.actorUuid===op.actorUuid&&defenseSame(previous.context,context),total=!!same&&(previous.ruleVersion===2?previous.movementTotal===true:Number(previous.spent?.movement)>0);
 const spent={};for(const key of ["attack","defense","movement","reaction"]){nat(view.maxima[key]);spent[key]=same?key==="movement"&&total?Math.max(view.maxima.movement,Number(previous.spent?.movement)||0):Math.max(0,Number(previous.spent?.[key])||0):0;if(!defenseSame(view.spent[key],spent[key])||view.remaining[key]!==Math.max(0,view.maxima[key]-spent[key]))throw Error("Contagem de ações divergente.");}
 const pool=op.options.actionPool,cost=pool==="defense"?view.maxima.defense:1;
 if(pool==="defense"&&spent.defense||cost<1||cost>view.remaining[pool]||cost!==action.cost||!defenseSame(action.before,before.actions))throw Error("Reserva de defesa divergente.");
 const cosmoUses=same?Math.max(0,Number(previous.cosmoUses)||0):0;if(view.cosmoUses!==cosmoUses||view.movementTotal!==total)throw Error("Reservas auxiliares divergentes.");
 return {ruleVersion:2,actorUuid:op.actorUuid,context:clone(context),spent:{...spent,[pool]:spent[pool]+cost},cosmoUses,movementTotal:total,last:op.id};
}
export function defenseReadyValues(op){
 let result,payment=null,after=null;
 if(op.mode==="paid"){
  validateCash(op.before);const options=defensePaidOptions(op.options,op.options.blocker);if(!defenseSame(options,op.options))throw Error("Opções capturadas inválidas.");
  const params=techniqueDefenseParameters(op.system,op.source.technique,options),rolled=resolvePool(op.roll?.results??[],params.modifier);if(op.roll.results.length!==params.dice||!defenseSame(rolled,op.roll))throw Error("Resultado de dados alterado.");
  result=techniqueDefenseOutcome(op.system,op.source.technique,options,rolled.total);
  const plan=cosmoPayment(paymentSystem(op.before,op.system.profile.level),params.cost,options);payment=paymentAuthorization(plan);
  const u=plan.updates;after={...clone(op.before),current:u["system.resources.cosmo.value"]??op.before.current,extra:u["system.resources.cosmoExtra"]??op.before.extra,overload:u["system.resources.cosmoOverload"]??op.before.overload,health:u["system.resources.health.value"]??op.before.health,penalty:result.nextPenalty,actions:actionAfter(op)};validateCash(after);
  if(!defenseSame(op.action.after,after.actions))throw Error("Plano capturado de ações alterado.");
 }else if(op.mode==="resolved")result=resolvedDefense(op.resolved);else throw Error("Modo capturado inválido.");
 techniqueDefenseRemainder(op.attackMath,result);
 const revision=(op.beforeRecord?.revision??0)+1;
 const record={kind:"techniqueDefense",version:1,actorUuid:op.actorUuid,rootId:op.rootId,attackSignature:op.attackSignature,revision,operationId:op.id,mode:op.mode,itemUuid:op.mode==="paid"?op.source.itemUuid:null,result,context:clone(op.context),userId:op.userId,time:op.time,reason:optionalNote(op.reason)};validateDefenseRecord(record,op.actorUuid,op.rootId);
 return {result,payment,after,record};
}
export function validateDefenseJournal(op){
 if(!op||op.kind!=="techniqueDefense"||op.version!==1||!['prepared','applied','reviewed'].includes(op.status)||!["rolling","ready"].includes(op.phase)||!["paid","resolved"].includes(op.mode))throw Error("Journal de defesa inválido.");
 defenseKey(op.id);defenseKey(op.rootId);defenseActor({type:"knight",uuid:op.actorUuid});if(typeof op.userId!=="string"||typeof op.attackSignature!=="string"||typeof op.baseline!=="string"||!Number.isFinite(op.time))throw Error("Vínculo do journal de defesa inválido.");optionalNote(op.reason);
 if(op.beforeRecord!==null)validateDefenseRecord(op.beforeRecord,op.actorUuid,op.rootId);
 if(op.mode==="paid"){validateCash(op.before);if(op.source?.itemUuid!==`${op.actorUuid}.Item.${defenseKey(op.source?.itemId)}`)throw Error("Fonte do journal alterada.");}
 if(op.phase==="rolling"){if(op.mode!=="paid"||op.roll!==undefined||op.after!==undefined||op.afterRecord!==undefined||op.payment!==undefined||op.result!==undefined)throw Error("Etapa da rolagem inválida.");return op;}
 const v=defenseReadyValues(op);if(!defenseSame(op.result,v.result)||!defenseSame(op.payment,v.payment)||!defenseSame(op.after,v.after)||!defenseSame(op.afterRecord,v.record))throw Error("Matemática do journal de defesa alterada.");return op;
}
export function defenseRecordForAttack(a,message,user){
 const root=receivedDefenseAttack(a,message,user),r=rawDefenseRecord(a,root.rootId);if(!r)return null;validateDefenseRecord(r,a.uuid,root.rootId);
 const op=f(a).effectOperations?.[r.operationId];validateDefenseJournal(op);
 if(op.status==="prepared"||op.phase!=="ready"||!defenseSame(defenseRecordMath(r),defenseRecordMath(op.afterRecord))||r.attackSignature!==root.attackSignature)throw Error("Defesa interrompida ou ataque alterado; confira o registro.");return r;
}
export function assertDefenseStamp(a,message,user,stamp){const record=defenseRecordForAttack(a,message,user);if(!defenseSame(stamp??null,defenseStamp(record)))throw Error("A defesa deste ataque mudou; atualize a resistência antes de aplicar dano.");return record;}
