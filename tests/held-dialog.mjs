import assert from "node:assert/strict";
import {runMasterOperation} from "../module/master-queue.mjs";
const deadline=async(promise)=>{let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error("Janela aberta bloqueou a fila ou não abriu.")),3000);})]);}finally{clearTimeout(timer);}};
// Mantém a decisão humana pendente enquanto uma operação independente usa a mesma fila.
export async function holdDecisionOutsideQueue(start,{confirm=false,answer=confirm?false:null,during=async()=>{}}={}) {
 const dialog=foundry.applications.api.DialogV2,method=confirm?"confirm":"wait",previous=dialog[method];let entered,release;
 const ready=new Promise(resolve=>entered=resolve),decision=new Promise(resolve=>release=resolve);
 dialog[method]=async()=>{entered();return decision;};
 const task=Promise.resolve().then(start),settled=task.then(value=>({value}),error=>({error}));
 try{await deadline(ready);assert.equal(await deadline(runMasterOperation(()=>true)),true);await during();}
 finally{release(answer);await settled;dialog[method]=previous;}
 const result=await settled;if(result.error)throw result.error;return result.value;
}
