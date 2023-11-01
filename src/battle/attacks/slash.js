import Phaser from '../../lib/phaser.js';
import { ATTACK_ASSET_KEYS } from '../../assets/asset-keys.js';
import { Attack } from './attack.js';

export class Slash extends Attack {
  /** @protected @type {Phaser.GameObjects.Container} */
  _attackGameObject;
  /** @type {Phaser.GameObjects.Sprite} */
  #attackGameObject1;
  /** @type {Phaser.GameObjects.Sprite} */
  #attackGameObject2;
  /** @type {Phaser.GameObjects.Sprite} */
  #attackGameObject3;

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene the game object will be added to
   * @param {import('../../types/typedef.js').Coordinate} position the position the game object will be added to
   */
  constructor(scene, position) {
    super(scene, position);

    // create animations
    this._scene.anims.create({
      key: ATTACK_ASSET_KEYS.SLASH,
      frames: this._scene.anims.generateFrameNumbers(ATTACK_ASSET_KEYS.SLASH),
      frameRate: 4,
      repeat: 0,
      delay: 0,
    });

    // create game objects
    this.#attackGameObject1 = this._scene.add
      .sprite(0, 0, ATTACK_ASSET_KEYS.SLASH, 0)
      .setOrigin(0.5)
      .setScale(4)
      .setTint(0x000000, 0x000000, 0x000000, 0xffffff);
    this.#attackGameObject2 = this._scene.add
      .sprite(30, 0, ATTACK_ASSET_KEYS.SLASH, 0)
      .setOrigin(0.5)
      .setScale(4)
      .setTint(0x000000, 0x000000, 0x000000, 0xffffff);
    this.#attackGameObject3 = this._scene.add
      .sprite(-30, 0, ATTACK_ASSET_KEYS.SLASH, 0)
      .setOrigin(0.5)
      .setScale(4)
      .setTint(0x000000, 0x000000, 0x000000, 0xffffff);
    this._attackGameObject = this._scene.add
      .container(this._position.x, this._position.y, [
        this.#attackGameObject1,
        this.#attackGameObject2,
        this.#attackGameObject3,
      ])
      .setAlpha(1);
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
    this.#attackGameObject1.play(ATTACK_ASSET_KEYS.SLASH);
    this.#attackGameObject2.play(ATTACK_ASSET_KEYS.SLASH);
    this.#attackGameObject3.play(ATTACK_ASSET_KEYS.SLASH);

    this.#attackGameObject1.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_ASSET_KEYS.SLASH, () => {
      this._attackGameObject.setAlpha(0);
      this.#attackGameObject1.setFrame(0);
      this.#attackGameObject2.setFrame(0);
      this.#attackGameObject3.setFrame(0);
      this.isAnimationPlaying = false;

      if (callback) {
        callback();
      }
    });
  }
}
