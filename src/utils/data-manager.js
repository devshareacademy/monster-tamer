import Phaser from '../lib/phaser.js';
import { TILE_SIZE } from '../config.js';
import { DIRECTION } from '../common/direction.js';

/**
 * @typedef GlobalState
 * @type {object}
 * @property {object} player
 * @property {object} player.position
 * @property {number} player.position.x
 * @property {number} player.position.y
 * @property {import('../common/direction.js').Direction} player.direction
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
};

export const DATA_MANAGER_STORE_KEYS = Object.freeze({
  PLAYER_POSITION: 'PLAYER_POSITION',
  PLAYER_DIRECTION: 'PLAYER_DIRECTION',
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
  }

  get store() {
    return this.#store;
  }

  loadData() {
    // attempt to load data from browser storage and populate the data manager
  }

  saveData() {
    // attempt to storage data in browser storage from data manager
  }
}

export const dataManager = new DataManager();
