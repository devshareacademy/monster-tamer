/**
 * Used for allowing the code to wait a certain amount of time before executing
 * the next code.
 * @param {number} milliseconds the number of milliseconds to wait
 * @returns {Promise<void>}
 */
export function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
