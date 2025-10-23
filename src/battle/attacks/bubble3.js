import Phaser from '../../lib/phaser.js';
import { ATTACK_ASSET_KEYS } from '../../assets/asset-keys.js';
import { Attack } from './attack.js';

export class Bubble3 extends Attack {
  /** @protected @type {Phaser.GameObjects.Group} */
  _bubbleGroup;
  /** @protected @type {import('../../types/typedef.js').Coordinate} */
  _targetPosition;

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene the game object will be added to
   * @param {import('../../types/typedef.js').Coordinate} position the position the game object will be added to
   * @param {import('../../types/typedef.js').Coordinate} targetPosition the position the attack is targeting
   */
  constructor(scene, position, targetPosition) {
    super(scene, position);
    this._targetPosition = targetPosition;
    this._bubbleGroup = this._scene.add.group({
      maxSize: 5,
      runChildUpdate: true,
    });
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

    const BUBBLE_COUNT = 5;
    const BUBBLE_DELAY = 300; // ms between each bubble launch
    const TWEEN_DURATION = 1200; // ms for each bubble to reach target

    for (let i = 0; i < BUBBLE_COUNT; i += 1) {
      this._scene.time.delayedCall(i * BUBBLE_DELAY, () => {
        /** @type {Phaser.GameObjects.Sprite} */
        const bubble = this._bubbleGroup.getFirstDead(
          true,
          this._position.x,
          this._position.y,
          ATTACK_ASSET_KEYS.BUBBLE_3,
          0,
          true
        );
        bubble.setActive(true).setVisible(true);

        const startX = this._position.x;
        const startY = this._position.y;
        const endX = this._targetPosition.x;
        const endY = this._targetPosition.y;

        const randomWaveAmplitude = Phaser.Math.Between(10, 30); // Random amplitude for the wave
        const randomWaveFrequency = Phaser.Math.Between(2, 5); // Random frequency for the wave

        this._scene.tweens.add({
          targets: bubble,
          x: {
            getStart: () => startX,
            getEnd: () => endX,
          },
          y: {
            getStart: () => startY,
            getEnd: () => endY,
          },
          duration: TWEEN_DURATION,
          ease: 'Linear',
          onUpdate: (tween, target) => {
            const progress = tween.progress;
            const currentX = Phaser.Math.Linear(startX, endX, progress);
            const currentY = Phaser.Math.Linear(startY, endY, progress);

            // Add sine wave to Y
            const waveY = Math.sin(progress * Math.PI * randomWaveFrequency) * randomWaveAmplitude;

            target.x = currentX;
            target.y = currentY + waveY;
          },
          onComplete: () => {
            bubble.setActive(false).setVisible(false);
          },
        });
      });
    }

    // Set animation to complete after all bubbles have launched and finished their tweens
    this._scene.time.delayedCall(BUBBLE_COUNT * BUBBLE_DELAY + TWEEN_DURATION, () => {
      this._isAnimationPlaying = false;
      if (callback) {
        callback();
      }
    });
  }
}
