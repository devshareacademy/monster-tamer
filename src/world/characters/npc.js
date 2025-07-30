import Phaser from '../../lib/phaser.js';
import { Character } from './character.js';
import { CHARACTER_ASSET_KEYS } from '../../assets/asset-keys.js';
import { DIRECTION } from '../../common/direction.js';
import { exhaustiveGuard } from '../../utils/guard.js';
import { TILE_SIZE } from '../../config.js';
import { BATTLE_TRIGGER_TYPE } from '../../types/typedef.js';

/**
 * @typedef {keyof typeof NPC_MOVEMENT_PATTERN} NpcMovementPattern
 */

/** @enum {NpcMovementPattern} */
export const NPC_MOVEMENT_PATTERN = Object.freeze({
  IDLE: 'IDLE',
  CLOCKWISE: 'CLOCKWISE',
  SET_PATH: 'SET_PATH',
});

/**
 * @typedef NPCPath
 * @type {Object.<number, import('../../types/typedef.js').Coordinate>}
 */

/**
 * @typedef NPCConfigProps
 * @type {object}
 * @property {number} frame
 * @property {NPCPath} npcPath
 * @property {NpcMovementPattern} movementPattern
 * @property {import('../../types/typedef.js').NpcEvent[]} events
 * @property {string} animationKeyPrefix
 * @property {number} id
 * @property {import('../../types/typedef.js').BattleTrigger} [battleTrigger]
 * @property {number} [visionRange]
 * @property {import('../../common/direction.js').Direction[]} [visionDirections]
 */

/**
 * @typedef {Omit<import('./character').CharacterConfig, 'assetKey' | 'idleFrameConfig'> & NPCConfigProps} NPCConfig
 */

export class NPC extends Character {
  /** @type {boolean} */
  #talkingToPlayer;
  /** @type {NPCPath} */
  #npcPath;
  /** @type {number} */
  #currentPathIndex;
  /** @type {NpcMovementPattern} */
  #movementPattern;
  /** @type {number} */
  #lastMovementTime;
  /** @type {import('../../types/typedef.js').NpcEvent[]} */
  #events;
  /** @type {string} */
  #animationKeyPrefix;
  /** @type {number} */
  #id;
  /** @type {import('../../types/typedef.js').BattleTrigger | undefined} */
  #battleTrigger;
  /** @type {number | undefined} */
  #visionRange;
  /** @type {import('../../common/direction.js').Direction[] | undefined} */
  #visionDirections;

  /**
   * @param {NPCConfig} config
   */
  constructor(config) {
    super({
      ...config,
      assetKey: CHARACTER_ASSET_KEYS.NPC,
      origin: { x: 0, y: 0 },
      idleFrameConfig: {
        DOWN: config.frame,
        UP: config.frame + 1,
        NONE: config.frame,
        LEFT: config.frame + 2,
        RIGHT: config.frame + 2,
      },
    });

    this.#talkingToPlayer = false;
    this.#npcPath = config.npcPath;
    this.#currentPathIndex = 0;
    this.#movementPattern = config.movementPattern;
    this.#lastMovementTime = Phaser.Math.Between(3500, 5000);
    this._phaserGameObject.setScale(4);
    this.#events = config.events;
    this.#animationKeyPrefix = config.animationKeyPrefix;
    this.#id = config.id;
    this.#battleTrigger = config.battleTrigger;
    this.#visionRange = config.visionRange;
    this.#visionDirections = config.visionDirections;
  }

  /** @type {import('../../types/typedef.js').NpcEvent[]} */
  get events() {
    return [...this.#events];
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

  /** @type {number} */
  get id() {
    return this.#id;
  }

  /** @type {NPCPath} */
  get npcPath() {
    return this.#npcPath;
  }

  /**
   * @param {NPCPath} val
   */
  set npcPath(val) {
    this.#npcPath = val;
  }

  /**
   * @param {NpcMovementPattern} val
   */
  set npcMovementPattern(val) {
    this.#movementPattern = val;
  }

  /**
   * @param {() => void | undefined} val
   */
  set finishedMovementCallback(val) {
    this._spriteGridMovementFinishedCallback = val;
  }

  /** @type {import('../../types/typedef.js').BattleTrigger | undefined} */
  get battleTrigger() {
    return this.#battleTrigger;
  }

  /**
   * Resets the lastMovementTime, which is used for when we want to have an npc start moving
   * immediately. This is needed for cutscene support so after the npc appears, that npc starts
   * moving directly to the player.
   * @returns {void}
   */
  resetMovementTime() {
    this.#lastMovementTime = 0;
  }

  /**
   * @param {import('../../common/direction.js').Direction} playerDirection
   * @returns {void}
   */
  facePlayer(playerDirection) {
    switch (playerDirection) {
      case DIRECTION.DOWN:
        this._phaserGameObject.setFrame(this._idleFrameConfig.UP).setFlipX(false);
        break;
      case DIRECTION.LEFT:
        this._phaserGameObject.setFrame(this._idleFrameConfig.RIGHT).setFlipX(false);
        break;
      case DIRECTION.RIGHT:
        console.log(this._idleFrameConfig);
        this._phaserGameObject.setFrame(this._idleFrameConfig.LEFT).setFlipX(true);
        console.log(123123);
        break;
      case DIRECTION.UP:
        this._phaserGameObject.setFrame(this._idleFrameConfig.DOWN).setFlipX(false);
        break;
      case DIRECTION.NONE:
        break;
      default:
        exhaustiveGuard(playerDirection);
    }
  }

  // TODO:NOW need to review
  // TODO:NOW battle trigger should come from the enum object
  /**
   * Checks if a target is within the NPC's line of sight.
   * @param {import('./player.js').Player} target The player to check against.
   * @param {Phaser.Tilemaps.TilemapLayer} collisionLayer The layer with collision data.
   * @returns {boolean}
   */
  isInLineOfSight(target, collisionLayer) {
    // 1. Return false immediately if this NPC doesn't use this trigger or has no vision range.
    if (this.#battleTrigger !== BATTLE_TRIGGER_TYPE.LINE_OF_SIGHT || this.#visionRange === undefined) {
      return false;
    }

    // 2. Use tile coordinates for grid-based logic.
    const npcTileX = this._phaserGameObject.x / TILE_SIZE;
    const npcTileY = this._phaserGameObject.y / TILE_SIZE;
    const targetTileX = target._phaserGameObject.x / TILE_SIZE;
    const targetTileY = target._phaserGameObject.y / TILE_SIZE;

    // 3. Check if player is in the correct direction and within range.
    switch (this.direction) {
      case DIRECTION.DOWN:
        if (targetTileX !== npcTileX || targetTileY <= npcTileY || targetTileY > npcTileY + this.#visionRange)
          return false;
        break;
      case DIRECTION.UP:
        if (targetTileX !== npcTileX || targetTileY >= npcTileY || targetTileY < npcTileY - this.#visionRange)
          return false;
        break;
      case DIRECTION.LEFT:
        if (targetTileY !== npcTileY || targetTileX >= npcTileX || targetTileX < npcTileX - this.#visionRange)
          return false;
        break;
      case DIRECTION.RIGHT:
        if (targetTileY !== npcTileY || targetTileX <= npcTileX || targetTileX > npcTileX + this.#visionRange)
          return false;
        break;
      default:
        return false;
    }

    // 4. Check for obstacles between the NPC and the player.
    // This involves iterating through the tiles in the path and checking for a collision property.
    // If any tile is collidable, return false.
    const line = new Phaser.Geom.Line(npcTileX, npcTileY, targetTileX, targetTileY);
    const tiles = collisionLayer.getTilesWithinShape(line);
    for (const tile of tiles) {
      if (tile.collides) {
        return false;
      }
    }

    return true; // Return true if all checks pass.
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

    if (this.#lastMovementTime < time) {
      /** @type {import('../../common/direction.js').Direction} */
      let characterDirection = DIRECTION.NONE;
      let nextPosition = this.#npcPath[this.#currentPathIndex + 1];

      // validate if we actually moved to the next position, if not, skip updating index
      const prevPosition = this.#npcPath[this.#currentPathIndex];
      if (prevPosition.x !== this._phaserGameObject.x || prevPosition.y !== this._phaserGameObject.y) {
        nextPosition = this.#npcPath[this.#currentPathIndex];
      } else {
        if (nextPosition === undefined) {
          // if npc is following a set path, once we reach the end, stop moving the npc
          if (this.#movementPattern === NPC_MOVEMENT_PATTERN.SET_PATH) {
            this.#movementPattern = NPC_MOVEMENT_PATTERN.IDLE;
            this.#currentPathIndex = 0;
            return;
          }
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
      if (this.#movementPattern === NPC_MOVEMENT_PATTERN.SET_PATH) {
        this.#lastMovementTime = time;
      } else {
        this.#lastMovementTime = time + Phaser.Math.Between(2000, 5000);
      }
    }
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
          this._phaserGameObject.anims.currentAnim?.key !== `${this.#animationKeyPrefix}_${this._direction}`
        ) {
          this._phaserGameObject.play(`${this.#animationKeyPrefix}_${this._direction}`);
          this._phaserGameObject.setFlipX(false);
        }
        break;
      case DIRECTION.LEFT:
        if (
          !this._phaserGameObject.anims.isPlaying ||
          this._phaserGameObject.anims.currentAnim?.key !== `${this.#animationKeyPrefix}_${DIRECTION.RIGHT}`
        ) {
          this._phaserGameObject.play(`${this.#animationKeyPrefix}_${DIRECTION.RIGHT}`);
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
}
