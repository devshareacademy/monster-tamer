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

    this.#scene = config.scene;
    this.#skipBattleAnimations = config.skipBattleAnimations;
    this.#createCurvePath();
    this.#ball = this.#scene.add
      .follower(this.#ballPath, 0, 500, config.assetKey, config.assetFrame)
      .setScale(config.scale);
    this.#ball.startFollow({
      delay: 0,
      duration: 1000,
      ease: Phaser.Math.Easing.Sine.InOut,
      onComplete: () => {
        console.log('done');
      },
    });
  }

  #createCurvePath() {
    const startPoint = new Phaser.Math.Vector2(0, 500);
    const controlPoint1 = new Phaser.Math.Vector2(200, 100);
    const controlPoint2 = new Phaser.Math.Vector2(725, 180);
    const endPoint = new Phaser.Math.Vector2(725, 180);
    const curve = new Phaser.Curves.CubicBezier(startPoint, controlPoint1, controlPoint2, endPoint);
    this.#ballPath = new Phaser.Curves.Path(0, 500).add(curve);

    this.#ballPathGraphics = this.#scene.add.graphics();
    this.#ballPathGraphics.clear();
    this.#ballPathGraphics.lineStyle(4, 0x00ff00, 1);
    this.#ballPath.draw(this.#ballPathGraphics);
  }
}
