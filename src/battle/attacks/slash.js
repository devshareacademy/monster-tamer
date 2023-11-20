import Phaser from '../../lib/phaser.js';
import { ATTACK_ASSET_KEYS } from '../../assets/asset-keys.js';
import { Attack } from './attack.js';

export class Slash extends Attack {
  /** @protected @type {Phaser.GameObjects.Container} */
  _attackGameObject;
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject1;
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject2;
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject3;

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene the game object will be added to
   * @param {import('../../types/typedef.js').Coordinate} position the position the game object will be added to
   */
  constructor(scene, position) {
    super(scene, position);

    // create game objects
    this._attackGameObject1 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.SLASH, 0).setOrigin(0.5).setScale(4);
    this._attackGameObject2 = this._scene.add.sprite(30, 0, ATTACK_ASSET_KEYS.SLASH, 0).setOrigin(0.5).setScale(4);
    this._attackGameObject3 = this._scene.add.sprite(-30, 0, ATTACK_ASSET_KEYS.SLASH, 0).setOrigin(0.5).setScale(4);
    this._attackGameObject = this._scene.add
      .container(this._position.x, this._position.y, [
        this._attackGameObject1,
        this._attackGameObject2,
        this._attackGameObject3,
      ])
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

    this._attackGameObject1.play(ATTACK_ASSET_KEYS.SLASH);
    this._attackGameObject2.play(ATTACK_ASSET_KEYS.SLASH);
    this._attackGameObject3.play(ATTACK_ASSET_KEYS.SLASH);

    this._attackGameObject1.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_ASSET_KEYS.SLASH, () => {
      this._isAnimationPlaying = false;
      this._attackGameObject.setAlpha(0);
      this._attackGameObject1.setFrame(0);
      this._attackGameObject2.setFrame(0);
      this._attackGameObject3.setFrame(0);

      if (callback) {
        callback();
      }
    });
  }
}
