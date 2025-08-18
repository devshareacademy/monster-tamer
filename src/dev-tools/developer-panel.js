import { DEV_PANEL_CONFIG } from '../config.js';
import TweakPane from '../lib/tweakpane.js';
import { BaseScene } from '../scenes/base-scene.js';

const LOCAL_STORAGE_KEY = 'MONSTER_TAMER_DEV_DATA';
const LOCAL_STORAGE_KEY_CORE = 'MONSTER_TAMER_DATA';

export class DeveloperPanel {
  /** @type {DeveloperPanel} */
  static #instance;
  #pane;
  /** @type {BaseScene} */
  #phaserScene;
  #paneInputFieldRef;

  /** @private */
  constructor() {
    this.#loadData();
    this.#pane = new TweakPane.Pane();

    const PARAMS = {
      addSaveTooltip: '',
      selectedSaveIndex: 0,
      selectedSaveTooltip: DEV_PANEL_CONFIG.CUSTOM_SAVES[0]?.description || '',
    };

    const main = this.#pane.addFolder({
      title: 'Developer Panel',
      expanded: DEV_PANEL_CONFIG.AUTO_EXPAND,
    });

    // config folder - flags to enable/disable features
    const configFolder = main.addFolder({
      title: 'Config',
      expanded: true,
    });
    configFolder
      .addBinding(DEV_PANEL_CONFIG.CONFIG_SETTINGS, 'DISABLE_WILD_ENCOUNTERS', {
        label: 'disable wild encounters',
      })
      .on('change', () => this.#saveData());
    configFolder.addBlade({
      view: 'separator',
    });
    configFolder
      .addBinding(DEV_PANEL_CONFIG, 'AUTO_EXPAND', {
        label: 'auto expand panel',
      })
      .on('change', () => this.#saveData());

    // load save folder - load a custom save previously created from dev panel
    const customSaveFolder = main.addFolder({
      title: 'Custom Saves',
      expanded: true,
    });
    const loadSaveBinding = customSaveFolder.addBinding(PARAMS, 'selectedSaveIndex', {
      view: 'list',
      label: 'Selected Save',
      options: DEV_PANEL_CONFIG.CUSTOM_SAVES.map((save, index) => ({ text: `Save ${index + 1}`, value: index })),
    });
    customSaveFolder.addBinding(PARAMS, 'selectedSaveTooltip', {
      label: 'Save Description',
      readonly: true,
      multiline: true,
      rows: 3,
      interval: 30000,
    });
    loadSaveBinding.on('change', () => {
      PARAMS.selectedSaveTooltip = DEV_PANEL_CONFIG.CUSTOM_SAVES[PARAMS.selectedSaveIndex].description;
      this.#pane.refresh();
    });
    customSaveFolder.addBlade({
      view: 'separator',
    });
    customSaveFolder
      .addButton({
        title: 'Load Save',
      })
      .on('click', () => {
        this.#loadCustomSave(DEV_PANEL_CONFIG.CUSTOM_SAVES[PARAMS.selectedSaveIndex].data);
      });
    customSaveFolder
      .addButton({
        title: 'Delete Save',
      })
      .on('click', () => {
        DEV_PANEL_CONFIG.CUSTOM_SAVES.splice(PARAMS.selectedSaveIndex, 1);
        loadSaveBinding.options = DEV_PANEL_CONFIG.CUSTOM_SAVES.map((save, index) => ({
          text: `Save ${index + 1}`,
          value: index,
        }));
        PARAMS.selectedSaveIndex = 0;
        PARAMS.selectedSaveTooltip = DEV_PANEL_CONFIG.CUSTOM_SAVES[PARAMS.selectedSaveIndex]?.description || '';
        this.#saveData();
        this.#pane.refresh();
      });

    // create save folder - create a custom save to load later on
    const createSaveFolder = main.addFolder({
      title: 'Create Save',
      expanded: true,
    });
    createSaveFolder.addBinding(PARAMS, 'addSaveTooltip', {
      label: 'Save Description',
      readonly: false,
      multiline: true,
      rows: 3,
    });
    const createSaveButton = createSaveFolder.addButton({
      title: 'Create Save',
    });
    createSaveButton.on('click', () => {
      const saveDescription = PARAMS.addSaveTooltip.trim();
      if (saveDescription.length === 0) {
        return;
      }
      DEV_PANEL_CONFIG.CUSTOM_SAVES.push({
        description: saveDescription,
        data: this.#getCurrentSaveData(),
      });
      loadSaveBinding.options = DEV_PANEL_CONFIG.CUSTOM_SAVES.map((save, index) => ({
        text: `Save ${index + 1}`,
        value: index,
      }));
      PARAMS.selectedSaveTooltip = DEV_PANEL_CONFIG.CUSTOM_SAVES[PARAMS.selectedSaveIndex].description;
      PARAMS.addSaveTooltip = '';
      this.#saveData();
      this.#pane.refresh();
    });

    // lock controls and propagate keyboard events from phaser to the DOM (default is to block)
    document.body.addEventListener(
      'focusin',
      (event) => {
        // @ts-ignore
        if (event.target && event.target.closest('.tp-txtv')) {
          this.#paneInputFieldRef = event.target;
          if (this.#phaserScene && this.#phaserScene.controls) {
            this.#phaserScene.controls.lockInput = true;
            this.#phaserScene.input.keyboard.disableGlobalCapture();
          }
        }
      },
      true
    );
    // unlock controls and disable propagation of keyboard events from phaser to the DOM (default is to block)
    document.body.addEventListener(
      'focusout',
      (event) => {
        if (event.target && event.target === this.#paneInputFieldRef) {
          this.#phaserScene.controls.lockInput = false;
          this.#phaserScene.input.keyboard.enableGlobalCapture();
          this.#paneInputFieldRef = undefined;
        }
      },
      true
    );
  }

  /** @type {DeveloperPanel} */
  static get instance() {
    if (!this.#instance) {
      this.#instance = new this();
    }
    return this.#instance;
  }

  /**
   * @param {BaseScene} scene
   */
  set scene(scene) {
    this.#phaserScene = scene;
  }

  #getCurrentSaveData() {
    if (typeof Storage === 'undefined') {
      return;
    }
    return localStorage.getItem(LOCAL_STORAGE_KEY_CORE);
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
        if (typeof value === 'object' && !Array.isArray(value)) {
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
