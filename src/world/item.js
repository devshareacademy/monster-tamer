import { WORLD_ASSET_KEYS } from '../assets/asset-keys.js';

/**
 * @typedef ItemConfig
 * @type {object}
 * @property {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
 * @property {import("../types/typedef").Coordinate} position the items position
 * @property {number} itemId
 * @property {number} id
 */

export class Item {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {Phaser.GameObjects.Image} */
  #phaserGameObject;
  /** @type {number} */
  #id;
  /** @type {number} */
  #itemId;

  /**
   * @param {ItemConfig} config
   */
  constructor(config) {
    this.#id = config.id;
    this.#itemId = config.itemId;
    this.#scene = config.scene;
    this.#phaserGameObject = this.#scene.add
      .image(config.position.x, config.position.y, WORLD_ASSET_KEYS.BEACH, 22)
      .setOrigin(0);
  }

  /** @type {Phaser.GameObjects.Image} */
  get gameObject() {
    return this.#phaserGameObject;
  }

  /** @type {import('../types/typedef').Coordinate} */
  get position() {
    return {
      x: this.#phaserGameObject.x,
      y: this.#phaserGameObject.y,
    };
  }

  /** @type {number} */
  get itemId() {
    return this.#itemId;
  }

  /** @type {number} */
  get id() {
    return this.#id;
  }
}
