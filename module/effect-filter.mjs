// Sheet-local view preferences. No document update or effect operation is performed here.
const normalize=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
const scopes=new Set(["all","active","pending","history"]);
export function installEffectFilter(element,state={}) {
 const panel=element.querySelector("[data-effect-panel]");if(!panel)return;
 const input=panel.querySelector("[data-effect-query]"),scope=panel.querySelector("[data-effect-scope]"),clear=panel.querySelector("[data-effect-clear]"),count=panel.querySelector("[data-effect-count]");
 if(!input||!scope||!clear||!count)return;
 input.disabled=false;scope.disabled=false;
 input.value=typeof state.query==="string"?state.query:"";scope.value=scopes.has(state.scope)?state.scope:"all";
 const rows=[...panel.querySelectorAll("[data-effect-record]")],history=panel.querySelector(".effect-history");
 const apply=()=>{
  state.query=input.value;state.scope=scope.value;
  const words=normalize(input.value).trim().split(/\s+/).filter(Boolean);let shown=0,historical=0;
  for(const row of rows){
   const group=row.closest(".effect-history")?"history":"active";
   const inScope=scope.value==="all"||scope.value===group||scope.value==="pending"&&group==="active"&&row.dataset.effectPending==="true";
   const text=normalize(row.dataset.effectSearch),visible=inScope&&words.every(word=>text.includes(word));
   row.hidden=!visible;if(visible){shown++;if(group==="history")historical++;}
  }
  count.textContent=`Mostrando ${shown} de ${rows.length} registros.`;
  if(history){history.hidden=historical===0&&rows.some(row=>row.closest(".effect-history"));if(historical&&(words.length||scope.value==="history"))history.open=true;}
  clear.disabled=!input.value&&scope.value==="all";
 };
 // These unnamed controls must not reach ActorSheetV2's submitOnChange handler.
 for(const field of [input,scope]){
  field.addEventListener("input",event=>{event.stopPropagation();apply();});
  field.addEventListener("change",event=>{event.stopPropagation();apply();});
  field.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();event.stopPropagation();}});
 }
 clear.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();input.value="";scope.value="all";apply();input.focus();});
 apply();
}
