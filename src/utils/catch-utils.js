import { BattleMonster } from '../battle/monsters/battle-monster.js';
import Phaser from '../lib/phaser.js';

/**
 * @param {BattleMonster} monster
 * @returns {number}
 */
export function calculateMinValueForCapture(monster) {
  const baseMin = 80;
  const healthRatio = monster.currentHp / monster.maxHp;

  let healthFactor = 0;
  if (healthRatio < 0.25) {
    healthFactor = 4;
  } else if (healthRatio < 0.5) {
    healthFactor = 3;
  } else if (healthRatio < 0.75) {
    healthFactor = 2;
  } else if (healthRatio < 0.9) {
    healthFactor = 1;
  }
  return baseMin - healthFactor * 5;
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
