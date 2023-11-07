import { HealthBar } from '../ui/health-bar.js';

/**
 * @typedef BattleMonsterConfig
 * @type {Object}
 * @property {Phaser.Scene} scene
 * @property {Monster} monsterDetails
 */

/**
 * @typedef Monster
 * @type {Object}
 * @property {string} name
 * @property {string} assetKey
 * @property {number} [assetFrame=0]
 * @property {number} maxHp
 * @property {number} currentHp
 * @property {number} baseAttack
 * @property {number[]} attackIds
 */

/**
 * @typedef Coordinate
 * @type {Object}
 * @property {number} x
 * @property {number} y
 */

export class BattleMonster {
  /** @protected @type {Phaser.Scene} */
  _scene;
  /** @protected @type {Monster} */
  _monsterDetails;
  /** @protected @type {HealthBar} */
  _healthBar;
  /** @protected @type {Phaser.GameObjects.Image} */
  _phaserGameObject;

  /**
   * @param {BattleMonsterConfig} config
   * @param {Coordinate} position
   */
  constructor(config, position) {
    this._scene = config.scene;
    this._monsterDetails = config.monsterDetails;

    this._healthBar = new HealthBar(this._scene, 34, 34);
    this._phaserGameObject = this._scene.add.image(
      position.x,
      position.y,
      this._monsterDetails.assetKey,
      this._monsterDetails.assetFrame || 0
    );
  }
}
