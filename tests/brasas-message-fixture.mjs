import {fixture,patch} from "./brasas-fixture.mjs";
import {submitBrasasRequest,enqueueBrasasRequest} from "../module/brasas-requests.mjs";
export function messages(options){
 const f=fixture(options),collection=new Map(),notices=[];let n=0,fail=null;
 game.messages={get:id=>collection.get(id),get contents(){return [...collection.values()];}};
 globalThis.ui={notifications:{info:v=>notices.push({type:"info",text:v}),error:v=>notices.push({type:"error",text:v})}};
 globalThis.ChatMessage={async create(data){const m={id:`message${++n}`,author:game.user,blind:false,isContentVisible:true,...structuredClone(data),async update(change){if(fail==="before"){fail=null;throw Error("lost response");}patch(m,change);if(fail==="after"){fail=null;throw Error("lost response");}}};collection.set(m.id,m);return m;}};
 const request=()=>({action:"apply",actorUuid:f.actor.uuid,recordId:"fire",...f.view()});
 return {...f,collection,notices,request,req:m=>m.flags["gods-battle-ss"].brasasRequest,response:m=>m.flags["gods-battle-ss"].brasasResponse,loseResponse:phase=>fail=phase,async send(value=request()){game.user=f.owner;const m=await submitBrasasRequest(value);game.user=f.gm;return m;},async process(m){game.user=f.gm;return enqueueBrasasRequest(m,{},m.author.id);}};
}
