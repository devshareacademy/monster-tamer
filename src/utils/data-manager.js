import Phaser from '../lib/phaser.js';
import { TILE_SIZE } from '../config.js';
import { DIRECTION } from '../common/direction.js';
import { BATTLE_SCENE_OPTIONS, BATTLE_STYLE_OPTIONS, SOUND_OPTIONS, TEXT_SPEED_OPTIONS } from '../common/options.js';

/**
 * @typedef GlobalState
 * @type {object}
 * @property {object} player
 * @property {object} player.position
 * @property {number} player.position.x
 * @property {number} player.position.y
 * @property {import('../common/direction.js').Direction} player.direction
 * @property {object} options
 * @property {import('../common/options.js').TextSpeedMenuOptions} options.textSpeed
 * @property {import('../common/options.js').BattleSceneMenuOptions} options.battleSceneAnimations
 * @property {import('../common/options.js').BattleStyleMenuOptions} options.battleStyle
 * @property {import('../common/options.js').SoundMenuOptions} options.sound
 * @property {import('../common/options.js').VolumeMenuOptions} options.volume
 * @property {import('../common/options.js').VolumeMenuOptions} options.menuColor
 */

/** @type {GlobalState} */
const initialState = {
  player: {
    position: {
      x: 6 * TILE_SIZE,
      y: 21 * TILE_SIZE,
    },
    direction: DIRECTION.DOWN,
  },
  options: {
    textSpeed: TEXT_SPEED_OPTIONS.MID,
    battleSceneAnimations: BATTLE_SCENE_OPTIONS.ON,
    battleStyle: BATTLE_STYLE_OPTIONS.SHIFT,
    sound: SOUND_OPTIONS.ON,
    volume: 4,
    menuColor: 0,
  },
};

export const DATA_MANAGER_STORE_KEYS = Object.freeze({
  PLAYER_POSITION: 'PLAYER_POSITION',
  PLAYER_DIRECTION: 'PLAYER_DIRECTION',
  OPTIONS_TEXT_SPEED: 'OPTIONS_TEXT_SPEED',
  OPTIONS_BATTLE_SCENE_ANIMATIONS: 'OPTIONS_BATTLE_SCENE_ANIMATIONS',
  OPTIONS_BATTLE_STYLE: 'OPTIONS_BATTLE_STYLE',
  OPTIONS_SOUND: 'OPTIONS_SOUND',
  OPTIONS_VOLUME: 'OPTIONS_VOLUME',
  OPTIONS_MENU_COLOR: 'OPTIONS_MENU_COLOR',
});

class DataManager extends Phaser.Events.EventEmitter {
  /** @type {Phaser.Data.DataManager} */
  #store;

  constructor() {
    super();
    this.#store = new Phaser.Data.DataManager(this);
    // initialize state with initial values
    this.#store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, initialState.player.position);
    this.#store.set(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION, initialState.player.direction);
    this.#store.set(DATA_MANAGER_STORE_KEYS.OPTIONS_TEXT_SPEED, initialState.options.textSpeed);
    this.#store.set(
      DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_SCENE_ANIMATIONS,
      initialState.options.battleSceneAnimations
    );
    this.#store.set(DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_STYLE, initialState.options.battleStyle);
    this.#store.set(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND, initialState.options.sound);
    this.#store.set(DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME, initialState.options.volume);
    this.#store.set(DATA_MANAGER_STORE_KEYS.OPTIONS_MENU_COLOR, initialState.options.menuColor);
  }

  get store() {
    return this.#store;
  }

  loadData() {
    // attempt to load data from browser storage and populate the data manager
    if (typeof Storage === 'undefined') {
      console.warn(
        `[${DataManager.name}:loadData] localStorage is not supported, will not be able to save and load data.`
      );
      return;
    }
  }

  saveData() {
    // attempt to storage data in browser storage from data manager
    if (typeof Storage === 'undefined') {
      console.warn(
        `[${DataManager.name}:saveData] localStorage is not supported, will not be able to save and load data.`
      );
      return;
    }
  }
}

export const dataManager = new DataManager();
