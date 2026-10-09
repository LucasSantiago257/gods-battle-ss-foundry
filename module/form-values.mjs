export function optionalNote(value, max=2000) {
 const text=value??"";
 if(typeof text!=="string"||text.length>max)throw Error(`Notas: informe até ${max} caracteres.`);
 return text.trim();
}
