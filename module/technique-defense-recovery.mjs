import {SYSTEM_ID} from "./config.mjs";
import {primaryGM,assertNoTechniqueInterruption} from "./master-queue.mjs";
import {actionHash} from "./action-rules.mjs";
import {defenseActor,defenseKey} from "./technique-defense-records.mjs";
import {submitTechniqueDefenseRequest} from "./technique-defense-requests.mjs";
const flags=a=>a?.flags?.[SYSTEM_ID]??{};
export function canManageTechniqueDefense(a){try{defenseActor(a);return !!a.testUserPermission?.(game.user,"OWNER");}catch{return false;}}
export function techniqueDefenseRecoveryContext(a){
 if(!canManageTechniqueDefense(a))return {visible:false,interruptions:[]};
 return {visible:true,interruptions:Object.entries(flags(a).effectOperations??{}).filter(([,r])=>r.kind==="techniqueDefense"&&r.status==="prepared").map(([id,r])=>({id,isTechniqueDefense:true,foreign:r.actorUuid!==a.uuid,canReview:r.actorUuid===a.uuid&&!!primaryGM()?.active}))};
}
function ready(a,id){if(!canManageTechniqueDefense(a))throw Error("Sem permissão para conferir a defesa.");if(!primaryGM()?.active)throw Error("É necessário um mestre ativo.");assertNoTechniqueInterruption(a,{effectOperationId:id});}
export async function openTechniqueDefenseRecovery(a,id){
 defenseKey(id);ready(a,id);const user=game.user,op=flags(a).effectOperations?.[id];if(op?.kind!=="techniqueDefense"||op.actorUuid!==a.uuid||op.status!=="prepared")throw Error("Interrupção de defesa indisponível.");const signature=actionHash(op);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:"Defesa por técnica interrompida"},content:'<details><summary>Notas</summary><textarea name="reason" maxlength="2000" aria-label="Notas opcionais"></textarea></details>',buttons:[{action:"recover",label:"Concluir pelo registro",callback:(_e,b)=>({action:"recover",reason:b.form.elements.reason.value})},{action:"close",label:"Encerrar sem alterar recursos",callback:(_e,b)=>({action:"close",reason:b.form.elements.reason.value})},{action:"cancel",label:"Cancelar",callback:()=>null}],rejectClose:false});
 if(!answer)return;if(game.user!==user||actionHash(flags(a).effectOperations?.[id])!==signature)throw Error("Usuário ou registro de defesa mudou.");ready(a,id);
 return submitTechniqueDefenseRequest({action:answer.action,actorUuid:a.uuid,operationId:id,reason:answer.reason});
}
