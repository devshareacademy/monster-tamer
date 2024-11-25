import Phaser from '../lib/phaser.js';
import { DIRECTION } from '../common/direction.js';
import { TEXT_SPEED, TILE_SIZE } from '../config.js';
import { TEXT_SPEED_OPTIONS, BATTLE_SCENE_OPTIONS, BATTLE_STYLE_OPTIONS, SOUND_OPTIONS } from '../common/options.js';
import { exhaustiveGuard } from './guard.js';
import { DataUtils } from './data-utils.js';
import { GAME_FLAG } from '../types/typedef.js';

const LOCAL_STORAGE_KEY = 'MONSTER_TAMER_DATA';

/**
 * @typedef PlayerLocation
 * @type {object}
 * @property {string} area
 * @property {boolean} isInterior
 */

/**
 * @typedef MonsterData
 * @type {object}
 * @property {import('../types/typedef.js').Monster[]} inParty
 */

/**
 * @typedef GlobalState
 * @type {object}
 * @property {object} player
 * @property {object} player.position
 * @property {number} player.position.x
 * @property {number} player.position.y
 * @property {PlayerLocation} player.location
 * @property {import('../common/direction.js').Direction} player.direction
 * @property {PlayerLocation} player.location
 * @property {object} options
 * @property {import('../common/options.js').TextSpeedMenuOptions} options.textSpeed
 * @property {import('../common/options.js').BattleSceneMenuOptions} options.battleSceneAnimations
 * @property {import('../common/options.js').BattleStyleMenuOptions} options.battleStyle
 * @property {import('../common/options.js').SoundMenuOptions} options.sound
 * @property {import('../common/options.js').VolumeMenuOptions} options.volume
 * @property {import('../common/options.js').MenuColorOptions} options.menuColor
 * @property {boolean} gameStarted
 * @property {MonsterData} monsters
 * @property {import('../types/typedef.js').Inventory} inventory
 * @property {number[]} itemsPickedUp
 * @property {number[]} viewedEvents
 * @property {import('../types/typedef.js').GameFlag[]} flags
 */

/** @type {GlobalState} */
const initialState = {
  player: {
    position: {
      x: 4 * TILE_SIZE,
      y: 21 * TILE_SIZE,
    },
    direction: DIRECTION.DOWN,
    location: {
      area: 'main_1',
      isInterior: false,
    },
  },
  options: {
    textSpeed: TEXT_SPEED_OPTIONS.MID,
    battleSceneAnimations: BATTLE_SCENE_OPTIONS.ON,
    battleStyle: BATTLE_STYLE_OPTIONS.SHIFT,
    sound: SOUND_OPTIONS.ON,
    volume: 4,
    menuColor: 0,
  },
  gameStarted: false,
  monsters: {
    inParty: [],
  },
  inventory: [
    {
      item: {
        id: 1,
      },
      quantity: 10,
    },
    {
      item: {
        id: 2,
      },
      quantity: 5,
    },
  ],
  itemsPickedUp: [],
  viewedEvents: [],
  flags: [],
};

export const DATA_MANAGER_STORE_KEYS = Object.freeze({
  PLAYER_POSITION: 'PLAYER_POSITION',
  PLAYER_DIRECTION: 'PLAYER_DIRECTION',
  PLAYER_LOCATION: 'PLAYER_LOCATION',
  OPTIONS_TEXT_SPEED: 'OPTIONS_TEXT_SPEED',
  OPTIONS_BATTLE_SCENE_ANIMATIONS: 'OPTIONS_BATTLE_SCENE_ANIMATIONS',
  OPTIONS_BATTLE_STYLE: 'OPTIONS_BATTLE_STYLE',
  OPTIONS_SOUND: 'OPTIONS_SOUND',
  OPTIONS_VOLUME: 'OPTIONS_VOLUME',
  OPTIONS_MENU_COLOR: 'OPTIONS_MENU_COLOR',
  GAME_STARTED: 'GAME_STARTED',
  MONSTERS_IN_PARTY: 'MONSTERS_IN_PARTY',
  INVENTORY: 'INVENTORY',
  ITEMS_PICKED_UP: 'ITEMS_PICKED_UP',
  VIEWED_EVENTS: 'VIEWED_EVENTS',
  FLAGS: 'FLAGS',
});

class DataManager extends Phaser.Events.EventEmitter {
  /** @type {Phaser.Data.DataManager} */
  #store;

  constructor() {
    super();
    this.#store = new Phaser.Data.DataManager(this);
    // initialize state with initial values
    this.#updateDataManger(initialState);
  }

  /** @type {Phaser.Data.DataManager} */
  get store() {
    return this.#store;
  }

  /**
   * @returns {void}
   */
  loadData() {
    // attempt to load data from browser storage and populate the data manager
    if (typeof Storage === 'undefined') {
      console.warn(
        `[${DataManager.name}:loadData] localStorage is not supported, will not be able to save and load data.`
      );
      return;
    }

    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData === null) {
      return;
    }
    try {
      // TODO: we should add error handling and data validation at this step to make sure we get the data we expect.
      /** @type {GlobalState} */
      const parsedData = JSON.parse(savedData);
      // update the state with the saved data
      this.#updateDataManger(parsedData);
    } catch (error) {
      console.warn(
        `[${DataManager.name}:loadData] encountered an error while attempting to load and parse saved data.`
      );
    }
  }

  /**
   * @returns {void}
   */
  saveData() {
    // attempt to storage data in browser storage from data manager
    if (typeof Storage === 'undefined') {
      console.warn(
        `[${DataManager.name}:saveData] localStorage is not supported, will not be able to save and load data.`
      );
      return;
    }
    const dataToSave = this.#dataManagerDataToGlobalStateObject();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
  }

  /**
   * @returns {void}
   */
  startNewGame() {
    // get existing data before resetting all of the data, so we can persist options data
    const existingData = { ...this.#dataManagerDataToGlobalStateObject() };
    existingData.player.position = { ...initialState.player.position };
    existingData.player.location = { ...initialState.player.location };
    existingData.player.direction = initialState.player.direction;
    existingData.player.location = { ...initialState.player.location };
    existingData.gameStarted = initialState.gameStarted;
    existingData.monsters = {
      inParty: [...initialState.monsters.inParty],
    };
    existingData.inventory = initialState.inventory;
    existingData.itemsPickedUp = [...initialState.itemsPickedUp];
    existingData.viewedEvents = [...initialState.viewedEvents];
    existingData.flags = [...initialState.flags];

    this.#store.reset();
    this.#updateDataManger(existingData);
    this.saveData();
  }

  /**
   * @returns {number}
   */
  getAnimatedTextSpeed() {
    /** @type {import('../common/options.js').TextSpeedMenuOptions | undefined} */
    const chosenTextSpeed = this.#store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_TEXT_SPEED);
    if (chosenTextSpeed === undefined) {
      return TEXT_SPEED.MEDIUM;
    }

    switch (chosenTextSpeed) {
      case TEXT_SPEED_OPTIONS.FAST:
        return TEXT_SPEED.FAST;
      case TEXT_SPEED_OPTIONS.MID:
        return TEXT_SPEED.MEDIUM;
      case TEXT_SPEED_OPTIONS.SLOW:
        return TEXT_SPEED.SLOW;
      default:
        exhaustiveGuard(chosenTextSpeed);
    }
  }

  /**
   * @param {Phaser.Scene} scene
   * @returns {import('../types/typedef.js').InventoryItem[]}
   */
  getInventory(scene) {
    /** @type {import('../types/typedef.js').InventoryItem[]} */
    const items = [];
    /** @type {import('../types/typedef.js').Inventory} */
    const inventory = this.#store.get(DATA_MANAGER_STORE_KEYS.INVENTORY);
    inventory.forEach((baseItem) => {
      const item = DataUtils.getItem(scene, baseItem.item.id);
      items.push({
        item: item,
        quantity: baseItem.quantity,
      });
    });
    return items;
  }

  /**
   * @param {import('../types/typedef.js').InventoryItem[]} items
   * @returns {void}
   */
  updateInventory(items) {
    /** @type {import('../types/typedef.js').BaseInventoryItem[]} */
    const inventory = items.map((item) => {
      return {
        item: {
          id: item.item.id,
        },
        quantity: item.quantity,
      };
    });
    this.#store.set(DATA_MANAGER_STORE_KEYS.INVENTORY, inventory);
  }

  /**
   * @param {import('../types/typedef.js').Item} item
   * @param {number} quantity
   * @returns {void}
   */
  addItem(item, quantity) {
    /** @type {import('../types/typedef.js').Inventory} */
    const inventory = this.#store.get(DATA_MANAGER_STORE_KEYS.INVENTORY);
    const existingItem = inventory.find((inventoryItem) => {
      return inventoryItem.item.id === item.id;
    });
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      inventory.push({
        item,
        quantity,
      });
    }
    this.#store.set(DATA_MANAGER_STORE_KEYS.INVENTORY, inventory);
  }

  /**
   * @param {number} itemId
   * @returns {void}
   */
  addItemPickedUp(itemId) {
    /** @type {number[]} */
    const itemsPickedUp = this.#store.get(DATA_MANAGER_STORE_KEYS.ITEMS_PICKED_UP) || [];
    itemsPickedUp.push(itemId);
    this.#store.set(DATA_MANAGER_STORE_KEYS.ITEMS_PICKED_UP, itemsPickedUp);
  }

  /**
   * @returns {boolean}
   */
  isPartyFull() {
    const partySize = this.#store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY).length;
    return partySize === 6;
  }

  /**
   * Adds the provided eventId to the viewed events in the data manager so player does
   * not see the event again.
   * @param {number} eventId
   * @returns {void}
   */
  viewedEvent(eventId) {
    /** @type {Set<number>} */
    const viewedEvents = new Set(this.#store.get(DATA_MANAGER_STORE_KEYS.VIEWED_EVENTS) || []);
    viewedEvents.add(eventId);
    this.#store.set(DATA_MANAGER_STORE_KEYS.VIEWED_EVENTS, Array.from(viewedEvents));
  }

  /**
   * @returns {Set<string>}
   */
  getFlags() {
    return new Set(this.#store.get(DATA_MANAGER_STORE_KEYS.FLAGS) || []);
  }

  /**
   * @param {GAME_FLAG} flag
   * @returns {void}
   */
  addFlag(flag) {
    /** @type {Set<string>} */
    const existingFlags = new Set(this.#store.get(DATA_MANAGER_STORE_KEYS.FLAGS) || []);
    existingFlags.add(flag);
    this.#store.set(DATA_MANAGER_STORE_KEYS.FLAGS, Array.from(existingFlags));
  }

  /**
   * @param {GAME_FLAG} flag
   * @returns {void}
   */
  removeFlag(flag) {
    /** @type {Set<string>} */
    const existingFlags = new Set(this.#store.get(DATA_MANAGER_STORE_KEYS.FLAGS) || []);
    existingFlags.delete(flag);
    this.#store.set(DATA_MANAGER_STORE_KEYS.FLAGS, Array.from(existingFlags));
  }

  /**
   * @param {GlobalState} data
   * @returns {void}
   */
  #updateDataManger(data) {
    this.#store.set({
      [DATA_MANAGER_STORE_KEYS.PLAYER_POSITION]: data.player.position,
      [DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION]: data.player.direction,
      [DATA_MANAGER_STORE_KEYS.PLAYER_LOCATION]: data.player.location || { ...initialState.player.location },
      [DATA_MANAGER_STORE_KEYS.OPTIONS_TEXT_SPEED]: data.options.textSpeed,
      [DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_SCENE_ANIMATIONS]: data.options.battleSceneAnimations,
      [DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_STYLE]: data.options.battleStyle,
      [DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND]: data.options.sound,
      [DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME]: data.options.volume,
      [DATA_MANAGER_STORE_KEYS.OPTIONS_MENU_COLOR]: data.options.menuColor,
      [DATA_MANAGER_STORE_KEYS.GAME_STARTED]: data.gameStarted,
      [DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY]: data.monsters.inParty,
      [DATA_MANAGER_STORE_KEYS.INVENTORY]: data.inventory,
      [DATA_MANAGER_STORE_KEYS.ITEMS_PICKED_UP]: data.itemsPickedUp || [...initialState.itemsPickedUp],
      [DATA_MANAGER_STORE_KEYS.VIEWED_EVENTS]: data.viewedEvents || [...initialState.viewedEvents],
      [DATA_MANAGER_STORE_KEYS.FLAGS]: data.flags || [...initialState.flags],
    });
  }

  /**
   * @returns {GlobalState}
   */
  #dataManagerDataToGlobalStateObject() {
    return {
      player: {
        position: {
          x: this.#store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION).x,
          y: this.#store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION).y,
        },
        direction: this.#store.get(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION),
        location: { ...this.#store.get(DATA_MANAGER_STORE_KEYS.PLAYER_LOCATION) },
      },
      options: {
        textSpeed: this.#store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_TEXT_SPEED),
        battleSceneAnimations: this.#store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_SCENE_ANIMATIONS),
        battleStyle: this.#store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_STYLE),
        sound: this.#store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND),
        volume: this.#store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME),
        menuColor: this.#store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_MENU_COLOR),
      },
      gameStarted: this.#store.get(DATA_MANAGER_STORE_KEYS.GAME_STARTED),
      monsters: {
        inParty: [...this.#store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY)],
      },
      inventory: this.#store.get(DATA_MANAGER_STORE_KEYS.INVENTORY),
      itemsPickedUp: [...(this.#store.get(DATA_MANAGER_STORE_KEYS.ITEMS_PICKED_UP) || [])],
      viewedEvents: [...(this.#store.get(DATA_MANAGER_STORE_KEYS.VIEWED_EVENTS) || [])],
      flags: [...(this.#store.get(DATA_MANAGER_STORE_KEYS.FLAGS) || [])],
    };
  }
}

export const dataManager = new DataManager();
