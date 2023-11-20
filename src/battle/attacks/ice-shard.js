import Phaser from '../../lib/phaser.js';
import { ATTACK_ASSET_KEYS } from '../../assets/asset-keys.js';
import { Attack } from './attack.js';

export class IceShard extends Attack {
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
      .sprite(this._position.x, this._position.y, ATTACK_ASSET_KEYS.ICE_SHARD, 5)
      .setOrigin(0.5)
      .setScale(4)
      .setAlpha(0);
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
    this._attackGameObject.setAlpha(1);

    // play animation and once complete call the callback
    this._attackGameObject.play(ATTACK_ASSET_KEYS.ICE_SHARD_START);

    this._attackGameObject.once(
      Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_ASSET_KEYS.ICE_SHARD_START,
      () => {
        this._attackGameObject.play(ATTACK_ASSET_KEYS.ICE_SHARD);
      }
    );

    this._attackGameObject.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_ASSET_KEYS.ICE_SHARD, () => {
      this._isAnimationPlaying = false;
      this._attackGameObject.setAlpha(0).setFrame(0);

      if (callback) {
        callback();
      }
    });
  }
}
