import Phaser from '../../lib/phaser.js';

export class Menu {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {number} */
  #width;
  /** @type {number} */
  #height;
  /** @type {number} */
  #padding;
  /** @type {Phaser.GameObjects.Graphics} */
  #graphics;
  /** @type {Phaser.GameObjects.Container} */
  #container;
  /** @type {boolean} */
  #isVisible;

  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.#scene = scene;
    this.#padding = 4;
    this.#width = 300;

    // calculate height based on currently available options
    this.#height = 10 + this.#padding * 2 + 50;

    this.#graphics = this.#createGraphics();
    this.#container = this.#scene.add.container(0, 0, [this.#graphics]);
  }

  /** @type {boolean} */
  get isVisible() {
    return this.#isVisible;
  }

  /**
   * @returns {void}
   */
  show() {
    const { right, top } = this.#scene.cameras.main.worldView;
    const startX = right - this.#padding * 2 - this.#width;
    const startY = top + this.#padding * 2;

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
   * @returns {Phaser.GameObjects.Graphics}
   */
  #createGraphics() {
    const g = this.#scene.add.graphics();
    const menuColor = { main: 0x32454c, border: 0x6d9aa8 };

    g.fillStyle(menuColor.main, 1);
    g.fillRect(1, 0, this.#width - 1, this.#height - 1);
    g.lineStyle(8, menuColor.border, 10);
    g.strokeRect(0, 0, this.#width, this.#height);
    g.setAlpha(0.9);

    return g;
  }
}
