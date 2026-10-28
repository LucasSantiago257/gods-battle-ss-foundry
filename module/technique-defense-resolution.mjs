// Shared, value-only stamps for resistance and damage. No attacker resolution.
import {SYSTEM_ID} from "./config.mjs";
import {actionHash} from "./action-rules.mjs";
import {canReadChat} from "./combat-rules.mjs";
import {areaAttackFor} from "./area-rules.mjs";
import {defenseRecordForAttack,defenseStamp,assertDefenseStamp} from "./technique-defense-records.mjs";
const flags=d=>d?.flags?.[SYSTEM_ID]??{};
const has=(actor,id)=>!!flags(actor).techniqueDefenses?.[id];
export function resistanceDefenseContext(actor,source,user){
 if(!source||flags(source).attack?.effectKind&&flags(source).attack.effectKind!=="damage")return {record:null,stamp:null,validate:()=>true};
 const record=has(actor,source.id)?defenseRecordForAttack(actor,source,user):null,stamp=defenseStamp(record);
 return {record,stamp,validate(){if(!has(actor,source.id)&&!stamp)return true;assertDefenseStamp(actor,source,user,stamp);return true;}};
}
export function damageDefenseContext(actor,card,user){
 const r=flags(card).resolvedDamage,root=game.messages?.get?.(r?.rootMessageId),stamp=r?.techniqueDefenseStamp??null;
 const active=!!(flags(root).attack||flags(card).attack||stamp||has(actor,r?.rootMessageId));
 if(!active)return {active:false,validate:()=>true};
 const signature=actionHash({resolution:r,attack:flags(card).attack}),rootSignature=root?actionHash(flags(root).attack):null,author=card.author?.id??card.user?.id;
 return {active:true,validate(){
  if(game.messages?.get?.(card.id)!==card||!canReadChat(user,card)||actionHash({resolution:flags(card).resolvedDamage,attack:flags(card).attack})!==signature||(card.author?.id??card.user?.id)!==author)throw Error("O cartão de dano mudou ou perdeu acesso.");
  if(root&&(game.messages?.get?.(r.rootMessageId)!==root||!canReadChat(user,root)||actionHash(flags(root).attack)!==rootSignature))throw Error("O ataque original mudou ou perdeu acesso.");
  if(!stamp&&!has(actor,r.rootMessageId))return true;
  if(!root)throw Error("Ataque indisponível; confira a defesa antes de aplicar dano.");
  assertDefenseStamp(actor,root,user,stamp);
  const original=flags(root).attack,expected=original?.areaTargets?areaAttackFor(original,actor.uuid):original,{messageId,...received}=flags(card).attack??{};
  if(messageId!==root.id||!expected||actionHash(received)!==actionHash(expected))throw Error("Este dano não corresponde ao ataque original da defesa.");
  return true;
 }};
}
