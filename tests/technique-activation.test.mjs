import test from "node:test";
import assert from "node:assert/strict";
import {knight,content} from "./foundry-stub.mjs";
import {prepareKnight} from "../module/rules.mjs";
import {activationState,submitTechniqueActivation,executeTechniqueRequest,enqueueTechniqueRequest,resumeTechniqueRequests,pendingTechnique,recoverTechniqueOperation,reviewTechniqueOperation,paymentSnapshot} from "../module/technique-activation.mjs";
import {techniqueParameters,cosmoPayment} from "../module/technique-rules.mjs";
import {enqueueDamageRequest} from "../module/damage.mjs";
import {applyLevelOperation} from "../module/level-up.mjs";
import {techniqueWithComponents,COMPONENT_RULES} from "../module/technique-components.mjs";
import {actionHash} from "../module/action-rules.mjs";
const ID="gods-battle-ss",clone=value=>JSON.parse(JSON.stringify(value));
function patch(object,data){for(const[path,value]of Object.entries(data)){const parts=path.split(".");let at=object;for(const key of parts.slice(0,-1))at=at[key]??={};const last=parts.at(-1);if(last.startsWith("-="))delete at[last.slice(2)];else if(value&&typeof value==="object"&&!Array.isArray(value)&&at[last]&&typeof at[last]==="object")merge(at[last],value);else at[last]=clone(value);}}
function merge(to,from){for(const[key,value]of Object.entries(from)){if(value&&typeof value==="object"&&!Array.isArray(value)&&to[key]&&typeof to[key]==="object")merge(to[key],value);else to[key]=clone(value);}}
function runtime(){
 const gm={id:"gm",isGM:true,active:true},owner={id:"owner",isGM:false},other={id:"other",isGM:false},outsider={id:"outsider",isGM:false},users=new Map([gm,owner,other,outsider].map(u=>[u.id,u])),messages=new Map(),updates=[],renders=[],notices=[],stats={rolls:0,payments:0,published:0};
 globalThis.game={user:owner,users:{activeGM:gm,get:id=>users.get(id)},messages:{get:id=>messages.get(id),get contents(){return [...messages.values()];}},settings:{get:(scope,key)=>scope==="core"?"publicroll":"rank"}};
 globalThis.ui={notifications:{warn:t=>notices.push(t),error:t=>notices.push(t),info:t=>notices.push(t)}};
 foundry.applications.api.DialogV2={confirm:async()=>true,wait:async()=>null};foundry.applications.handlebars={renderTemplate:async(path,context)=>{renders.push({path,context});return "<p>Resultado conferido</p>";}};
 foundry.dice={terms:{OperatorTerm:class{constructor(data){Object.assign(this,data);}}}};
 const controls={faces:[10,10],beforeRoll:null,publishFail:false,paymentFail:null,updateMessage:null};
 globalThis.Roll=class{constructor(formula){this.formula=formula;}async evaluate(){if(this.formula.includes("d10")){stats.rolls++;if(controls.beforeRoll)await controls.beforeRoll();this.dice=[{results:controls.faces.map(result=>({result}))}];this.terms=[{number:Math.max(...controls.faces)}];}else this.terms=[{number:Number(this.formula)}];return this;}static fromTerms(terms){const total=terms[0].number+(terms[1].operator==="+"?1:-1)*terms[2].number;return{total,toJSON:()=>({total,evaluated:true,terms:clone(terms)})};}static fromData(data){return{...data,toJSON:()=>clone(data)};}};
 const doc=data=>({...data,async update(change){if(controls.updateMessage)await controls.updateMessage(this,change);if(change.rolls&&controls.publishFail)throw Error("Falha de publicação");patch(this,change);if(change.rolls)stats.published++;return this;}});
 globalThis.ChatMessage={getSpeaker:({actor})=>({actor:actor.id,alias:actor.name}),applyRollMode:(data,mode)=>{data.whisper=mode==="publicroll"?[]:mode==="selfroll"?[game.user.id]:[gm.id];data.blind=mode==="blindroll";},create:async data=>{const message=doc({...clone(data),id:`request${messages.size+1}`,author:game.user});messages.set(message.id,message);return message;}};
 const s=knight();s.skills.asterism.value=2;s.resources.cosmo.value=10;s.resources.health.value=100;prepareKnight(s);
 const actor={uuid:"Actor.hero",id:"hero",name:"Cavaleiro de teste",type:"knight",system:s,flags:{},isOwner:true,testUserPermission:u=>u?.isGM||[owner.id,other.id].includes(u?.id),async update(change){updates.push(clone(change));const payment=Object.hasOwn(change,"system.combat.asterismPenalty");if(payment&&controls.paymentFail==="before")throw Error("Falha ao salvar pagamento");patch(this,change);if(payment)stats.payments++;if(payment&&controls.paymentFail==="after")throw Error("Resposta perdida após pagamento");return this;}};
 const item={id:"tech",uuid:"Actor.hero.Item.tech",name:"Fulgor",type:"technique",isOwner:true,parent:actor,flags:{},system:{...content(),notes:"Nota preservada",originUuid:"origem"}};actor.items={contents:[item],get:id=>actor.items.contents.find(i=>i.id===id)};
 const targets=new Map([[actor.uuid,actor]]);globalThis.fromUuid=async uuid=>targets.get(uuid);
 const options={extra:0,elevate:0,condense:0,bonus:0,advantage:0,useExtra:true,allowOverload:false};
 const request=(id="requestA",change={},user=owner)=>{const chosen={...options,...change.options},parameters=techniqueParameters(actor.system,techniqueWithComponents(item),chosen),data={actorUuid:actor.uuid,itemId:item.id,itemUuid:item.uuid,baseline:activationState(actor,item),options:chosen,expectedPayment:cosmoPayment(actor.system,parameters.cost,chosen),targetUuid:null,rollMode:"publicroll",...change};const message=doc({id,author:user,whisper:[user.id,gm.id],flags:{[ID]:{techniqueRequest:data}}});messages.set(id,message);return message;};
 return{gm,owner,other,outsider,actor,item,stats,controls,updates,renders,notices,messages,targets,options,request,execute:async message=>{game.user=gm;await executeTechniqueRequest(message,message.author.id);}};
}
test("Controle publicado conserva duração e hash opaco de origem sem revelar roll no Actor",async()=>{
 for(const mode of ["publicroll","blindroll"]){const r=runtime();r.item.system.effectKind="control";r.item.system.classification="gold";
 const combat={uuid:"Combat.test",started:true,round:3,combatants:{contents:[{id:"hero",actor:r.actor}]}};game.combat=combat;game.combats={contents:[combat]};
 const m=r.request("control",{rollMode:mode});await r.execute(m);const attack=m.flags[ID].attack,operation=r.actor.flags[ID].techniqueOperations.control;
 assert.equal(attack.control.baseRounds,4);assert.equal(attack.control.start.round,3);assert.equal(attack.itemUuid,r.item.uuid);assert.equal(operation.controlAttackSignature,actionHash(attack));assert.equal(operation.card,undefined);assert.equal(operation.control,undefined);assert.equal(operation.rolls,undefined);assert.equal(operation.status,"paid");
 assert.equal(r.renders.at(-1).context.control.baseRounds,4);assert.equal(r.stats.payments,1);assert.equal(r.stats.rolls,1);
 }
});
test("mudar rodada de Controle durante rolagem invalida pagamento",async()=>{
 const r=runtime();r.item.system.effectKind="control";const combat={uuid:"Combat.test",started:true,round:1,combatants:{contents:[{id:"hero",actor:r.actor}]}};game.combat=combat;game.combats={contents:[combat]};const m=r.request();r.controls.beforeRoll=async()=>{combat.round=2;};await r.execute(m);assert.equal(r.stats.payments,0);assert.equal(m.flags[ID].techniqueResponse.status,"interrupted");
});
test("envio é privado e não rola/gasta no jogador; pendência e ausência de mestre bloqueiam",async()=>{
 const r=runtime(),baseline=activationState(r.actor,r.item),payment=cosmoPayment(r.actor.system,2,r.options);
 const m=await submitTechniqueActivation(r.actor,r.item,{baseline,options:r.options,payment,rollMode:"blindroll"});assert.deepEqual(m.whisper,["owner","gm"]);assert.equal(m.blind,true);assert.equal(r.stats.rolls,0);assert.equal(r.stats.payments,0);assert.equal(pendingTechnique(r.actor),true);
 await assert.rejects(()=>submitTechniqueActivation(r.actor,r.item,{baseline,options:r.options,payment,rollMode:"publicroll"}),/aguardando/);
 game.users.activeGM=null;await assert.rejects(()=>submitTechniqueActivation(r.actor,r.item,{baseline,options:r.options,payment,rollMode:"publicroll"}),/mestre ativo/);
});
test("dois clientes com a mesma ficha cobram uma vez; segunda solicitação fica desatualizada",async()=>{
 const r=runtime(),a=r.request("first"),b=r.request("second",{},r.other);game.user=r.gm;
 await Promise.all([enqueueTechniqueRequest(a,{},r.owner.id),enqueueTechniqueRequest(b,{},r.other.id)]);assert.equal(r.stats.rolls,1);assert.equal(r.stats.payments,1);assert.equal(r.stats.published,1);assert.equal(r.actor.system.resources.cosmo.value,8);assert.equal(b.flags[ID].techniqueResponse.status,"failed");assert.match(b.flags[ID].techniqueResponse.text,/mudou/);
 await enqueueTechniqueRequest(a,{},r.owner.id);assert.equal(r.stats.rolls,1);assert.equal(r.stats.payments,1);assert.equal(a.id,"first");assert.equal(a.flags[ID].techniqueRequest,undefined);assert.equal(a.flags[ID].techniquePrepared,undefined);
});
test("CE ilimitada também invalida solicitações concorrentes sem consumir recurso",async()=>{
 const r=runtime();r.actor.system.resources.cosmo.unlimited=true;const a=r.request("first"),b=r.request("second");game.user=r.gm;
 await Promise.all([enqueueTechniqueRequest(a,{},r.owner.id),enqueueTechniqueRequest(b,{},r.owner.id)]);assert.equal(r.stats.rolls,1);assert.equal(r.stats.payments,1);assert.equal(r.actor.system.resources.cosmo.value,10);assert.equal(r.actor.flags[ID].techniqueLast,"first");
 const next=r.request("next");await r.execute(next);assert.equal(r.stats.rolls,2);assert.equal(r.actor.system.resources.cosmo.value,10);
});
test("mesma solicitação recebida duas vezes mantém uma rolagem, pagamento e cartão",async()=>{
 const r=runtime(),m=r.request();game.user=r.gm;await Promise.all([enqueueTechniqueRequest(m,{},r.owner.id),enqueueTechniqueRequest(m,{},r.owner.id)]);assert.equal(r.stats.rolls,1);assert.equal(r.stats.payments,1);assert.equal(r.stats.published,1);assert.equal(r.messages.size,1);
});
test("propriedade, autoria e mestre responsável são verificados; pagamento forjado é recusado",async()=>{
 for(const kind of ["owner","author","gm","payment","uuid","options","item"]){const r=runtime(),m=r.request();game.user=r.gm;
  if(kind==="owner")r.actor.testUserPermission=()=>false;if(kind==="gm")game.user={id:"secondary",isGM:true};if(kind==="payment")m.flags[ID].techniqueRequest.expectedPayment.lifeDamage=99;if(kind==="uuid")m.flags[ID].techniqueRequest.actorUuid="Compendium.invalid";if(kind==="options")m.flags[ID].techniqueRequest.options.useExtra="true";if(kind==="item")r.actor.items.contents=[];
  await executeTechniqueRequest(m,kind==="author"?r.outsider.id:r.owner.id);assert.equal(r.stats.rolls,0,kind);assert.equal(r.stats.payments,0,kind);assert.equal(r.actor.system.resources.cosmo.value,10);
 }
});
test("reserva/CE extra e queima cumulativa preservam ficha e registram pagamento exato",async()=>{
 const r=runtime();r.actor.system.profile.level=7;r.actor.system.resources.cosmo.value=5;r.actor.system.resources.cosmoExtra=2;r.actor.system.resources.cosmoReserved=3;r.item.system.cost=6;
 const before=clone(r.item.system),first=r.request("first",{options:{...r.options,allowOverload:true}});await r.execute(first);const record=r.actor.flags[ID].techniqueOperations.first;
 assert.equal(record.payment.fromExtra,2);assert.equal(record.payment.fromCurrent,2);assert.equal(record.payment.overload,2);assert.equal(record.payment.lifeDamage,14);assert.equal(r.actor.system.resources.health.value,86);assert.equal(r.actor.system.resources.cosmo.value,3);assert.equal(r.actor.system.resources.cosmoReserved,3);assert.deepEqual(r.item.system,before);
 r.item.system.cost=1;const next=r.request("next",{options:{...r.options,allowOverload:true}});await r.execute(next);assert.equal(r.actor.system.resources.health.value,65);assert.equal(r.actor.system.resources.cosmoOverload,3);
});
test("modos público/privado/cego/self pertencem ao solicitante; journal do ator não contém dados da rolagem",async()=>{
 for(const mode of ["publicroll","gmroll","blindroll","selfroll"]){const r=runtime(),m=r.request("mode",{rollMode:mode});await r.execute(m);assert.equal(m.author.id,r.owner.id);assert.equal(m.blind,mode==="blindroll");assert.deepEqual(m.whisper,mode==="publicroll"?[]:mode==="selfroll"?[r.owner.id]:[r.gm.id]);
  assert.equal(m.rolls[0].total,r.renders.at(-1).context.total);assert.equal(m.flags[ID].techniqueRequest,undefined);assert.equal(m.flags[ID].techniquePrepared,undefined);const history=r.actor.flags[ID].techniqueOperations.mode;assert.equal(history.results,undefined);assert.equal(history.rolls,undefined);assert.equal(history.card,undefined);assert.equal(history.cardPublished,true);
 }
});
test("alteração de técnica, solicitação ou permissão durante a rolagem impede pagamento",async()=>{
 for(const kind of ["technique","request","permission"]){const r=runtime(),m=r.request();r.controls.beforeRoll=async()=>{if(kind==="technique")r.item.system.power++;if(kind==="request")m.flags[ID].techniqueRequest.options.bonus++;if(kind==="permission")r.actor.testUserPermission=()=>false;};await r.execute(m);assert.equal(r.stats.payments,0);assert.equal(r.actor.flags[ID].techniqueOperations[m.id].status,"prepared");assert.equal(m.flags[ID].techniqueResponse.status,"interrupted");}
});
test("dano e ativação compartilham fila; confirmação anterior não sobrescreve PV pagos",async()=>{
 const r=runtime();r.actor.system.resources.cosmo.value=0;const activation=r.request("activation",{options:{...r.options,allowOverload:true}});
 const source={id:"damageResult",author:r.owner,whisper:[],flags:{[ID]:{resolvedDamage:{actorUuid:r.actor.uuid,rootMessageId:"attack",body:10,armor:0,armorId:null}}}},damage={id:"damage",author:r.owner,flags:{[ID]:{damageRequest:{messageId:source.id,action:"apply",expected:{health:100,armor:null},override:null}}},async update(change){patch(this,change);}};r.messages.set(source.id,source);game.user=r.gm;
 await Promise.all([enqueueTechniqueRequest(activation,{},r.owner.id),enqueueDamageRequest(damage,{},r.owner.id)]);assert.equal(r.actor.system.resources.health.value,98);assert.equal(damage.flags[ID].damageResponse.ok,false);assert.match(damage.flags[ID].damageResponse.error,/mudaram/);
});
test("operação preparada bloqueia dano e evolução até revisão; retomada não rola nem cobra",async()=>{
 const r=runtime(),m=r.request();r.controls.beforeRoll=async()=>{throw Error("Interrupção simulada");};await r.execute(m);assert.equal(r.stats.rolls,1);await resumeTechniqueRequests();assert.equal(r.stats.rolls,1);assert.equal(r.stats.payments,0);
 const source={id:"result",author:r.owner,whisper:[],flags:{[ID]:{resolvedDamage:{actorUuid:r.actor.uuid,rootMessageId:"root",body:1,armor:0,armorId:null}}}},damage={id:"damage",author:r.owner,flags:{[ID]:{damageRequest:{messageId:"result",action:"apply",expected:{health:100,armor:null}}}},async update(change){patch(this,change);}};r.messages.set(source.id,source);await enqueueDamageRequest(damage,{},r.owner.id);assert.match(damage.flags[ID].damageResponse.error,/ativação.*interrompida/);await assert.rejects(()=>applyLevelOperation(r.actor,r.owner),/ativação.*interrompida/);
 await recoverTechniqueOperation(r.actor,m.id);assert.equal(r.actor.flags[ID].techniqueOperations[m.id].status,"failed");assert.equal(r.actor.system.resources.cosmo.value,10);assert.equal(pendingTechnique(r.actor),false);assert.equal(r.stats.rolls,1);
});
test("falha na publicação recupera o mesmo resultado, sem débito e sem alterar recursos posteriores",async()=>{
 const r=runtime(),m=r.request();r.controls.publishFail=true;await r.execute(m);assert.equal(r.actor.flags[ID].techniqueOperations[m.id].status,"paid");assert.equal(m.flags[ID].techniqueResponse.status,"paid");assert.equal(r.stats.payments,1);assert.equal(r.stats.published,0);
 r.actor.system.resources.health.value=77;r.controls.publishFail=false;await resumeTechniqueRequests();assert.equal(r.stats.rolls,1);assert.equal(r.stats.payments,1);assert.equal(r.stats.published,1);assert.equal(r.actor.system.resources.health.value,77);assert.equal(m.flags[ID].techniqueResponse.status,"published");
 await recoverTechniqueOperation(r.actor,m.id);assert.equal(r.stats.published,1);
});
test("resposta perdida depois da gravação reconhece pagamento; antes da gravação mantém rascunho recuperável",async()=>{
 for(const failure of ["before","after"]){const r=runtime(),m=r.request();r.controls.paymentFail=failure;await r.execute(m);assert.equal(r.actor.system.resources.cosmo.value,failure==="after"?8:10);assert.equal(r.actor.flags[ID].techniqueOperations[m.id].status,failure==="after"?"paid":"prepared");r.controls.paymentFail=null;await recoverTechniqueOperation(r.actor,m.id);assert.equal(r.stats.rolls,1);assert.equal(r.stats.payments,failure==="after"?1:0);assert.equal(r.actor.flags[ID].techniqueOperations[m.id].status,failure==="after"?"paid":"failed");}
});
test("recuperação reconhece estado posterior completo e publica sem repetir pagamento",async()=>{
 const r=runtime(),m=r.request();r.controls.paymentFail="before";await r.execute(m);const record=r.actor.flags[ID].techniqueOperations[m.id],after=record.after;
 r.actor.system.resources.cosmo.value=after.current;r.actor.system.combat.asterismPenalty=after.penalty;r.actor.flags[ID].techniqueLast=after.last;r.controls.paymentFail=null;await recoverTechniqueOperation(r.actor,m.id);assert.equal(r.actor.flags[ID].techniqueOperations[m.id].status,"paid");assert.equal(r.stats.payments,0);assert.equal(r.stats.published,1);assert.equal(r.stats.rolls,1);
});
test("valores diferentes não são restaurados; encerrar sem notas preserva recursos",async()=>{
 const r=runtime(),m=r.request();r.controls.paymentFail="before";await r.execute(m);r.actor.system.resources.health.value=80;const before=paymentSnapshot(r.actor);
 await assert.rejects(()=>recoverTechniqueOperation(r.actor,m.id),/Recursos diferentes/);assert.deepEqual(paymentSnapshot(r.actor),before);
 foundry.applications.api.DialogV2.wait=async()=>({reason:""});await reviewTechniqueOperation(r.actor,m.id);assert.deepEqual(paymentSnapshot(r.actor),before);assert.equal(r.actor.flags[ID].techniqueOperations[m.id].status,"reviewed");assert.equal(pendingTechnique(r.actor),false);assert.equal(r.stats.payments,0);
});
test("cartão preparado adulterado não publica; dados iniciais forjados não substituem resultado do mestre",async()=>{
 const r=runtime(),m=r.request();m.flags[ID].techniquePrepared={card:{content:"forjado",rolls:[{total:999}]}};await r.execute(m);assert.equal(m.flags[ID].techniqueResponse.status,"published");assert.notEqual(m.rolls[0].total,999);assert.equal(r.stats.payments,1);
 const b=runtime(),n=b.request();b.controls.publishFail=true;await b.execute(n);n.flags[ID].techniquePrepared.card.content="adulterado";b.controls.publishFail=false;await assert.rejects(()=>recoverTechniqueOperation(b.actor,n.id),/ausente\/alterado/);assert.equal(b.stats.published,0);assert.equal(b.stats.payments,1);
});
test("troca de mestre interrompe antes de pagar; novo mestre confere sem repetir rolagem",async()=>{
 const r=runtime(),m=r.request(),next={id:"nextgm",isGM:true,active:true};r.controls.beforeRoll=async()=>{game.users.activeGM=next;};await r.execute(m);assert.equal(r.stats.payments,0);assert.equal(r.actor.flags[ID].techniqueOperations[m.id].status,"prepared");game.user=next;await resumeTechniqueRequests();assert.equal(r.stats.rolls,1);await recoverTechniqueOperation(r.actor,m.id);assert.equal(r.stats.payments,0);assert.equal(r.actor.flags[ID].techniqueOperations[m.id].status,"failed");
});
test("recuperar ficha duplicada não altera cartão/registro da original",async()=>{
 const r=runtime(),m=r.request();r.controls.beforeRoll=async()=>{throw Error("Interrompida");};await r.execute(m);const copy={...r.actor,uuid:"Actor.copy",flags:clone(r.actor.flags),system:clone(r.actor.system)};
 await assert.rejects(()=>recoverTechniqueOperation(copy,m.id),/outra cópia/);
 foundry.applications.api.DialogV2.wait=async()=>({reviewed:true,reason:"Conferi recursos da ficha duplicada"});await reviewTechniqueOperation(copy,m.id);assert.equal(copy.flags[ID].techniqueOperations[m.id].status,"reviewed");assert.equal(r.actor.flags[ID].techniqueOperations[m.id].status,"prepared");assert.ok(m.flags[ID].techniqueRequest);assert.equal(r.stats.payments,0);
});
test("alvo é resolvido no mestre; token sintético mantém identidade própria",async()=>{
 const r=runtime();r.actor.uuid="Scene.scene.Token.token.Actor.hero";r.item.uuid=`${r.actor.uuid}.Item.tech`;r.targets.set(r.actor.uuid,r.actor);const target={uuid:"Actor.defender",name:"Defensor",type:"knight"};r.targets.set(target.uuid,target);const m=r.request("synthetic",{targetUuid:target.uuid});await r.execute(m);assert.equal(m.flags[ID].attack.attackerUuid,r.actor.uuid);assert.equal(m.flags[ID].attack.targetUuid,target.uuid);
 const b=runtime(),n=b.request("missing",{targetUuid:"Actor.missing"});await b.execute(n);assert.equal(b.stats.rolls,0);assert.equal(b.stats.payments,0);
 const c=runtime(),target2={uuid:"Actor.defender",type:"knight"};c.targets.set(target2.uuid,target2);const disappeared=c.request("gone",{targetUuid:target2.uuid});c.controls.beforeRoll=async()=>c.targets.delete(target2.uuid);await c.execute(disappeared);assert.equal(c.stats.payments,0);assert.equal(disappeared.flags[ID].techniqueResponse.status,"interrupted");
});

function enableComponents(r){r.item.flags[ID]={componentAutomation:true,techniqueConstructionId:"saved",techniqueConstructionHistory:{saved:{primary:{label:"Dano",uuid:"Compendium.gods-battle-ss.componentes-tecnicas.Item.13841831d802c5be"},components:Object.entries(COMPONENT_RULES).map(([id,rule])=>({uuid:`Compendium.${ID}.componentes-tecnicas.Item.${id}`,key:rule.key,type:rule.kind==="space"?"increment":"bigbang",rank:rule.kind==="space"?2:1,name:rule.label,page:rule.page,detail:rule.kind==="terrain"?"Campo de gelo":""}))}}};}
test("componentes calculados pelo GM pagam custo variável e preservam valores base/cópia",async()=>{const r=runtime();enableComponents(r);r.actor.system.resources.cosmo.value=20;const target={uuid:"Actor.target",type:"knight",name:"Defensor"};r.targets.set(target.uuid,target);const before=clone(r.item.system),m=r.request("components",{targetUuid:target.uuid,options:{...r.options,exhaust:2,oppositeEssence:true,favorableTerrain:true,componentReason:"Essência contrária e gelo conferidos"}});await r.execute(m);assert.equal(r.actor.system.resources.cosmo.value,14);assert.equal(m.flags[ID].technique.components.levelBonus,4);assert.equal(m.flags[ID].technique.damageLevel,6);assert.equal(m.flags[ID].technique.components.range,6);assert.deepEqual(r.item.system,before);assert.equal(r.actor.flags[ID].techniqueOperations.components.componentReason,"Essência contrária e gelo conferidos");assert.equal(r.stats.payments,1);});
test("componente contextual exige alvo e regra; notas são opcionais",async()=>{for(const kind of ["target","missing"]){const r=runtime();if(kind!=="missing")enableComponents(r);const m=r.request("context",{options:{...r.options,oppositeEssence:kind!=="missing",componentReason:"Conferido"}});if(kind==="missing")m.flags[ID].techniqueRequest.options.oppositeEssence=true;if(kind==="reason")m.flags[ID].techniqueRequest.options.componentReason="";await r.execute(m);assert.equal(r.stats.rolls,0,kind);assert.equal(r.stats.payments,0,kind);assert.equal(r.actor.system.resources.cosmo.value,10);}});
test("composição alterada durante rolagem impede pagar novo dano/custo",async()=>{const r=runtime();enableComponents(r);const m=r.request("changed",{options:{...r.options,exhaust:1}});r.controls.beforeRoll=async()=>{r.item.flags[ID].techniqueConstructionHistory.saved.components.at(-1).rank=3;};await r.execute(m);assert.equal(r.stats.rolls,1);assert.equal(r.stats.payments,0);assert.equal(m.flags[ID].techniqueResponse.status,"interrupted");await recoverTechniqueOperation(r.actor,m.id);assert.equal(r.stats.payments,0);});
test("falha de cartão de componentes recupera mesmo resultado sem nova queima",async()=>{const r=runtime();enableComponents(r);const m=r.request("recover",{options:{...r.options,exhaust:2}});r.controls.publishFail=true;await r.execute(m);assert.equal(r.actor.system.resources.cosmo.value,4);r.controls.publishFail=false;await recoverTechniqueOperation(r.actor,m.id);assert.equal(r.stats.rolls,1);assert.equal(r.stats.payments,1);assert.equal(m.flags[ID].technique.components.extraCost,4);});
test("mestre calcula condições no Asterismo sem duplicar pagamento ou mudar dano base",async()=>{
 const r=runtime();r.actor.flags[ID]={conditionEffects:{fatigue:{actorUuid:r.actor.uuid,status:"active",key:"tired",count:1,ruleVersion:1,reviewedManual:true},limb:{actorUuid:r.actor.uuid,status:"active",key:"incapacitated",count:1,ruleVersion:1,reviewedManual:true}}};prepareKnight(r.actor.system,r.actor.items.contents,"rank",{actorUuid:r.actor.uuid,flags:r.actor.flags});const p=techniqueParameters(r.actor.system,r.item.system);const m=r.request();await r.execute(m);assert.equal(r.renders[0].context.modifier,p.modifier);assert.equal(p.dice,1);assert.match(r.renders[0].context.conditionSummary,/Condições/);assert.equal(r.stats.payments,1);assert.equal(r.actor.system.resources.cosmo.value,8);
});
test("registro de condição alterado durante Asterismo bloqueia pagamento",async()=>{
 const r=runtime(),m=r.request();r.controls.beforeRoll=()=>{r.actor.flags[ID]??={};r.actor.flags[ID].conditionEffects={fatigue:{actorUuid:r.actor.uuid,status:"active",key:"tired",count:2,ruleVersion:1,reviewedManual:true}};};await r.execute(m);assert.equal(r.stats.payments,0);assert.equal(r.actor.system.resources.cosmo.value,10);assert.equal(m.flags[ID].techniqueResponse.status,"interrupted");
});
