import Phaser from '../lib/phaser.js';

/**
 * @typedef BallConfig
 * @type {object}
 * @property {Phaser.Scene} scene the Phaser 3 Scene the game object will be added to
 * @property {string} assetKey the cached asset key that will be used for this game objects texture
 * @property {number} [assetFrame=0] the frame of the cached asset that will be used for this game objects texture, defaults to 0
 * @property {boolean} [skipBattleAnimations=false] used to skip all animations tied to the game object during battle
 * @property {number} [scale=1] the scale factor that will be applied to the x and y values of this game object
 */

export class Ball {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {Phaser.GameObjects.PathFollower} */
  #ball;
  /** @type {Phaser.Curves.Path} */
  #ballPath;
  /** @type {Phaser.GameObjects.Graphics} */
  #ballPathGraphics;
  /** @type {boolean} */
  #skipBattleAnimations;

  /**
   * @param {BallConfig} config
   */
  constructor(config) {
    if (config.assetFrame === undefined) {
      config.assetFrame = 0;
    }
    if (config.scale === undefined) {
      config.scale = 1;
    }
    if (config.skipBattleAnimations === undefined) {
      config.skipBattleAnimations = false;
    }
    this.#skipBattleAnimations = config.skipBattleAnimations;
    this.#scene = config.scene;
    this.#createCurvePath();
    this.#ball = this.#scene.add
      .follower(this.#ballPath, 0, 500, config.assetKey, config.assetFrame)
      .setAlpha(0)
      .setScale(config.scale);
  }

  /**
   * @returns {void}
   */
  #createCurvePath() {
    // create curved path for ball to follow
    const startPoint = new Phaser.Math.Vector2(0, 500);
    const controlPoint1 = new Phaser.Math.Vector2(200, 100);
    const controlPoint2 = new Phaser.Math.Vector2(725, 180);
    const endPoint = new Phaser.Math.Vector2(725, 180);
    const curve = new Phaser.Curves.CubicBezier(startPoint, controlPoint1, controlPoint2, endPoint);
    this.#ballPath = new Phaser.Curves.Path(0, 500).add(curve);

    // draw curve (for debugging)
    this.#ballPathGraphics = this.#scene.add.graphics();
    this.#ballPathGraphics.clear();
    this.#ballPathGraphics.lineStyle(4, 0x00ff00, 1);
    this.#ballPath.draw(this.#ballPathGraphics);
    this.#ballPathGraphics.setAlpha(0);
  }

  /**
   * @returns {void}
   */
  hide() {
    this.#ball.setAlpha(0);
  }

  /**
   * @returns {void}
   */
  showBallPath() {
    this.#ballPathGraphics.setAlpha(1);
  }

  /**
   * @returns {void}
   */
  hideBallPath() {
    this.#ballPathGraphics.setAlpha(0);
  }

  /**
   * @returns {Promise<void>}
   */
  playThrowBallAnimation() {
    return new Promise((resolve) => {
      if (this.#skipBattleAnimations) {
        this.#ball.setPosition(725, 180);
        this.#ball.setAlpha(1);
        resolve();
        return;
      }

      this.#ball.setPosition(0, 500);
      this.#ball.setAlpha(1);
      this.#ball.startFollow({
        delay: 0,
        duration: 1000,
        ease: Phaser.Math.Easing.Sine.InOut,
        onComplete: () => {
          resolve();
        },
      });
    });
  }

  /**
   * @param {number} [repeat=2]
   * @returns {Promise<void>}
   */
  playShakeBallAnimation(repeat = 2) {
    return new Promise((resolve) => {
      if (this.#skipBattleAnimations) {
        resolve();
        return;
      }

      this.#scene.tweens.add({
        duration: 150,
        repeatDelay: 800,
        targets: this.#ball,
        x: this.#ball.x + 10,
        y: this.#ball.y + 0,
        yoyo: true,
        repeat,
        delay: 200,
        ease: Phaser.Math.Easing.Sine.InOut,
        onComplete: () => {
          resolve();
        },
      });
    });
  }
}
