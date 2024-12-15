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

  /** @type {number} */
  get baseExpValue() {
    return this._monsterDetails.baseExp;
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

    if (this._skipBattleAnimations) {
      this._phaserGameObject.setX(endXPos);
      callback();
      return;
    }

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
    this._phaserHealthBarGameContainer.setPosition(startXPos, this._phaserHealthBarGameContainer.y);
    this._phaserHealthBarGameContainer.setAlpha(1);

    if (this._skipBattleAnimations) {
      this._phaserHealthBarGameContainer.setX(endXPos);
      callback();
      return;
    }

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
  playDeathAnimation(callback) {
    const startYPos = this._phaserGameObject.y;
    const endYPos = startYPos - 400;

    if (this._skipBattleAnimations) {
      this._phaserGameObject.setY(endYPos);
      callback();
      return;
    }

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

  /**
   * @returns {number}
   */
  pickRandomMove() {
    return Phaser.Math.Between(0, this._monsterAttacks.length - 1);
  }

  /**
   * @returns {Promise<void>}
   */
  playCatchAnimation() {
    return new Promise((resolve) => {
      if (this._skipBattleAnimations) {
        this._phaserGameObject.setAlpha(0);
        resolve();
        return;
      }

      this._scene.tweens.add({
        duration: 500,
        targets: this._phaserGameObject,
        alpha: {
          from: 1,
          start: 1,
          to: 0,
        },
        ease: Phaser.Math.Easing.Sine.InOut,
        onComplete: () => {
          resolve();
        },
      });
    });
  }

  /**
   * @returns {Promise<void>}
   */
  playCatchAnimationFailed() {
    return new Promise((resolve) => {
      if (this._skipBattleAnimations) {
        this._phaserGameObject.setAlpha(1);
        resolve();
        return;
      }

      this._scene.tweens.add({
        duration: 500,
        targets: this._phaserGameObject,
        alpha: {
          from: 0,
          start: 0,
          to: 1,
        },
        ease: Phaser.Math.Easing.Sine.InOut,
        onComplete: () => {
          resolve();
        },
      });
    });
  }
}
