import {SYSTEM_ID, ITEM_TYPES} from "./config.mjs";
import {prepareKnight, armorValues} from "./rules.mjs";

export class BattleActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.type === "knight") prepareKnight(this.system, this.items.contents, game.settings.get(SYSTEM_ID, "resistanceMode"),{actorUuid:this.uuid,flags:this.flags});
  }
  async equipArmor(item) {
    if (!this.isOwner || item.parent !== this || item.type !== "armor") return;
    const equip = !item.system.equipped;
    const updates = this.items.filter(i => i.type === "armor").map(i => ({_id: i.id, "system.equipped": equip && i.id === item.id}));
    await this.updateEmbeddedDocuments("Item", updates);
    if (equip && item.system.health.value < 0) ui.notifications.warn("Armadura sem vida: seus bônus não são aplicados.");
  }
}
export class BattleItem extends Item {
  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.type === "armor") {
      this.system.armor = armorValues(this.system);
      this.system.health.max = this.system.armor.hp;
    }
  }
  get typeLabel() { return ITEM_TYPES[this.type] ?? this.type; }
}
