import Phaser from '../lib/phaser.js';
import { SCENE_KEYS } from './scene-keys.js';
import { AUDIO_ASSET_KEYS, EXTERNAL_LINKS_ASSET_KEYS, TITLE_ASSET_KEYS, UI_ASSET_KEYS } from '../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { DIRECTION } from '../common/direction.js';
import { exhaustiveGuard } from '../utils/guard.js';
import { NineSlice } from '../utils/nine-slice.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import { SHOW_SOCIAL_LINKS } from '../config.js';
import { BaseScene } from './base-scene.js';
import { playBackgroundMusic } from '../utils/audio-utils.js';

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const MENU_TEXT_STYLE = Object.freeze({
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#4D4A49',
  fontSize: '30px',
});

const PLAYER_INPUT_CURSOR_POSITION = Object.freeze({
  x: 150,
  y: 41,
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

export class TitleScene extends BaseScene {
  /** @type {Phaser.GameObjects.Image} */
  #mainMenuCursorPhaserImageGameObject;
  /** @type {MainMenuOptions} */
  #selectedMenuOption;
  /** @type {boolean} */
  #isContinueButtonEnabled;
  /** @type {NineSlice} */
  #nineSliceMenu;

  constructor() {
    super({ key: SCENE_KEYS.TITLE_SCENE });
  }

  /**
   * @returns {void}
   */
  init() {
    super.init();

    this.#nineSliceMenu = new NineSlice({
      cornerCutSize: 32,
      textureManager: this.sys.textures,
      assetKeys: [UI_ASSET_KEYS.MENU_BACKGROUND],
    });
  }

  /**
   * @returns {void}
   */
  create() {
    super.create();

    this.#selectedMenuOption = MAIN_MENU_OPTIONS.NEW_GAME;
    this.#isContinueButtonEnabled = dataManager.store.get(DATA_MANAGER_STORE_KEYS.GAME_STARTED) || false;

    // create title scene background
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
    const menuBgContainer = this.#nineSliceMenu.createNineSliceContainer(
      this,
      menuBgWidth,
      200,
      UI_ASSET_KEYS.MENU_BACKGROUND
    );
    const newGameText = this.add.text(menuBgWidth / 2, 40, 'New Game', MENU_TEXT_STYLE).setOrigin(0.5);
    const continueText = this.add.text(menuBgWidth / 2, 90, 'Continue', MENU_TEXT_STYLE).setOrigin(0.5);
    if (!this.#isContinueButtonEnabled) {
      continueText.setAlpha(0.5);
    }
    const optionText = this.add.text(menuBgWidth / 2, 140, 'Options', MENU_TEXT_STYLE).setOrigin(0.5);
    const menuContainer = this.add.container(0, 0, [menuBgContainer, newGameText, continueText, optionText]);
    menuContainer.setPosition(this.scale.width / 2 - menuBgWidth / 2, 300);

    // create cursors
    this.#mainMenuCursorPhaserImageGameObject = this.add
      .image(PLAYER_INPUT_CURSOR_POSITION.x, PLAYER_INPUT_CURSOR_POSITION.y, UI_ASSET_KEYS.CURSOR)
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

    // add in social links
    if (SHOW_SOCIAL_LINKS) {
      this.#addInSocialLinks();
    }

    // add in fade effects
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (this.#selectedMenuOption === MAIN_MENU_OPTIONS.OPTIONS) {
        this.scene.start(SCENE_KEYS.OPTIONS_SCENE);
        return;
      }

      if (this.#selectedMenuOption === MAIN_MENU_OPTIONS.NEW_GAME) {
        dataManager.startNewGame();
      }

      this.scene.start(SCENE_KEYS.WORLD_SCENE);
    });

    // play background music
    playBackgroundMusic(this, AUDIO_ASSET_KEYS.TITLE);
  }

  /**
   * @returns {void}
   */
  update() {
    super.update();

    if (this._controls.isInputLocked) {
      return;
    }

    const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();
    if (wasSpaceKeyPressed) {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this._controls.lockInput = true;
      return;
    }

    const selectedDirection = this._controls.getDirectionKeyJustPressed();
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
        this.#mainMenuCursorPhaserImageGameObject.setY(PLAYER_INPUT_CURSOR_POSITION.y);
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
        if (this.#selectedMenuOption === MAIN_MENU_OPTIONS.NEW_GAME) {
          return;
        }
        if (this.#selectedMenuOption === MAIN_MENU_OPTIONS.CONTINUE) {
          this.#selectedMenuOption = MAIN_MENU_OPTIONS.NEW_GAME;
          return;
        }
        if (this.#selectedMenuOption === MAIN_MENU_OPTIONS.OPTIONS && !this.#isContinueButtonEnabled) {
          this.#selectedMenuOption = MAIN_MENU_OPTIONS.NEW_GAME;
          return;
        }
        this.#selectedMenuOption = MAIN_MENU_OPTIONS.CONTINUE;
        return;
      case DIRECTION.DOWN:
        if (this.#selectedMenuOption === MAIN_MENU_OPTIONS.OPTIONS) {
          return;
        }
        if (this.#selectedMenuOption === MAIN_MENU_OPTIONS.CONTINUE) {
          this.#selectedMenuOption = MAIN_MENU_OPTIONS.OPTIONS;
          return;
        }
        if (this.#selectedMenuOption === MAIN_MENU_OPTIONS.NEW_GAME && !this.#isContinueButtonEnabled) {
          this.#selectedMenuOption = MAIN_MENU_OPTIONS.OPTIONS;
          return;
        }
        this.#selectedMenuOption = MAIN_MENU_OPTIONS.CONTINUE;
        return;
      case DIRECTION.LEFT:
      case DIRECTION.RIGHT:
      case DIRECTION.NONE:
        return;
      default:
        exhaustiveGuard(direction);
    }
  }

  #addInSocialLinks() {
    const githubImage = this.add
      .image(this.scale.width, 0, EXTERNAL_LINKS_ASSET_KEYS.GITHUB_BANNER, 0)
      .setOrigin(1, 0)
      .setInteractive({
        useHandCursor: true,
      });
    githubImage.on(Phaser.Input.Events.POINTER_DOWN, () => {
      window.open('https://github.com/devshareacademy/monster-tamer', '_blank').focus();
    });

    const containerPosition = {
      maximized: this.scale.height - 235,
      minimized: this.scale.height - 26,
    };
    const container = this.add.container(20, containerPosition.minimized, []);
    container.on(Phaser.Input.Events.POINTER_OVER, () => {
      container.y -= 1;
    });

    let containerTween = this.add
      .tween({
        delay: 0,
        duration: 400,
        y: {
          from: container.y,
          start: container.y,
          to: containerPosition.maximized,
        },
        targets: container,
      })
      .pause();

    const bg = this.add
      .image(0, 0, EXTERNAL_LINKS_ASSET_KEYS.LEARN_MORE_BACKGROUND, 0)
      .setOrigin(0)
      .setScale(1.2, 1)
      .setInteractive({
        useHandCursor: true,
      });
    bg.on(Phaser.Input.Events.POINTER_DOWN, () => {
      window.open('https://www.youtube.com/playlist?list=PLmcXe0-sfoSgq-pyXrFx0GZjHbvoVUW8t', '_blank').focus();
    });
    bg.on(Phaser.Input.Events.POINTER_OVER, () => {
      if (containerTween.isDestroyed()) {
        containerTween = this.add.tween({
          delay: 0,
          duration: 400,
          y: {
            from: container.y,
            start: container.y,
            to: containerPosition.maximized,
          },
          targets: container,
        });
        return;
      }
      if (containerTween.isPaused()) {
        containerTween.resume();
      }
      containerTween.updateTo('y', containerPosition.maximized, true);
    });
    bg.on(Phaser.Input.Events.POINTER_OUT, () => {
      if (containerTween.isDestroyed()) {
        containerTween = this.add.tween({
          delay: 0,
          duration: 400,
          y: {
            from: container.y,
            start: container.y,
            to: containerPosition.minimized,
          },
          targets: container,
        });
        return;
      }
      if (containerTween.isPaused()) {
        containerTween.resume();
      }
      containerTween.updateTo('y', containerPosition.minimized, true);
    });
    container.add(bg);

    const sideBarText = this.add
      .text(20, 5, 'Learn To Build This Game!', {
        fontSize: '18px',
      })
      .setOrigin(0, 0);
    container.add(sideBarText);

    container.add(
      this.add.image(153, 90, EXTERNAL_LINKS_ASSET_KEYS.YOUTUBE_THUMB_NAIL, 0).setScale(0.65).setAlpha(0.9)
    );
    const youTubeLogo = this.add.image(150, 80, EXTERNAL_LINKS_ASSET_KEYS.YOUTUBE_BUTTON, 0).setScale(0.4);
    container.add(youTubeLogo);

    const moreInfoText = this.add
      .text(20, 155, 'In this free series, learn how to build this Pokemon like RPG from scratch!', {
        fontSize: '20px',
        wordWrap: { width: 300 },
      })
      .setOrigin(0, 0);
    container.add(moreInfoText);
  }
}
