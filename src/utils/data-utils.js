import Phaser from '../lib/phaser.js';
import { DATA_ASSET_KEYS } from '../assets/asset-keys.js';

export class DataUtils {
  /**
   * Utility function for retrieving an Attack object from the attacks.json data file.
   * @param {Phaser.Scene} scene the Phaser 3 Scene to get cached JSON file from
   * @param {number} attackId the id of the attack to retrieve from the attacks.json file
   * @returns {import('../types/typedef.js').Attack | undefined}
   */
  static getMonsterAttack(scene, attackId) {
    /** @type {import('../types/typedef.js').Attack[]} */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.ATTACKS);
    return data.find((attack) => attack.id === attackId);
  }

  /**
   * Utility function for retrieving the Animation objects from the animations.json data file.
   * @param {Phaser.Scene} scene the Phaser 3 Scene to get cached JSON file from
   * @returns {import('../types/typedef.js').Animation[]}
   */
  static getAnimations(scene) {
    /** @type {import('../types/typedef.js').Animation[]} */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.ANIMATIONS);
    return data;
  }

  /**
   * Utility function for retrieving an Item object from the items.json data file.
   * @param {Phaser.Scene} scene the Phaser 3 Scene to get cached JSON file from
   * @param {number} itemId the id of the item to retrieve from the items.json file
   * @returns {import('../types/typedef.js').Item | undefined}
   */
  static getItem(scene, itemId) {
    /** @type {import('../types/typedef.js').Item[]} */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.ITEMS);
    return data.find((item) => item.id === itemId);
  }

  /**
   * Utility function for retrieving an array Item objects from the items.json data file.
   * @param {Phaser.Scene} scene the Phaser 3 Scene to get cached JSON file from
   * @param {number[]} itemIds the array of the item ids to retrieve from the items.json file
   * @returns {import('../types/typedef.js').Item[] | undefined}
   */
  static getItems(scene, itemIds) {
    /** @type {import('../types/typedef.js').Item[]} */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.ITEMS);
    return data.filter((item) => {
      return itemIds.some((id) => id === item.id);
    });
  }

  /**
   * Utility function for retrieving a Monster object from the monsters.json data file.
   * @param {Phaser.Scene} scene the Phaser 3 Scene to get cached JSON file from
   * @param {number} monsterId the monster id to retrieve from the monsters.json file
   * @returns {import('../types/typedef.js').Monster}
   */
  static getMonsterById(scene, monsterId) {
    /** @type {import('../types/typedef.js').Monster[]} */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.MONSTERS);
    return data.find((monster) => monster.monsterId === monsterId);
  }

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene to get cached JSON file from
   * @param {number} areaId the area id to pull monster encounter details for
   * @returns {number[][]}
   */
  static getEncounterAreaDetails(scene, areaId) {
    /** @type {import('../types/typedef.js').EncounterData} */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.ENCOUNTERS);
    return data[areaId];
  }

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene to get cached JSON file from
   * @param {number} npcId
   * @returns {import('../types/typedef.js').NpcDetails}
   */
  static getNpcData(scene, npcId) {
    /** @type {import('../types/typedef.js').NpcData} */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.NPCS);
    return data[npcId];
  }

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene to get cached JSON file from
   * @param {number} eventId the event id to retrieve from the events.json file
   * @returns {import('../types/typedef.js').EventDetails}
   */
  static getEventData(scene, eventId) {
    /** @type {import('../types/typedef.js').EventData} */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.EVENTS);
    return data[eventId];
  }
}
