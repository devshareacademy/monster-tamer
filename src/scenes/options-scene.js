import Phaser from '../lib/phaser.js';
import { SCENE_KEYS } from './scene-keys.js';
import { UI_ASSET_KEYS } from '../assets/asset-keys.js';
import { NineSlice } from '../utils/nine-slice.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { Controls } from '../utils/controls.js';
import { OPTION_MENU_OPTIONS } from '../common/options.js';
import { DIRECTION } from '../common/direction.js';
import { exhaustiveGuard } from '../utils/guard.js';

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const OPTIONS_TEXT_STYLE = {
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#FFFFFF',
  fontSize: '30px',
};

const OPTION_MENU_OPTION_INFO_MSG = Object.freeze({
  TEXT_SPEED: 'Choose one of three text display speeds.',
  BATTLE_SCENE: 'Choose to display battle animations and effects or not.',
  BATTLE_STYLE: 'Choose to allow your monster to be recalled between rounds.',
  SOUND: 'Choose to enable or disable the sound.',
  VOLUME: 'Choose the volume of the music and sound effects of the game.',
  MENU_COLOR: 'Choose one of the three menu color options.',
  CONFIRM: 'Save your changes and go back to the main menu.',
});

export class OptionsScene extends Phaser.Scene {
  /** @type {Phaser.GameObjects.Container} */
  #mainContainer;
  /** @type {NineSlice} */
  #nineSliceMainContainer;
  /** @type {Phaser.GameObjects.Group} */
  #textSpeedOptionTextGameObjects;
  /** @type {Phaser.GameObjects.Group} */
  #battleSceneOptionTextGameObjects;
  /** @type {Phaser.GameObjects.Group} */
  #battleStyleOptionTextGameObjects;
  /** @type {Phaser.GameObjects.Group} */
  #soundOptionTextGameObjects;
  /** @type {Phaser.GameObjects.Rectangle} */
  #volumeOptionsMenuCursor;
  /** @type {Phaser.GameObjects.Text} */
  #volumeOptionsValueText;
  /** @type {Phaser.GameObjects.Text} */
  #selectedMenuColorTextGameObject;
  /** @type {Phaser.GameObjects.Container} */
  #infoContainer;
  /** @type {Phaser.GameObjects.Text} */
  #selectedOptionInfoMsgTextGameObject;
  /** @type {Phaser.GameObjects.Rectangle} */
  #optionsMenuCursor;
  /** @type {Controls} */
  #controls;
  /** @type {import('../common/options.js').OptionMenuOptions} */
  #selectedOptionMenu;

  constructor() {
    super({
      key: SCENE_KEYS.OPTIONS_SCENE,
    });
  }

  init() {
    console.log(`[${OptionsScene.name}:init] invoked`);

    this.#nineSliceMainContainer = new NineSlice({
      cornerCutSize: 32,
      textureManager: this.sys.textures,
      assetKey: UI_ASSET_KEYS.MENU_BACKGROUND,
    });
    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.TEXT_SPEED;
  }

  create() {
    console.log(`[${OptionsScene.name}:create] invoked`);

    const { width, height } = this.scale;
    const optionMenuWidth = width - 200;

    // main options container
    this.#mainContainer = this.#nineSliceMainContainer.createNineSliceContainer(this, optionMenuWidth, 432);
    this.#mainContainer.setX(100).setY(20);

    // create main option sections
    this.add.text(width / 2, 40, 'Options', OPTIONS_TEXT_STYLE).setOrigin(0.5);
    const menuOptionsPosition = {
      x: 25,
      yStart: 55,
      yIncrement: 55,
    };
    const menuOptions = ['Text Speed', 'Battle Scene', 'Battle Style', 'Sound', 'Volume', 'Menu Color', 'Close'];
    menuOptions.forEach((option, index) => {
      const x = menuOptionsPosition.x;
      const y = menuOptionsPosition.yStart + menuOptionsPosition.yIncrement * index;
      const textGameObject = this.add.text(x, y, option, OPTIONS_TEXT_STYLE);
      this.#mainContainer.add(textGameObject);
    });

    // create text speed options
    this.#textSpeedOptionTextGameObjects = this.add.group([
      this.add.text(420, 75, 'Slow', OPTIONS_TEXT_STYLE),
      this.add.text(590, 75, 'Mid', OPTIONS_TEXT_STYLE),
      this.add.text(760, 75, 'Fast', OPTIONS_TEXT_STYLE),
    ]);

    // create battle scene options
    this.#battleSceneOptionTextGameObjects = this.add.group([
      this.add.text(420, 130, 'On', OPTIONS_TEXT_STYLE),
      this.add.text(590, 130, 'Off', OPTIONS_TEXT_STYLE),
    ]);

    // create battle style options
    this.#battleStyleOptionTextGameObjects = this.add.group([
      this.add.text(420, 185, 'Set', OPTIONS_TEXT_STYLE),
      this.add.text(590, 185, 'Shift', OPTIONS_TEXT_STYLE),
    ]);

    // create sound options
    this.#soundOptionTextGameObjects = this.add.group([
      this.add.text(420, 240, 'On', OPTIONS_TEXT_STYLE),
      this.add.text(590, 240, 'Off', OPTIONS_TEXT_STYLE),
    ]);

    // volume options
    this.add.rectangle(420, 312, 300, 4, 0xffffff, 1).setOrigin(0, 0.5);
    this.#volumeOptionsMenuCursor = this.add.rectangle(710, 312, 10, 25, 0xff2222, 1).setOrigin(0, 0.5);
    this.#volumeOptionsValueText = this.add.text(760, 295, '100%', OPTIONS_TEXT_STYLE);

    // frame options
    this.#selectedMenuColorTextGameObject = this.add.text(590, 350, '', OPTIONS_TEXT_STYLE);
    this.add.image(530, 352, UI_ASSET_KEYS.CURSOR_WHITE).setOrigin(1, 0).setScale(2.5).setFlipX(true);
    this.add.image(660, 352, UI_ASSET_KEYS.CURSOR_WHITE).setOrigin(0, 0).setScale(2.5);

    // option details container
    this.#infoContainer = this.#nineSliceMainContainer.createNineSliceContainer(this, optionMenuWidth, 100);
    this.#infoContainer.setX(100).setY(height - 110);
    this.#selectedOptionInfoMsgTextGameObject = this.add.text(125, 480, OPTION_MENU_OPTION_INFO_MSG.TEXT_SPEED, {
      ...OPTIONS_TEXT_STYLE,
      ...{
        wordWrap: { width: width - 250 },
      },
    });

    this.#optionsMenuCursor = this.add
      .rectangle(110, 70, optionMenuWidth - 20, 40, 0xffffff, 0)
      .setOrigin(0)
      .setStrokeStyle(4, 0xe4434a, 1);

    this.#controls = new Controls(this);

    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENE_KEYS.TITLE_SCENE);
    });
  }

  update() {
    if (this.#controls.isInputLocked) {
      return;
    }

    if (this.#controls.wasBackKeyPressed()) {
      this.#controls.lockInput = true;
      this.cameras.main.fadeOut(500, 0, 0, 0);
      return;
    }

    if (this.#controls.wasSpaceKeyPressed() && this.#selectedOptionMenu === OPTION_MENU_OPTIONS.CONFIRM) {
      this.#controls.lockInput = true;
      this.cameras.main.fadeOut(500, 0, 0, 0);
      return;
    }

    const selectedDirection = this.#controls.getDirectionKeyJustPressed();
    if (selectedDirection !== DIRECTION.NONE) {
      this.#moveOptionMenuCursor(selectedDirection);
    }
  }

  /**
   * @param {import('../common/direction.js').Direction} direction
   */
  #moveOptionMenuCursor(direction) {
    if (direction === DIRECTION.NONE) {
      return;
    }

    this.#updateSelectedOptionMenuFromInput(direction);

    switch (this.#selectedOptionMenu) {
      case OPTION_MENU_OPTIONS.TEXT_SPEED:
        this.#optionsMenuCursor.setY(70);
        break;
      case OPTION_MENU_OPTIONS.BATTLE_SCENE:
        this.#optionsMenuCursor.setY(125);
        break;
      case OPTION_MENU_OPTIONS.BATTLE_STYLE:
        this.#optionsMenuCursor.setY(180);
        break;
      case OPTION_MENU_OPTIONS.SOUND:
        this.#optionsMenuCursor.setY(235);
        break;
      case OPTION_MENU_OPTIONS.VOLUME:
        this.#optionsMenuCursor.setY(290);
        break;
      case OPTION_MENU_OPTIONS.MENU_COLOR:
        this.#optionsMenuCursor.setY(345);
        break;
      case OPTION_MENU_OPTIONS.CONFIRM:
        this.#optionsMenuCursor.setY(400);
        break;
      default:
        exhaustiveGuard(this.#selectedOptionMenu);
    }
    this.#selectedOptionInfoMsgTextGameObject.setText(OPTION_MENU_OPTION_INFO_MSG[this.#selectedOptionMenu]);
  }

  /**
   * @param {import('../common/direction.js').Direction} direction
   */
  #updateSelectedOptionMenuFromInput(direction) {
    if (direction === DIRECTION.NONE) {
      return;
    }

    if (this.#selectedOptionMenu === OPTION_MENU_OPTIONS.TEXT_SPEED) {
      switch (direction) {
        case DIRECTION.DOWN:
          this.#selectedOptionMenu = OPTION_MENU_OPTIONS.BATTLE_SCENE;
          return;
        case DIRECTION.UP:
          this.#selectedOptionMenu = OPTION_MENU_OPTIONS.CONFIRM;
          return;
        case DIRECTION.LEFT:
        case DIRECTION.RIGHT:
          // TODO;
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedOptionMenu === OPTION_MENU_OPTIONS.BATTLE_SCENE) {
      switch (direction) {
        case DIRECTION.DOWN:
          this.#selectedOptionMenu = OPTION_MENU_OPTIONS.BATTLE_STYLE;
          return;
        case DIRECTION.UP:
          this.#selectedOptionMenu = OPTION_MENU_OPTIONS.TEXT_SPEED;
          return;
        case DIRECTION.LEFT:
        case DIRECTION.RIGHT:
          // TODO;
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedOptionMenu === OPTION_MENU_OPTIONS.BATTLE_STYLE) {
      switch (direction) {
        case DIRECTION.DOWN:
          this.#selectedOptionMenu = OPTION_MENU_OPTIONS.SOUND;
          return;
        case DIRECTION.UP:
          this.#selectedOptionMenu = OPTION_MENU_OPTIONS.BATTLE_SCENE;
          return;
        case DIRECTION.LEFT:
        case DIRECTION.RIGHT:
          // TODO;
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedOptionMenu === OPTION_MENU_OPTIONS.SOUND) {
      switch (direction) {
        case DIRECTION.DOWN:
          this.#selectedOptionMenu = OPTION_MENU_OPTIONS.VOLUME;
          return;
        case DIRECTION.UP:
          this.#selectedOptionMenu = OPTION_MENU_OPTIONS.BATTLE_STYLE;
          return;
        case DIRECTION.LEFT:
        case DIRECTION.RIGHT:
          // TODO;
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedOptionMenu === OPTION_MENU_OPTIONS.VOLUME) {
      switch (direction) {
        case DIRECTION.DOWN:
          this.#selectedOptionMenu = OPTION_MENU_OPTIONS.MENU_COLOR;
          return;
        case DIRECTION.UP:
          this.#selectedOptionMenu = OPTION_MENU_OPTIONS.SOUND;
          return;
        case DIRECTION.LEFT:
        case DIRECTION.RIGHT:
          // TODO;
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedOptionMenu === OPTION_MENU_OPTIONS.MENU_COLOR) {
      switch (direction) {
        case DIRECTION.DOWN:
          this.#selectedOptionMenu = OPTION_MENU_OPTIONS.CONFIRM;
          return;
        case DIRECTION.UP:
          this.#selectedOptionMenu = OPTION_MENU_OPTIONS.VOLUME;
          return;
        case DIRECTION.LEFT:
        case DIRECTION.RIGHT:
          // TODO;
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedOptionMenu === OPTION_MENU_OPTIONS.CONFIRM) {
      switch (direction) {
        case DIRECTION.DOWN:
          this.#selectedOptionMenu = OPTION_MENU_OPTIONS.TEXT_SPEED;
          return;
        case DIRECTION.UP:
          this.#selectedOptionMenu = OPTION_MENU_OPTIONS.MENU_COLOR;
          return;
        case DIRECTION.LEFT:
        case DIRECTION.RIGHT:
          // TODO;
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    exhaustiveGuard(this.#selectedOptionMenu);
  }
}
