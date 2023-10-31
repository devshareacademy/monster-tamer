import Phaser from '../lib/phaser.js';
import { BATTLE_BACKGROUND_ASSET_KEYS } from '../assets/asset-keys.js';

export class Background {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {Phaser.GameObjects.Image} */
  #backgroundGameObject;

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene the health bar will be added to
   */
  constructor(scene) {
    this.#scene = scene;

    this.#backgroundGameObject = this.#scene.add
      .image(0, 0, BATTLE_BACKGROUND_ASSET_KEYS.FOREST, 0)
      .setOrigin(0)
      .setAlpha(0);
  }

  showForest() {
    this.#backgroundGameObject.setTexture(BATTLE_BACKGROUND_ASSET_KEYS.FOREST).setAlpha(1);
  }
}
