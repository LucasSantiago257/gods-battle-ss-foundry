import {fixture,patch} from "./sustained-payment-fixture.mjs";
import {submitSustainPaymentRequest,enqueueSustainPaymentRequest} from "../module/sustained-payment-requests.mjs";
const ID="gods-battle-ss";
export function sustainMessages(options){
 const f=fixture(options),messages=new Map(),notices=[];let n=0,fail=null;
 game.messages={get:id=>messages.get(id),get contents(){return [...messages.values()];}};
 globalThis.ui={notifications:{info:v=>notices.push({type:"info",text:v}),error:v=>notices.push({type:"error",text:v})}};
 globalThis.ChatMessage={async create(data){const m={id:`request${++n}`,author:game.user,blind:false,isContentVisible:true,...structuredClone(data),async update(change){if(fail==="before"){fail=null;throw Error("lost response");}patch(m,change);if(fail==="after"){fail=null;throw Error("lost response");}}};messages.set(m.id,m);return m;}};
 const request=(opts={})=>({action:"pay",actorUuid:f.actor.uuid,recordId:"sustain1",options:{...f.options,...opts},expectedState:f.preview(opts).signature});
 return {...f,messages,notices,request,req:m=>m.flags[ID].sustainPaymentRequest,response:m=>m.flags[ID].sustainPaymentResponse,loseResponse:phase=>fail=phase,async send(value=request()){game.user=f.owner;const m=await submitSustainPaymentRequest(value);game.user=f.gm;return m;},async process(m){game.user=f.gm;return enqueueSustainPaymentRequest(m,{},m.author.id);}};
}
