import Phaser from '../lib/phaser.js';

/**
 * @typedef AnimatedBarConfig
 * @type {object}
 * @property {Phaser.Scene} scene the Phaser 3 Scene the animated bar will be added to
 * @property {number} x the x position to place the animated bar container
 * @property {number} y the y position to place the animated bar container
 * @property {number} width the full width of our animated bar component
 * @property {number} [scaleY=0.7] the scale factor applied to the height of each image of this animated bar component
 * @property {string} leftCapAssetKey asset key of left image used to create the animated bar
 * @property {string} middleAssetKey asset key of middle image used to create the animated bar
 * @property {string} rightCapAssetKey asset key of right image used to create the animated bar
 * @property {string} leftShadowCapAssetKey asset key of left background image used to create the animated bar
 * @property {string} middleShadowAssetKey asset key of middle background image used to create the animated bar
 * @property {string} rightShadowCapAssetKey asset key of right background image used to create the animated bar
 */

export class AnimatedBar {
  /** @protected @type {Phaser.Scene} */
  _scene;
  /** @protected @type {Phaser.GameObjects.Container} */
  _container;
  /** @protected @type {number} */
  _fullWidth;
  /** @protected @type {number} */
  _scaleY;
  /** @protected @type {Phaser.GameObjects.Image} */
  _leftCap;
  /** @protected @type {Phaser.GameObjects.Image} */
  _middle;
  /** @protected @type {Phaser.GameObjects.Image} */
  _rightCap;
  /** @protected @type {Phaser.GameObjects.Image} */
  _leftShadowCap;
  /** @protected @type {Phaser.GameObjects.Image} */
  _middleShadow;
  /** @protected @type {Phaser.GameObjects.Image} */
  _rightShadowCap;
  /** @protected @type {AnimatedBarConfig} */
  _config;

  /**
   * @param {AnimatedBarConfig} config the configuration used for this Animated Bar component
   */
  constructor(config) {
    if (this.constructor === AnimatedBar) {
      throw new Error('AnimatedBar is an abstract class and cannot be instantiated.');
    }

    this._scene = config.scene;
    this._fullWidth = config.width;
    this._scaleY = config.scaleY;
    this._config = config;

    this._container = this._scene.add.container(config.x, config.y, []);
    this._createBarShadowImages(config.x, config.y);
    this._createBarImages(config.x, config.y);
    this._setMeterPercentage(1);
  }

  /** @type {Phaser.GameObjects.Container} */
  get container() {
    return this._container;
  }

  /**
   * @protected
   * @param {number} x the x position to place the animated bar game object
   * @param {number} y the y position to place the animated bar game object
   * @returns {void}
   */
  _createBarShadowImages(x, y) {
    this._leftShadowCap = this._scene.add
      .image(x, y, this._config.leftShadowCapAssetKey)
      .setOrigin(0, 0.5)
      .setScale(1, this._scaleY);

    this._middleShadow = this._scene.add
      .image(this._leftShadowCap.x + this._leftShadowCap.width, y, this._config.middleShadowAssetKey)
      .setOrigin(0, 0.5)
      .setScale(1, this._scaleY);
    this._middleShadow.displayWidth = this._fullWidth;

    this._rightShadowCap = this._scene.add
      .image(this._middleShadow.x + this._middleShadow.displayWidth, y, this._config.rightShadowCapAssetKey)
      .setOrigin(0, 0.5)
      .setScale(1, this._scaleY);

    this._container.add([this._leftShadowCap, this._middleShadow, this._rightShadowCap]);
  }

  /**
   * @protected
   * @param {number} x the x position to place the animated bar game object
   * @param {number} y the y position to place the animated bar game object
   * @returns {void}
   */
  _createBarImages(x, y) {
    this._leftCap = this._scene.add
      .image(x, y, this._config.leftCapAssetKey)
      .setOrigin(0, 0.5)
      .setScale(1, this._scaleY);

    this._middle = this._scene.add
      .image(this._leftCap.x + this._leftCap.width, y, this._config.middleAssetKey)
      .setOrigin(0, 0.5)
      .setScale(1, this._scaleY);

    this._rightCap = this._scene.add
      .image(this._middle.x + this._middle.displayWidth, y, this._config.rightCapAssetKey)
      .setOrigin(0, 0.5)
      .setScale(1, this._scaleY);

    this._container.add([this._leftCap, this._middle, this._rightCap]);
  }

  /**
   * @protected
   * @param {number} [percent=1] a number between 0 and 1 that is used for setting how filled the animated bar is
   * @returns {void}
   */
  _setMeterPercentage(percent = 1) {
    const width = this._fullWidth * percent;
    this._middle.displayWidth = width;
    this._updateBarGameObjects();
  }

  /**
   * @protected
   * @returns {void}
   */
  _updateBarGameObjects() {
    this._rightCap.x = this._middle.x + this._middle.displayWidth;
    const isVisible = this._middle.displayWidth > 0;
    this._leftCap.visible = isVisible;
    this._middle.visible = isVisible;
    this._rightCap.visible = isVisible;
  }

  /**
   * @param {number} [percent=1] a number between 0 and 1 that is used for setting how filled the animated bar is
   * @param {object} [options] optional configuration options that can be provided for the animation
   * @param {number} [options.duration=1000] the duration of the animated bar animation
   * @param {() => void} [options.callback] an optional callback that will be called when the animation is complete
   * @param {boolean} [options.skipBattleAnimations=false] determines if we skip the animated bar animation
   * @returns {void}
   */
  setMeterPercentageAnimated(percent, options) {
    const width = this._fullWidth * percent;

    if (options?.skipBattleAnimations) {
      this._setMeterPercentage(percent);
      if (options?.callback) {
        options.callback();
      }
      return;
    }

    this._scene.tweens.add({
      targets: this._middle,
      displayWidth: width,
      duration: options?.duration || options?.duration === 0 ? 0 : 1000,
      ease: Phaser.Math.Easing.Sine.Out,
      onUpdate: () => {
        this._updateBarGameObjects();
      },
      onComplete: options?.callback,
    });
  }
}
