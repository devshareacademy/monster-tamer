/** @type {import('../types/typedef.js').Coordinate} */
const ENEMY_POSITION = Object.freeze({
  x: 768,
  y: 176,
});

export class EnemyBattleNpc {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {Phaser.GameObjects.Image} */
  #phaserGameObject;
  /** @type {boolean} */
  #skipBattleAnimations;

  /**
   * @param {import('../types/typedef.js').BattleNpcConfig} config
   */
  constructor(config) {
    this.#scene = config.scene;
    this.#skipBattleAnimations = config.skipBattleAnimations || false;
    this.#phaserGameObject = this.#scene.add
      .image(ENEMY_POSITION.x, ENEMY_POSITION.y, config.assetKey, config.assetFrame || 0)
      .setVisible(false)
      .setScale(0.8);
  }

  /**
   * @public
   * @returns {Promise<void>}
   */
  playAppearAnimation() {
    return new Promise((resolve) => {
      const startXPos = -30;
      const endXPos = ENEMY_POSITION.x;
      this.#phaserGameObject.setPosition(startXPos, ENEMY_POSITION.y);
      this.#phaserGameObject.setVisible(true);

      if (this.#skipBattleAnimations) {
        this.#phaserGameObject.setX(endXPos);
        resolve();
        return;
      }

      this.#scene.tweens.add({
        delay: 0,
        duration: 1600,
        x: {
          from: startXPos,
          start: startXPos,
          to: endXPos,
        },
        targets: this.#phaserGameObject,
        onComplete: () => {
          resolve();
        },
      });
    });
  }

  /**
   * @public
   * @returns {void}
   */
  hide() {
    this.#phaserGameObject.setVisible(false);
  }
}
