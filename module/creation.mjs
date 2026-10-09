import {SYSTEM_ID} from "./config.mjs";
import {initialStyleChanges,creationReview} from "./creation-rules.mjs";
const busy=new WeakSet();
const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function beginCreation(actor) {
 if(!actor.isOwner || actor.system.profile.level!==1)return ui.notifications.warn('Assistente disponível para cavaleiros de nível 1.');
 if(actor.system.creationGuide.status==='complete')return ui.notifications.info('Criação já concluída. Continue pela edição normal da ficha.');
 await actor.update({'system.creationGuide.status':'draft'});
}
export async function importCreationItem(actor,document,slot) {
 if(!actor.isOwner || actor.system.creationGuide.status!=='draft' || !['virtue','ability','armor','technique'].includes(document.type))return;
 if(!/^(virtue1|virtue2|ability|armor|technique)$/.test(slot))throw Error('Escolha inicial inválida.');
 const old=actor.items.contents.find(i=>i.system.originUuid===document.uuid);
 if(old)return old; // Não reimporta nem substitui cópias editadas.
 const occupied=actor.items.contents.find(i=>i.flags?.[SYSTEM_ID]?.creationSlot===slot);
 if(occupied) {occupied.sheet.render(true);ui.notifications.warn('Esta escolha já foi importada. Remova a cópia para escolher outra.');return occupied;}
 const data=document.toObject();delete data._id;
 data.system.originUuid=document.uuid;data.system.equipped=false;data.system.acquisitionLevel=1;
 data.flags??={};data.flags[SYSTEM_ID]??={};data.flags[SYSTEM_ID].creationSlot=slot;
 const [item]=await actor.createEmbeddedDocuments('Item',[data]);item.sheet.render(true);return item;
}
export async function chooseCreationItem(actor,slot) {
 if(!actor.isOwner || busy.has(actor))return;
 const type=slot.startsWith('virtue')?'virtue':slot;
 const packName={virtue:'virtudes',ability:'habilidades',technique:'tecnicas'}[type];
 if(type==='armor') {
  const existing=actor.items.contents.find(i=>i.type==='armor');if(existing){existing.sheet.render(true);return;}
  const answer=await foundry.applications.api.DialogV2.confirm({window:{title:'Armadura inicial'},content:'<p>Criar um modelo de Bronze com 30 PV, PA 3 e +3 CE? Abra a cópia para definir constelação e detalhes antes de equipar.</p>'});
  if(answer){const [item]=await actor.createEmbeddedDocuments('Item',[{name:'Armadura de Bronze — personalizar',type:'armor',system:{class:'bronze',page:'149',health:{value:30}},flags:{[SYSTEM_ID]:{creationSlot:'armor'}}}]);item.sheet.render(true);}return;
 }
 const pack=game.packs.get(`${SYSTEM_ID}.${packName}`);
 if(!pack?.testUserPermission(game.user,'OBSERVER'))return ui.notifications.warn('O mestre precisa permitir acesso ao compêndio.');
 busy.add(actor);
 try {
  const index=await pack.getIndex({fields:['system.category','system.level','flags.gods-battle-ss.source.key']});
  const entries=index.contents.filter(e=>type!=='ability'||e.flags?.[SYSTEM_ID]?.source?.key?.startsWith(`${actor.system.profile.style}:ability:1:`)).toSorted((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  const options=entries.map(e=>`<option value="${e._id}">${escape(e.name)} · ${escape(e.system?.category??'')}</option>`).join('');
  const id=await foundry.applications.api.DialogV2.wait({window:{title:'Escolher conteúdo inicial'},content:`<label>Entrada do compêndio<select name="entry">${options}</select></label><p>Requisitos e escolhas serão conferidos na cópia; você também pode arrastar do compêndio para a ficha.</p>`,buttons:[{action:'choose',label:'Escolher',default:true,callback:(_e,b)=>b.form.elements.entry.value},{action:'cancel',label:'Cancelar',callback:()=>null}],rejectClose:false});
  if(!id || !entries.some(e=>e._id===id))return;
  const document=await pack.getDocument(id);await importCreationItem(actor,document,slot);
 } finally {busy.delete(actor);}
}
export async function applyInitialStyle(actor) {
 if(!actor.isOwner || busy.has(actor) || actor.system.creationGuide.status!=='draft')return;
 busy.add(actor);
 try {
  const choice=await foundry.applications.api.DialogV2.wait({window:{title:'Benefícios iniciais do estilo'},content:'<p>Aplicar +1 ao atributo-chave e a luta inicial se todos os campos de luta estiverem zerados? Se você já lançou esses benefícios, confirme o registro sem somar novamente.</p>',buttons:[{action:'apply',label:'Aplicar à ficha',callback:()=> 'apply'},{action:'record',label:'Já registrei os benefícios',callback:()=> 'record'},{action:'cancel',label:'Cancelar',callback:()=>null}],rejectClose:false});
  if(!choice)return;
  const updates=initialStyleChanges(actor.system,{recordOnly:choice==='record'});if(Object.keys(updates).length)await actor.update(updates);
 } finally {busy.delete(actor);}
}
export async function finishCreation(actor) {
 if(!actor.isOwner || busy.has(actor) || actor.system.creationGuide.status!=='draft')return;
 busy.add(actor);
 try {
  const review=creationReview(actor.system,actor.items.contents,actor.name);
  if(!review.canFinish)return ui.notifications.warn('Não foi possível concluir a criação.');
  if(!await foundry.applications.api.DialogV2.confirm({window:{title:'Concluir criação'},content:`<p>Concluir criação? ${review.warnings.length} pendência(s) na ficha.</p><p>${actor.system.creationGuide.initializeResources?'PV e CE atuais serão preenchidos até seus máximos.':'Os recursos atuais serão preservados.'} Nenhum item será reimportado.</p>`}))return;
  const current=creationReview(actor.system,actor.items.contents,actor.name);if(!current.canFinish)throw Error('A ficha mudou durante a revisão. Confira novamente.');
  const updates={'system.creationGuide.status':'complete',[`flags.${SYSTEM_ID}.creationReview`]:{time:Date.now(),userId:game.user.id,warnings:current.warnings,reason:actor.system.creationGuide.exceptionReason}};
  if(actor.system.creationGuide.initializeResources)Object.assign(updates,{'system.resources.health.value':actor.system.resources.health.max,'system.resources.cosmo.value':actor.system.resources.cosmo.max});
  await actor.update(updates);ui.notifications.info('Criação concluída. Os benefícios e itens não serão concedidos novamente.');
 } finally {busy.delete(actor);}
}
