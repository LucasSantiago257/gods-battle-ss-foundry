const normalize=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
export function componentPickerRows(entries,query="",type="all") {
 const words=normalize(query).trim().split(/\s+/).filter(Boolean);
 return entries.filter(entry=>(type==="all"||entry.type===type)&&words.every(word=>normalize(`${entry.name} ${entry.system?.page??""}`).includes(word)));
}
export function installComponentPicker(form,entries) {
 if(!form)return;
 const search=form.elements.componentSearch,type=form.elements.componentType,select=form.elements.component;
 const title=form.querySelector('[data-component-title]'),description=form.querySelector('[data-component-description]'),requirements=form.querySelector('[data-component-requirements]'),count=form.querySelector('[data-component-count]');
 const support=form.querySelector("[data-component-support]"),supportDetail=form.querySelector("[data-component-support-detail]");
 const preview=()=>{
  const entry=entries.find(row=>row._id===select.value);
  title.textContent=entry?`${entry.name} · p.${entry.system?.page??""}`:"Nenhum componente encontrado";
  if(support)support.textContent=entry?.support?.label??"";
  if(supportDetail)supportDetail.textContent=entry?.support?.detail??"";
  description.textContent=entry?.system?.description??"";
  requirements.textContent=entry?.system?.requirements?`Requisitos: ${entry.system.requirements}`:"";
 };
 const update=()=>{
  const previous=select.value,rows=componentPickerRows(entries,search.value,type.value);
  select.replaceChildren(...rows.map(row=>{const option=form.ownerDocument.createElement("option");option.value=row._id;option.textContent=`${row.name} · p.${row.system?.page??""}`;return option;}));
  select.value=rows.some(row=>row._id===previous)?previous:rows[0]?._id??"";select.disabled=!rows.length;
  const button=form.querySelector('[data-action="add"]');if(button)button.disabled=!rows.length;
  count.textContent=`${rows.length} componente(s) disponível(is)`;preview();
 };
 search.addEventListener("input",update);type.addEventListener("change",update);select.addEventListener("change",preview);update();return update;
}
