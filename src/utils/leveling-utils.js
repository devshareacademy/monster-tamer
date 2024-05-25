/**
 * @typedef StatChanges
 * @type {object}
 * @property {number} level
 * @property {number} health
 * @property {number} attack
 */

export function calculateExpBarCurrentValue(currentLevel, currentExp) {
  return 0.5;
}

export function calculateExpGainedFromMonster(baseExp, currentLevel, isActiveMonster) {
  return 10;
}

export function expNeededForNextLevel(currentLevel, currentExp) {
  return 5;
}

export function handleMonsterGainingExperience(monster, gainedExp) {
  const statChanges = {
    level: 0,
    health: 0,
    attack: 0,
  };
  return statChanges;
}
