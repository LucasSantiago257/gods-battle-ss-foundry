import {ownedFixture,patch} from "./control-retry-owned-fixture.mjs";
import {submitControlRetryRequest,enqueueControlRetryRequest} from "../module/control-retry-requests.mjs";
export function controlMessages(options){
 const f=ownedFixture(options),notices=[];let n=0,fail=null;const create=ChatMessage.create;
 globalThis.ui={notifications:{info:v=>notices.push({type:"info",text:v}),error:v=>notices.push({type:"error",text:v})}};
 ChatMessage.create=async data=>{
  if(!data.flags?.["gods-battle-ss"]?.controlRetryRequest)return create(data);
  const m={id:`request${++n}`,author:game.user,blind:false,isContentVisible:true,...structuredClone(data),async update(change){if(fail==="before"){fail=null;throw Error("lost response");}patch(m,change);if(fail==="after"){fail=null;throw Error("lost response");}}};f.messages.set(m.id,m);return m;
 };
 const request=(opts={})=>({action:"retry",actorUuid:f.actor.uuid,recordId:"controlA",options:{...f.options,...opts},expectedState:f.preview(opts).signature});
 return {...f,notices,request,req:m=>m.flags["gods-battle-ss"].controlRetryRequest,response:m=>m.flags["gods-battle-ss"].controlRetryResponse,loseResponse:phase=>fail=phase,async send(value=request()){game.user=f.owner;const m=await submitControlRetryRequest(value);game.user=f.gm;return m;},async process(m){game.user=f.gm;return enqueueControlRetryRequest(m,{},m.author.id);}};
}
