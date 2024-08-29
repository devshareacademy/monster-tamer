/**
 * Used for allowing the code to wait a certain amount of time before executing
 * the next code.
 * @param {number} milliseconds the number of milliseconds to wait
 * @param {Phaser.Scene} scene the Phaser Scene to use the time plugin from
 * @returns {Promise<void>}
 */
export function sleep(milliseconds, scene) {
  return new Promise((resolve) => {
    scene.time.delayedCall(milliseconds, () => {
      resolve();
    });
  });
}
