import { BattleMonster } from './battle-monster.js';

/** @type {import('../../types/typedef.js').Coordinate} */
const ENEMY_POSITION = Object.freeze({
  x: 768,
  y: 144,
});

export class EnemyBattleMonster extends BattleMonster {
  /**
   * @param {import('../../types/typedef.js').BattleMonsterConfig} config
   */
  constructor(config) {
    super({ ...config, scaleHealthBarBackgroundImageByY: 0.8 }, ENEMY_POSITION);
  }

  /**
   * @param {() => void} callback
   * @returns {void}
   */
  playMonsterAppearAnimation(callback) {
    const startXPos = -30;
    const endXPos = ENEMY_POSITION.x;
    this._phaserGameObject.setPosition(startXPos, ENEMY_POSITION.y);
    this._phaserGameObject.setAlpha(1);

    this._scene.tweens.add({
      delay: 0,
      duration: 1600,
      x: {
        from: startXPos,
        start: startXPos,
        to: endXPos,
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
    const startXPos = -600;
    const endXPos = 0;
    this._phaserHealthBarGameContainer.setAlpha(1);

    this._scene.tweens.add({
      delay: 0,
      duration: 1500,
      x: {
        from: startXPos,
        start: startXPos,
        to: endXPos,
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
    const endYPos = startYPos - 400;
    this._scene.tweens.add({
      delay: 0,
      duration: 2000,
      y: {
        from: startYPos,
        start: startYPos,
        to: endYPos,
      },
      targets: this._phaserGameObject,
      onComplete: callback,
    });
  }
}
