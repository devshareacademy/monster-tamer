import Phaser from '../../lib/phaser.js';

/**
 * @typedef CharacterConfig
 * @type {Object}
 * @property {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
 * @property {string} assetKey the name of the asset key that should be used for this character
 * @property {number} [assetFrame=0] if the asset key is tied to a spritesheet, this frame will be used, defaults to 0
 * @property {import('../../types/typedef.js').Coordinate} position the starting position of the character
 */

export class Character {
  /** @type {Phaser.Scene} */
  _scene;
  /** @type {Phaser.GameObjects.Sprite} */
  _phaserGameObject;

  /**
   * @param {CharacterConfig} config
   */
  constructor(config) {
    this._scene = config.scene;
    this._phaserGameObject = this._scene.add
      .sprite(config.position.x, config.position.y, config.assetKey, config.assetFrame || 0)
      .setOrigin(0);
  }
}
