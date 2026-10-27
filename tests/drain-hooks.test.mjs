import test from "node:test";
import assert from "node:assert/strict";
import {fixture,patch,ce,losses} from "./drain-fixture.mjs";
import {drainRegistrationState,drainRecordState} from "../module/drain-records.mjs";
import {submitDrainRequest} from "../module/drain-requests.mjs";
const ID="gods-battle-ss",hooks=new Map();
globalThis.Hooks={on(name,fn){if(!hooks.has(name))hooks.set(name,[]);hooks.get(name).push(fn);},once(name,fn){this.on(name,fn);}};
await import("../module/main.mjs");
const dispatch=async(name,...args)=>{for(const fn of hooks.get(name)??[])await fn(...args);};
test("hooks instalados processam e retomam Dreno sem diálogo ou aprovação",async()=>{
 const f=fixture(),messages=new Map();let n=0,renders=0;f.target.apps={sheet:{rendered:true,render:()=>renders++}};game.actors={contents:[f.source,f.target]};game.messages={get:id=>messages.get(id),get contents(){return [...messages.values()];}};globalThis.ui={notifications:{info(){},error(){}}};foundry.applications.api.DialogV2={wait(){throw Error("Approval dialog opened");}};
 globalThis.ChatMessage={async create(data){const m={id:`hook${++n}`,author:game.user,blind:false,...structuredClone(data),async update(data){patch(m,data);await dispatch("updateChatMessage",m,data,{},f.gm.id);}};messages.set(m.id,m);await dispatch("createChatMessage",m,{},f.gm.id);return m;}};
 const registered=await submitDrainRequest({action:"register",actorUuid:f.target.uuid,sourceUuid:f.item.uuid,combatUuid:f.combat.uuid,rounds:1,firstOffset:0,expectedState:drainRegistrationState(f.item,f.target,f.combat.uuid)});
 assert.equal(registered.flags[ID].drainResponse.ok,true);assert.deepEqual(ce(f),{current:12,extra:4,reserved:2});const record=f.target.flags[ID].persistentEffects[registered.id];
 const applied=await submitDrainRequest({action:"apply",actorUuid:f.target.uuid,recordId:record.id,expectedRevision:record.revision,expectedState:drainRecordState(f.target,record)});assert.equal(applied.flags[ID].drainResponse.ok,true);assert.deepEqual(ce(f),{current:9,extra:4,reserved:2});assert.equal(losses(f).length,1);assert.ok(renders>0);
 delete applied.flags[ID].drainResponse;await dispatch("ready");assert.equal(applied.flags[ID].drainResponse.replayed,true);assert.equal(losses(f).length,1);const html={dataset:{},setAttribute(){},querySelector:()=>null};await dispatch("renderChatMessageHTML",applied,html);assert.equal(html.hidden,true);
});
