import { CHARACTER_ASSET_KEYS } from '../../assets/asset-keys.js';
import { DIRECTION } from '../../common/direction.js';
import { exhaustiveGuard } from '../../utils/guard.js';
import { Character } from './character.js';
import { getTargetPositionFromGameObjectPositionAndDirection } from '../../utils/grid-utils.js';
import { TILE_SIZE } from '../../config.js';

/**
 * @typedef PlayerConfigProps
 * @type {object}
 * @property {Phaser.Tilemaps.TilemapLayer} collisionLayer
 * @property {Phaser.Tilemaps.ObjectLayer} [entranceLayer]
 * @property {(entranceName: string, entranceId: string, isBuildingEntrance: boolean) => void} enterEntranceCallback
 */

/**
 * @typedef {Omit<import('./character').CharacterConfig, 'assetKey' | 'idleFrameConfig'> & PlayerConfigProps} PlayerConfig
 */

export class Player extends Character {
  /** @type {Phaser.Tilemaps.ObjectLayer | undefined} */
  #entranceLayer;
  /** @type {(entranceName: string, entranceId: string, isBuildingEntrance: boolean) => void} */
  #enterEntranceCallback;

  /**
   * @param {PlayerConfig} config
   */
  constructor(config) {
    super({
      ...config,
      assetKey: CHARACTER_ASSET_KEYS.PLAYER,
      origin: { x: 0, y: 0.2 },
      idleFrameConfig: {
        DOWN: 7,
        UP: 1,
        NONE: 7,
        LEFT: 10,
        RIGHT: 4,
      },
    });
    this.#entranceLayer = config.entranceLayer;
    this.#enterEntranceCallback = config.enterEntranceCallback;
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

    // validate character is not moving and that the target position belongs to an entrance
    if (!this._isMoving && this.#entranceLayer !== undefined) {
      const targetPosition = getTargetPositionFromGameObjectPositionAndDirection(
        { x: this._phaserGameObject.x, y: this._phaserGameObject.y },
        this._direction
      );
      const nearbyEntrance = this.#entranceLayer.objects.find((object) => {
        if (!object.x || !object.y) {
          return false;
        }
        return object.x === targetPosition.x && object.y - TILE_SIZE === targetPosition.y;
      });

      if (!nearbyEntrance) {
        return;
      }

      // entrance is nearby and the player is trying to enter that location
      const entranceName = nearbyEntrance.properties.find((property) => property.name === 'connects_to').value;
      const entranceId = nearbyEntrance.properties.find((property) => property.name === 'entrance_id').value;
      const isBuildingEntrance =
        nearbyEntrance.properties.find((property) => property.name === 'is_building')?.value || false;
      this.#enterEntranceCallback(entranceName, entranceId, isBuildingEntrance);
    }
  }
}
