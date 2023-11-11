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
   * @param {Phaser.Scene} scene
   * @param {import("../../types/typedef").Coordinate} position
   */
  constructor(scene, position) {
    this._scene = scene;
    this._position = position;
    this._isAnimationPlaying = false;
    this._attackGameObject = undefined;
  }

  /** @type {Phaser.GameObjects.Sprite | Phaser.GameObjects.Container | undefined} */
  get gameObject() {
    return this._attackGameObject;
  }

  /**
   * @param {() => void} [callback]
   * @returns {void}
   */
  playAnimation(callback) {
    throw new Error('playAnimation is not implemented');
  }
}
