import Phaser from '../../lib/phaser.js';
import { MENU_COLOR } from '../../config.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../../utils/data-manager.js';
import { createNineSliceContainer, updateNineSliceContainerTexture } from '../../utils/nine-slice.js';
import { UI_ASSET_KEYS } from '../../assets/asset-keys.js';
import { exhaustiveGuard } from '../../utils/guard.js';

export class Menu {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {number} */
  #width;
  /** @type {number} */
  #height;
  /** @type {number} */
  #padding;
  /** @type {Phaser.GameObjects.Container} */
  #container;
  /** @type {boolean} */
  #isVisible;
  /** @type {Phaser.GameObjects.Rectangle} */
  #rectangleBackground;

  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.#scene = scene;

    this.#width = 350;
    this.#height = 400;
    this.#padding = 4;

    this.#container = createNineSliceContainer(this.#scene, UI_ASSET_KEYS.MENU_BACKGROUND, this.#width, this.#height)
      .setAlpha(0)
      .setDepth(2);
    this.#updateMenuTexture();

    this.#rectangleBackground = this.#scene.add
      .rectangle(
        this.#padding,
        this.#padding,
        this.#width - this.#padding * 2,
        this.#height - this.#padding * 2,
        0x000000,
        0.8
      )
      .setOrigin(0);
    this.#container.add(this.#rectangleBackground);
  }

  /** @type {boolean} */
  get isVisible() {
    return this.#isVisible;
  }

  /**
   * @returns {void}
   */
  show() {
    console.log(this.#scene.cameras.main.worldView);
    const { right, top } = this.#scene.cameras.main.worldView;
    const startX = right - this.#padding * 2 - this.#width;
    const startY = top + this.#padding * 2;
    console.log(startX, startY);

    this.#container.setPosition(startX, startY);
    this.#container.setAlpha(1);
    this.#isVisible = true;
  }

  /**
   * @returns {void}
   */
  hide() {
    this.#container.setAlpha(0);
    this.#isVisible = false;
  }

  /**
   * @param {import('../../common/direction.js').Direction|'OK'|'CANCEL'} input
   * @returns {void}
   */
  handlePlayerInput(input) {
    if (input === 'CANCEL') {
      this.hide();
      return;
    }

    if (input === 'OK') {
      // TODO: handle selected option
      return;
    }

    // update selected menu option based on player input
    // TODO
  }

  /**
   * @returns {void}
   */
  #updateMenuTexture() {
    /** @type {import('../../common/options').MenuColorOptions} */
    const chosenMenuColor = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_MENU_COLOR);
    if (chosenMenuColor === undefined) {
      return;
    }

    switch (chosenMenuColor) {
      case 0:
        updateNineSliceContainerTexture(this.#scene, this.#container, UI_ASSET_KEYS.MENU_BACKGROUND);
        break;
      case 1:
        updateNineSliceContainerTexture(this.#scene, this.#container, UI_ASSET_KEYS.MENU_BACKGROUND_GREEN);
        break;
      case 2:
        updateNineSliceContainerTexture(this.#scene, this.#container, UI_ASSET_KEYS.MENU_BACKGROUND_PURPLE);
        break;
      default:
        exhaustiveGuard(chosenMenuColor);
    }
  }
}
