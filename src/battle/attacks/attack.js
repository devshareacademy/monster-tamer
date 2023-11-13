import Phaser from '../../lib/phaser.js';

export class Attack {
  /** @protected @type {Phaser.Scene} */
  _scene;
  /** @protected @type {import("../../types/typedef").Coordinate} */
  _position;
  /** @protected @type {boolean} */
  _isAnimationPlaying;
  /** @protected @type {Phaser.GameObjects.Sprite | Phaser.GameObjects.Container | undefined} */
  _attackGameObject;

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene the game object will be added to
   * @param {import('../../types/typedef.js').Coordinate} position the position the game object will be added to
   */
  constructor(scene, position) {
    if (this.constructor === Attack) {
      throw new Error('Attack is an abstract class and cannot be instantiated.');
    }

    this._scene = scene;
    this._position = position;
    this._isAnimationPlaying = false;
    this._attackGameObject = undefined;
  }

  /**
   * @type {Phaser.GameObjects.Sprite | Phaser.GameObjects.Container | undefined}
   * Will be undefined if the attack does not create a Phaser 3 Game Object instance.
   * */
  get gameObject() {
    return this._attackGameObject;
  }

  /**
   * @param {() => void} [callback]
   * @returns {void}
   */
  playAnimation(callback) {
    throw new Error('playAnimation is not implemented.');
  }
}
