import { BATTLE_BACKGROUND_ASSET_KEYS, INTRO_ASSET_KEYS, MONSTER_ASSET_KEYS } from '../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { BaseScene } from './base-scene.js';
import { SCENE_KEYS } from './scene-keys.js';

export class IntroScene extends BaseScene {
  constructor() {
    super({
      key: SCENE_KEYS.INTRO_SCENE,
    });
  }

  /**
   * @returns {Promise<void>}
   */
  async create() {
    super.create();

    // create basic background
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xd7d7d7, 1).setOrigin(0);
    // create logo
    const logo = this.add.image(this.scale.width / 2, this.scale.height / 2, INTRO_ASSET_KEYS.LOGO, 0).setAlpha(0);
    const text = this.add
      .text(this.scale.width / 2, 340, 'dev share academy', {
        fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
        fontSize: '42px',
        color: 'black',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // create monsters
    this.add.image(100, 390, MONSTER_ASSET_KEYS.AQUAVALOR, 0);
    // create black bars
    const blackBarSize = 125;
    this.add.rectangle(0, 0, this.scale.width, blackBarSize, 0x000000, 1).setOrigin(0);
    this.add.rectangle(0, this.scale.height - blackBarSize, this.scale.width, blackBarSize, 0x000000, 1).setOrigin(0);

    await this.showLogo([logo, text]);
    await this.hideLogo([logo, text]);
  }

  /**
   *
   * @param {Phaser.GameObjects.GameObject[]} gameObjects
   * @returns {Promise<void>}
   */
  showLogo(gameObjects) {
    return new Promise((resolve) => {
      this.tweens.add({
        delay: 600,
        duration: 2000,
        repeat: 0,
        alpha: {
          from: 0,
          start: 0,
          to: 1,
        },
        targets: gameObjects,
        onComplete: () => {
          resolve();
        },
      });
    });
  }

  /**
   *
   * @param {Phaser.GameObjects.GameObject[]} gameObjects
   * @returns {Promise<void>}
   */
  hideLogo(gameObjects) {
    return new Promise((resolve) => {
      this.tweens.add({
        delay: 600,
        duration: 1200,
        repeat: 0,
        alpha: {
          from: 1,
          start: 1,
          to: 0,
        },
        targets: gameObjects,
        onComplete: () => {
          resolve();
        },
      });
    });
  }
}
