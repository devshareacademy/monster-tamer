import Phaser from '../../lib/phaser.js';
import { DIRECTION } from '../../common/direction.js';
import { TILE_SIZE } from '../../config.js';
import { exhaustiveGuard } from '../../utils/guard.js';

/**
 * @typedef CharacterConfig
 * @type {Object}
 * @property {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
 * @property {string} assetKey the name of the asset key that should be used for this character
 * @property {number} [assetFrame=0] if the asset key is tied to a spritesheet, this frame will be used, defaults to 0
 * @property {import('../../types/typedef.js').Coordinate} position the starting position of the character
 */

export class Character {
  /** @protected @type {Phaser.Scene} */
  _scene;
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _phaserGameObject;

  /**
   * @param {CharacterConfig} config
   */
  constructor(config) {
    if (this.constructor === Character) {
      throw new Error('Character is an abstract class and cannot be instantiated.');
    }

    this._scene = config.scene;
    this._phaserGameObject = this._scene.add
      .sprite(config.position.x, config.position.y, config.assetKey, config.assetFrame || 0)
      .setOrigin(0);
  }

  /**
   * @param {import('../../common/direction.js').Direction} direction
   * @returns {void}
   */
  moveCharacter(direction) {
    switch (direction) {
      case DIRECTION.DOWN:
        this._phaserGameObject.y += TILE_SIZE;
        break;
      case DIRECTION.UP:
        this._phaserGameObject.y -= TILE_SIZE;
        break;
      case DIRECTION.LEFT:
        this._phaserGameObject.x -= TILE_SIZE;
        break;
      case DIRECTION.RIGHT:
        this._phaserGameObject.x += TILE_SIZE;
        break;
      case DIRECTION.NONE:
        break;
      default:
        exhaustiveGuard(direction);
    }
  }
}
