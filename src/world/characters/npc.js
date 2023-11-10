import Phaser from '../../lib/phaser.js';
import { Character } from './character.js';
import { CHARACTER_ASSET_KEYS } from '../../assets/asset-keys.js';

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
}
