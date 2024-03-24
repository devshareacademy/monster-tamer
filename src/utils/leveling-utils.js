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
