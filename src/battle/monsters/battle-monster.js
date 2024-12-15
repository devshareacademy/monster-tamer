import Phaser from '../../lib/phaser.js';
import { HealthBar } from '../../common/health-bar.js';
import { BATTLE_ASSET_KEYS } from '../../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../../assets/font-keys.js';
import { DataUtils } from '../../utils/data-utils.js';

export class BattleMonster {
  /** @protected @type {Phaser.Scene} */
  _scene;
  /** @protected @type {import('../../types/typedef.js').Monster} */
  _monsterDetails;
  /** @protected @type {HealthBar} */
  _healthBar;
  /** @protected @type {Phaser.GameObjects.Image} */
  _phaserGameObject;
  /** @protected @type {number} */
  _currentHealth;
  /** @protected @type {number} */
  _maxHealth;
  /** @protected @type {import('../../types/typedef.js').Attack[]} */
  _monsterAttacks;
  /** @protected @type {Phaser.GameObjects.Container} */
  _phaserHealthBarGameContainer;
  /** @protected @type {boolean} */
  _skipBattleAnimations;
  /** @protected @type {Phaser.GameObjects.Text} */
  _monsterHealthBarLevelText;
  /** @protected @type {Phaser.GameObjects.Text} */
  _monsterNameText;

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
    this._currentHealth = this._monsterDetails.currentHp;
    this._maxHealth = this._monsterDetails.maxHp;
    this._monsterAttacks = [];
    this._skipBattleAnimations = config.skipBattleAnimations || false;

    this._phaserGameObject = this._scene.add
      .image(position.x, position.y, this._monsterDetails.assetKey, this._monsterDetails.assetFrame || 0)
      .setAlpha(0);
    this.#createHealthBarComponents(config.scaleHealthBarBackgroundImageByY);
    this._healthBar.setMeterPercentageAnimated(this._currentHealth / this._maxHealth, {
      skipBattleAnimations: true,
    });

    this._monsterDetails.attackIds.forEach((attackId) => {
      const monsterAttack = DataUtils.getMonsterAttack(this._scene, attackId);
      if (monsterAttack !== undefined) {
        this._monsterAttacks.push(monsterAttack);
      }
    });
  }

  /** @type {number} */
  get currentHp() {
    return this._currentHealth;
  }

  /** @type {number} */
  get maxHp() {
    return this._maxHealth;
  }

  /** @type {boolean} */
  get isFainted() {
    return this._currentHealth <= 0;
  }

  /** @type {string} */
  get name() {
    return this._monsterDetails.name;
  }

  /** @type {import('../../types/typedef.js').Attack[]} */
  get attacks() {
    return [...this._monsterAttacks];
  }

  /** @type {number} */
  get baseAttack() {
    return this._monsterDetails.currentAttack;
  }

  /** @type {number} */
  get level() {
    return this._monsterDetails.currentLevel;
  }

  /**
   * @param {import('../../types/typedef.js').Monster} monster
   * @returns {void}
   */
  switchMonster(monster) {
    this._monsterDetails = monster;
    this._currentHealth = this._monsterDetails.currentHp;
    this._maxHealth = this._monsterDetails.maxHp;
    this._healthBar.setMeterPercentageAnimated(this._currentHealth / this._maxHealth, {
      skipBattleAnimations: true,
    });
    this._monsterAttacks = [];
    this._monsterDetails.attackIds.forEach((attackId) => {
      const monsterAttack = DataUtils.getMonsterAttack(this._scene, attackId);
      if (monsterAttack !== undefined) {
        this._monsterAttacks.push(monsterAttack);
      }
    });
    this._phaserGameObject.setTexture(this._monsterDetails.assetKey, this._monsterDetails.assetFrame || 0);
    this._monsterNameText.setText(this._monsterDetails.name);
    this._setMonsterLevelText();
    this._monsterHealthBarLevelText.setX(this._monsterNameText.width + 35);
  }

  /**
   * @param {number} damage
   * @param {() => void} [callback]
   * @returns {void}
   */
  takeDamage(damage, callback) {
    // update current monster health and animate health bar
    this._currentHealth -= damage;
    if (this._currentHealth < 0) {
      this._currentHealth = 0;
    }
    this._healthBar.setMeterPercentageAnimated(this._currentHealth / this._maxHealth, {
      callback,
      skipBattleAnimations: this._skipBattleAnimations,
    });
  }

  /**
   * @param {() => void} callback
   * @returns {void}
   */
  playMonsterAppearAnimation(callback) {
    throw new Error('playMonsterAppearAnimation is not implemented.');
  }

  /**
   * @param {() => void} callback
   * @returns {void}
   */
  playMonsterHealthBarAppearAnimation(callback) {
    throw new Error('playMonsterHealthBarAppearAnimation is not implemented.');
  }

  /**
   * @param {() => void} callback
   * @returns {void}
   */
  playDeathAnimation(callback) {
    throw new Error('playDeathAnimation is not implemented.');
  }

  /**
   * @param {() => void} callback
   * @returns {void}
   */
  playTakeDamageAnimation(callback) {
    if (this._skipBattleAnimations) {
      this._phaserGameObject.setAlpha(1);
      callback();
      return;
    }

    this._scene.tweens.add({
      delay: 0,
      duration: 150,
      targets: this._phaserGameObject,
      alpha: {
        from: 1,
        start: 1,
        to: 0,
      },
      repeat: 10,
      onComplete: () => {
        this._phaserGameObject.setAlpha(1);
        callback();
      },
    });
  }

  /**
   * @protected
   * @returns {void}
   */
  _setMonsterLevelText() {
    this._monsterHealthBarLevelText.setText(`L${this.level}`);
  }

  /**
   * Creates the base health bar components for this monster.
   * @param {number} [scaleHealthBarBackgroundImageByY=1] the scaling factor applied to the phaser image game object Y value
   */
  #createHealthBarComponents(scaleHealthBarBackgroundImageByY = 1) {
    this._healthBar = new HealthBar(this._scene, 34, 34);

    this._monsterNameText = this._scene.add.text(30, 20, this.name, {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#7E3D3F',
      fontSize: '32px',
    });

    const healthBarBgImage = this._scene.add
      .image(0, 0, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND)
      .setOrigin(0)
      .setScale(1, scaleHealthBarBackgroundImageByY);

    this._monsterHealthBarLevelText = this._scene.add.text(this._monsterNameText.width + 35, 23, '', {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#ED474B',
      fontSize: '28px',
    });
    this._setMonsterLevelText();

    const monsterHpText = this._scene.add.text(30, 55, 'HP', {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#FF6505',
      fontSize: '24px',
      fontStyle: 'italic',
    });

    this._phaserHealthBarGameContainer = this._scene.add
      .container(0, 0, [
        healthBarBgImage,
        this._monsterNameText,
        this._healthBar.container,
        this._monsterHealthBarLevelText,
        monsterHpText,
      ])
      .setAlpha(0);
  }
}
