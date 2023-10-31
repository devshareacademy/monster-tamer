import { BattleMonster } from './battle-monster.js';

/** @type {import('../../types/typedef.js').Coordinate} */
const Player_POSITION = Object.freeze({
  x: 256,
  y: 316,
});

export class PlayerBattleMonster extends BattleMonster {
  /** @type {Phaser.GameObjects.Text} */
  #healthBarTextGameObject;

  /**
   * @param {import('../../types/typedef.js').BattleMonsterConfig} config
   */
  constructor(config) {
    super(config, Player_POSITION);
    this._phaserGameObject.setFlipX(true);
    this._phaserHealthBarGameContainer.setPosition(556, 318);

    this.#addHealthBarComponents();
  }

  #setHealthBarText() {
    this.#healthBarTextGameObject.setText(`${this._currentHealth}/${this._maxHealth}`);
  }

  #addHealthBarComponents() {
    this.#healthBarTextGameObject = this._scene.add
      .text(443, 80, '', {
        color: '#7E3D3F',
        fontSize: '16px',
      })
      .setOrigin(1, 0);
    this.#setHealthBarText();

    this._phaserHealthBarGameContainer.add(this.#healthBarTextGameObject);
  }

  /**
   * @param {number} damage
   * @param {() => void} [callback]
   * @returns {void}
   */
  takeDamage(damage, callback) {
    super.takeDamage(damage, callback);
    this.#setHealthBarText();
  }

  /**
   * @param {() => void} callback
   * @returns {void}
   */
  playMonsterAppearAnimation(callback) {
    const startXPos = -30;
    this._phaserGameObject.setPosition(startXPos, Player_POSITION.y);
    this._phaserGameObject.setAlpha(1);

    this._scene.tweens.add({
      delay: 0,
      duration: 800,
      x: {
        from: startXPos,
        start: startXPos,
        to: Player_POSITION.x,
      },
      targets: this._phaserGameObject,
      onComplete: () => {
        callback();
      },
    });
  }

  /**
   * @param {() => void} callback
   * @returns {void}
   */
  playMonsterHealthBarAppearAnimation(callback) {
    const startXPos = 800;
    this._phaserHealthBarGameContainer.setAlpha(1);

    this._scene.tweens.add({
      delay: 0,
      duration: 800,
      x: {
        from: startXPos,
        start: startXPos,
        to: this._phaserHealthBarGameContainer.x,
      },
      targets: this._phaserHealthBarGameContainer,
      onComplete: () => {
        callback();
      },
    });
  }

  /**
   * @param {() => void} callback
   * @returns {void}
   */
  playTakeDamageAnimation(callback) {
    this._scene.tweens.add({
      delay: 0,
      duration: 150,
      targets: this._phaserGameObject,
      onComplete: () => {
        this._phaserGameObject.setAlpha(1);
        callback();
      },
      alpha: {
        from: 1,
        start: 1,
        to: 0,
      },
      repeat: 10,
    });
  }

  /**
   * @param {() => void} callback
   * @returns {void}
   */
  playDeathAnimation(callback) {
    const startYPos = this._phaserGameObject.y;
    const endYPos = startYPos + 400;

    this._scene.tweens.add({
      delay: 0,
      duration: 2000,
      y: {
        from: startYPos,
        start: startYPos,
        to: endYPos,
      },
      targets: this._phaserGameObject,
      onComplete: () => {
        callback();
      },
    });
  }
}
