import test from "node:test";
import assert from "node:assert/strict";
import {content} from "./foundry-stub.mjs";
import {fixture,resources,counts} from "./armor-repair-fixture.mjs";
import {armorRepairState} from "../module/armor-repair-rules.mjs";
import {applyArmorRepair,endArmorRepair,releaseOrphanArmorRepair} from "../module/armor-repair.mjs";
import {validateRepairJournal} from "../module/armor-repair-journal.mjs";
import {assertNoTechniqueInterruption} from "../module/master-queue.mjs";
const ID="gods-battle-ss",copy=structuredClone;

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
