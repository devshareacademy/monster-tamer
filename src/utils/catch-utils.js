import Phaser from '../lib/phaser.js';

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

export function calculateMonsterCaptureResults(monster) {
  const minValueRequiredForCapture = calculateMinValueForCapture(monster);
  const randomValue = Phaser.Math.Between(0, 100);
  return {
    requiredCaptureValue: minValueRequiredForCapture,
    actualCaptureValue: randomValue,
    wasCaptured: randomValue >= minValueRequiredForCapture,
  };
}
