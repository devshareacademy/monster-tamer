import { DEV_PANEL_CONFIG } from '../config.js';
import TweakPane from '../lib/tweakpane.js';
import * as SAVES from './saves.js';

const LOCAL_STORAGE_KEY = 'MONSTER_TAMER_DEV_DATA';
const LOCAL_STORAGE_KEY_CORE = 'MONSTER_TAMER_DATA';

export class DeveloperPanel {
  /** @type {DeveloperPanel} */
  static #instance;
  #pane;

  /** @private */
  constructor() {
    this.#loadData();
    this.#pane = new TweakPane.Pane();

    const PARAMS = {
      button1Tooltip: SAVES.SAVE_1_INFO,
      button2Tooltip: SAVES.SAVE_2_INFO,
    };

    const main = this.#pane.addFolder({
      title: 'Developer Panel',
      expanded: DEV_PANEL_CONFIG.AUTO_EXPAND,
    });
    const tab = main.addTab({
      pages: [{ title: 'Config' }, { title: 'Saves' }],
    });
    tab.pages[0].addBinding(DEV_PANEL_CONFIG.CONFIG_SETTINGS, 'DISABLE_WILD_ENCOUNTERS', {
      label: 'disable wild encounters',
    });
    tab.pages[0].addBlade({
      view: 'separator',
    });
    tab.pages[0].addBinding(DEV_PANEL_CONFIG, 'AUTO_EXPAND', {
      label: 'auto expand panel',
    });

    // custom save 1
    tab.pages[1].addBinding(PARAMS, 'button1Tooltip', {
      label: 'Save 1',
      readonly: true,
      multiline: true,
      rows: 3,
      interval: 30000,
    });
    const save1Button = tab.pages[1].addButton({
      title: 'Load Save 1',
    });
    save1Button.on('click', () => {
      this.#loadCustomSave(SAVES.SAVE_1);
    });
    tab.pages[1].addBlade({
      view: 'separator',
    });

    // custom save 2
    tab.pages[1].addBinding(PARAMS, 'button2Tooltip', {
      label: 'Save 2',
      readonly: true,
      multiline: true,
      rows: 3,
      interval: 30000,
    });
    const save2Button = tab.pages[1].addButton({
      title: 'Load Save 2',
    });
    save2Button.on('click', () => {
      this.#loadCustomSave(SAVES.SAVE_2);
    });
    tab.pages[1].addBlade({
      view: 'separator',
    });

    this.#pane.on('change', (ev) => {
      this.#saveData();
    });
  }

  /** @type {DeveloperPanel} */
  static get instance() {
    if (!this.#instance) {
      this.#instance = new this();
    }
    return this.#instance;
  }

  /**
   * @returns {void}
   */
  #loadData() {
    if (typeof Storage === 'undefined') {
      return;
    }

    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData === null) {
      return;
    }

    try {
      const parsedData = JSON.parse(savedData);
      for (const [key, value] of Object.entries(parsedData)) {
        if (typeof value === 'object') {
          for (const [innerKey, innerValue] of Object.entries(parsedData[key])) {
            if (DEV_PANEL_CONFIG[key] !== undefined && DEV_PANEL_CONFIG[key][innerKey] !== undefined) {
              DEV_PANEL_CONFIG[key][innerKey] = innerValue;
            }
          }
        } else {
          if (DEV_PANEL_CONFIG[key] !== undefined) {
            DEV_PANEL_CONFIG[key] = value;
          }
        }
      }
    } catch (error) {
      console.warn(
        `[${DeveloperPanel.name}:loadData] encountered an error while attempting to load and parse saved data.`
      );
    }
  }

  /**
   * @returns {void}
   */
  #saveData() {
    if (typeof Storage === 'undefined') {
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEV_PANEL_CONFIG));
  }

  /**
   * @param {string} saveData
   * @returns {void}
   */
  #loadCustomSave(saveData) {
    if (typeof Storage === 'undefined') {
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_CORE, saveData);
    window.location.reload();
  }
}
