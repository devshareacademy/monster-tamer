import Phaser from '../../lib/phaser.js';
import { ATTACK_ASSET_KEYS } from '../../assets/asset-keys.js';
import { Attack } from './attack.js';

export class Bubble1 extends Attack {
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject;

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene the game object will be added to
   * @param {import('../../types/typedef.js').Coordinate} position the position the game object will be added to
   */
  constructor(scene, position) {
    super(scene, position);

    // create game object
    this._attackGameObject = this._scene.add
      .sprite(this._position.x, this._position.y, ATTACK_ASSET_KEYS.BUBBLE_1, 0)
      .setOrigin(0, 1)
      .setScale(6, 5)
      .setVisible(false);

    if (this._scene.anims.get(ATTACK_ASSET_KEYS.BUBBLE_1) === undefined) {
      this._scene.anims.create({
        key: ATTACK_ASSET_KEYS.BUBBLE_1,
        frameRate: 8,
        frames: this._scene.anims.generateFrameNames(ATTACK_ASSET_KEYS.BUBBLE_1),
        repeat: 0,
      });
    }
  }

  /**
   * @param {() => void} [callback]
   * @returns {void}
   */
  playAnimation(callback) {
    if (this._isAnimationPlaying) {
      return;
    }

    this._isAnimationPlaying = true;
    this._attackGameObject.setVisible(true);

    // play animation and once complete call the callback
    this._attackGameObject.play(ATTACK_ASSET_KEYS.BUBBLE_1);

    this._attackGameObject.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_ASSET_KEYS.BUBBLE_1, () => {
      this._isAnimationPlaying = false;
      this._attackGameObject.setVisible(false).setFrame(0);

      if (callback) {
        callback();
      }
    });
  }
}
