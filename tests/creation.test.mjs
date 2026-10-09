import test from 'node:test';
import assert from 'node:assert/strict';
import {knight,content} from './foundry-stub.mjs';
import {prepareKnight} from '../module/rules.mjs';
import {initialStyleChanges,creationReview,INITIAL_STYLES} from '../module/creation-rules.mjs';
import {finishCreation,importCreationItem} from '../module/creation.mjs';
import {migrateKnightSource} from '../module/migrations.mjs';
function patch(obj,data){for(const [path,value]of Object.entries(data)){const parts=path.split('.');let target=obj;for(const key of parts.slice(0,-1))target=target[key]??={};target[parts.at(-1)]=structuredClone(value);}}
function fixture(){
 const s=knight();s.automation.enabled=true;s.creationGuide.status='draft';s.creationGuide.styleApplied='saint';s.creationGuide.extraSkill='asterism';s.creationGuide.initializeResources=true;
 for(const [key,value]of Object.entries({for:4,vig:3,vel:2,cos:2,sen:3}))s.attributes[key].value=value;
 for(const [key,value]of Object.entries({combat:3,sports:4,leadership:1,perception:2,training:3,cosmoUse:1,asterism:1}))s.skills[key].value=value;
 const items=[{id:'a',type:'armor',system:{...content(),equipped:true}},
 {id:'v1',name:'Virtude Geral',type:'virtue',system:{...content(),category:'Geral'}},
 {id:'v2',name:'Virtude de Combate',type:'virtue',system:{...content(),category:'Combate'}},
 {id:'t',name:'Técnica configurada',type:'technique',system:content()},
 {id:'h',name:'Velocidade',type:'ability',system:content(),flags:{'gods-battle-ss':{source:{key:'saint:ability:1:VELOCIDADE'}}}}];
 const actor={name:'Cavaleiro',isOwner:true,system:s,items:{contents:items},async update(data){patch(this,data);prepareKnight(s,items);}};
 prepareKnight(s,items);return actor;
}
test('criação separa oito pontos do estilo e calcula orçamento de perícias',()=>{
 const a=fixture(),r=creationReview(a.system,a.items.contents,a.name);assert.equal(r.trainingSpent,8);assert.equal(r.skillBudget,15);assert.equal(r.skillSpent,15);assert.deepEqual(r.warnings,[]);assert.equal(r.canFinish,true);
});
test('defaults novos abrem rascunho; migração e duplicação conservam edição normal',()=>{
 const fresh=knight();assert.equal(fresh.automation.enabled,true);assert.equal(fresh.creationGuide.status,'draft');
 const old={schemaVersion:2,automation:{enabled:false},resources:{health:{value:-3}}};migrateKnightSource(old);assert.equal(old.creationGuide.status,'');assert.equal(old.automation.enabled,false);assert.equal(old.resources.health.value,-3);
 const copy=structuredClone(old);migrateKnightSource(copy);assert.deepEqual(copy,old);const empty={};migrateKnightSource(empty);assert.deepEqual(empty,{});
});
test('benefícios iniciais de todos os estilos aplicam uma vez e não sobrescrevem luta existente',()=>{
 for(const style of Object.keys(INITIAL_STYLES)){const s=knight();s.profile.style=style;const updates=initialStyleChanges(s);patch({system:s},updates);assert.deepEqual(initialStyleChanges(s),{});}
 const s=knight();s.fighting.punch=4;const updates=initialStyleChanges(s);assert.equal(Object.keys(updates).some(k=>k.startsWith('system.fighting.')),false);
});
test('orçamento e perícia fora do padrão são informações sem aceite obrigatório',()=>{
 const a=fixture();a.system.attributes.for.value=6;a.system.skills.mythology.value=5;prepareKnight(a.system,a.items.contents);
 let r=creationReview(a.system,a.items.contents,a.name);assert.equal(r.canFinish,true);assert.ok(r.warnings.some(w=>w.includes('supera')));
 a.system.creationGuide.acceptExceptions=true;assert.equal(creationReview(a.system,a.items.contents,a.name).canFinish,true);
 a.system.creationGuide.exceptionReason='Personagem aprovado para campanha especial';assert.equal(creationReview(a.system,a.items.contents,a.name).canFinish,true);
});
test('retomar não aplica estilo e confirmar registro não soma atributos',()=>{
 const s=knight();const before=structuredClone(s.attributes);const updates=initialStyleChanges(s,{recordOnly:true});patch({system:s},updates);assert.deepEqual(s.attributes,before);assert.deepEqual(initialStyleChanges(s),{});
 s.profile.style='sage';assert.throws(()=>initialStyleChanges(s),/estilo/i);
});
test('finalizar é idempotente, não importa itens e preserva recursos se escolhido',async()=>{
 const a=fixture();a.system.creationGuide.initializeResources=false;a.system.resources.health.value=7.5;a.system.resources.cosmo.value=0;
 foundry.applications.api.DialogV2={confirm:async()=>true};globalThis.ui={notifications:{info:()=>{},warn:()=>{}}};game.user={id:'p'};
 const count=a.items.contents.length;await finishCreation(a);await finishCreation(a);assert.equal(a.system.creationGuide.status,'complete');assert.equal(a.system.resources.health.value,7.5);assert.equal(a.system.resources.cosmo.value,0);assert.equal(a.items.contents.length,count);
 assert.ok(a.flags['gods-battle-ss'].creationReview.time);
});
test('cancelar conclusão mantém rascunho e recursos',async()=>{
 const a=fixture();foundry.applications.api.DialogV2={confirm:async()=>false};const before=structuredClone(a.system.resources);await finishCreation(a);assert.equal(a.system.creationGuide.status,'draft');assert.deepEqual(a.system.resources,before);
});
test('importação preserva cópia editada e origem, sem repetir concessão',async()=>{
 const a=fixture(),doc={uuid:'Compendium.gods-battle-ss.virtudes.Item.abc',type:'virtue',toObject:()=>({_id:'abc',name:'Escolha',type:'virtue',system:content()})};let creations=0;
 a.createEmbeddedDocuments=async(_type,data)=>{creations++;const item={...data[0],id:'new',sheet:{render:()=>{}}};a.items.contents.push(item);return[item];};
 const first=await importCreationItem(a,doc,'virtue1');first.system.notes='Edição local';const again=await importCreationItem(a,doc,'virtue1');assert.equal(first,again);assert.equal(creations,1);assert.equal(again.system.notes,'Edição local');assert.equal(again.system.originUuid,doc.uuid);assert.equal(Object.hasOwn(first,'_id'),false);
});
