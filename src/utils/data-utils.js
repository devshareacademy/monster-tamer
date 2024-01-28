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
   * @param {Phaser.Scene} scene the Phaser 3 Scene to get cached JSON file from
   * @returns {import('../types/typedef.js').Monster}
   */
  static getIguanignite(scene) {
    /** @type { import('../types/typedef.js').Monster[]} */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.MONSTERS);
    return data.find((monster) => monster.id === 1);
  }

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene to get cached JSON file from
   * @returns {import('../types/typedef.js').Monster}
   */
  static getCarnodusk(scene) {
    /** @type { import('../types/typedef.js').Monster[]} */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.MONSTERS);
    return data.find((monster) => monster.id === 2);
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

  // /**
  //  * Utility function for retrieving the Animation objects from the animations.json data file.
  //  * @param {Phaser.Scene} scene the Phaser 3 Scene to get cached JSON file from
  //  * @param {import('../types/typedef.js').BaseMonster[]} baseMonsters the base monsters that need to be populated with data
  //  * @returns {import('../types/typedef.js').Monster[]}
  //  */
  // static createMonstersFromBaseMonsters(scene, baseMonsters) {
  //   /** @type { import('../types/typedef.js').Monster[]} */
  //   const data = scene.cache.json.get(DATA_ASSET_KEYS.MONSTERS);

  //   /** @type {import('../types/typedef.js').Monster[]} */
  //   const monsters = [];

  //   baseMonsters.forEach((baseMonster) => {
  //     const monsterData = data.find((monster) => monster.id === baseMonster.id);
  //     if (!monsterData) {
  //       return;
  //     }
  //     monsters.push({
  //       ...baseMonster,
  //       name: monsterData.name,
  //       assetKey: monsterData.assetKey,
  //       assetFrame: monsterData.assetFrame,
  //       attackIds: [...monsterData.attackIds],
  //     });
  //   });

  //   return monsters;
  // }

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene to get cached JSON file from
   * @param {number} area
   * @returns {number[][]}
   */
  static getEncounterAreaDetails(scene, area) {
    /** @type {import('../types/typedef.js').EncounterData} */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.ENCOUNTERS);
    return data[area];
  }

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene to get cached JSON file from
   * @param {number} monsterId
   * @returns {import('../types/typedef.js').Monster}
   */
  static getMonsterById(scene, monsterId) {
    /** @type {import('../types/typedef.js').Monster[]} */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.MONSTERS);
    return data.find((monster) => monster.id === monsterId);
  }

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene to get cached JSON file from
   * @param {number} npcId
   * @returns {import('../types/typedef.js').NpcDetails}
   */
  static getNpcData(scene, npcId) {
    /** @type {import('../types/typedef.js').NpcDetails} */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.NPCS);
    return data[npcId];
  }
}
