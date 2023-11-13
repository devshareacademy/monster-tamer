import Phaser from '../lib/phaser.js';
import { UI_ASSET_KEYS } from '../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { animateText } from '../utils/text-utils.js';
import { TEXT_SPEED } from '../config.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import { TEXT_SPEED_OPTIONS } from '../common/options.js';
import { exhaustiveGuard } from '../utils/guard.js';

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const UI_TEXT_STYLE = {
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: 'black',
  fontSize: '32px',
  wordWrap: { width: 0 },
};

export class DialogUi {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {number} */
  #padding;
  /** @type {number} */
  #width;
  /** @type {number} */
  #height;
  /** @type {Phaser.GameObjects.Container} */
  #container;
  /** @type {Phaser.GameObjects.Graphics} */
  #graphics;
  /** @type {boolean} */
  #isVisible;
  /** @type {Phaser.GameObjects.Image} */
  #userInputCursor;
  /** @type {Phaser.Tweens.Tween} */
  #userInputCursorTween;
  /** @type {Phaser.GameObjects.Text} */
  #uiText;
  /** @type {boolean} */
  #textAnimationPlaying;
  /** @type {string[]} */
  #messagesToShow;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} width
   */
  constructor(scene, width) {
    this.#scene = scene;
    this.#padding = 90;
    this.#width = width - this.#padding * 2;
    this.#height = 124;
    this.#textAnimationPlaying = false;
    this.#messagesToShow = [];

    this.#graphics = this.#createGraphics();
    this.#container = this.#scene.add.container(0, 0, [this.#graphics]);
    this.#uiText = this.#scene.add.text(18, 12, '', {
      ...UI_TEXT_STYLE,
      ...{ wordWrap: { width: this.#width - 18 } },
    });
    this.#container.add(this.#uiText);
    this.#createPlayerInputCursor();
    this.hideDialogModal();
  }

  /** @type {boolean} */
  get isVisible() {
    return this.#isVisible;
  }

  /** @type {boolean} */
  get isAnimationPlaying() {
    return this.#textAnimationPlaying;
  }

  /** @type {boolean} */
  get moreMessagesToShow() {
    return this.#messagesToShow.length > 0;
  }

  /**
   * @param {string[]} messages
   * @returns {void}
   */
  showDialogModal(messages) {
    this.#messagesToShow = [...messages];

    const { x, bottom } = this.#scene.cameras.main.worldView;
    const startX = x + this.#padding;
    const startY = bottom - this.#height - this.#padding / 4;

    this.#container.setPosition(startX, startY);
    this.#userInputCursorTween.restart();
    this.#container.setAlpha(1);
    this.#isVisible = true;

    this.showNextMessage();
  }

  /**
   * @returns {void}
   */
  showNextMessage() {
    if (this.#messagesToShow.length === 0) {
      return;
    }

    this.#uiText.setText('').setAlpha(1);
    animateText(this.#scene, this.#uiText, this.#messagesToShow.shift(), {
      delay: this.#getAnimatedTextSpeed(),
      callback: () => {
        this.#textAnimationPlaying = false;
      },
    });
    this.#textAnimationPlaying = true;
  }

  /**
   * @returns {void}
   */
  hideDialogModal() {
    this.#container.setAlpha(0);
    this.#userInputCursorTween.pause();
    this.#isVisible = false;
  }

  /**
   * @returns {Phaser.GameObjects.Graphics}
   */
  #createGraphics() {
    const g = this.#scene.add.graphics();

    g.fillStyle(0xede4f3, 1);
    g.fillRect(1, 0, this.#width - 1, this.#height - 1);
    g.lineStyle(8, 0x905ac2, 10);
    g.strokeRect(0, 0, this.#width, this.#height);
    g.setAlpha(0.9);

    return g;
  }

  /**
   * @returns {void}
   */
  #createPlayerInputCursor() {
    const y = this.#height - 24;
    this.#userInputCursor = this.#scene.add.image(this.#width - 16, y, UI_ASSET_KEYS.CURSOR);
    this.#userInputCursor.setAngle(90).setScale(4.5, 2);
    this.#userInputCursorTween = this.#scene.tweens.add({
      delay: 0,
      duration: 500,
      repeat: -1,
      y: {
        from: y,
        start: y,
        to: y + 6,
      },
      targets: this.#userInputCursor,
    });
    this.#userInputCursorTween.pause();
    this.#container.add(this.#userInputCursor);
  }

  /**
   * @returns {number}
   */
  #getAnimatedTextSpeed() {
    /** @type {import('../common/options.js').TextSpeedMenuOptions | undefined} */
    const chosenTextSpeed = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_TEXT_SPEED);
    if (!chosenTextSpeed) {
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
}
