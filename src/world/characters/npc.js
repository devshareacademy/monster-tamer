import Phaser from '../../lib/phaser.js';
import { Character } from './character.js';
import { CHARACTER_ASSET_KEYS } from '../../assets/asset-keys.js';
import { DIRECTION } from '../../common/direction.js';
import { exhaustiveGuard } from '../../utils/guard.js';

/**
 * @typedef {keyof typeof NPC_MOVEMENT_PATTERN} NpcMovementPattern
 */

/** @enum {NpcMovementPattern} */
export const NPC_MOVEMENT_PATTERN = Object.freeze({
  IDLE: 'IDLE',
  CLOCKWISE: 'CLOCKWISE',
});

/**
 * @typedef NPCConfigProps
 * @type {object}
 * @property {number} frame
 * @property {string[]} messages
 * @property {Object.<number, import('../../types/typedef.js').Coordinate>} npcPath
 * @property {NpcMovementPattern} movementPattern
 */

/**
 * @typedef {import('./character.js').BaseCharacterConfig & NPCConfigProps} NPCConfig
 */

export class NPC extends Character {
  /** @type {string[]} */
  #messages;
  /** @type {Object.<number, import('../../types/typedef.js').Coordinate>} */
  #npcPath;
  /** @type {number} */
  #currentPathIndex;
  /** @type {NpcMovementPattern} */
  #movementPattern;
  /** @type {number} */
  #lastMoveMentTime;
  /** @type {boolean} */
  #talkingToPlayer;

  /**
   * @param {NPCConfig} config
   */
  constructor(config) {
    super({
      ...config,
      assetKey: CHARACTER_ASSET_KEYS.NPC,
      isPlayer: false,
      origin: new Phaser.Math.Vector2(0, 0),
      idleFrame: {
        DOWN: config.frame,
        UP: config.frame + 1,
        NONE: config.frame,
        LEFT: config.frame + 2,
        RIGHT: config.frame + 2,
      },
    });

    this.#messages = config.messages;
    this.#npcPath = config.npcPath;
    this.#currentPathIndex = 0;
    this.#movementPattern = config.movementPattern;
    this.#lastMoveMentTime = Phaser.Math.Between(3500, 5000);
    this.#talkingToPlayer = false;
  }

  /** @type {string[]} */
  get messages() {
    return this.#messages;
  }

  /** @type {boolean} */
  get isTalkingToPlayer() {
    return this.#talkingToPlayer;
  }

  /**
   * @param {boolean} val
   */
  set isTalkingToPlayer(val) {
    this.#talkingToPlayer = val;
  }

  /**
   * @param {import('../../common/direction.js').Direction} direction
   * @returns {void}
   */
  moveCharacter(direction) {
    super.moveCharacter(direction);

    switch (this._direction) {
      case DIRECTION.DOWN:
      case DIRECTION.RIGHT:
      case DIRECTION.UP:
        if (
          !this._phaserGameObject.anims.isPlaying ||
          this._phaserGameObject.anims.currentAnim?.key !== `NPC_1_${this._direction}`
        ) {
          this._phaserGameObject.play(`NPC_1_${this._direction}`);
          this._phaserGameObject.setFlipX(false);
        }
        break;
      case DIRECTION.LEFT:
        if (
          !this._phaserGameObject.anims.isPlaying ||
          this._phaserGameObject.anims.currentAnim?.key !== `NPC_1_${DIRECTION.RIGHT}`
        ) {
          this._phaserGameObject.play(`NPC_1_${DIRECTION.RIGHT}`);
          this._phaserGameObject.setFlipX(true);
        }
        break;
      case DIRECTION.NONE:
        break;
      default:
        // We should never reach this default case
        exhaustiveGuard(this._direction);
    }
  }

  /**
   * @param {import('../../common/direction.js').Direction} playerDirection
   * @returns {void}
   */
  facePlayer(playerDirection) {
    switch (playerDirection) {
      case DIRECTION.DOWN:
        this._phaserGameObject.setFrame(this._idleFrame.UP).setFlipX(false);
        break;
      case DIRECTION.LEFT:
        this._phaserGameObject.setFrame(this._idleFrame.RIGHT).setFlipX(false);
        break;
      case DIRECTION.RIGHT:
        this._phaserGameObject.setFrame(this._idleFrame.LEFT).setFlipX(true);
        break;
      case DIRECTION.UP:
        this._phaserGameObject.setFrame(this._idleFrame.DOWN).setFlipX(false);
        break;
      case DIRECTION.NONE:
        break;
      default:
        exhaustiveGuard(playerDirection);
    }
  }

  /**
   * @param {DOMHighResTimeStamp} time
   * @returns {void}
   */
  update(time) {
    if (this._isMoving) {
      return;
    }
    if (this.#talkingToPlayer) {
      return;
    }
    super.update(time);

    if (this.#movementPattern === NPC_MOVEMENT_PATTERN.IDLE) {
      return;
    }

    if (this.#lastMoveMentTime < time) {
      /** @type {import('../../common/direction.js').Direction} */
      let characterDirection = DIRECTION.NONE;
      let nextPosition = this.#npcPath[this.#currentPathIndex + 1];

      // validate if we actually moved to the next position, if not, skip updating index
      const prevPosition = this.#npcPath[this.#currentPathIndex];
      if (prevPosition.x !== this._phaserGameObject.x || prevPosition.y !== this._phaserGameObject.y) {
        nextPosition = this.#npcPath[this.#currentPathIndex];
      } else {
        if (nextPosition === undefined) {
          nextPosition = this.#npcPath[0];
          this.#currentPathIndex = 0;
        } else {
          this.#currentPathIndex = this.#currentPathIndex + 1;
        }
      }

      if (nextPosition.x > this._phaserGameObject.x) {
        characterDirection = DIRECTION.RIGHT;
      } else if (nextPosition.x < this._phaserGameObject.x) {
        characterDirection = DIRECTION.LEFT;
      } else if (nextPosition.y < this._phaserGameObject.y) {
        characterDirection = DIRECTION.UP;
      } else if (nextPosition.y > this._phaserGameObject.y) {
        characterDirection = DIRECTION.DOWN;
      }

      this.moveCharacter(characterDirection);
      this.#lastMoveMentTime = time + Phaser.Math.Between(2000, 5000);
    }
  }
}
