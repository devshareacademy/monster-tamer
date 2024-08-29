import Phaser from '../lib/phaser.js';
import { BattleMonster } from '../battle/monsters/battle-monster.js';

/**
 * @param {BattleMonster} monster
 * @returns {number}
 */
export function calculateMinValueForCapture(monster) {
  let baseMin = 80;
  const healthRatio = monster.currentHp / monster.maxHp;

  if (healthRatio < 0.25) {
    baseMin -= 20;
  } else if (healthRatio < 0.5) {
    baseMin -= 15;
  } else if (healthRatio < 0.75) {
    baseMin -= 10;
  } else if (healthRatio < 0.9) {
    baseMin -= 5;
  }

  return baseMin;
}

/**
 * @typedef CaptureMonsterResults
 * @type {object}
 * @property {number} requiredCaptureValue
 * @property {number} actualCaptureValue
 * @property {boolean} wasCaptured
 */

/**
 * @param {BattleMonster} monster
 * @returns {CaptureMonsterResults}
 */
export function calculateMonsterCaptureResults(monster) {
  const minValueRequiredForCapture = calculateMinValueForCapture(monster);
  const randomValue = Phaser.Math.Between(0, 100);
  return {
    requiredCaptureValue: minValueRequiredForCapture,
    actualCaptureValue: randomValue,
    wasCaptured: randomValue >= minValueRequiredForCapture,
  };
}
