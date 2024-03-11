import Phaser from '../lib/phaser.js';

/**
 * @typedef AnimateTextConfig
 * @type {object}
 * @property {() => void} [callback]
 * @property {number} [delay=25]
 */

/**
 *
 * @param {Phaser.Scene} scene the Phaser 3 Scene the time event will be added to
 * @param {Phaser.GameObjects.Text} target the Phaser 3 Text Game Object that will be animated
 * @param {string} text the text to display on the target game object
 * @param {AnimateTextConfig} [config]
 * @returns {void}
 */
export function animateText(scene, target, text, config) {
  const length = text.length;
  let i = 0;
  scene.time.addEvent({
    callback: () => {
      target.text += text[i];
      ++i;
      if (i === length - 1 && config?.callback) {
        config.callback();
      }
    },
    repeat: length - 1,
    delay: config?.delay || 25,
  });
}

export const CANNOT_READ_SIGN_TEXT = 'You cannot read the sign from this direction.';
export const SAMPLE_TEXT = 'Make sure you talk to npcs for helpful tips!';
export const LONG_SAMPLE_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Enim sed faucibus turpis in eu mi bibendum.';
