import { Character } from './character.js';
import { CHARACTER_ASSET_KEYS } from '../../assets/asset-keys.js';
import { DIRECTION } from '../../common/direction.js';
import { exhaustiveGuard } from '../../utils/guard.js';

export class Player extends Character {
  /**
   * @param {import('./character.js').BaseCharacterConfig} config
   */
  constructor(config) {
    super({
      ...config,
      isPlayer: true,
      assetKey: CHARACTER_ASSET_KEYS.PLAYER,
      origin: { x: 0, y: 0.2 },
      idleFrame: {
        DOWN: 7,
        UP: 1,
        NONE: 7,
        LEFT: 10,
        RIGHT: 4,
      },
    });
  }

  /**
   * @param {import('../../common/direction.js').Direction} direction
   * @returns {void}
   */
  moveCharacter(direction) {
    super.moveCharacter(direction);

    switch (this._direction) {
      case DIRECTION.DOWN:
      case DIRECTION.LEFT:
      case DIRECTION.RIGHT:
      case DIRECTION.UP:
        if (
          !this._phaserGameObject.anims.isPlaying ||
          this._phaserGameObject.anims.currentAnim?.key !== `PLAYER_${this._direction}`
        ) {
          this._phaserGameObject.play(`PLAYER_${this._direction}`);
        }
        break;
      case DIRECTION.NONE:
        break;
      default:
        // We should never reach this default case
        exhaustiveGuard(this._direction);
    }
  }
}