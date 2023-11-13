import Phaser from '../lib/phaser.js';
import { UI_ASSET_KEYS } from '../assets/asset-keys.js';
import { Controls } from '../utils/controls.js';
import { createNineSliceContainer, updateNineSliceContainerTexture } from '../utils/nine-slice.js';
import { SCENE_KEYS } from './scene-keys.js';
import { exhaustiveGuard } from '../utils/guard.js';
import { DIRECTION } from '../common/direction.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';

/**
 * @typedef {keyof typeof OPTION_MENU_OPTIONS} OptionMenuOptions
 */

/** @enum {OptionMenuOptions} */
const OPTION_MENU_OPTIONS = Object.freeze({
  TEXT_SPEED: 'TEXT_SPEED',
  BATTLE_SCENE: 'BATTLE_SCENE',
  BATTLE_STYLE: 'BATTLE_STYLE',
  SOUND: 'SOUND',
  VOLUME: 'VOLUME',
  MENU_COLOR: 'MENU_COLOR',
  CONFIRM: 'CONFIRM',
});

/**
 * @typedef {keyof typeof TEXT_SPEED_OPTIONS} TextSpeedMenuOptions
 */

/** @enum {TextSpeedMenuOptions} */
const TEXT_SPEED_OPTIONS = Object.freeze({
  SLOW: 'SLOW',
  MID: 'MID',
  FAST: 'FAST',
});

/**
 * @typedef {keyof typeof BATTLE_SCENE_OPTIONS} BattleSceneMenuOptions
 */

/** @enum {BattleSceneMenuOptions} */
const BATTLE_SCENE_OPTIONS = Object.freeze({
  ON: 'ON',
  OFF: 'OFF',
});

/**
 * @typedef {keyof typeof BATTLE_STYLE_OPTIONS} BattleStyleMenuOptions
 */

/** @enum {BattleStyleMenuOptions} */
const BATTLE_STYLE_OPTIONS = Object.freeze({
  SET: 'SET',
  SHIFT: 'SHIFT',
});

/**
 * @typedef {keyof typeof SOUND_OPTIONS} SoundMenuOptions
 */

/** @enum {SoundMenuOptions} */
const SOUND_OPTIONS = Object.freeze({
  ON: 'ON',
  OFF: 'OFF',
});

/**
 * @typedef {0 | 1 | 2 | 3 | 4} VolumeMenuOptions
 */

/**
 * @typedef {0 | 1 | 2 } MenuColorOptions
 */

const TEXT_FONT_COLORS = Object.freeze({
  NOT_SELECTED: '#FFFFFF',
  SELECTED: '#FF2222',
});

const OPTION_MENU_OPTION_INFO_MSG = Object.freeze({
  TEXT_SPEED: 'Choose one of three text display speeds.',
  BATTLE_SCENE: 'Choose to display battle animations and effects or not.',
  BATTLE_STYLE: 'Choose to allow your monster to be recalled between rounds.',
  SOUND: 'Choose to enable or disable the sound.',
  VOLUME: 'Choose the volume of the music and sound effects of the game.',
  MENU_COLOR: 'Choose one of the three menu color options.',
  CONFIRM: 'Save your changes and go back to the main menu.',
});

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const OPTIONS_TEXT_STYLE = {
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#FFFFFF',
  fontSize: '30px',
};

export class OptionsScene extends Phaser.Scene {
  /** @type {OptionMenuOptions} */
  #selectedOptionMenu;
  /** @type {TextSpeedMenuOptions} */
  #selectedTextSpeedOption;
  /** @type {BattleSceneMenuOptions} */
  #selectedBattleSceneOption;
  /** @type {BattleStyleMenuOptions} */
  #selectedBattleStyleOption;
  /** @type {SoundMenuOptions} */
  #selectedSoundMenuOption;
  /** @type {VolumeMenuOptions} */
  #selectedVolumeOption;
  /** @type {MenuColorOptions} */
  #selectedMenuColorOption;
  /** @type {Phaser.GameObjects.Container} */
  #mainContainer;
  /** @type {Phaser.GameObjects.Container} */
  #infoContainer;
  /** @type {Phaser.GameObjects.Rectangle} */
  #volumeOptionsMenuCursor;
  /** @type {Phaser.GameObjects.Rectangle} */
  #optionsMenuCursor;
  /** @type {Phaser.GameObjects.Text} */
  #selectedOptionInfoMsgTextGameObject;
  /** @type {Phaser.GameObjects.Text} */
  #volumeOptionValueText;
  /** @type {Phaser.GameObjects.Text} */
  #selectedMenuColorTextGameObject;
  /** @type {Phaser.GameObjects.Group} */
  #soundOptionTextGameObjects;
  /** @type {Phaser.GameObjects.Group} */
  #battleSceneOptionTextGameObjects;
  /** @type {Phaser.GameObjects.Group} */
  #battleStyleOptionTextGameObjects;
  /** @type {Phaser.GameObjects.Group} */
  #textSpeedOptionTextGameObjects;
  /** @type {Controls} */
  #controls;

  constructor() {
    super({ key: SCENE_KEYS.OPTIONS_SCENE });
  }

  init() {
    this.#selectedOptionMenu = OPTION_MENU_OPTIONS.TEXT_SPEED;
    this.#selectedTextSpeedOption = TEXT_SPEED_OPTIONS.MID;
    this.#selectedBattleSceneOption = BATTLE_SCENE_OPTIONS.ON;
    this.#selectedBattleStyleOption = BATTLE_STYLE_OPTIONS.SHIFT;
    this.#selectedSoundMenuOption = SOUND_OPTIONS.ON;
    this.#selectedVolumeOption = 4;
    this.#selectedMenuColorOption = 0;
  }

  create() {
    const { width, height } = this.scale;
    const optionMenuWidth = width - 200;

    // main options container
    this.#mainContainer = createNineSliceContainer(this, UI_ASSET_KEYS.MENU_BACKGROUND, optionMenuWidth, 432);
    this.#mainContainer.setX(100).setY(20);

    // create main option sections
    this.add.text(width / 2, 40, 'Options', OPTIONS_TEXT_STYLE).setOrigin(0.5);
    this.add.text(125, 75, 'Text Speed', OPTIONS_TEXT_STYLE);
    this.add.text(125, 130, 'Battle Scene', OPTIONS_TEXT_STYLE);
    this.add.text(125, 185, 'Battle Style', OPTIONS_TEXT_STYLE);
    this.add.text(125, 240, 'Sound', OPTIONS_TEXT_STYLE);
    this.add.text(125, 295, 'Volume', OPTIONS_TEXT_STYLE);
    this.add.text(125, 350, 'Menu Color', OPTIONS_TEXT_STYLE);
    this.add.text(125, 405, 'Close', OPTIONS_TEXT_STYLE);

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
    this.#volumeOptionValueText = this.add.text(760, 295, '100%', OPTIONS_TEXT_STYLE);

    // frame options
    this.#selectedMenuColorTextGameObject = this.add.text(590, 350, '', OPTIONS_TEXT_STYLE);
    this.add.image(660, 352, UI_ASSET_KEYS.CURSOR_WHITE).setOrigin(0, 0).setScale(2.5);
    this.add.image(530, 352, UI_ASSET_KEYS.CURSOR_WHITE).setOrigin(1, 0).setScale(2.5).setFlipX(true);

    // option details container
    this.#infoContainer = createNineSliceContainer(this, UI_ASSET_KEYS.MENU_BACKGROUND, optionMenuWidth, 100);
    this.#infoContainer.setX(100).setY(height - 110);
    this.#selectedOptionInfoMsgTextGameObject = this.add.text(125, 480, OPTION_MENU_OPTION_INFO_MSG.TEXT_SPEED, {
      ...OPTIONS_TEXT_STYLE,
      ...{
        wordWrap: { width: width - 250 },
      },
    });

    this.#updateMenuColorDisplayText();

    this.#optionsMenuCursor = this.add
      .rectangle(110, 70, optionMenuWidth - 20, 40, 0xffffff, 0)
      .setOrigin(0)
      .setStrokeStyle(4, 0xe4434a, 1);

    this.#updateSoundOptionGameObjects();
    this.#updateBattleSceneOptionGameObjects();
    this.#updateBattleStyleOptionGameObjects();
    this.#updateTextSpeedOptionGameObjects();

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

  #updateMenuColorDisplayText() {
    switch (this.#selectedMenuColorOption) {
      case 0:
        this.#selectedMenuColorTextGameObject.setText('1');
        updateNineSliceContainerTexture(this, this.#mainContainer, UI_ASSET_KEYS.MENU_BACKGROUND);
        updateNineSliceContainerTexture(this, this.#infoContainer, UI_ASSET_KEYS.MENU_BACKGROUND);
        break;
      case 1:
        this.#selectedMenuColorTextGameObject.setText('2');
        updateNineSliceContainerTexture(this, this.#mainContainer, UI_ASSET_KEYS.MENU_BACKGROUND_GREEN);
        updateNineSliceContainerTexture(this, this.#infoContainer, UI_ASSET_KEYS.MENU_BACKGROUND_GREEN);
        break;
      case 2:
        this.#selectedMenuColorTextGameObject.setText('3');
        updateNineSliceContainerTexture(this, this.#mainContainer, UI_ASSET_KEYS.MENU_BACKGROUND_PURPLE);
        updateNineSliceContainerTexture(this, this.#infoContainer, UI_ASSET_KEYS.MENU_BACKGROUND_PURPLE);
        break;
      default:
        exhaustiveGuard(this.#selectedMenuColorOption);
    }
  }

  #updateSoundOptionGameObjects() {
    const textGameObjects = /** @type {Phaser.GameObjects.Text[]} */ (this.#soundOptionTextGameObjects.getChildren());

    textGameObjects.forEach((obj) => {
      obj.setColor(TEXT_FONT_COLORS.NOT_SELECTED);
    });

    if (this.#selectedSoundMenuOption === SOUND_OPTIONS.OFF) {
      textGameObjects[1].setColor(TEXT_FONT_COLORS.SELECTED);
      return;
    }

    if (this.#selectedSoundMenuOption === SOUND_OPTIONS.ON) {
      textGameObjects[0].setColor(TEXT_FONT_COLORS.SELECTED);
      return;
    }

    exhaustiveGuard(this.#selectedSoundMenuOption);
  }

  #updateBattleSceneOptionGameObjects() {
    const textGameObjects = /** @type {Phaser.GameObjects.Text[]} */ (
      this.#battleSceneOptionTextGameObjects.getChildren()
    );

    textGameObjects.forEach((obj) => {
      obj.setColor(TEXT_FONT_COLORS.NOT_SELECTED);
    });

    if (this.#selectedBattleSceneOption === BATTLE_SCENE_OPTIONS.OFF) {
      textGameObjects[1].setColor(TEXT_FONT_COLORS.SELECTED);
      return;
    }

    if (this.#selectedBattleSceneOption === BATTLE_SCENE_OPTIONS.ON) {
      textGameObjects[0].setColor(TEXT_FONT_COLORS.SELECTED);
      return;
    }

    exhaustiveGuard(this.#selectedBattleSceneOption);
  }

  #updateBattleStyleOptionGameObjects() {
    const textGameObjects = /** @type {Phaser.GameObjects.Text[]} */ (
      this.#battleStyleOptionTextGameObjects.getChildren()
    );

    textGameObjects.forEach((obj) => {
      obj.setColor(TEXT_FONT_COLORS.NOT_SELECTED);
    });

    if (this.#selectedBattleStyleOption === BATTLE_STYLE_OPTIONS.SHIFT) {
      textGameObjects[1].setColor(TEXT_FONT_COLORS.SELECTED);
      return;
    }

    if (this.#selectedBattleStyleOption === BATTLE_STYLE_OPTIONS.SET) {
      textGameObjects[0].setColor(TEXT_FONT_COLORS.SELECTED);
      return;
    }

    exhaustiveGuard(this.#selectedBattleStyleOption);
  }

  #updateTextSpeedOptionGameObjects() {
    const textGameObjects = /** @type {Phaser.GameObjects.Text[]} */ (
      this.#textSpeedOptionTextGameObjects.getChildren()
    );

    textGameObjects.forEach((obj) => {
      obj.setColor(TEXT_FONT_COLORS.NOT_SELECTED);
    });

    if (this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.SLOW) {
      textGameObjects[0].setColor(TEXT_FONT_COLORS.SELECTED);
      return;
    }

    if (this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.MID) {
      textGameObjects[1].setColor(TEXT_FONT_COLORS.SELECTED);
      return;
    }

    if (this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.FAST) {
      textGameObjects[2].setColor(TEXT_FONT_COLORS.SELECTED);
      return;
    }

    exhaustiveGuard(this.#selectedTextSpeedOption);
  }

  /**
   * @param {import('../common/direction.js').Direction} direction
   * @returns {void}
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
   * @returns {void}
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
          this.#updateTextSpeedOption(direction);
          this.#updateTextSpeedOptionGameObjects();
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
          this.#updateBattleSceneOption(direction);
          this.#updateBattleSceneOptionGameObjects();
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
          this.#updateBattleStyleOption(direction);
          this.#updateBattleStyleOptionGameObjects();
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
          this.#updateSoundOption(direction);
          this.#updateSoundOptionGameObjects();
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
          this.#updateVolumeOption(direction);
          this.#updateVolumeSlider();
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
          this.#updateMenuColorOption(direction);
          this.#updateMenuColorDisplayText();
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
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    exhaustiveGuard(this.#selectedOptionMenu);
  }

  /**
   * @param {'LEFT' | 'RIGHT'} direction
   * @returns {void}
   */
  #updateTextSpeedOption(direction) {
    if (direction === DIRECTION.LEFT && this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.SLOW) {
      return;
    }
    if (direction === DIRECTION.RIGHT && this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.FAST) {
      return;
    }

    if (direction === DIRECTION.LEFT && this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.MID) {
      this.#selectedTextSpeedOption = TEXT_SPEED_OPTIONS.SLOW;
      return;
    }
    if (direction === DIRECTION.LEFT && this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.FAST) {
      this.#selectedTextSpeedOption = TEXT_SPEED_OPTIONS.MID;
      return;
    }

    if (direction === DIRECTION.RIGHT && this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.SLOW) {
      this.#selectedTextSpeedOption = TEXT_SPEED_OPTIONS.MID;
      return;
    }
    if (direction === DIRECTION.RIGHT && this.#selectedTextSpeedOption === TEXT_SPEED_OPTIONS.MID) {
      this.#selectedTextSpeedOption = TEXT_SPEED_OPTIONS.FAST;
      return;
    }

    if (direction === DIRECTION.RIGHT) {
      return;
    }
  }

  /**
   * @param {'LEFT' | 'RIGHT'} direction
   * @returns {void}
   */
  #updateMenuColorOption(direction) {
    if (direction === DIRECTION.LEFT && this.#selectedMenuColorOption === 0) {
      this.#selectedMenuColorOption = 2;
      return;
    }
    if (direction === DIRECTION.RIGHT && this.#selectedMenuColorOption === 2) {
      this.#selectedMenuColorOption = 0;
      return;
    }
    if (direction === DIRECTION.LEFT) {
      this.#selectedMenuColorOption -= 1;
      return;
    }
    if (direction === DIRECTION.RIGHT) {
      this.#selectedMenuColorOption += 1;
      return;
    }

    exhaustiveGuard(direction);
  }

  #updateVolumeSlider() {
    switch (this.#selectedVolumeOption) {
      case 0:
        this.#volumeOptionsMenuCursor.setX(420);
        this.#volumeOptionValueText.setText('0%');
        break;
      case 1:
        this.#volumeOptionsMenuCursor.setX(490);
        this.#volumeOptionValueText.setText('25%');
        break;
      case 2:
        this.#volumeOptionsMenuCursor.setX(560);
        this.#volumeOptionValueText.setText('50%');
        break;
      case 3:
        this.#volumeOptionsMenuCursor.setX(630);
        this.#volumeOptionValueText.setText('75%');
        break;
      case 4:
        this.#volumeOptionsMenuCursor.setX(710);
        this.#volumeOptionValueText.setText('100%');
        break;
      default:
        exhaustiveGuard(this.#selectedVolumeOption);
    }
  }

  /**
   * @param {'LEFT' | 'RIGHT'} direction
   * @returns {void}
   */
  #updateVolumeOption(direction) {
    if (direction === DIRECTION.LEFT && this.#selectedVolumeOption === 0) {
      return;
    }
    if (direction === DIRECTION.LEFT) {
      this.#selectedVolumeOption = /** @type {VolumeMenuOptions} */ (this.#selectedVolumeOption - 1);
      return;
    }

    if (direction === DIRECTION.RIGHT && this.#selectedVolumeOption === 4) {
      return;
    }
    if (direction === DIRECTION.RIGHT) {
      this.#selectedVolumeOption = /** @type {VolumeMenuOptions} */ (this.#selectedVolumeOption + 1);
      return;
    }

    exhaustiveGuard(direction);
  }

  /**
   * @param {'LEFT' | 'RIGHT'} direction
   * @returns {void}
   */
  #updateSoundOption(direction) {
    if (direction === DIRECTION.LEFT && this.#selectedSoundMenuOption === SOUND_OPTIONS.ON) {
      return;
    }
    if (direction === DIRECTION.LEFT) {
      this.#selectedSoundMenuOption = SOUND_OPTIONS.ON;
      return;
    }

    if (direction === DIRECTION.RIGHT && this.#selectedSoundMenuOption === SOUND_OPTIONS.OFF) {
      return;
    }
    if (direction === DIRECTION.RIGHT) {
      this.#selectedSoundMenuOption = SOUND_OPTIONS.OFF;
      return;
    }

    exhaustiveGuard(direction);
  }

  /**
   * @param {'LEFT' | 'RIGHT'} direction
   * @returns {void}
   */
  #updateBattleStyleOption(direction) {
    if (direction === DIRECTION.LEFT && this.#selectedBattleStyleOption === BATTLE_STYLE_OPTIONS.SET) {
      return;
    }
    if (direction === DIRECTION.LEFT) {
      this.#selectedBattleStyleOption = BATTLE_STYLE_OPTIONS.SET;
      return;
    }

    if (direction === DIRECTION.RIGHT && this.#selectedBattleStyleOption === BATTLE_STYLE_OPTIONS.SHIFT) {
      return;
    }
    if (direction === DIRECTION.RIGHT) {
      this.#selectedBattleStyleOption = BATTLE_STYLE_OPTIONS.SHIFT;
      return;
    }

    exhaustiveGuard(direction);
  }

  /**
   * @param {'LEFT' | 'RIGHT'} direction
   * @returns {void}
   */
  #updateBattleSceneOption(direction) {
    if (direction === DIRECTION.LEFT && this.#selectedBattleSceneOption === BATTLE_SCENE_OPTIONS.ON) {
      return;
    }
    if (direction === DIRECTION.LEFT) {
      this.#selectedBattleSceneOption = BATTLE_SCENE_OPTIONS.ON;
      return;
    }

    if (direction === DIRECTION.RIGHT && this.#selectedBattleSceneOption === BATTLE_SCENE_OPTIONS.OFF) {
      return;
    }
    if (direction === DIRECTION.RIGHT) {
      this.#selectedBattleSceneOption = BATTLE_SCENE_OPTIONS.OFF;
      return;
    }

    exhaustiveGuard(direction);
  }
}
