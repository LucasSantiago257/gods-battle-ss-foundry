
import test from "node:test";
import assert from "node:assert/strict";
import {BRASAS} from "../module/effect-rules.mjs";
import {componentUuid} from "../module/technique-builder-rules.mjs";
import {brasasRecordMath,brasasSnapshot,brasasState,brasasParcelPlan,brasasUndoPlan,brasasEndPlan} from "../module/brasas-rules.mjs";
const ID="gods-battle-ss";
function fixture({uuid="Actor.target",classification="silver",rounds=2}={}){
 const record={id:"fire",actorUuid:uuid,kind:"brasas",label:"Brasas",status:"active",combatUuid:"Combat.example",combatantId:"member",firstRound:3,lastRound:2+rounds,damage:BRASAS.damage[classification],source:{actorUuid:"Actor.hidden",itemUuid:"Actor.hidden.Item.heat",componentUuid:componentUuid(BRASAS.id),classification,damage:BRASAS.damage[classification],constructionId:"construction",name:"Nome privado"},ticks:{},reason:"Notas antigas"};
 const actor={type:"knight",uuid,name:"Alvo",system:{resources:{health:{value:100,max:200},cosmo:{value:9},cosmoExtra:2},conditions:{afraid:true}},flags:{[ID]:{persistentEffects:{fire:record}}}};
 const combat={uuid:"Combat.example",round:3,turn:0,started:true,combatants:{contents:[{id:"member",actor}]}};
 globalThis.game={combat,combats:{contents:[combat]}};globalThis.fromUuid=()=>{throw Error("Não consultar atacante");};
 return {actor,record,combat};
}
function commit(f,p){
 f.actor.system.resources.health.value=p.after.health;
 if(p.action==="apply")f.record.ticks[`round${p.tick.round}`]=structuredClone(p.tick);
 if(p.action==="undo")delete f.record.ticks[`round${p.round}`];
 f.record.status=p.after.record.status;f.record.brasasLastOperation=structuredClone(p.after.record.lastOperation);
 return {...structuredClone(p),status:"applied"};
}
const parcel=(f,id="apply1",options={})=>brasasParcelPlan(f.actor,"fire",{operationId:id,...options});
test("classe capturada e cálculo publicado sem leitura do atacante",()=>{
 for(const [classification,damage] of Object.entries(BRASAS.damage)){const f=fixture({classification}),before=structuredClone(f.actor),p=parcel(f);assert.equal(p.tick.damage,damage);assert.equal(p.after.health,100-damage);assert.equal(p.context.round,3);assert.deepEqual(f.actor,before);assert.equal(JSON.stringify(p).includes("Nome privado"),false);}
});
test("ajuste fracionário, zero e dispensa não afetam recursos alheios",()=>{
 const f=fixture();for(const damage of [0,2.5,16]){const p=parcel(f,"apply1",{damage});assert.equal(p.tick.damage,damage);assert.equal(p.after.health,100-damage);}
 const p=parcel(f,"skip1",{skip:true});assert.equal(p.tick.status,"skipped");assert.equal(p.after.health,100);assert.equal(f.actor.system.resources.cosmo.value,9);assert.equal(f.actor.system.conditions.afraid,true);
});
test("prazo e sequência não aplicam por avanço ou retorno da rodada",()=>{
 const f=fixture();f.combat.round=2;assert.throws(()=>parcel(f),/próxima/);f.combat.round=8;const p=parcel(f);assert.equal(p.tick.round,3);assert.equal(f.actor.system.resources.health.value,100);commit(f,p);const q=parcel(f,"apply2");assert.equal(q.tick.round,4);assert.equal(q.after.record.status,"expired");commit(f,q);assert.throws(()=>parcel(f,"apply3"),/concluída/);f.combat.round=1;assert.equal(f.actor.system.resources.health.value,80);
});
test("próprio, vinculado e sintético conservam identidade; cópia é recusada",()=>{
 for(const uuid of ["Actor.target","Scene.scene.Token.token.Actor.target"]){const f=fixture({uuid}),p=parcel(f);assert.equal(p.before.record.actorUuid,uuid);f.record.actorUuid="Actor.other";assert.throws(()=>parcel(f),/outra ficha/);}
});
test("assinatura ignora nomes/notas e CE, mas prende PV/perfil/prazo",()=>{
 const f=fixture(),state=brasasState(f.actor,"fire");f.actor.name="Novo";f.record.reason="Nota tardia";f.record.label="Revisado";f.record.source.name="Oculto";f.actor.system.resources.cosmo.value=2;f.actor.system.resources.health.max=500;
 assert.equal(brasasState(f.actor,"fire"),state);f.actor.system.resources.health.value=99;assert.notEqual(brasasState(f.actor,"fire"),state);f.actor.system.resources.health.value=100;f.record.lastRound=8;assert.notEqual(brasasState(f.actor,"fire"),state);
});
test("perfil canônico e registros adulterados são recusados",()=>{
 for(const change of [f=>f.record.kind="manual",f=>f.record.id="other",f=>f.record.source.classification="divine",f=>f.record.source.componentUuid="fake",f=>f.record.damage=100,f=>f.record.source.damage=100,f=>f.record.source.itemUuid="Actor.other.Item.heat",f=>f.record.ticks=[],f=>f.record.source.constructionId={name:"Oculto"},f=>f.record.brasasLastOperation={id:"bad",action:"apply"}]){const f=fixture();change(f);assert.throws(()=>parcel(f));}
});
test("valores inválidos falham antes de produzir perda",()=>{
 for(const options of [{damage:-1},{damage:NaN},{damage:Infinity},{damage:1000001},{damage:"5"},{skip:1},{reason:7},{reason:"x".repeat(2001)},{operationId:"../bad"}]){const f=fixture();assert.throws(()=>parcel(f,"apply1",options));assert.equal(f.actor.system.resources.health.value,100);}
 const f=fixture();f.actor.system.resources.health.value=Infinity;assert.throws(()=>parcel(f));
});
test("vez não altera parcela; combatente substituído bloqueia",()=>{
 const f=fixture(),p=parcel(f);f.combat.turn=9;assert.deepEqual(parcel(f),p);f.combat.combatants.contents[0].id="replacement";assert.throws(()=>parcel(f),/substituído/);
});
test("parcelas legadas não reaplicam nem recebem Undo retroativo",()=>{
 const f=fixture();f.record.ticks.round3={round:3,status:"applied",baseDamage:10,damage:6,before:100,after:94,reason:"Antigo",operationId:"oldGM"};f.actor.system.resources.health.value=94;f.combat.round=4;
 assert.equal(parcel(f).tick.round,4);assert.equal(brasasRecordMath(f.actor,"fire").lastOperation,null);assert.throws(()=>brasasUndoPlan(f.actor,"fire",{status:"applied",operationId:"oldGM"},{operationId:"undo1"}));
});
test("lacunas, chaves fora do prazo e matemática adulterada são recusadas",()=>{
 for(const change of [f=>f.record.ticks.round4={round:4,status:"skipped",baseDamage:10,damage:0,before:100,after:100},f=>f.record.ticks.extra={},f=>f.record.ticks.round3={round:3,status:"applied",baseDamage:10,damage:10,before:100,after:95},f=>f.record.status="expired"]){const f=fixture();change(f);assert.throws(()=>brasasSnapshot(f.actor,"fire"));}
});
test("Undo da última parcela intacta reabre prazo sem refund alheio ou repetição",()=>{
 const f=fixture({rounds:1}),receipt=commit(f,parcel(f));f.record.ticks.round3.reason="Nota posterior";f.actor.system.resources.cosmo.value=1;const undo=brasasUndoPlan(f.actor,"fire",receipt,{operationId:"undo1",reason:""});assert.equal(undo.after.health,100);assert.equal(undo.after.record.status,"active");commit(f,undo);assert.equal(Object.keys(f.record.ticks).length,0);assert.equal(f.actor.system.resources.cosmo.value,1);assert.equal(f.record.reason,"Notas antigas");assert.throws(()=>brasasUndoPlan(f.actor,"fire",receipt,{operationId:"undo2"}),/última parcela/);
});
test("Undo recusa PV/perfil divergentes ou outra intenção posterior",()=>{
 for(const change of [f=>f.actor.system.resources.health.value--,f=>f.record.lastRound++,f=>f.record.brasasLastOperation={id:"later",action:"undo"},f=>f.record.ticks.round3.damage=5]){const f=fixture(),receipt=commit(f,parcel(f));change(f);assert.throws(()=>brasasUndoPlan(f.actor,"fire",receipt,{operationId:"undo1"}));}
 const f=fixture(),first=commit(f,parcel(f));f.combat.round=4;commit(f,parcel(f,"apply2"));assert.throws(()=>brasasUndoPlan(f.actor,"fire",first,{operationId:"undo1"}),/última parcela/);
});
test("recibo alterado, outro alvo ou ID reutilizada não permitem inversão",()=>{
 for(const change of [r=>r.before.health=1000,r=>r.after.record.damage=15,r=>r.tick.damage=100,r=>r.before.record.actorUuid="Actor.other",r=>r.status="prepared",r=>r.action="undo"]){const f=fixture(),receipt=commit(f,parcel(f));change(receipt);assert.throws(()=>brasasUndoPlan(f.actor,"fire",receipt,{operationId:"undo1"}));}
 const f=fixture(),receipt=commit(f,parcel(f));assert.throws(()=>brasasUndoPlan(f.actor,"fire",receipt,{operationId:"apply1"}));
});
test("encerrar e Undo intacto sobrevivem a fonte/encontro removidos",()=>{
 const f=fixture(),receipt=commit(f,parcel(f));game.combats.contents=[];delete game.combat;assert.equal(brasasUndoPlan(f.actor,"fire",receipt,{operationId:"undo1"}).after.health,100);const end=brasasEndPlan(f.actor,"fire",{operationId:"end1",reason:""});assert.equal(end.after.health,90);commit(f,end);assert.throws(()=>brasasEndPlan(f.actor,"fire",{operationId:"end2"}),/encerradas/);
});
test("planos não compartilham objetos mutáveis com ficha",()=>{
 const f=fixture(),p=parcel(f);p.before.record.source.classification="gold";p.after.record.ticks[0].damage=100;assert.equal(f.record.source.classification,"silver");assert.equal(Object.keys(f.record.ticks).length,0);assert.equal(f.actor.system.resources.health.value,100);
});
