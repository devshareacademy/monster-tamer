import Phaser from '../../lib/phaser.js';
import { HealthBar } from '../ui/health-bar.js';

export class BattleMonster {
  /** @type {Phaser.Scene} */
  _scene;
  /** @type {import('../../types/typedef.js').Monster} */
  _monsterDetails;
  /** @type {HealthBar} */
  _healthBar;
  /** @type {Phaser.GameObjects.Image} */
  _phaserGameObject;
  /** @type {number} */
  _currentHealth;
  /** @type {number} */
  _maxHealth;

  /**
   * @param {import('../../types/typedef.js').BattleMonsterConfig} config
   * @param {import('../../types/typedef.js').Coordinate} position
   */
  constructor(config, position) {
    if (this.constructor === BattleMonster) {
      throw new Error('BattleMonster is an abstract class and cannot be instantiated.');
    }
    this._scene = config.scene;
    this._monsterDetails = config.monsterDetails;
    this._healthBar = new HealthBar(this._scene, 34, 34);
    this._phaserGameObject = this._scene.add.image(
      position.x,
      position.y,
      this._monsterDetails.assetKey,
      this._monsterDetails.assetFrame || 0
    );
    this._currentHealth = this._monsterDetails.currentHp;
    this._maxHealth = this._monsterDetails.maxHp;
  }
}
