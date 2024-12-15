import Phaser from '../lib/phaser.js';
import { DIRECTION } from '../common/direction.js';

export class Controls {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {Phaser.Types.Input.Keyboard.CursorKeys | undefined} */
  #cursorKeys;
  /** @type {boolean} */
  #lockPlayerInput;
  /** @type {Phaser.Input.Keyboard.Key | undefined} */
  #enterKey;
  /** @type {Phaser.Input.Keyboard.Key | undefined} */
  #fKey;

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene the cursor keys will be created in
   */
  constructor(scene) {
    this.#scene = scene;
    this.#cursorKeys = this.#scene.input.keyboard?.createCursorKeys();
    this.#enterKey = this.#scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.#fKey = this.#scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.#lockPlayerInput = false;
  }

  /** @type {boolean} */
  get isInputLocked() {
    return this.#lockPlayerInput;
  }

  /** @param {boolean} val the value that will be assigned */
  set lockInput(val) {
    this.#lockPlayerInput = val;
  }

  /** @returns {boolean} */
  wasEnterKeyPressed() {
    if (this.#enterKey === undefined) {
      return false;
    }
    return Phaser.Input.Keyboard.JustDown(this.#enterKey);
  }

  /** @returns {boolean} */
  wasSpaceKeyPressed() {
    if (this.#cursorKeys === undefined) {
      return false;
    }
    return Phaser.Input.Keyboard.JustDown(this.#cursorKeys.space);
  }

  /** @returns {boolean} */
  wasBackKeyPressed() {
    if (this.#cursorKeys === undefined) {
      return false;
    }
    return Phaser.Input.Keyboard.JustDown(this.#cursorKeys.shift);
  }

  /** @returns {boolean} */
  wasFKeyPressed() {
    if (this.#fKey === undefined) {
      return false;
    }
    return Phaser.Input.Keyboard.JustDown(this.#fKey);
  }

  /** @returns {import('../common/direction.js').Direction} */
  getDirectionKeyJustPressed() {
    if (this.#cursorKeys === undefined) {
      return DIRECTION.NONE;
    }

    /** @type {import('../common/direction.js').Direction} */
    let selectedDirection = DIRECTION.NONE;
    if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.left)) {
      selectedDirection = DIRECTION.LEFT;
    } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.right)) {
      selectedDirection = DIRECTION.RIGHT;
    } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.up)) {
      selectedDirection = DIRECTION.UP;
    } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.down)) {
      selectedDirection = DIRECTION.DOWN;
    }

    return selectedDirection;
  }

  /** @returns {import('../common/direction.js').Direction} */
  getDirectionKeyPressedDown() {
    if (this.#cursorKeys === undefined) {
      return DIRECTION.NONE;
    }

    /** @type {import('../common/direction.js').Direction} */
    let selectedDirection = DIRECTION.NONE;
    if (this.#cursorKeys.left.isDown) {
      selectedDirection = DIRECTION.LEFT;
    } else if (this.#cursorKeys.right.isDown) {
      selectedDirection = DIRECTION.RIGHT;
    } else if (this.#cursorKeys.up.isDown) {
      selectedDirection = DIRECTION.UP;
    } else if (this.#cursorKeys.down.isDown) {
      selectedDirection = DIRECTION.DOWN;
    }

    return selectedDirection;
  }
}
