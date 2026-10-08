import {SYSTEM_ID} from "./config.mjs";
let queue=Promise.resolve();
export const primaryGM=()=>game.users?.activeGM;
export const isPrimaryGM=()=>game.user?.isGM&&primaryGM()?.active&&primaryGM().id===game.user.id;
export function runMasterOperation(task) {const result=queue.catch(()=>{}).then(task);queue=result.catch(()=>{});return result;}
export function assertNoTechniqueInterruption(actor) {
 if(Object.values(actor.flags?.[SYSTEM_ID]?.techniqueOperations??{}).some(r=>r.status==="prepared"))throw Error("Há ativação de técnica interrompida. O mestre precisa conferir seu registro antes de alterar recursos.");
 if(Object.values(actor.flags?.[SYSTEM_ID]?.actionOperations??{}).some(r=>r.status==="prepared"))throw Error("Há gasto de ações interrompido. O mestre precisa conferir o histórico de ações antes de continuar.");
}
