import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {knight,content} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {armorRepairState} from "../module/armor-repair-rules.mjs";
import {registerArmorRepair,applyArmorRepair,undoArmorRepair,endArmorRepair,recoverArmorRepair,releaseOrphanArmorRepair} from "../module/armor-repair.mjs";
import {validateRepairJournal} from "../module/armor-repair-journal.mjs";
import {assertNoTechniqueInterruption} from "../module/master-queue.mjs";
const ID="gods-battle-ss",copy=structuredClone;
const source=JSON.parse(await readFile(new URL("../data/catalog/techniques.json",import.meta.url),"utf8")).find(x=>x._id==="16ffa8dcf4d1e1d8");
function patch(obj,data){for(const [path,value]of Object.entries(data)){let o=obj;const parts=path.split(".");for(const key of parts.slice(0,-1))o=o[key]??={};o[parts.at(-1)]=copy(value);}}
function fixture({same=false,synthetic=false}={}){
 const gm={id:"gm",isGM:true,active:true},owner={id:"owner",isGM:false},observer={id:"observer",isGM:false},users=new Map([gm,owner,observer].map(x=>[x.id,x])),denied=new Set(),docs=new Map(),writes=[],faults=[],hooks={};let n=0;
 function tag(actor,data){const entries=Object.entries(data);if(entries.some(([k])=>k.startsWith("system.resources.")))return "payment";
  for(const [k,v]of entries){if(k.endsWith(".status")&&k.includes("effectOperations"))return actor===caster?"originRelease":"targetRelease";if(k.includes("effectOperations")&&v?.kind)return v.kind==="armorRepair"?"originJournal":"targetLock";if(k.includes("armorRepairs")&&v?.kind)return v.revision===0?"register":"record";}return "other";}
 async function event(phase,who,label,data){await hooks[phase]?.(who,label,data);const index=faults.findIndex(f=>f.phase===phase&&f.tag===label);if(index>=0){faults.splice(index,1);throw Error(`fault ${phase} ${label}`);}}
 function actor(uuid){const a={uuid,type:"knight",name:uuid,system:knight(),flags:{[ID]:{unrelated:"keep"}},isOwner:true,testUserPermission(user){return !!user.isGM||user===owner&&!denied.has(uuid);},async update(data){const label=tag(a,data);await event("before",a,label,data);patch(a,data);prepare();writes.push({uuid:a.uuid,label,data:copy(data)});await event("after",a,label,data);return a;}};docs.set(uuid,a);return a;}
 const caster=actor("Actor.caster"),target=same?caster:actor(synthetic?"Scene.arena.Token.target.Actor.target":"Actor.target");
 caster.system.profile.level=11;caster.system.resources.cosmo.value=10;caster.system.resources.cosmoExtra=0;caster.system.resources.cosmoReserved=0;caster.system.resources.cosmoOverload=0;caster.system.resources.cosmo.unlimited=false;caster.system.resources.health.value=100;
 const item={...copy(source),id:"repair",uuid:`${caster.uuid}.Item.repair`,parent:caster};
 const armor={id:"armor",uuid:`${target.uuid}.Item.armor`,name:"Armadura",type:"armor",parent:target,system:{...content(),equipped:false,state:"alive",health:{...content().health,value:19}},async update(data){await event("before",armor,"repair",data);patch(armor,data);prepare();writes.push({uuid:armor.uuid,label:"repair",data:copy(data)});await event("after",armor,"repair",data);return armor;}};
 caster.items={contents:[item],get:id=>caster.items.contents.find(x=>x.id===id)};if(same)caster.items.contents.push(armor);else target.items={contents:[armor],get:id=>target.items.contents.find(x=>x.id===id)};docs.set(item.uuid,item);docs.set(armor.uuid,armor);
 function prepare(){for(const a of new Set([caster,target]))if(a.items)prepareKnight(a.system,a.items.contents,"rank",{actorUuid:a.uuid,flags:a.flags});}
 prepare();globalThis.game={user:gm,users:{get:id=>users.get(id),activeGM:gm}};globalThis.fromUuid=async uuid=>{await hooks.resolve?.(uuid);return docs.get(uuid)??null;};foundry.utils={randomID:()=>`repair${++n}`};
 let record;
 const saved=()=>caster.flags[ID].armorRepairs?.[record?.id],operations=()=>caster.flags[ID].effectOperations??{},pending=()=>Object.values(operations()).find(x=>x.kind==="armorRepair"&&x.status==="prepared"),last=()=>Object.values(operations()).at(-1);
 const view=()=>({expectedRevision:saved().revision,expectedState:armorRepairState(item,armor),requester:owner});
 return {caster,target,item,armor,gm,owner,observer,users,denied,docs,writes,faults,hooks,prepare,saved,operations,pending,last,view,async register(options={}){record=await registerArmorRepair(item,armor,{expectedState:armorRepairState(item,armor),requester:owner,...options});return record;},apply(options={}){return applyArmorRepair(caster,record.id,{...view(),...options});},undo(options={}){return undoArmorRepair(caster,record.id,{expectedRevision:saved().revision,requester:owner,...options});},end(options={}){return endArmorRepair(caster,record.id,{expectedRevision:saved().revision,requester:owner,...options});},recover(op=pending(),options={}){return recoverArmorRepair(caster,op.id,{requester:owner,...options});}};
}
const resources=f=>({ce:f.caster.system.resources.cosmo.value,extra:f.caster.system.resources.cosmoExtra,health:f.caster.system.resources.health.value,armor:f.armor.system.health.value});
const counts=f=>Object.fromEntries(["payment","repair"].map(k=>[k,f.writes.filter(x=>x.label===k).length]));

test("registro gratuito e uma hora autorizada em alvo vinculado/sintético/próprio",async()=>{
 for(const options of [{},{synthetic:true},{same:true}]){const f=fixture(options),before=resources(f);await f.register();assert.deepEqual(resources(f),before);assert.equal(f.saved().hours,0);const result=await f.apply();assert.equal(result.status,"applied");assert.deepEqual(resources(f),{ce:9,extra:0,health:100,armor:30});assert.deepEqual(counts(f),{payment:1,repair:1});assert.equal(f.saved().hours,1);assert.equal(f.caster.flags[ID].unrelated,"keep");assert.doesNotThrow(()=>assertNoTechniqueInterruption(f.target));validateRepairJournal(f.last());}
});
test("dois cliques na mesma revisão não cobram nem curam duas vezes",async()=>{
 const f=fixture();await f.register();const view=f.view(),results=await Promise.allSettled([applyArmorRepair(f.caster,f.saved().id,view),applyArmorRepair(f.caster,f.saved().id,view)]);assert.equal(results.filter(x=>x.status==="fulfilled").length,1);assert.deepEqual(counts(f),{payment:1,repair:1});assert.equal(f.saved().hours,1);
});
test("criação duplicada e cancelamento implícito não geram custos",async()=>{
 const f=fixture();await f.register();await assert.rejects(f.register(),/ativo/);assert.deepEqual(counts(f),{payment:0,repair:0});f.caster.system.resources.cosmo.value=0;await assert.rejects(f.apply(),/insuficiente/);assert.equal(f.pending(),undefined);assert.equal(f.saved().hours,0);
});
test("ajuste0 já pago, reparo fracionário e prévia stale conservam notas e campos",async()=>{
 const f=fixture();await f.register();const view=f.view();f.armor.name="Pessoal";f.armor.system.notes="Nota depois da prévia";await applyArmorRepair(f.caster,f.saved().id,{...view,options:{repair:.25,cost:0,reason:""}});assert.equal(f.armor.system.health.value,19.25);assert.equal(f.caster.system.resources.cosmo.value,10);assert.equal(f.armor.system.notes,"Nota depois da prévia");assert.deepEqual(counts(f),{payment:0,repair:1});const old=f.view();f.caster.system.resources.cosmo.value--;await assert.rejects(applyArmorRepair(f.caster,f.saved().id,old),/prévia/);assert.equal(f.saved().hours,1);
});
test("aplicar e desfazer usam apenas campos whitelisted e preservam recursos reservados",async()=>{
 const f=fixture();f.caster.system.resources.cosmoReserved=9;f.caster.system.resources.cosmoExtra=1;await f.register();await f.apply({options:{updates:{"system.resources.cosmoReserved":0},repair:2}});assert.equal(f.caster.system.resources.cosmoExtra,0);assert.equal(f.caster.system.resources.cosmoReserved,9);await f.undo();assert.deepEqual(resources(f),{ce:10,extra:1,health:100,armor:19});assert.equal(f.caster.system.resources.cosmoReserved,9);assert.equal(f.saved().hours,0);for(const w of f.writes.filter(x=>x.label==="payment"))assert.equal(Object.hasOwn(w.data,"system.resources.cosmoReserved"),false);
});
test("duas horas e inversões seguem revisão/histórico sem reaplicar recurso",async()=>{
 const f=fixture();await f.register();await f.apply();await f.apply();assert.equal(f.saved().hours,2);assert.deepEqual(resources(f),{ce:8,extra:0,health:100,armor:30});await f.undo();assert.equal(f.saved().hours,1);await f.undo();assert.equal(f.saved().hours,0);assert.deepEqual(resources(f),{ce:10,extra:0,health:100,armor:19});assert.equal(Object.keys(f.saved().ticks).length,4);await assert.rejects(f.undo());
});
test("desfazer depois de ajuste de PV/CE/nível/máximo preserva a alteração",async()=>{
 for(const change of [f=>f.armor.system.health.value=28,f=>f.caster.system.resources.cosmo.value=5,f=>f.caster.system.profile.level++,f=>f.armor.system.health.max=80]){const f=fixture();await f.register();await f.apply();change(f);const before=copy(resources(f));await assert.rejects(f.undo());assert.deepEqual(resources(f),before);}
});
test("encerrar não cobra/repara; fonte ou armadura removida não impede encerrar",async()=>{
 for(const remove of [null,"source","armor"]){const f=fixture();await f.register();if(remove)f.docs.delete(remove==="source"?f.item.uuid:f.armor.uuid);const before=resources(f);await f.end();assert.equal(f.saved().status,"ended");assert.deepEqual(resources(f),before);await assert.rejects(f.apply(),/encerrado/);}
});
test("mestre responsável e permissão real em origem/alvo são revalidados",async()=>{
 for(const change of [f=>game.user=f.owner,f=>game.users.activeGM={id:"other",isGM:true,active:true},f=>f.denied.add(f.caster.uuid),f=>f.denied.add(f.target.uuid),f=>f.caster.isOwner=false]){const f=fixture();await f.register();change(f);await assert.rejects(f.apply());assert.deepEqual(counts(f),{payment:0,repair:0});}
 const f=fixture();await f.register();await assert.rejects(f.apply({requester:{...f.owner}}),/permissão/);await assert.rejects(f.apply({requester:f.observer}),/permissão/);assert.deepEqual(counts(f),{payment:0,repair:0});
});
test("estado alterado durante await deixa journal e não grava recursos seguintes",async()=>{
 const f=fixture();await f.register();let changed=false;f.hooks.after=async(_a,tag)=>{if(tag==="originJournal"&&!changed){changed=true;f.armor.system.health.value=22;}};await assert.rejects(f.apply(),/mudaram/);assert.equal(f.pending().status,"prepared");assert.deepEqual(resources(f),{ce:10,extra:0,health:100,armor:22});await assert.rejects(f.recover());await f.recover(f.pending(),{close:true});assert.equal(f.saved().status,"ended");assert.equal(f.armor.system.health.value,22);
});
test("ambos os Actors ficam protegidos após pagamento interrompido",async()=>{
 const f=fixture();await f.register();f.faults.push({tag:"payment",phase:"after"});await assert.rejects(f.apply());assert.throws(()=>assertNoTechniqueInterruption(f.caster));assert.throws(()=>assertNoTechniqueInterruption(f.target));assert.deepEqual(resources(f),{ce:9,extra:0,health:100,armor:19});await f.recover();assert.doesNotThrow(()=>assertNoTechniqueInterruption(f.caster));assert.doesNotThrow(()=>assertNoTechniqueInterruption(f.target));assert.deepEqual(counts(f),{payment:1,repair:1});
});
test("falhas antes/depois de cada gravação recuperam sem repetir cobrança ou reparo",async()=>{
 for(const tag of ["originJournal","targetLock","payment","repair","record","targetRelease","originRelease"])for(const phase of ["before","after"]){const f=fixture();await f.register();f.faults.push({tag,phase});await assert.rejects(f.apply(),/fault/);const op=f.last();if(!op){assert.deepEqual(resources(f),{ce:10,extra:0,health:100,armor:19});continue;}const recovered=await f.recover(op);if(recovered.status==="failed"){assert.deepEqual(resources(f),{ce:10,extra:0,health:100,armor:19});await f.apply();}assert.deepEqual(resources(f),{ce:9,extra:0,health:100,armor:30},`${phase} ${tag}`);assert.deepEqual(counts(f),{payment:1,repair:1},`${phase} ${tag}`);assert.equal(f.saved().hours,1);assert.doesNotThrow(()=>assertNoTechniqueInterruption(f.caster));assert.doesNotThrow(()=>assertNoTechniqueInterruption(f.target));}
});
test("recuperação da inversão não repete reembolso e preserva hora anterior",async()=>{
 for(const tag of ["payment","repair","record","targetRelease","originRelease"])for(const phase of ["before","after"]){const f=fixture();await f.register();await f.apply();f.faults.push({tag,phase});await assert.rejects(f.undo());const result=await f.recover(f.last());if(result.status==="failed")await f.undo();assert.deepEqual(resources(f),{ce:10,extra:0,health:100,armor:19},`${phase} ${tag}`);assert.deepEqual(counts(f),{payment:2,repair:2});assert.equal(f.saved().hours,0);}
});
test("sobrecarga explícita cobra/refaz só a diferença autorizada de CE/PV",async()=>{
 const f=fixture();f.caster.system.resources.cosmo.value=0;f.caster.system.resources.cosmoOverload=2;await f.register();f.faults.push({tag:"payment",phase:"after"});await assert.rejects(f.apply({options:{allowOverload:true}}));assert.equal(f.caster.system.resources.health.value,67);await f.recover();assert.equal(f.caster.system.resources.health.value,67);await f.undo();assert.equal(f.caster.system.resources.health.value,100);assert.equal(f.caster.system.resources.cosmoOverload,2);
});
test("plano/journal adulterado não executa comandos ou matemática recebida",async()=>{
 for(const mutate of [o=>o.plan.after.payer.current=999,o=>o.plan.after.armor.health=999,o=>o.plan.options.cost=0,o=>o.plan.updates={"system.resources.health.value":999},o=>o.actorUuid="Actor.other",o=>o.afterRecord.hours=999]){const f=fixture();await f.register();f.faults.push({tag:"payment",phase:"after"});await assert.rejects(f.apply());mutate(f.pending());const before=resources(f);await assert.rejects(f.recover(f.last()));assert.deepEqual(resources(f),before);}
});
test("mudança de mestre ou permissão após pagamento conserva journal recuperável",async()=>{
 for(const mutate of [f=>game.users.activeGM={id:"new",isGM:true,active:true},f=>f.denied.add(f.target.uuid)]){const f=fixture();await f.register();f.hooks.after=async(_a,tag)=>{if(tag==="payment"){f.hooks.after=null;mutate(f);}};await assert.rejects(f.apply());assert.deepEqual(resources(f),{ce:9,extra:0,health:100,armor:19});game.users.activeGM=f.gm;f.denied.clear();await f.recover();assert.deepEqual(counts(f),{payment:1,repair:1});}
});
test("copiar flags de outra ficha não permite aplicar, recuperar ou encerrar",async()=>{
 const f=fixture();await f.register();const other={...f.caster,uuid:"Actor.copy"};await assert.rejects(applyArmorRepair(other,f.saved().id,f.view()),/outra ficha/);await assert.rejects(endArmorRepair(other,f.saved().id,{expectedRevision:0,requester:f.owner}));assert.deepEqual(counts(f),{payment:0,repair:0});
});
test("interrupções de outros fluxos e alvo ocupado não são ignorados",async()=>{
 for(const side of ["caster","target"])for(const field of ["techniqueOperations","actionOperations","effectOperations","damageOperations"]){const f=fixture();await f.register();f[side].flags[ID][field]={other:{status:"prepared"}};await assert.rejects(f.apply());assert.deepEqual(counts(f),{payment:0,repair:0});}
});
test("fechamento divergente não restaura recursos nem fecha journal alheio",async()=>{
 const f=fixture();await f.register();f.faults.push({tag:"payment",phase:"after"});await assert.rejects(f.apply());const op=f.pending();f.armor.system.health.value=21;await f.recover(op,{close:true,reason:""});assert.deepEqual(resources(f),{ce:9,extra:0,health:100,armor:21});assert.equal(f.saved().status,"ended");assert.doesNotThrow(()=>assertNoTechniqueInterruption(f.target));await assert.rejects(f.apply());
 const g=fixture();await g.register();g.faults.push({tag:"payment",phase:"after"});await assert.rejects(g.apply());g.target.flags[ID].effectOperations[g.pending().id].payerUuid="Actor.foreign";const before=resources(g);await assert.rejects(g.recover(g.pending(),{close:true}),/outra operação/);assert.deepEqual(resources(g),before);
});

test("recuperação sem débito revalida recursos após seus awaits",async()=>{
 const f=fixture();await f.register();f.faults.push({tag:"payment",phase:"before"});await assert.rejects(f.apply());let targetReads=0;f.hooks.resolve=async uuid=>{if(uuid===f.target.uuid&&++targetReads===2)f.caster.system.resources.cosmo.value=9;};await assert.rejects(f.recover());assert.equal(f.pending().status,"prepared");assert.equal(f.caster.system.resources.cosmo.value,9);
});
test("hora0/0 interrompida antes do lock do alvo pode liberar sem cobrança",async()=>{
 const f=fixture();await f.register();f.faults.push({tag:"targetLock",phase:"before"});await assert.rejects(f.apply({options:{repair:0,cost:0}}));const result=await f.recover();assert.equal(result.status,"failed");assert.deepEqual(counts(f),{payment:0,repair:0});assert.equal(f.saved().hours,0);assert.equal(f.pending(),undefined);
});
test("resposta perdida ao liberar alvo sem débito conclui somente flags",async()=>{
 const f=fixture();await f.register();f.faults.push({tag:"payment",phase:"before"});await assert.rejects(f.apply());f.faults.push({tag:"targetRelease",phase:"after"});await assert.rejects(f.recover());const result=await f.recover();assert.equal(result.status,"failed");assert.deepEqual(counts(f),{payment:0,repair:0});assert.doesNotThrow(()=>assertNoTechniqueInterruption(f.target));
});
test("encerrar revalida a revisão se o trabalho mudar durante resolução do alvo",async()=>{
 const f=fixture();await f.register();f.hooks.resolve=async uuid=>{if(uuid===f.target.uuid){f.hooks.resolve=null;f.saved().revision++;f.saved().reason="alteração posterior";}};await assert.rejects(f.end({expectedRevision:0}));assert.equal(f.saved().status,"active");assert.equal(f.saved().reason,"alteração posterior");
});
test("interrupção em ficha própria e liberação divergente nunca repetem recursos",async()=>{
 for(const phase of ["before","after"]){const f=fixture({same:true});await f.register();f.faults.push({tag:"repair",phase});await assert.rejects(f.apply());await f.recover();assert.deepEqual(counts(f),{payment:1,repair:1});await f.undo();assert.deepEqual(resources(f),{ce:10,extra:0,health:100,armor:19});}
});

test("fonte/Item/máximo removido ou alterado depois do pagamento preserva ajustes",async()=>{
 for(const change of [f=>f.docs.delete(f.item.uuid),f=>f.docs.delete(f.armor.uuid),f=>f.armor.system.health.max=80,f=>f.caster.system.profile.level++,f=>f.armor.system.health.value=23]){const f=fixture();await f.register();f.faults.push({tag:"payment",phase:"after"});await assert.rejects(f.apply());const op=f.pending();change(f);const before=resources(f);await assert.rejects(f.recover(op));assert.deepEqual(resources(f),before);await f.recover(op,{close:true});assert.deepEqual(resources(f),before);assert.doesNotThrow(()=>assertNoTechniqueInterruption(f.target));}
});
test("recuperação0/0 após lock e CEilimitada não criam débito fictício",async()=>{
 for(const options of [{repair:0,cost:0},{repair:0,cost:1}]){const f=fixture();await f.register();if(options.cost===1){f.caster.items.contents.push({id:"kamui",uuid:`${f.caster.uuid}.Item.kamui`,type:"armor",parent:f.caster,system:{...content(),class:"kamui",equipped:true,state:"alive",health:{...content().health,value:100}}});f.prepare();assert.equal(f.caster.system.resources.cosmo.unlimited,true);}f.faults.push({tag:"targetLock",phase:"after"});await assert.rejects(f.apply({options}));await f.recover();assert.deepEqual(counts(f),{payment:0,repair:0});assert.equal(f.saved().hours,1);}
});
test("vínculo órfão só é liberado pelo mestre se a origem/journal não existir",async()=>{
 const f=fixture();await f.register();f.faults.push({tag:"payment",phase:"after"});await assert.rejects(f.apply());const op=f.pending();await assert.rejects(releaseOrphanArmorRepair(f.target,op.id,{requester:f.owner}));await assert.rejects(releaseOrphanArmorRepair(f.target,op.id),/origem existe/);const before=resources(f);f.docs.delete(f.caster.uuid);await releaseOrphanArmorRepair(f.target,op.id);assert.deepEqual(resources(f),before);assert.doesNotThrow(()=>assertNoTechniqueInterruption(f.target));
 const g=fixture();await g.register();g.faults.push({tag:"payment",phase:"after"});await assert.rejects(g.apply());const id=g.pending().id;delete g.caster.flags[ID].effectOperations[id];await releaseOrphanArmorRepair(g.target,id);assert.equal(g.armor.system.health.value,19);assert.equal(g.caster.system.resources.cosmo.value,9);
});
test("encerramento e fechamento de journal rejeitam instância de Actor removida",async()=>{
 const f=fixture();await f.register();f.hooks.resolve=async uuid=>{if(uuid===f.target.uuid)f.docs.delete(f.caster.uuid);};await assert.rejects(f.end());assert.equal(f.saved().status,"active");
 const g=fixture();await g.register();g.faults.push({tag:"payment",phase:"after"});await assert.rejects(g.apply());const op=g.pending();g.docs.delete(g.caster.uuid);await assert.rejects(g.recover(op,{close:true}));assert.equal(op.status,"prepared");
});

test("fechar journal não libera alvo se a origem desaparecer durante await",async()=>{
 const f=fixture();await f.register();f.faults.push({tag:"payment",phase:"after"});await assert.rejects(f.apply());const op=f.pending();f.hooks.resolve=async uuid=>{if(uuid===f.target.uuid){f.hooks.resolve=null;f.docs.delete(f.caster.uuid);}};await assert.rejects(f.recover(op,{close:true}));assert.equal(f.target.flags[ID].effectOperations[op.id].status,"prepared");
});
test("vínculo órfão revalida um journal que reaparece em nova instância",async()=>{
 const f=fixture();await f.register();f.faults.push({tag:"payment",phase:"after"});await assert.rejects(f.apply());const op=copy(f.pending());delete f.caster.flags[ID].effectOperations[op.id];f.hooks.resolve=async uuid=>{if(uuid===f.target.uuid){f.hooks.resolve=null;const replacement={...f.caster,flags:copy(f.caster.flags)};replacement.flags[ID].effectOperations[op.id]=op;f.docs.set(f.caster.uuid,replacement);}};await assert.rejects(releaseOrphanArmorRepair(f.target,op.id),/origem/);assert.equal(f.target.flags[ID].effectOperations[op.id].status,"prepared");
});

test("intenção identificada com resposta perdida retorna recibo sem repetir a hora",async()=>{
 const f=fixture();await f.register();const view={...f.view(),operationId:"chatApply"};f.faults.push({tag:"originRelease",phase:"after"});await assert.rejects(applyArmorRepair(f.caster,f.saved().id,view));const result=await applyArmorRepair(f.caster,f.saved().id,view);assert.equal(result.replayed,true);assert.deepEqual(counts(f),{payment:1,repair:1});await f.undo({operationId:"chatUndo"});const writes=f.writes.length;const again=await applyArmorRepair(f.caster,f.saved().id,view);assert.equal(again.replayed,true);assert.equal(f.writes.length,writes);assert.equal(f.saved().hours,0);assert.deepEqual(resources(f),{ce:10,extra:0,health:100,armor:19});
});
test("intenção pendente/encerrada ou de outro autor não é reenviada como novo débito",async()=>{
 const f=fixture();await f.register();const view={...f.view(),operationId:"request"};f.faults.push({tag:"payment",phase:"after"});await assert.rejects(applyArmorRepair(f.caster,f.saved().id,view));await assert.rejects(applyArmorRepair(f.caster,f.saved().id,view),/interrompida/);assert.deepEqual(counts(f),{payment:1,repair:0});await f.recover();await applyArmorRepair(f.caster,f.saved().id,view);assert.deepEqual(counts(f),{payment:1,repair:1});await assert.rejects(f.undo({operationId:"request"}),/outra intenção/);await assert.rejects(applyArmorRepair(f.caster,f.saved().id,{...view,requester:f.observer}));
 const g=fixture();await g.register();g.faults.push({tag:"payment",phase:"before"});await assert.rejects(g.apply({operationId:"failed"}));await g.recover();await assert.rejects(g.apply({operationId:"failed"}),/encerrada/);assert.deepEqual(counts(g),{payment:0,repair:0});
});
