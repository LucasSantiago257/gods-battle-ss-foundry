import {SYSTEM_ID} from "./config.mjs";
let queue=Promise.resolve();
export const primaryGM=()=>game.users?.activeGM;
export const isPrimaryGM=()=>game.user?.isGM&&primaryGM()?.active&&primaryGM().id===game.user.id;
// Prepare diálogos fora da fila. Revalide estado/permissões dentro dela antes de gravar.
export function runMasterOperation(task) {const result=queue.catch(()=>{}).then(task);queue=result.catch(()=>{});return result;}
export function assertNoTechniqueInterruption(actor,{effectOperationId=null}={}) {
 if(Object.values(actor.flags?.[SYSTEM_ID]?.techniqueOperations??{}).some(r=>r.status==="prepared"))throw Error("Há ativação de técnica interrompida. O mestre precisa conferir seu registro antes de alterar recursos.");
 if(Object.values(actor.flags?.[SYSTEM_ID]?.actionOperations??{}).some(r=>r.status==="prepared"))throw Error("Há gasto de ações interrompido. O mestre precisa conferir o histórico de ações antes de continuar.");
 if(Object.entries(actor.flags?.[SYSTEM_ID]?.effectOperations??{}).some(([id,r])=>id!==effectOperationId&&r.status==="prepared"))throw Error("Há resolução de efeito interrompida. O mestre precisa conferir seu registro antes de continuar.");
}
