import test from "node:test";
import assert from "node:assert/strict";
import {installAreaProgress,updateAreaProgress,refreshAreaProgress} from "../module/area-progress.mjs";
import {areaAttackFor} from "../module/area-rules.mjs";
const ID="gods-battle-ss";
function fixture(){
 const gm={id:"gm",isGM:true},a={id:"a",isGM:false},b={id:"b",isGM:false},observer={id:"observer",isGM:false};
 const users=new Map([gm,a,b,observer].map(u=>[u.id,u]));
 const actor=(uuid,owner)=>({uuid,type:"knight",flags:{},owners:new Set([owner.id]),testUserPermission(u,p){return p==="OWNER"&&(u.isGM||this.owners.has(u.id));}});
 const first=actor("Actor.first",a),second=actor("Scene.arena.Token.second.Actor.second",b),actors=new Map([first,second].map(x=>[x.uuid,x]));
 const attack={name:"Área",effectKind:"damage",nature:"physical",powerCosmic:11,damage:10.5,armorDamage:10,area:{count:2},areaTargets:[first,second].map((x,i)=>({actorUuid:x.uuid,name:"Alvo "+i,tokenUuid:"Scene.arena.Token.token"+i,turnSnapshot:null}))};
 const message={id:"root",isContentVisible:true,author:gm,flags:{[ID]:{attack}}},messages=new Map([[message.id,message]]);
 const rows=attack.areaTargets.map(x=>{const badge={textContent:"OLD PRIVATE STATE",hidden:false,dataset:{state:"old"}},buttons=["resistTechnique","adjustResistance"].map(action=>({dataset:{areaTarget:x.actorUuid,action},disabled:false,hidden:false}));return {dataset:{areaMember:x.actorUuid},badge,buttons,querySelector:()=>badge,querySelectorAll:()=>buttons};});
 const root={dataset:{},isConnected:true,querySelectorAll:()=>rows},html={querySelector:()=>root};
 globalThis.game={user:a,users,messages:{get:id=>messages.get(id),get contents(){return [...messages.values()];}}};
 globalThis.fromUuid=async uuid=>actors.get(uuid)??null;
 globalThis.document={querySelectorAll:()=>[root]};
 const result=(target=first,id="result")=>({id,author:target===first?a:b,isContentVisible:true,flags:{[ID]:{attack:structuredClone({...areaAttackFor(attack,target.uuid),messageId:message.id}),resistance:{application:"damage",damage:10.5,armorDamage:10},resolvedDamage:{rootMessageId:message.id,actorUuid:target.uuid,body:10.5,armor:10}}}});
 const hidden=row=>row.badge.hidden&&row.badge.textContent===""&&row.buttons.every(x=>x.hidden&&x.disabled);
 return {gm,a,b,observer,users,first,second,actors,attack,message,messages,rows,root,html,result,hidden};
}
test("montagem esconde estado anterior antes do await e só mostra ações do dono",async()=>{
 const f=fixture(),pending=installAreaProgress(f.message,f.html);assert.ok(f.rows.every(f.hidden));await pending;
 assert.equal(f.rows[0].badge.textContent,"Aguardando resistência");assert.ok(f.rows[0].buttons.every(x=>!x.hidden&&!x.disabled));assert.ok(f.hidden(f.rows[1]));
});
test("mestre acompanha ambos e observador não consulta flags privadas",async()=>{
 const f=fixture();game.user=f.gm;await installAreaProgress(f.message,f.html);assert.ok(f.rows.every(x=>!x.badge.hidden));
 for(const actor of f.actors.values())Object.defineProperty(actor,"flags",{get(){throw Error("private read");}});
 game.user=f.observer;await refreshAreaProgress();assert.ok(f.rows.every(f.hidden));
});
test("criar/remover/privatizar resistência atualiza pendência sem escrever no Actor",async()=>{
 const f=fixture();await installAreaProgress(f.message,f.html);const r=f.result();f.messages.set(r.id,r);await refreshAreaProgress();assert.equal(f.rows[0].badge.textContent,"Dano pendente");
 r.author=f.gm;r.whisper=[f.b.id];await refreshAreaProgress();assert.equal(f.rows[0].badge.textContent,"Aguardando resistência");
 r.whisper=[];r.blind=true;await refreshAreaProgress();assert.equal(f.rows[0].badge.textContent,"Aguardando resistência");
 r.blind=false;f.messages.delete(r.id);await refreshAreaProgress();assert.equal(f.rows[0].badge.textContent,"Aguardando resistência");assert.deepEqual(f.first.flags,{});
});
test("journal aplicado/desfeito/interrompido acompanha cada defensor separadamente",async()=>{
 const f=fixture();game.user=f.gm;await installAreaProgress(f.message,f.html);
 for(const [status,label]of [["applied","Aplicado"],["undone","Desfeito"],["prepared","Conferir aplicação"]]){f.first.flags[ID]={damageOperations:{root:{status}}};await refreshAreaProgress();assert.equal(f.rows[0].badge.textContent,label);assert.equal(f.rows[1].badge.textContent,"Aguardando resistência");}
});
test("perda de permissão durante busca não restaura ações ou resultado privado",async()=>{
 const f=fixture(),releases=[];fromUuid=uuid=>new Promise(resolve=>releases.push(()=>resolve(f.actors.get(uuid))));
 const pending=installAreaProgress(f.message,f.html);f.first.owners.clear();Object.defineProperty(f.first,"flags",{get(){throw Error("lost permission read");}});
 fromUuid=async uuid=>f.actors.get(uuid);releases.forEach(r=>r());await pending;assert.ok(f.rows.every(f.hidden));
});
test("mudança de usuário ou raiz oculta/alterada/removida durante busca descarta leitura antiga",async()=>{
 for(const change of [f=>game.user=f.b,f=>f.users.delete(f.a.id),f=>f.message.isContentVisible=false,f=>f.message.blind=true,f=>f.message.whisper=[f.b.id],f=>f.attack.damage++,f=>f.messages.delete(f.message.id),f=>f.root.isConnected=false]){
  const f=fixture(),releases=[];fromUuid=uuid=>new Promise(resolve=>releases.push(()=>resolve(f.actors.get(uuid))));const pending=installAreaProgress(f.message,f.html);change(f);fromUuid=async uuid=>f.actors.get(uuid);releases.forEach(r=>r());await pending;assert.ok(f.rows.every(f.hidden));
 }
});
test("atualização nova ganha de lookup antigo que termina depois",async()=>{
 const f=fixture(),releases=[];fromUuid=uuid=>new Promise(resolve=>releases.push(()=>resolve(f.actors.get(uuid))));const old=installAreaProgress(f.message,f.html);
 fromUuid=async uuid=>f.actors.get(uuid);const r=f.result();f.messages.set(r.id,r);await refreshAreaProgress();assert.equal(f.rows[0].badge.textContent,"Dano pendente");
 f.messages.delete(r.id);releases.forEach(r=>r());await old;assert.equal(f.rows[0].badge.textContent,"Dano pendente");await refreshAreaProgress();assert.equal(f.rows[0].badge.textContent,"Aguardando resistência");
});
test("Actor substituído no mesmo UUID durante outra busca não herda estado antigo",async()=>{
 const f=fixture(),old=f.first;let calls=0;fromUuid=async uuid=>{calls++;if(calls===2)f.actors.set(old.uuid,{...old,flags:{[ID]:{damageOperations:{root:{status:"applied"}}}}});return calls===1?old:f.actors.get(uuid);};
 await installAreaProgress(f.message,f.html);assert.equal(f.rows[0].badge.textContent,"Alvo indisponível");assert.ok(f.rows[0].buttons.every(x=>x.hidden));
 await refreshAreaProgress();assert.equal(f.rows[0].badge.textContent,"Aplicado");
});
test("alvo excluído ou UUID copiado não ganha ações e não bloqueia o outro",async()=>{
 const f=fixture();game.user=f.gm;f.actors.delete(f.first.uuid);await installAreaProgress(f.message,f.html);assert.equal(f.rows[0].badge.textContent,"Alvo indisponível");assert.ok(f.rows[0].buttons.every(x=>x.hidden));assert.equal(f.rows[1].badge.textContent,"Aguardando resistência");
 f.rows[1].dataset.areaMember="Actor.copy";await refreshAreaProgress();assert.ok(f.hidden(f.rows[1]));
});
test("raiz substituída, excluída ou escondida depois de pronta limpa estados e botões",async()=>{
 for(const change of [f=>f.messages.set(f.message.id,{...f.message}),f=>f.messages.delete(f.message.id),f=>f.message.isContentVisible=false]){const f=fixture();await installAreaProgress(f.message,f.html);change(f);await refreshAreaProgress();assert.ok(f.rows.every(f.hidden));}
});
test("busy desabilita só ações autorizadas e libera após atualização",async()=>{
 const f=fixture();let busy=true;await installAreaProgress(f.message,f.html,{busy:()=>busy});assert.ok(f.rows[0].buttons.every(x=>!x.hidden&&x.disabled));assert.ok(f.hidden(f.rows[1]));busy=false;await updateAreaProgress(f.html);assert.ok(f.rows[0].buttons.every(x=>!x.hidden&&!x.disabled));
});
test("montar cartão oculto ou atualizar sem usuário não lê flags nem vaza estado",async()=>{
 const f=fixture();f.message.isContentVisible=false;Object.defineProperty(f.message,"flags",{get(){throw Error("hidden root read");}});await installAreaProgress(f.message,f.html);assert.ok(f.rows.every(f.hidden));
 const visible=fixture();await installAreaProgress(visible.message,visible.html);game.user=null;await refreshAreaProgress();assert.ok(visible.rows.every(visible.hidden));
});

test("hook pode preparar cartão antes da inserção; remoção posterior invalida o vínculo",async()=>{
 const f=fixture();f.root.isConnected=false;await installAreaProgress(f.message,f.html);assert.equal(f.rows[0].badge.textContent,"Aguardando resistência");
 f.root.isConnected=true;await updateAreaProgress(f.html);f.root.isConnected=false;await updateAreaProgress(f.html);assert.ok(f.rows.every(f.hidden));
});
