/**
 * @typedef StatChanges
 * @type {object}
 * @property {number} level
 * @property {number} health
 * @property {number} attack
 */

/**
 * Calculates the total number of experience points that are needed for a given level.
 * For a simple growth rate, we are using the same equation for all monsters in the game.
 * Example: if target level is 5, we need 125 total exp, vs level 100 were we need 1,000,000 exp.
 *
 * In the game, we have a max level of 100, so if the provided level is greater than that
 * we return the max exp that is needed for the max level.
 * @param {number} level the target level we need to the total experience for
 * @returns {number} the total experience amount needed to reach the provided level
 */
export function totalExpNeededForLevel(level) {
  if (level > 100) {
    return 100 ** 3;
  }
  return level ** 3;
}

/**
 * Calculates the number of experience points the monster needs to gain to reach the
 * next level. Calculation is based off the monsters current level and current exp points.
 *
 * In the game, we have a max level of 100, so if the provided level is at the current
 * max level, we return 0 exp.
 * @param {number} currentLevel the current level of the monster
 * @param {number} currentExp the current exp of the monster
 * @returns {number} the total experience points needed to reach the next level
 */
export function expNeededForNextLevel(currentLevel, currentExp) {
  if (currentLevel >= 100) {
    return 0;
  }
  return totalExpNeededForLevel(currentLevel + 1) - currentExp;
}

/**
 * Calculates the current value of exp to display on the exp bar.
 * The current value is based on how much more the exp the monster needs
 * to reach the next level. This is calculated by taking the monsters current
 * exp points, subtracting the base exp needed to reach the current level, and
 * then comparing that value against the exp points needed to reach the next level.
 * @param {number} currentLevel the current level of the monster
 * @param {number} currentExp the current exp of the monster
 * @returns {number} the total experience points needed to reach the next level
 */
export function calculateExpBarCurrentValue(currentLevel, currentExp) {
  const expNeededForCurrentLevel = totalExpNeededForLevel(currentLevel);
  let currentExpForBar = currentExp - expNeededForCurrentLevel;
  if (currentExpForBar < 0) {
    currentExpForBar = 0;
  }
  const expForNextLevel = totalExpNeededForLevel(currentLevel + 1);
  const maxExpForBar = expForNextLevel - expNeededForCurrentLevel;
  return currentExpForBar / maxExpForBar;
}

/**
 * Calculates the number of experience points a monster will gain from a given monster
 * based on that monsters baseExp value and current level.
 * @param {number} baseExp the base exp value for a given monster that was defeated or caught
 * @param {number} currentLevel the current level of a given monster that was defeated or caught
 * @param {boolean} isActiveMonster if the monster that is gaining the exp was the current active monster in battle
 * @returns {number} the number of experience points earned from this monster
 */
export function calculateExpGainedFromMonster(baseExp, currentLevel, isActiveMonster) {
  return Math.round(((baseExp * currentLevel) / 7) * (1 / (isActiveMonster ? 1 : 2)));
}

/**
 * Adds the given experience to the provided monster and handles increasing the monsters
 * level and stats if the monster leveled up.
 * @param {import("../types/typedef").Monster} monster the monster that is gaining the experience
 * @param {number} gainedExp the amount of experience the monster gained
 * @returns {StatChanges} the stat increases that were applied to the monster
 */
export function handleMonsterGainingExperience(monster, gainedExp) {
  if (monster.currentLevel === 100) {
    return;
  }

  monster.currentExp += gainedExp;
  // check if we have enough exp to gain a level
  let gainedLevel = false;
  const statChanges = {
    level: 0,
    health: 0,
    attack: 0,
  };
  do {
    gainedLevel = false;
    const expRequiredForNextLevel = totalExpNeededForLevel(monster.currentLevel + 1);
    if (monster.currentExp >= expRequiredForNextLevel) {
      monster.currentLevel += 1;
      const bonusAttack = Phaser.Math.Between(0, 1);
      const bonusHealth = Phaser.Math.Between(0, 3);
      const hpIncrease = 5 + bonusHealth;
      const atkIncrease = 1 + bonusAttack;
      monster.maxHp += hpIncrease;
      monster.currentAttack += atkIncrease;
      statChanges.level += 1;
      statChanges.health += hpIncrease;
      statChanges.attack += atkIncrease;

      gainedLevel = true;
    }
  } while (gainedLevel);

  return statChanges;
}
