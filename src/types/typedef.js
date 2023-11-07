import Phaser from '../lib/phaser.js';

/**
 * @typedef BattleMonsterConfig
 * @type {Object}
 * @property {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
 * @property {Monster} monsterDetails the details of the monster that is currently in battle
 * @property {number} [scaleHealthBarBackgroundImageByY=1] scales the health bar background vertically by the specified value, defaults to 1
 */

/**
 * @typedef Monster
 * @type {Object}
 * @property {string} name the name of the monster
 * @property {string} assetKey the name of the asset key that should be used for this monster
 * @property {number} [assetFrame=0] if the asset key is tied to a spritesheet, this frame will be used, defaults to 0
 * @property {number} currentLevel the current level of this monster
 * @property {number} maxHp the max health of this monster
 * @property {number} currentHp the max health of this monster
 * @property {number} baseAttack the base attack value of this monster
 * @property {number[]} attackIds the ids of the attacks this monster uses
 */

/**
 * @typedef Coordinate
 * @type {Object}
 * @property {number} x the position of this coordinate
 * @property {number} y the position of this coordinate
 */

/**
 * @typedef Attack
 * @type {Object}
 * @property {number} id the unique id of this attack
 * @property {string} name the name of this attack
 * @property {string} animationName the animation key that is tied to this attack, will be used to play the attack animation when attack is used.
 */
