import Phaser from '../../lib/phaser.js';
import { ATTACK_ASSET_KEYS } from '../../assets/asset-keys.js';
import { Attack } from './attack.js';

export class Bubble2 extends Attack {
  /** @protected @type {Phaser.GameObjects.Particles.ParticleEmitter} */
  _emitter;

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene the game object will be added to
   * @param {import('../../types/typedef.js').Coordinate} position the position the game object will be added to
   * @param {import('../../types/typedef.js').Coordinate} targetPosition the position the attack is targeting
   */
  constructor(scene, position, targetPosition) {
    super(scene, position);

    // Calculate angle and distance
    const angle = Phaser.Math.Angle.Between(this._position.x, this._position.y, targetPosition.x, targetPosition.y);
    const distance = Phaser.Math.Distance.Between(
      this._position.x,
      this._position.y,
      targetPosition.x,
      targetPosition.y
    );

    this._emitter = this._scene.add.particles(position.x, position.y, ATTACK_ASSET_KEYS.BUBBLE_2, {
      active: true,
      lifespan: (distance / 220) * 1000,
      speed: { min: 220, max: 250 },
      scale: { start: 0.2, end: 1 },
      quantity: 1,
      frequency: 150,
      duration: 2500,
      angle: { min: Phaser.Math.RadToDeg(angle) - 10, max: Phaser.Math.RadToDeg(angle) + 10 },
    });
    this._emitter.stop();
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

    this._emitter.start();

    this._emitter.on(Phaser.GameObjects.Particles.Events.COMPLETE, () => {
      this._isAnimationPlaying = false;
      if (callback) {
        callback();
      }
    });
  }
}
