import { TITLE_ASSET_KEYS, UI_ASSET_KEYS } from '../assets/asset-keys.js';
import Phaser from '../lib/phaser.js';
import { Controls } from '../utils/controls.js';
import { createNineSliceContainer } from '../utils/nine-slice.js';
import { SCENE_KEYS } from './scene-keys.js';

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const MENU_TEXT_STYLE = {
  fontFamily: 'KenneyFutureNarrow',
  color: '#4D4A49',
  fontSize: '30px',
};

const PLAYER_INPUT_CURSOR_POSITION = Object.freeze({
  x: 150,
});

/**
 * @typedef {keyof typeof MAIN_MENU_OPTIONS} MainMenuOptions
 */

/** @enum {MainMenuOptions} */
const MAIN_MENU_OPTIONS = Object.freeze({
  NEW_GAME: 'NEW_GAME',
  CONTINUE: 'CONTINUE',
  OPTIONS: 'OPTIONS',
});

export class TitleScene extends Phaser.Scene {
  /** @type {Phaser.GameObjects.Image} */
  #mainMenuCursorPhaserImageGameObject;
  /** @type {MainMenuOptions} */
  #selectedMenuOption;
  /** @type {Controls} */
  #controls;

  constructor() {
    super({ key: SCENE_KEYS.TITLE_SCENE });
  }

  create() {
    this.#selectedMenuOption = MAIN_MENU_OPTIONS.NEW_GAME;

    // create title screen background
    this.add.image(0, 0, TITLE_ASSET_KEYS.BACKGROUND).setOrigin(0).setScale(0.58);
    this.add
      .image(this.scale.width / 2, 150, TITLE_ASSET_KEYS.PANEL)
      .setScale(0.25, 0.25)
      .setAlpha(0.5);
    this.add
      .image(this.scale.width / 2, 150, TITLE_ASSET_KEYS.TITLE)
      .setScale(0.55)
      .setAlpha(0.5);

    // create menu
    const menuBgWidth = 500;
    const menuBgContainer = createNineSliceContainer(this, UI_ASSET_KEYS.MENU_BACKGROUND, menuBgWidth, 200);
    const newGameText = this.add.text(menuBgWidth / 2, 40, 'New Game', MENU_TEXT_STYLE).setOrigin(0.5);
    const continueText = this.add
      .text(menuBgWidth / 2, 90, 'Continue', MENU_TEXT_STYLE)
      .setOrigin(0.5)
      .setAlpha(0.5);
    const optionText = this.add.text(menuBgWidth / 2, 140, 'Options', MENU_TEXT_STYLE).setOrigin(0.5);
    const menuContainer = this.add.container(0, 0, [menuBgContainer, newGameText, continueText, optionText]);
    menuContainer.setPosition(this.scale.width / 2 - menuBgWidth / 2, 300);
  }
}
