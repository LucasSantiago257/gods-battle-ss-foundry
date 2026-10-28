import test from "node:test";
import assert from "node:assert/strict";
import {fixture,copy,resources,healthWrites,patch} from "./brasas-fixture.mjs";
import {brasasState} from "../module/brasas-rules.mjs";
import {brasasApplicationState,validateBrasasJournal} from "../module/brasas-records.mjs";
import {applyBrasas,undoBrasas,endBrasas,recoverBrasas} from "../module/brasas.mjs";
const ID="gods-battle-ss";
test("dono resolve perda própria em vinculado/sintético sem ler atacante",async()=>{
 for(const synthetic of [false,true]){const f=fixture({synthetic}),before=resources(f);await f.apply({operationId:"one"});assert.equal(f.actor.system.resources.health.value,90);assert.deepEqual({...resources(f),resources:{...resources(f).resources,health:before.resources.health}},before);assert.equal(f.record().ticks.round3.operationId,"one");assert.equal(f.record().brasasLastOperation.id,"one");assert.equal(f.operations().one.status,"applied");assert.equal(healthWrites(f).length,1);assert.doesNotMatch(JSON.stringify(f.operations()),/private|Nome privado/);}
});
test("papel forjado, observador e cliente jogador não executam ou leem flags",async()=>{
 const f=fixture(),before=resources(f);for(const requester of [f.observer,{...f.owner,isGM:true}]){let reads=0;const flags=f.actor.flags;Object.defineProperty(f.actor,"flags",{configurable:true,get(){reads++;return flags;}});await assert.rejects(applyBrasas(f.actor,"fire",{operationId:"bad",requester}));assert.equal(reads,0);Object.defineProperty(f.actor,"flags",{configurable:true,value:flags,writable:true});}
 game.user=f.owner;await assert.rejects(f.apply(),/mestre responsável/);assert.deepEqual(resources(f),before);assert.equal(f.writes.length,0);
});
test("duas intenções para a mesma prévia aplicam uma única parcela",async()=>{
 const f=fixture(),v=f.view(),r=await Promise.allSettled([f.apply({...v,operationId:"one"}),f.apply({...v,operationId:"two"})]);assert.equal(r.filter(x=>x.status==="fulfilled").length,1);assert.equal(healthWrites(f).length,1);assert.deepEqual(Object.keys(f.record().ticks),["round3"]);
});
test("resposta perdida retorna recibo sem regravar ficha ou inversão posterior",async()=>{
 const f=fixture(),v=f.view();f.faults.push({tag:"commit",phase:"after"});await assert.rejects(f.apply({...v,operationId:"one"}));assert.equal(f.actor.system.resources.health.value,90);await f.undo({operationId:"undo1"});const before=resources(f),record=copy(f.record()),n=f.writes.length;
 const r=await f.apply({...v,operationId:"one"});assert.equal(r.replayed,true);assert.equal(r.record,undefined);assert.deepEqual(resources(f),before);assert.deepEqual(f.record(),record);assert.equal(f.writes.length,n);
});
test("mesma ID não pode trocar operação, usuário ou registro",async()=>{
 const f=fixture();await f.apply({operationId:"one"});for(const run of [()=>f.undo({operationId:"one"}),()=>f.end({operationId:"one"}),()=>applyBrasas(f.actor,"other",{operationId:"one",requester:f.owner}),()=>f.apply({operationId:"one",requester:f.gm})])await assert.rejects(run(),/outra intenção/);assert.equal(healthWrites(f).length,1);
});
test("zero, fracionários e dispensa preservam classe e só escrevem PV quando necessário",async()=>{
 for(const options of [{damage:0},{damage:2.5},{skip:true},{damage:17}]){const f=fixture(),before=resources(f);await f.apply({options});const value=options.skip?0:options.damage;assert.equal(f.actor.system.resources.health.value,100-value);assert.equal(f.record().ticks.round3.baseDamage,10);assert.equal(healthWrites(f).length,value===0?0:1);assert.equal(f.actor.system.resources.cosmoReserved,before.resources.cosmoReserved);assert.equal(f.actor.system.conditions.afraid,true);}
});
test("opções e assinatura inválidas não preparam journal",async()=>{
 for(const options of [{damage:-1},{damage:NaN},{damage:Infinity},{damage:"5"},{skip:null},{skip:1},{reason:12}]){const f=fixture();await assert.rejects(f.apply({options}));assert.equal(f.writes.length,0);}
 const f=fixture();await assert.rejects(f.apply({expectedState:"stale"}));await assert.rejects(f.apply({expectedRound:4}));assert.equal(f.writes.length,0);
});
test("rodada/epoch pertencem à intenção atual, sem aplicar por avanço",async()=>{
 const f=fixture();f.combat.round=2;await assert.rejects(f.apply(),/próxima/);assert.equal(f.writes.length,0);f.combat.round=8;f.combat.flags[ID].actionControl.epoch="epoch8";assert.equal(f.actor.system.resources.health.value,100);await f.apply();assert.equal(f.record().ticks.round3.round,3);assert.equal(f.actor.system.resources.health.value,90);f.combat.round=3;await assert.rejects(f.apply(),/próxima/);f.combat.round=4;await f.apply();assert.equal(f.record().status,"expired");
});
test("perfil congelado não consulta fonte removida e notas não causam falso conflito",async()=>{
 const f=fixture(),v=f.view();f.record().label="Rótulo local";f.record().reason="Nota posterior";f.record().source.name="Nome local já registrado";await f.apply({...v});assert.equal(f.record().damage,10);assert.equal(f.record().reason,"Nota posterior");assert.equal(f.actor.system.resources.health.value,90);
});
test("cópia e instância real substituída não resolvem registro de outra identidade",async()=>{
 for(const change of [f=>f.record().actorUuid="Actor.other",f=>f.docs.set(f.actor.uuid,{...f.actor}),f=>f.member.actor={...f.actor},f=>f.docs.set(f.combat.uuid,{...f.combat})]){const f=fixture(),v=f.view();change(f);await assert.rejects(applyBrasas(f.actor,"fire",{...v,requester:f.owner}));assert.equal(f.writes.length,0);}
});
test("mudança de recurso/perfil/tempo do registro/rodada duranteawait rejeita prévia",async()=>{
 for(const change of [f=>f.actor.system.resources.health.value--,f=>f.record().time++,f=>f.record().lastRound++,f=>f.combat.round++,f=>f.combat.flags[ID].actionControl.epoch="changed",f=>f.member.id="changed"]){const f=fixture(),v=f.view();let once=false;f.hooks.resolve=()=>{if(!once){once=true;change(f);}};await assert.rejects(f.apply({...v}));assert.equal(f.writes.length,0);}
});
test("falhas antes/depois do journal e commit recuperam apenas a parte ausente",async()=>{
 for(const action of ["apply","undo","end"])for(const tag of ["journal","commit"])for(const phase of ["before","after"]){const f=fixture();if(action==="undo")await f.apply({operationId:"initial"});const before=f.actor.system.resources.health.value,baseWrites=healthWrites(f).length,id="intent";f.faults.push({tag,phase});await assert.rejects(f[action]({operationId:id}));const op=f.operations()[id];
  if(!op){assert.equal(f.actor.system.resources.health.value,before);assert.equal(healthWrites(f).length,baseWrites);continue;}
  if(op.status==="prepared"){await f.recover(op);}
  const expected=action==="apply"?before-10:action==="undo"?before+10:before;assert.equal(f.actor.system.resources.health.value,expected);assert.equal(f.operations()[id].status,"applied");assert.equal(healthWrites(f).length,baseWrites+(action==="end"?0:1));
  const n=f.writes.length;assert.equal((await f[action]({operationId:id})).replayed,true);assert.equal(f.writes.length,n);
 }
});
test("OWNER ou mestre perdido após journal deixa operação recuperável",async()=>{
 for(const change of [f=>f.denied.add(f.actor.uuid),f=>game.users.activeGM={id:"other",isGM:true,active:true}]){const f=fixture();f.hooks.after=tag=>{if(tag==="journal")change(f);};await assert.rejects(f.apply());assert.ok(f.pending());assert.equal(healthWrites(f).length,0);f.hooks.after=null;f.denied.clear();game.users.activeGM=f.gm;await f.recover();assert.equal(f.actor.system.resources.health.value,90);}
});
test("intenção invalidada após journal não escreve perda",async()=>{
 const f=fixture();let allowed=true;f.hooks.after=tag=>{if(tag==="journal")allowed=false;};await assert.rejects(f.apply({intentGuard:()=>{if(!allowed)throw Error("message changed");}}));assert.ok(f.pending());assert.equal(healthWrites(f).length,0);f.hooks.after=null;await f.recover();assert.equal(healthWrites(f).length,1);
});
test("rodada ou epoch mudado depois de preparar impede commit e retomada antigos",async()=>{
 for(const change of [f=>f.combat.round++,f=>f.combat.flags[ID].actionControl.epoch="changed"]){const f=fixture();f.hooks.after=tag=>{if(tag==="journal")change(f);};await assert.rejects(f.apply());f.hooks.after=null;assert.equal(healthWrites(f).length,0);await assert.rejects(f.recover(),/rodada|epoch/);const record=copy(f.record());await f.recover(f.pending(),{close:true});assert.deepEqual(f.record(),record);assert.equal(f.actor.system.resources.health.value,100);await f.apply({options:{damage:0}});assert.equal(f.record().ticks.round3.damage,0);}
});
test("recuperação divergente ou parcial conserva PV e registro ao fechar",async()=>{
 for(const change of [f=>f.actor.system.resources.health.value-=10,f=>f.record().lastRound++,f=>f.record().time++]){const f=fixture();f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.apply());change(f);const before=resources(f),record=copy(f.record());await assert.rejects(f.recover(),/divergentes/);await f.recover(f.pending(),{close:true});assert.deepEqual(resources(f),before);assert.deepEqual(f.record(),record);}
});
test("Undo somente da última parcela intacta, inclusive parcela final e dispensa",async()=>{
 for(const options of [{},{options:{skip:true}},{options:{damage:0}},{options:{damage:1.5}}]){const f=fixture({rounds:1});await f.apply({...options,operationId:"one"});assert.equal(f.record().status,"expired");await f.undo({operationId:"undo1"});assert.equal(f.actor.system.resources.health.value,100);assert.equal(f.record().status,"active");assert.deepEqual(f.record().ticks,{});assert.equal(f.record().brasasLastOperation.action,"undo");await assert.rejects(f.undo(),/aplicada|parcela|Journal/);await f.apply();assert.equal(Object.keys(f.record().ticks).length,1);}
});
test("Undo não desfaz perda de outro fluxo ou parcela anterior",async()=>{
 for(const change of [f=>f.actor.system.resources.health.value++,f=>f.record().firstRound++,f=>f.record().time++]){const f=fixture();await f.apply();change(f);const before=resources(f);await assert.rejects(async()=>f.undo());assert.deepEqual(resources(f),before);}
 const f=fixture();await f.apply({operationId:"one"});f.combat.round=4;await f.apply({operationId:"two"});await f.undo({operationId:"undo2"});await assert.rejects(f.undo());assert.equal(f.actor.system.resources.health.value,90);assert.ok(f.record().ticks.round3);
});
test("Undo e encerramento funcionam sem encontro/fonte, sem devolver CE ou ações",async()=>{
 const f=fixture();await f.apply();f.docs.delete(f.combat.uuid);game.combats.contents=[];game.combat=null;const ce=f.actor.system.resources.cosmo.value;await f.undo();assert.equal(f.actor.system.resources.health.value,100);assert.equal(f.actor.system.resources.cosmo.value,ce);await f.end();assert.equal(f.record().status,"ended");await assert.rejects(f.undo());
});
test("Undo arquiva notas tardias da parcela em vez de regravar record histórico",async()=>{
 const f=fixture();await f.apply({operationId:"one"});f.record().ticks.round3.reason="Nota tardia";f.record().ticks.round3.customNote="Preservar campo";f.hooks.after=tag=>{if(tag==="journal"){f.record().reason="Nota duranteawait";f.record().ticks.round3.reason="Nota durante inversão";}};await f.undo({operationId:"undo1"});assert.equal(f.record().reason,"Nota duranteawait");assert.equal(f.record().brasasHistory.undo1.archivedTick.reason,"Nota durante inversão");assert.equal(f.record().brasasHistory.undo1.archivedTick.customNote,"Preservar campo");
});
test("notas de record e histórico editadas após journal sobrevivem ao commit",async()=>{
 const f=fixture();f.hooks.after=tag=>{if(tag==="journal"){f.record().reason="Tardia";f.record().label="Nome novo";f.record().source.name="Fonte local";f.record().brasasHistory={manual:{note:"Conservar"}};f.actor.system.resources.cosmo.value=7;}};await f.apply();assert.equal(f.record().reason,"Tardia");assert.equal(f.record().label,"Nome novo");assert.equal(f.record().brasasHistory.manual.note,"Conservar");assert.equal(f.actor.system.resources.cosmo.value,7);
});
test("after/after só conclui flags mesmo sem encontro e com notas tardias",async()=>{
 const f=fixture();await f.apply({operationId:"one"});f.operations().one.status="prepared";f.record().reason="Tardia";f.record().ticks.round3.reason="Nota da parcela";game.combats.contents=[];f.docs.delete(f.combat.uuid);const before=resources(f),record=copy(f.record()),n=healthWrites(f).length;await f.recover(f.operations().one);assert.equal(f.operations().one.status,"applied");assert.deepEqual(resources(f),before);assert.deepEqual(f.record(),record);assert.equal(healthWrites(f).length,n);
});
test("recuperação revalida alvo, journal e PV após seus awaits",async()=>{
 for(const change of [f=>f.docs.delete(f.actor.uuid),f=>f.actor.system.resources.health.value++,f=>f.operations().one.status="reviewed",f=>f.denied.add(f.actor.uuid)]){const f=fixture();await f.apply({operationId:"one"});f.operations().one.status="prepared";let reads=0;f.hooks.resolve=uuid=>{if(uuid===f.actor.uuid&&++reads===2)change(f);};const n=f.writes.length;await assert.rejects(f.recover(f.operations().one));assert.equal(f.writes.length,n);}
});
test("encerramento e recuperação da inversão preservam notas e alterações financeiras",async()=>{
 const f=fixture();await f.apply();f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.undo());const op=f.pending();f.record().ticks.round3.reason="Nota nova";f.actor.system.resources.cosmo.value=1;await f.recover(op);assert.equal(f.actor.system.resources.health.value,100);assert.equal(f.record().brasasHistory[op.id].archivedTick.reason,"Nota nova");assert.equal(f.actor.system.resources.cosmo.value,1);f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.end());await f.recover();assert.equal(f.record().status,"ended");
});
test("histórico legado permanece consumido; Undo novo conserva parcela antiga",async()=>{
 const f=fixture();f.record().ticks.round3={round:3,status:"applied",baseDamage:10,damage:4,before:100,after:96,operationId:"legacy",reason:"Antiga"};f.actor.system.resources.health.value=96;f.combat.round=4;await assert.rejects(f.undo());await f.apply({operationId:"new"});assert.equal(f.actor.system.resources.health.value,86);await f.undo();assert.equal(f.actor.system.resources.health.value,96);assert.equal(f.record().ticks.round3.reason,"Antiga");assert.equal(f.record().ticks.round4,undefined);
});
test("journal financeiro adulterado não executa; fechamento não altera outro registro",async()=>{
 const f=fixture();f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.apply());const op=f.pending();const other=copy(f.record());other.id="other";other.time++;f.actor.flags[ID].persistentEffects.other=other;op.recordId="other";op.after.health=999;await assert.rejects(f.recover(op));const record=copy(f.record()),before=resources(f);await f.recover(op,{close:true});assert.deepEqual(resources(f),before);assert.deepEqual(f.record(),record);assert.equal(other.status,"active");
});
test("patches e papéis serializados não são comandos de Brasas",async()=>{
 const f=fixture();f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.apply({options:{damage:5,updates:{"system.resources.cosmo.value":999},isGM:true}}));const op=f.pending();op.updates={"system.resources.cosmo.value":999,"system.resources.health.value":1000};op.requester={isGM:true};await f.recover(op);assert.equal(f.actor.system.resources.health.value,95);assert.equal(f.actor.system.resources.cosmo.value,12);
});
test("outros locks bloqueiam perdas, mas recibo e fechamento não escrevem recursos",async()=>{
 for(const extra of [{techniqueOperations:{x:{status:"prepared"}}},{actionOperations:{x:{status:"prepared"}}},{effectOperations:{x:{status:"prepared",kind:"manual"}}},{levelOperation:{status:"prepared"}},{damageOperations:{x:{status:"repair"}}}]){const f=fixture();Object.assign(f.actor.flags[ID],extra);await assert.rejects(f.apply());assert.equal(healthWrites(f).length,0);}
 const f=fixture();await f.apply({operationId:"one"});f.actor.flags[ID].techniqueOperations={x:{status:"prepared"}};const n=f.writes.length;assert.equal((await f.apply({operationId:"one"})).replayed,true);assert.equal(f.writes.length,n);f.operations().one.status="prepared";await f.recover(f.operations().one,{close:true});assert.equal(f.operations().one.status,"reviewed");assert.equal(healthWrites(f).length,1);
});
test("ID ocupada duranteawait não substitui operação ou histórico",async()=>{
 for(const history of [false,true]){const f=fixture(),foreign={kind:"other",status:"applied",keep:true};let once=false;f.hooks.resolve=uuid=>{if(uuid===f.combat.uuid&&!once){once=true;if(history)f.record().brasasHistory={collision:copy(foreign)};else{f.actor.flags[ID].effectOperations??={};f.operations().collision=copy(foreign);}}};await assert.rejects(f.apply({operationId:"collision"}),/ocupado/);assert.equal(healthWrites(f).length,0);assert.deepEqual(history?f.record().brasasHistory.collision:f.operations().collision,foreign);}
});
test("close de journal copiado libera apenas seu lock sem tocar registro/PV",async()=>{
 const f=fixture();f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.apply());const op=f.pending();op.actorUuid="Actor.original";const before=resources(f),record=copy(f.record());await assert.rejects(f.recover(op),/outra ficha/);await f.recover(op,{close:true});assert.deepEqual(resources(f),before);assert.deepEqual(f.record(),record);
});
test("close revalida propriedade e journal; cancelamento de guarda não grava",async()=>{
 for(const change of [f=>f.denied.add(f.actor.uuid),f=>f.operations().one.status="applied",f=>f.docs.delete(f.actor.uuid)]){const f=fixture();f.faults.push({tag:"commit",phase:"before"});await assert.rejects(f.apply({operationId:"one"}));let reads=0;f.hooks.resolve=uuid=>{if(uuid===f.actor.uuid&&++reads===2)change(f);};const n=f.writes.length;await assert.rejects(f.recover(f.operations().one,{close:true}));assert.equal(f.writes.length,n);}
 const f=fixture();await assert.rejects(f.apply({intentGuard:()=>{throw Error("cancelled");}}));assert.equal(f.writes.length,0);
});
test("recibo histórico sobrevive à remoção do registro sem recriá-lo",async()=>{
 const f=fixture();await f.apply({operationId:"one"});delete f.actor.flags[ID].persistentEffects.fire;const n=f.writes.length;const r=await applyBrasas(f.actor,"fire",{requester:f.owner,operationId:"one",expectedState:"old",expectedRound:3});assert.equal(r.replayed,true);assert.equal(f.writes.length,n);assert.deepEqual(f.actor.flags[ID].persistentEffects,{});
});
test("validador reconstrói números e recusa metadados/prazo/identidades alterados",async()=>{
 const f=fixture();await f.apply({operationId:"one"});const original=f.operations().one;assert.equal(validateBrasasJournal(original),original);
 for(const change of [r=>r.before.health=999,r=>r.after.health=999,r=>r.actorUuid="Actor.other",r=>r.context.round=1,r=>r.context.epoch=null,r=>r.before.record.registration.time++,r=>r.tick.damage=1,r=>{r.tick.before++;r.tick.after++;r.after.record.ticks.at(-1).before++;r.after.record.ticks.at(-1).after++;},r=>r.userId=null,r=>r.id="other"]){const op=copy(original);change(op);assert.throws(()=>validateBrasasJournal(op));}
});

test("interrupção de outro fluxo surgida após journal impede commit financeiro",async()=>{
 for(const other of [{techniqueOperations:{x:{status:"prepared"}}},{actionOperations:{x:{status:"prepared"}}},{damageOperations:{x:{status:"repair"}}},{levelOperation:{status:"prepared"}},{effectOperations:{foreign:{status:"prepared",kind:"manual"}}}]){const f=fixture();f.hooks.after=tag=>{if(tag==="journal"){for(const [key,value]of Object.entries(other)){if(key==="effectOperations")Object.assign(f.operations(),value);else f.actor.flags[ID][key]=value;}}};await assert.rejects(f.apply());assert.ok(f.pending());assert.equal(healthWrites(f).length,0);f.hooks.after=null;const op=Object.values(f.operations()).find(x=>x.kind==="brasasParcel");await assert.rejects(f.recover(op));await f.recover(op,{close:true});assert.equal(f.operations()[op.id].status,"reviewed");assert.equal(healthWrites(f).length,0);}
});
test("OWNER perdido no await do encontro e perfil inválido na retomada preservam dados",async()=>{
 const f=fixture();f.hooks.resolve=uuid=>{if(uuid===f.combat.uuid)f.denied.add(f.actor.uuid);};await assert.rejects(f.apply());assert.equal(f.writes.length,0);
 const g=fixture();g.faults.push({tag:"commit",phase:"before"});await assert.rejects(g.apply());g.record().source.classification="unsupported";const record=copy(g.record()),before=resources(g);await assert.rejects(g.recover());await g.recover(g.pending(),{close:true});assert.deepEqual(g.record(),record);assert.deepEqual(resources(g),before);
});
