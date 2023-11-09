import Phaser from '../lib/phaser.js';
import { TITLE_ASSET_KEYS, UI_ASSET_KEYS } from '../assets/asset-keys.js';
import { DIRECTION } from '../common/direction.js';
import { Controls } from '../utils/controls.js';
import { exhaustiveGuard } from '../utils/guard.js';
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

    // create cursors
    this.#mainMenuCursorPhaserImageGameObject = this.add
      .image(PLAYER_INPUT_CURSOR_POSITION.x, 41, UI_ASSET_KEYS.CURSOR)
      .setOrigin(0.5)
      .setScale(2.5);
    menuBgContainer.add(this.#mainMenuCursorPhaserImageGameObject);
    this.tweens.add({
      delay: 0,
      duration: 500,
      repeat: -1,
      x: {
        from: PLAYER_INPUT_CURSOR_POSITION.x,
        start: PLAYER_INPUT_CURSOR_POSITION.x,
        to: PLAYER_INPUT_CURSOR_POSITION.x + 3,
      },
      targets: this.#mainMenuCursorPhaserImageGameObject,
    });

    // add in fade affects
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (this.#selectedMenuOption === MAIN_MENU_OPTIONS.NEW_GAME) {
        this.scene.start(SCENE_KEYS.WORLD_SCENE);
        return;
      }

      if (this.#selectedMenuOption === MAIN_MENU_OPTIONS.OPTIONS) {
        this.scene.start(SCENE_KEYS.OPTIONS_SCENE);
        return;
      }

      // TODO: implement continue logic
      this.scene.start(SCENE_KEYS.WORLD_SCENE);
    });

    this.#controls = new Controls(this);
  }

  update() {
    if (this.#controls.isInputLocked) {
      return;
    }

    const wasSpaceKeyPressed = this.#controls.wasSpaceKeyPressed();
    if (wasSpaceKeyPressed) {
      if (
        this.#selectedMenuOption === MAIN_MENU_OPTIONS.NEW_GAME ||
        this.#selectedMenuOption === MAIN_MENU_OPTIONS.OPTIONS
      ) {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.#controls.lockInput = true;
        return;
      }
    }

    const selectedDirection = this.#controls.getDirectionKeyJustPressed();
    if (selectedDirection !== DIRECTION.NONE) {
      this.#moveMenuSelectCursor(selectedDirection);
    }
  }

  /**
   * @param {import('../common/direction.js').Direction} direction
   * @returns {void}
   */
  #moveMenuSelectCursor(direction) {
    this.#updateSelectedMenuOptionFromInput(direction);
    switch (this.#selectedMenuOption) {
      case MAIN_MENU_OPTIONS.NEW_GAME:
        this.#mainMenuCursorPhaserImageGameObject.setY(41);
        break;
      case MAIN_MENU_OPTIONS.CONTINUE:
        this.#mainMenuCursorPhaserImageGameObject.setY(91);
        break;
      case MAIN_MENU_OPTIONS.OPTIONS:
        this.#mainMenuCursorPhaserImageGameObject.setY(141);
        break;
      default:
        exhaustiveGuard(this.#selectedMenuOption);
    }
  }

  /**
   * @param {import('../common/direction.js').Direction} direction
   * @returns {void}
   */
  #updateSelectedMenuOptionFromInput(direction) {
    switch (direction) {
      case DIRECTION.UP:
        this.#selectedMenuOption = MAIN_MENU_OPTIONS.NEW_GAME;
        return;
      case DIRECTION.DOWN:
        this.#selectedMenuOption = MAIN_MENU_OPTIONS.OPTIONS;
        return;
      case DIRECTION.LEFT:
      case DIRECTION.RIGHT:
      case DIRECTION.NONE:
        return;
      default:
        exhaustiveGuard(direction);
    }
  }
}
