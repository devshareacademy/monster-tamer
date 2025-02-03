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
 * @property {string} id the unique identifier for this monster
 * @property {number} monsterId the unique identifier for this monster type
 * @property {string} name the name of the monster
 * @property {string} assetKey the name of the asset key that should be used for this monster
 * @property {number} [assetFrame=0] if the asset key is tied to a spritesheet, this frame will be used, defaults to 0
 * @property {number} currentLevel the current level of this monster
 * @property {number} maxHp the max health of this monster
 * @property {number} currentHp the max health of this monster
 * @property {number} baseAttack the base attack value of this monster
 * @property {number[]} attackIds the ids of the attacks this monster uses
 * @property {number} currentAttack the current attack value of this monster
 * @property {number} baseExp the base exp value of this monster
 * @property {number} currentExp the current exp this monster has
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
 * @property {string} audioKey the unique key of the audio asset that is cached by phaser, will be passed to the phaser sound manager to play this audio object
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

/**
 * @typedef {keyof typeof ITEM_CATEGORY} ItemCategory
 */

/** @enum {ItemCategory} */
export const ITEM_CATEGORY = Object.freeze({
  HEAL: 'HEAL',
  CAPTURE: 'CAPTURE',
});

/**
 * @typedef {keyof typeof ITEM_EFFECT} ItemEffect
 */

/** @enum {ItemEffect} */
export const ITEM_EFFECT = Object.freeze({
  HEAL_30: 'HEAL_30',
  CAPTURE_1: 'CAPTURE_1',
});

/**
 * @typedef Item
 * @type {object}
 * @property {number} id the unique id of this item
 * @property {string} name the name of this item
 * @property {ItemEffect} effect the effect of using this item
 * @property {string} description the description of the item to show in the inventory bag
 * @property {ItemCategory} category the main category of this item, healing, capture, etc
 */

/**
 * @typedef BaseInventoryItem
 * @type {object}
 * @property {object} item
 * @property {number} item.id the unique id of this item
 * @property {number} quantity
 */

/**
 * @typedef Inventory
 * @type {BaseInventoryItem[]}
 */

/**
 * @typedef InventoryItem
 * @type {object}
 * @property {Item} item
 * @property {number} quantity
 */

/**
 * @typedef EncounterData
 * @type {Object.<string, number[][]>}
 */

/** NPC JSON Data Types */

/**
 * @typedef {keyof typeof NPC_EVENT_TYPE} NpcEventType
 */

/** @enum {NpcEventType} */
export const NPC_EVENT_TYPE = Object.freeze({
  MESSAGE: 'MESSAGE',
  SCENE_FADE_IN_AND_OUT: 'SCENE_FADE_IN_AND_OUT',
  HEAL: 'HEAL',
  TRADE: 'TRADE',
  ITEM: 'ITEM',
  BATTLE: 'BATTLE',
});

/**
 * @typedef NpcEventMessage
 * @type {object}
 * @property {'MESSAGE'} type
 * @property {string[]} requires
 * @property {object} data
 * @property {string[]} data.messages
 * @property {string[]} requires
 */

/**
 * @typedef NpcEventSceneFadeInAndOut
 * @type {object}
 * @property {'SCENE_FADE_IN_AND_OUT'} type
 * @property {string[]} requires
 * @property {object} data
 * @property {number} data.fadeInDuration
 * @property {number} data.fadeOutDuration
 * @property {number} data.waitDuration
 * @property {string[]} requires
 */

/**
 * @typedef NpcEventHeal
 * @type {object}
 * @property {'HEAL'} type
 * @property {string[]} requires
 * @property {object} data
 * @property {string[]} requires
 */

/**
 * @typedef NpcEvent
 * @type {NpcEventMessage | NpcEventSceneFadeInAndOut | NpcEventHeal}
 */

/**
 * @typedef NpcDetails
 * @type {object}
 * @property {number} frame
 * @property {string} animationKeyPrefix
 * @property {NpcEvent[]} events
 */

/**
 * @typedef NpcData
 * @type {Object.<string, NpcDetails>}
 */

/** Events JSON Data Types */

/**
 * @typedef {keyof typeof GAME_EVENT_TYPE} GameEventType
 */

/** @enum {GameEventType} */
export const GAME_EVENT_TYPE = Object.freeze({
  ADD_NPC: 'ADD_NPC',
  MOVE_TO_PLAYER: 'MOVE_TO_PLAYER',
  RETRACE_PATH: 'RETRACE_PATH',
  TALK_TO_PLAYER: 'TALK_TO_PLAYER',
  REMOVE_NPC: 'REMOVE_NPC',
  GIVE_MONSTER: 'GIVE_MONSTER',
  ADD_FLAG: 'ADD_FLAG',
  REMOVE_FLAG: 'REMOVE_FLAG',
});

/**
 * @typedef GameEventAddNpc
 * @type {object}
 * @property {'ADD_NPC'} type
 * @property {object} data
 * @property {import('../common/direction.js').Direction} data.direction
 * @property {number} data.x
 * @property {number} data.y
 * @property {number} data.frame
 * @property {number} data.id
 * @property {string} data.animationKeyPrefix
 */

/**
 * @typedef GameEventMoveToPlayer
 * @type {object}
 * @property {'MOVE_TO_PLAYER'} type
 * @property {object} data
 * @property {number} data.id
 */

/**
 * @typedef GameEventRetracePath
 * @type {object}
 * @property {'RETRACE_PATH'} type
 * @property {object} data
 * @property {number} data.id
 * @property {import('../common/direction.js').Direction} data.direction
 */

/**
 * @typedef GameEventTalkToPlayer
 * @type {object}
 * @property {'TALK_TO_PLAYER'} type
 * @property {object} data
 * @property {number} data.id
 * @property {string[]} data.messages
 */

/**
 * @typedef GameEventRemoveNpc
 * @type {object}
 * @property {'REMOVE_NPC'} type
 * @property {object} data
 * @property {number} data.id
 */

/**
 * @typedef GameEventGiveMonster
 * @type {object}
 * @property {'GIVE_MONSTER'} type
 * @property {object} data
 * @property {number} data.id
 */

/**
 * @typedef GameEventAddFlag
 * @type {object}
 * @property {'ADD_FLAG'} type
 * @property {object} data
 * @property {GameFlag} data.flag
 */

/**
 * @typedef GameEventRemoveFlag
 * @type {object}
 * @property {'REMOVE_FLAG'} type
 * @property {object} data
 * @property {GameFlag} data.flag
 */

/**
 * @typedef GameEvent
 * @type {GameEventAddNpc | GameEventMoveToPlayer | GameEventRetracePath | GameEventRemoveNpc | GameEventTalkToPlayer | GameEventGiveMonster | GameEventAddFlag | GameEventRemoveFlag}
 */

/**
 * @typedef EventDetails
 * @type {object}
 * @property {string[]} requires
 * @property {GameEvent[]} events
 */

/**
 * @typedef EventData
 * @type {Object.<string, EventDetails>}
 */

/** Game Flags Data Types */
/**
 * @typedef {keyof typeof GAME_FLAG} GameFlag
 */

/** @enum {GameFlag} */
export const GAME_FLAG = Object.freeze({
  LOOKING_FOR_PROFESSOR: 'LOOKING_FOR_PROFESSOR',
  FOUND_PROFESSOR: 'FOUND_PROFESSOR',
});

/** Encounter Zone Tile Types */
/**
 * @typedef {keyof typeof ENCOUNTER_TILE_TYPE} EncounterTileType
 */

/** @enum {EncounterTileType} */
export const ENCOUNTER_TILE_TYPE = Object.freeze({
  NONE: 'NONE',
  GRASS: 'GRASS',
});
