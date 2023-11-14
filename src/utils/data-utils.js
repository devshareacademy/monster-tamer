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
}
