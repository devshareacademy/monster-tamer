import Phaser from '../lib/phaser.js';

/**
 * @typedef BattleMonsterConfig
 * @type {object}
 * @property {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
 * @property {Monster} monsterDetails the details of the monster that is currently in battle
 */

/**
 * @typedef Monster
 * @type {object}
 * @property {string} name the name of the monster
 * @property {string} assetKey the name of the asset key that should be used for this monster
 * @property {number} [assetFrame=0] if the asset key is tied to a spritesheet, this frame will be used, defaults to 0
 * @property {number} maxHp the max health of this monster
 * @property {number} currentHp the max health of this monster
 * @property {number} baseAttack the base attack value of this monster
 * @property {string[]} attackIds the ids of the attacks this monster uses
 */

/**
 * @typedef Coordinate
 * @type {object}
 * @property {number} x the position of this coordinate
 * @property {number} y the position of this coordinate
 */
