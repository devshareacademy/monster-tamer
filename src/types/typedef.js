import Phaser from '../lib/phaser.js';

/**
 * @typedef BattleMonsterConfig
 * @type {object}
 * @property {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
 * @property {Monster} monsterDetails the details of the monster that is currently in battle
 * @property {number} [scaleHealthBarBackgroundImageByY=1] scales the health bar background vertically by the specified value, defaults to 1
 * @property {boolean} [skipBattleAnimations=false] used to skip all animations tied to the monster during battle
 */

/**
 * @typedef Monster
 * @type {object}
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
 * @type {object}
 * @property {number} x the position of this coordinate
 * @property {number} y the position of this coordinate
 */

/**
 * @typedef Attack
 * @type {object}
 * @property {number} id the unique id of this attack
 * @property {string} name the name of this attack
 * @property {import('../battle/attacks/attack-keys.js').AttackKeys} animationName the animation key that is tied to this attack, will be used to play the attack animation when attack is used.
 */

/**
 * @typedef Animation
 * @type {object}
 * @property {string} key
 * @property {number[]} [frames]
 * @property {number} frameRate
 * @property {number} repeat
 * @property {number} delay
 * @property {boolean} yoyo
 * @property {string} assetKey
 */
