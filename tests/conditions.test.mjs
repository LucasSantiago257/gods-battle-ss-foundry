import {holdDecisionOutsideQueue} from "./held-dialog.mjs";
import {runMasterOperation} from "../module/master-queue.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {knight,content} from "./foundry-stub.mjs";
import {prepareKnight,testParameters} from "../module/rules.mjs";
import {conditionTotals,conditionPool,conditionDefinition,conditionRecords} from "../module/condition-rules.mjs";
import {registerCondition,editCondition,endCondition,conditionSheetContext} from "../module/conditions.mjs";
import {rollTest} from "../module/rolls.mjs";
import {techniqueParameters,activationPreview} from "../module/technique-rules.mjs";
import {planLevel} from "../module/level-rules.mjs";
import {BattleActor} from "../module/documents.mjs";
const ID="gods-battle-ss";
function patch(obj,data){for(const [path,value]of Object.entries(data)){const parts=path.split(".");let o=obj;for(const p of parts.slice(0,-1))o=o[p]??={};o[parts.at(-1)]=structuredClone(value);}}
function fixture(){
 const gm={id:"gm",isGM:true,active:true},player={id:"p",isGM:false},answers=[],notices=[],cards=[],formulas=[];let n=0;
 const actor={uuid:"Actor.example",name:"Cavaleiro de exercício",type:"knight",isOwner:true,flags:{[ID]:{preserve:"notas"}},system:knight(),items:{contents:[]},updates:[],async update(data){this.updates.push(data);patch(this,data);refresh();}};
 actor.system.attributes.for.value=4;actor.system.attributes.vig.value=3;actor.system.attributes.for.bonus=7;actor.system.skills.sports.value=4;actor.system.skills.sports.bonus=3;actor.system.skills.asterism.value=3;actor.system.resources.health.value=17.5;actor.system.resources.cosmo.value=8;actor.system.conditions.tired=true;
 const refresh=()=>prepareKnight(actor.system,actor.items.contents,"rank",{actorUuid:actor.uuid,flags:actor.flags});refresh();
 globalThis.game={user:gm,users:{activeGM:gm},settings:{get:scope=>scope==="core"?"blindroll":"rank"},combats:{contents:[]}};globalThis.fromUuid=async uuid=>uuid===actor.uuid?actor:null;
 globalThis.ui={notifications:{warn:t=>notices.push(t),error:t=>notices.push(t),info:t=>notices.push(t)}};
 foundry.utils={randomID:()=>`condition${++n}`};foundry.applications.api.DialogV2={wait:async()=>{const a=answers.shift();return typeof a==="function"?a():a??null;}};foundry.applications.handlebars={renderTemplate:async(_path,data)=>{cards.push(data);return "card";}};
 foundry.dice={terms:{OperatorTerm:class{constructor(data){Object.assign(this,data);}}}};
 globalThis.Roll=class{constructor(formula){this.formula=formula;}async evaluate(){formulas.push(this.formula);if(this.formula.includes("d10")){this.dice=[{results:Array.from({length:Number.parseInt(this.formula)},()=>({result:8}))}];this.terms=[{number:8}];}else this.terms=[{number:Number(this.formula)}];return this;}static fromTerms(t){return {total:t[0].number+(t[1].operator==="+"?1:-1)*t[2].number};}};
 globalThis.ChatMessage={getSpeaker:()=>({}),applyRollMode:(d,m)=>{d.rollMode=m;},create:async data=>{cards.push(data);return data;}};
 const definition={key:"tired",count:2,origin:"Privação de descanso",details:"Conferido pelo mestre",until:"Após descanso confirmado",reason:"Revisei a regra e ajustes manuais.",reviewedManual:true};
 return {actor,gm,player,answers,definition,refresh,cards,formulas,notices,async create(options={}){answers.push({...definition,...options});return registerCondition(actor);}};
}
test("checkbox antigo e anotações não ativam condições; só registros conferidos próprios",()=>{
 const f=fixture();assert.equal(conditionTotals(f.actor.uuid,f.actor.flags).modifier,0);const r={...f.definition,actorUuid:f.actor.uuid,ruleVersion:1,status:"active"};f.actor.flags[ID].conditionEffects={valid:r,copy:{...r,actorUuid:"Actor.original"},manual:{...r,key:"paralyzed"},notReviewed:{...r,reviewedManual:false}};const total=conditionTotals(f.actor.uuid,f.actor.flags);assert.equal(total.modifier,-4);assert.equal(total.dice,0);assert.equal(total.warnings.length,3);f.actor.flags[ID].conditionEffects.valid.count=NaN;assert.equal(conditionTotals(f.actor.uuid,f.actor.flags).modifier,0);
});
test("condição exige quantidade válida, aceita notas vazias sem declarações",()=>{
 const f=fixture();for(const invalid of [{key:"dead"},{count:0},{count:1.2},{count:1001},{reason:42},{until:"x".repeat(1001)}])assert.throws(()=>conditionDefinition({...f.definition,...invalid}));assert.equal(conditionDefinition(f.definition).page,"393");assert.equal(conditionDefinition({...f.definition,key:"incapacitated"}).page,"397");
});
test("registro altera apenas parcelas derivadas, preserva PV/CE e ajustes manuais",async()=>{
 const f=fixture(),before=structuredClone(f.actor.system);const r=await f.create();assert.equal(r.count,2);assert.equal(f.actor.system.automation.conditionModifier,-4);assert.deepEqual(f.actor.system.resources,before.resources);assert.deepEqual(f.actor.system.attributes,before.attributes);assert.deepEqual(f.actor.system.skills,before.skills);assert.deepEqual(f.actor.system.conditions,before.conditions);assert.equal(f.actor.flags[ID].preserve,"notas");
});
test("cansaço e membros combinam uma vez em atributos, perícias e resistências",async()=>{
 const f=fixture(),before={attribute:testParameters(f.actor.system,"attribute","for"),skill:testParameters(f.actor.system,"skill","sports"),resistance:testParameters(f.actor.system,"resistance","vig")};await f.create();await f.create({key:"incapacitated",count:2,origin:"Dano localizado",until:"Final da luta conferido"});for(const [name,kind,key]of [["attribute","attribute","for"],["skill","skill","sports"],["resistance","resistance","vig"]]){const actual=testParameters(f.actor.system,kind,key);assert.equal(actual.modifier,before[name].modifier-8);assert.equal(actual.dice,Math.max(1,before[name].dice-2));}assert.equal(f.actor.system.combat.resistances.vig,before.resistance.modifier-8);
});
test("encerrar restaura só sua contribuição e não marca/desmarca caixas manuais",async()=>{
 const f=fixture(),baseline=testParameters(f.actor.system,"attribute","for"),t=await f.create(),i=await f.create({key:"incapacitated",count:1});f.answers.push("Descanso conferido.");await endCondition(f.actor,t.id);assert.equal(f.actor.system.automation.conditionModifier,-2);f.answers.push("Membro recuperado conforme regra.");await endCondition(f.actor,i.id);assert.deepEqual(testParameters(f.actor.system,"attribute","for"),baseline);assert.equal(f.actor.system.conditions.tired,true);assert.equal(f.actor.system.resources.health.value,17.5);assert.equal(conditionSheetContext(f.actor).records.length,2);
});
test("limites e vantagem não duplicam perda; quantidade não aumenta ao avançar tempo",async()=>{
 const f=fixture();await f.create({key:"incapacitated",count:3});for(const advantage of [-1,0,1])assert.equal(conditionPool(f.actor.system,1+advantage,10+advantage*2,{maxDice:5}).dice,advantage===-1?0:1);assert.equal(conditionPool(f.actor.system,6,10,{maxDice:5}).dice,3);assert.equal(conditionPool(f.actor.system,0,10).dice,0);game.combats.contents=[{round:50}];f.refresh();assert.equal(f.actor.system.automation.conditionDicePenalty,3);
});
test("Asterismo aplica parcelas sem modificar CE, ND, dano ou dificuldade",async()=>{
 const f=fixture(),tech=content(),base=techniqueParameters(f.actor.system,tech,{advantage:1}),preview=activationPreview(f.actor.system,tech);await f.create();await f.create({key:"incapacitated",count:2});const current=techniqueParameters(f.actor.system,tech,{advantage:1}),after=activationPreview(f.actor.system,tech);assert.equal(current.dice,2);assert.equal(current.modifier,base.modifier-8);assert.equal(current.cost,base.cost);assert.equal(current.difficulty,base.difficulty);assert.equal(after.normal.damage,preview.normal.damage);assert.match(current.conditionSummary,/−2 dado/);
});
test("duplicata não acumula; encerramento permite substituir a quantidade",async()=>{
 const f=fixture(),r=await f.create();await assert.rejects(f.create(),/Já existe/);assert.equal(f.actor.system.automation.conditionModifier,-4);f.answers.push("Revisei novo total de dias sem descanso.");await endCondition(f.actor,r.id);await f.create({count:3});assert.equal(f.actor.system.automation.conditionModifier,-6);
});
test("copiar ficheiro não herda parcelas; encerramento afeta somente cópia",async()=>{
 const f=fixture(),r=await f.create();f.actor.uuid="Actor.copy";f.refresh();assert.equal(f.actor.system.automation.conditionModifier,0);assert.equal(conditionSheetContext(f.actor).warnings.length,1);f.answers.push("Encerrei o registro herdado somente na cópia.");await endCondition(f.actor,r.id);assert.equal(conditionRecords(f.actor)[r.id].status,"ended");assert.equal(f.actor.system.resources.health.value,17.5);
});
test("cancelamento, mestre/proprietário e edição durante diálogo impedem alterações",async()=>{
 const f=fixture();f.answers.push(null);await registerCondition(f.actor);assert.equal(f.actor.updates.length,0);game.user=f.player;await assert.rejects(f.create(),/mestre responsável/);game.user=f.gm;f.answers.length=0;f.answers.push(()=>{f.actor.system.resources.health.value=9;return f.definition;});await assert.rejects(registerCondition(f.actor),/mudou/);assert.equal(Object.keys(conditionRecords(f.actor)).length,0);f.actor.isOwner=false;await assert.rejects(registerCondition(f.actor));
});
test("falha de gravação não altera recursos e registro já salvo não se duplica",async()=>{
 for(const persist of [false,true]){const f=fixture(),update=f.actor.update.bind(f.actor);let fail=true;f.actor.update=async data=>{if(fail){fail=false;if(persist)await update(data);throw Error("resposta perdida");}return update(data);};await assert.rejects(f.create(),/perdida/);assert.equal(f.actor.system.resources.health.value,17.5);assert.equal(Object.keys(conditionRecords(f.actor)).length,persist?1:0);if(persist)await assert.rejects(f.create(),/Já existe/);else await f.create();assert.equal(f.actor.system.automation.conditionModifier,-4);}
});
test("operações preparadas bloqueiam concessão/encerramento de condições",async()=>{
 const f=fixture(),r=await f.create();f.actor.flags[ID].effectOperations={pending:{status:"prepared"}};await assert.rejects(endCondition(f.actor,r.id),/interrompida/);await assert.rejects(f.create({key:"incapacitated"}),/interrompida/);assert.equal(conditionRecords(f.actor)[r.id].status,"active");
});
test("Actor nativo calcula a partir das flags e projeção de nível conserva contexto",async()=>{
 const f=fixture();await f.create();const native=new BattleActor();Object.assign(native,{type:"knight",uuid:f.actor.uuid,system:knight(),flags:f.actor.flags,items:{contents:[]}});native.prepareDerivedData();assert.equal(native.system.automation.conditionModifier,-4);
 const draft={id:"levelExample0001",from:1,to:2,skills:{},attributes:{},fighting:{},advanceSense:false,reviewedManual:true,acceptExceptions:true,reason:"Aquisição pendente"};const plan=planLevel(f.actor.system,[],draft,{},"rank",{actorUuid:f.actor.uuid,flags:f.actor.flags});assert.equal(plan.projected.automation.conditionModifier,-4);assert.equal(plan.projected.resources.health.value,17.5);
});
test("testes genéricos e resistência aplicam uma vez e preservam modo privado",async()=>{
 for(const [kind,key]of [["attribute","for"],["skill","sports"],["resistance","vig"]]){const f=fixture();await f.create();await f.create({key:"incapacitated",count:1});f.cards.length=0;const expected=testParameters(f.actor.system,kind,key);f.answers.push({difficulty:10,bonus:0,advantage:0});const sent=await rollTest(f.actor,kind,key);assert.equal(f.formulas.filter(x=>x.includes("d10")).length,1);assert.equal(f.formulas[0],`${expected.dice}d10kh1`);const card=f.cards.find(x=>x.modifier!==undefined);assert.equal(card.modifier,expected.modifier);assert.equal(sent.rolls[0].total,card.total);assert.equal(sent.rollMode,"blindroll");assert.match(card.conditionSummary,/Condições/);}
});
test("condição alterada durante prévia/teste genérico não publica resultado antigo",async()=>{
 for(const stage of ["dialog","roll"]){const f=fixture(),r=await f.create();f.cards.length=0;const change=()=>{conditionRecords(f.actor)[r.id].status="ended";f.refresh();};if(stage==="dialog")f.answers.push(()=>{change();return {difficulty:10,bonus:0,advantage:0};});else{f.answers.push({difficulty:10,bonus:0,advantage:0});const evaluate=Roll.prototype.evaluate;Roll.prototype.evaluate=async function(){const result=await evaluate.call(this);if(this.formula.includes("d10"))change();return result;};}await rollTest(f.actor,"skill","asterism");assert.equal(f.cards.filter(x=>x.rolls).length,0);assert.ok(f.notices.some(x=>x.includes("condições")));if(stage==="dialog")assert.equal(f.formulas.length,0);}
});
test("registrar e encerrar sem justificativa ou aceite preserva recursos e ajustes",async()=>{
 const f=fixture(),before=structuredClone(f.actor.system.resources);const r=await f.create({reason:"",until:"",reviewedManual:false});assert.equal(r.until,"Até encerrar");assert.equal(r.reason,"");assert.equal(f.actor.system.automation.conditionModifier,-4);f.answers.push("");await endCondition(f.actor,r.id);assert.equal(f.actor.system.automation.conditionModifier,0);assert.deepEqual(f.actor.system.resources,before);assert.equal(conditionRecords(f.actor)[r.id].end.reason,"");
});
test("callback de registro não depende de elementos de aceite removidos",async()=>{
 const f=fixture();foundry.applications.api.DialogV2.wait=async options=>options.buttons[0].callback(null,{form:{elements:Object.fromEntries(Object.entries({key:"tired",count:"1",origin:"",details:"",until:"",reason:""}).map(([k,value])=>[k,{value}]))}});const r=await registerCondition(f.actor);assert.equal(r.count,1);assert.equal(r.reviewedManual,true);assert.equal(f.actor.system.automation.conditionModifier,-2);
});

test("janelas de registrar/encerrar condição não ocupam fila enquanto abertas",async()=>{
 const f=fixture();await holdDecisionOutsideQueue(()=>registerCondition(f.actor),{during:()=>assert.equal(f.actor.updates.length,0)});const record=await f.create();const count=f.actor.updates.length;await holdDecisionOutsideQueue(()=>endCondition(f.actor,record.id),{during:()=>assert.equal(f.actor.updates.length,count)});assert.equal(conditionRecords(f.actor)[record.id].status,"active");
});
test("condição revalida ficha na fila após outra operação durante diálogo",async()=>{
 const f=fixture();await assert.rejects(holdDecisionOutsideQueue(()=>registerCondition(f.actor),{answer:f.definition,during:async()=>{await runMasterOperation(()=>{f.actor.system.resources.health.value=11;});}}),/mudou/);assert.equal(f.actor.updates.length,0);assert.equal(f.actor.system.resources.health.value,11);
});

function changingFixture(){
 const f=fixture(),hooks={},stats={writes:0},write=f.actor.update.bind(f.actor);f.hooks=hooks;f.stats=stats;
 f.actor.update=async data=>{await hooks.write?.(data,"before");await write(data);stats.writes++;await hooks.write?.(data,"after");};
 globalThis.fromUuid=async uuid=>{await hooks.read?.(uuid);return uuid===f.actor.uuid?f.actor:null;};
 const render=foundry.applications.handlebars.renderTemplate;foundry.applications.handlebars.renderTemplate=async(p,c)=>{await hooks.render?.(p,c);return render(p,c);};
 f.current=id=>conditionRecords(f.actor)[id];f.edit=async(id,changes={})=>{f.answers.push({...f.current(id),...changes});return editCondition(f.actor,id);};return f;
}
test("Desorientado da tabela reduz −4 e um dado por sentido uma vez em todos os testes",async()=>{
 const f=changingFixture(),before=[testParameters(f.actor.system,"attribute","vig"),testParameters(f.actor.system,"skill","sports"),testParameters(f.actor.system,"resistance","vig")],s=structuredClone(f.actor.system);await f.create({key:"disoriented",count:2,reason:"",details:"Audição e olfato"});const totals=conditionTotals(f.actor.uuid,f.actor.flags);assert.equal(totals.modifier,-8);assert.equal(totals.dice,2);for(const [i,kind,key]of [[0,"attribute","vig"],[1,"skill","sports"],[2,"resistance","vig"]]){const p=testParameters(f.actor.system,kind,key);assert.equal(p.modifier,before[i].modifier-8);assert.equal(p.dice,Math.max(1,before[i].dice-2));}assert.deepEqual(f.actor.system.resources,s.resources);assert.deepEqual(f.actor.system.attributes,s.attributes);assert.equal(totals.entries[0].page,"393–394");
});
test("modificador final de Desorientado substitui tabela sem multiplicar nem retirar dados a mais",async()=>{
 const f=changingFixture(),r=await f.create({key:"disoriented",count:3,modifierOverride:-6});assert.equal(f.actor.system.automation.conditionModifier,-6);assert.equal(f.actor.system.automation.conditionDicePenalty,3);await f.edit(r.id,{count:2});assert.equal(f.actor.system.automation.conditionModifier,-6);assert.equal(f.actor.system.automation.conditionDicePenalty,2);await f.edit(r.id,{modifierOverride:null});assert.equal(f.actor.system.automation.conditionModifier,-8);assert.equal(f.actor.system.automation.conditionDicePenalty,2);assert.equal(f.current(r.id).revision,2);
});
test("Cansado/membros/Desorientado coexistem e somam sem cortar os limites combinados",async()=>{
 const f=changingFixture();await f.create({key:"tired",count:1000});await f.create({key:"incapacitated",count:1000});await f.create({key:"disoriented",count:6,modifierOverride:-100});assert.equal(f.actor.system.automation.conditionModifier,-4100);assert.equal(f.actor.system.automation.conditionDicePenalty,1006);assert.deepEqual(conditionPool(f.actor.system,5,8),{dice:1,modifier:-4092});assert.equal(conditionPool(f.actor.system,0,8).dice,0);assert.equal(f.actor.system.resources.health.value,17.5);
});
test("quantidade de sentidos e modificador final inválidos, chaves herdadas e nulos são guardados",async()=>{
 for(const change of [{count:0},{count:7},{count:1.5},{modifierOverride:NaN},{modifierOverride:1},{modifierOverride:-101},{modifierOverride:-6.5},{modifierOverride:"-6"},{key:"constructor"},{key:"toString"}]){const f=changingFixture();await assert.rejects(f.create({key:"disoriented",count:1,...change}));assert.equal(f.stats.writes,0);}
 const f=changingFixture();f.actor.flags[ID].conditionEffects={bad:{...f.definition,status:"active",actorUuid:f.actor.uuid,ruleVersion:1,key:"constructor"},nil:null,legacy:{...f.definition,key:"disoriented",count:1,status:"active",actorUuid:f.actor.uuid,ruleVersion:1}};f.refresh();assert.equal(f.actor.system.automation.conditionModifier,0);assert.equal(conditionTotals(f.actor.uuid,f.actor.flags).warnings.length,2);assert.equal(conditionSheetContext(f.actor).records.length,3);
});
test("Ajustar substitui quantidade e mantém ID/origem inicial/autoria, com antes/depois no histórico",async()=>{
 for(const key of ["tired","incapacitated","disoriented"]){const f=changingFixture(),r=await f.create({key,count:1}),resources=structuredClone(f.actor.system.resources),initialTime=f.current(r.id).time;await f.edit(r.id,{count:2,details:"Novo detalhe",reason:""});const current=f.current(r.id),h=Object.values(current.revisions)[0];assert.equal(current.count,2);assert.equal(current.revision,1);assert.equal(current.userId,"gm");assert.equal(current.time,initialTime);assert.equal(h.before.count,1);assert.equal(h.after.count,2);assert.equal(h.after.reason,"");assert.equal(Object.keys(conditionRecords(f.actor)).length,1);assert.equal(current.status,"active");assert.deepEqual(f.actor.system.resources,resources);assert.equal(conditionSheetContext(f.actor).records[0].canEdit,true);}
});
test("recuperação parcial de sentidos muda parcelas; recuperação completa encerra só registro",async()=>{
 const f=changingFixture(),base=testParameters(f.actor.system,"attribute","vig"),r=await f.create({key:"disoriented",count:3});await f.edit(r.id,{count:1});assert.equal(f.actor.system.automation.conditionModifier,-4);assert.equal(f.actor.system.automation.conditionDicePenalty,1);f.answers.push("");await endCondition(f.actor,r.id);assert.deepEqual(testParameters(f.actor.system,"attribute","vig"),base);assert.equal(f.current(r.id).revision,1);assert.equal(f.current(r.id).end.reason,"");assert.equal(f.actor.system.conditions.tired,true);
});
test("ajuste vazio ou cancelado não escreve nem aumenta histórico; tipo não pode mudar",async()=>{
 const f=changingFixture(),r=await f.create({key:"disoriented",count:2});const writes=f.stats.writes;await f.edit(r.id);assert.equal(f.stats.writes,writes);await editCondition(f.actor,r.id);assert.equal(f.stats.writes,writes);await assert.rejects(f.edit(r.id,{key:"tired"}),/tipo/);assert.equal(f.current(r.id).count,2);assert.equal(f.current(r.id).revision,undefined);await assert.rejects(f.edit(r.id,{count:0}));
});
test("duplo clique do mesmo ajuste só grava uma revisão e uma quantidade final",async()=>{
 const f=changingFixture(),r=await f.create({key:"disoriented",count:1});const outcomes=await Promise.allSettled([f.edit(r.id,{count:3}),f.edit(r.id,{count:3})]);assert.equal(outcomes.filter(x=>x.status==="fulfilled").length,1);assert.equal(f.current(r.id).revision,1);assert.equal(f.current(r.id).count,3);assert.equal(f.stats.writes,2);
});
test("ajuste e registro recusam alterações durante render/diálogo/última leitura e troca conjunta deGM",async()=>{
 for(const point of ["render","dialog","read"]){for(const mutate of [f=>f.actor.system.resources.cosmo.value=2,f=>f.actor.isOwner=false,f=>{const gm={id:"gm2",isGM:true,active:true};game.user=gm;game.users.activeGM=gm;},f=>f.current("condition1").count=3]){const f=changingFixture(),r=await f.create({key:"disoriented",count:1});const answer={...f.current(r.id),count:2};if(point==="render")f.hooks.render=async()=>mutate(f);if(point==="dialog")f.answers.push(()=>{mutate(f);return answer;});if(point==="read")f.hooks.read=async()=>mutate(f);await assert.rejects(point==="dialog"?editCondition(f.actor,r.id):f.edit(r.id,{count:2}),/mudou|mestre responsável/);assert.equal(f.stats.writes,1);assert.equal(f.current(r.id).revision,undefined);}}
 const f=changingFixture();f.hooks.render=async()=>{const gm={id:"gm2",isGM:true,active:true};game.user=gm;game.users.activeGM=gm;};await assert.rejects(f.create({key:"disoriented",count:1}),/mudou/);assert.equal(f.stats.writes,0);
});
test("mestre/ownership/cópia/pendências/encerrado e duplicados não recebem ajuste",async()=>{
 for(const mutate of [f=>game.user=f.player,f=>f.actor.isOwner=false,f=>f.actor.uuid="Actor.copy",f=>f.current("condition1").status="ended",...['techniqueOperations','actionOperations','effectOperations','damageOperations','levelOperation'].map(g=>f=>f.actor.flags[ID][g]=g==="levelOperation"?{status:"prepared"}:{pending:{status:"prepared"}})]){const f=changingFixture(),r=await f.create({key:"disoriented",count:1});mutate(f);await assert.rejects(f.edit(r.id,{count:2}));assert.equal(f.stats.writes,1);assert.equal(conditionSheetContext(f.actor).records[0].canEdit,false);}
 const f=changingFixture(),r=await f.create();conditionRecords(f.actor).duplicate=structuredClone(f.current(r.id));await assert.rejects(f.edit(r.id,{count:3}),/duplicadas/);assert.equal(f.stats.writes,1);
});
test("ajustes e encerramento não ocupam fila enquanto esperam escolha",async()=>{
 const f=changingFixture(),r=await f.create({key:"disoriented",count:1});await holdDecisionOutsideQueue(()=>editCondition(f.actor,r.id));assert.equal(f.stats.writes,1);await assert.rejects(holdDecisionOutsideQueue(()=>editCondition(f.actor,r.id),{answer:{...f.current(r.id),count:2},during:()=>{f.actor.system.resources.health.value=1;}}),/mudou/);assert.equal(f.current(r.id).count,1);
});
test("falha antes/depois de Actor.update deixa condição anterior ou ajuste único reconhecível",async()=>{
 for(const point of ["before","after"]){const f=changingFixture(),r=await f.create({key:"disoriented",count:1});f.hooks.write=async(_d,p)=>{if(p===point)throw Error("Falha de resposta");};await assert.rejects(f.edit(r.id,{count:2}));assert.equal(f.current(r.id).count,point==="before"?1:2);f.hooks.write=null;await f.edit(r.id,{count:2});assert.equal(f.current(r.id).count,2);assert.equal(f.current(r.id).revision,1);assert.equal(Object.keys(f.current(r.id).revisions).length,1);assert.equal(f.actor.system.resources.health.value,17.5);}
});
test("histórico divergente, ordem, quantidade e chaves inválidas não são sobrescritos",async()=>{
 for(const mutate of [r=>r.revision=2,r=>r.count=3,r=>Object.values(r.revisions)[0].before.count=0,r=>Object.values(r.revisions)[0].after.key="incapacitated",r=>Object.values(r.revisions)[0].revision=2,r=>r.revisions['bad.key']=Object.values(r.revisions)[0]]){const f=changingFixture(),r=await f.create({key:"disoriented",count:1});await f.edit(r.id,{count:2});mutate(f.current(r.id));await assert.rejects(f.edit(r.id,{count:4}));assert.equal(f.stats.writes,2);assert.equal(conditionSheetContext(f.actor).records[0].canEdit,false);}
});
test("vários ajustes encadeiam matemática e evolução conserva a última parcela sem curar",async()=>{
 const f=changingFixture(),r=await f.create({key:"disoriented",count:1});await f.edit(r.id,{count:3});await f.edit(r.id,{count:2,modifierOverride:-6});const history=Object.values(f.current(r.id).revisions);assert.deepEqual(history[1].before,history[0].after);const draft={id:"abcdefghijklmnop",from:1,to:2,attributes:{},skills:{},fighting:{}};const plan=planLevel(f.actor.system,[],draft,{},"rank",{actorUuid:f.actor.uuid,flags:f.actor.flags});assert.equal(plan.projected.automation.conditionModifier,-6);assert.equal(plan.projected.automation.conditionDicePenalty,2);assert.equal(plan.projected.resources.health.value,17.5);assert.equal(f.current(r.id).revision,2);
});
test("Asterismo e testes privados recebem Desorientado uma vez sem dano/CE automático",async()=>{
 const f=changingFixture(),tech=content(),before=techniqueParameters(f.actor.system,tech,{advantage:1});await f.create({key:"disoriented",count:2});const after=techniqueParameters(f.actor.system,tech,{advantage:1});assert.equal(after.dice,Math.max(1,before.dice-2));assert.equal(after.modifier,before.modifier-8);assert.equal(after.cost,before.cost);assert.equal(after.difficulty,before.difficulty);f.cards.length=0;f.answers.push({difficulty:10,bonus:0,advantage:0});const sent=await rollTest(f.actor,"resistance","vig");assert.equal(sent.rollMode,"blindroll");const card=f.cards.find(x=>x.modifier!==undefined);assert.equal(card.modifier,testParameters(f.actor.system,"resistance","vig").modifier);assert.equal(f.actor.system.resources.cosmo.value,8);
});
test("callback de ajuste aceita campos mecânicos e notas vazias, sem declarações",async()=>{
 const f=changingFixture(),r=await f.create({key:"disoriented",count:1});foundry.applications.api.DialogV2.wait=async options=>options.buttons[0].callback(null,{form:{elements:Object.fromEntries(Object.entries({key:"disoriented",count:"2",modifierOverride:"-6",origin:"",details:"",until:"",reason:""}).map(([k,value])=>[k,{value}]))}});await editCondition(f.actor,r.id);assert.equal(f.current(r.id).modifierOverride,-6);assert.equal(f.current(r.id).count,2);assert.equal(f.current(r.id).reason,"");assert.equal(f.current(r.id).until,"Até encerrar");
});

test("histórico renderizado mostra mudança de modificador mesmo com a mesma quantidade",async()=>{
 const f=changingFixture(),r=await f.create({key:"disoriented",count:2});await f.edit(r.id,{modifierOverride:-6});const row=conditionSheetContext(f.actor).records[0];assert.equal(row.revisions[0].beforeModifier,-8);assert.equal(row.revisions[0].afterModifier,-6);assert.equal(row.revisions[0].beforeDice,2);assert.equal(row.revisions[0].afterDice,2);row.revisions[0].after=null;assert.doesNotThrow(()=>conditionSheetContext(f.actor));f.current(r.id).revisions.bad=null;assert.equal(conditionSheetContext(f.actor).records[0].canEdit,false);assert.match(conditionSheetContext(f.actor).records[0].editWarning,/inconsistente/);
});
