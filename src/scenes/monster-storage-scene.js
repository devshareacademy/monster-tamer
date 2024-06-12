import { MONSTER_ASSET_KEYS, MONSTER_PARTY_ASSET_KEYS, UI_ASSET_KEYS } from '../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { DIRECTION } from '../common/direction.js';
import Phaser from '../lib/phaser.js';
import { BaseScene } from './base-scene.js';
import { SCENE_KEYS } from './scene-keys.js';

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const UI_TEXT_STYLE = {
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#FFFFFF',
  fontSize: '24px',
};

/**
 * @typedef MonsterStorageSceneData
 * @type {object}
 * @property {string} previousSceneName
 */

export class MonsterStorageScene extends BaseScene {
  /** @type {MonsterStorageSceneData} */
  #sceneData;
  /** @type {Phaser.GameObjects.Image} */
  #cancelButton;
  /** @type {Phaser.GameObjects.Text} */
  #boxInfoTextGameObject;
  /** @type {Phaser.GameObjects.Rectangle} */
  #monsterSelectionBox;
  /** @type {number} */
  #selectedMonsterIndex;

  constructor() {
    super({ key: SCENE_KEYS.MONSTER_STORAGE_SCENE });
  }

  /**
   * @param {MonsterStorageSceneData} data
   * @returns {void}
   */
  init(data) {
    super.init(data);
    this.#sceneData = data;
    this.#selectedMonsterIndex = 0;
  }

  /**
   * @returns {void}
   */
  create() {
    super.create();

    // create main background and title
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x2f4bfd, 1).setOrigin(0);
    this.add.rectangle(10, 60, 300, 496, 0x73737c, 1).setOrigin(0);
    this.add.rectangle(30, 100, 260, 210, 0xffffff, 0.8).setOrigin(0);
    this.add.rectangle(30, 320, 260, 225, 0x9494ad, 1).setOrigin(0);

    console.log(this.scale.height - 80 - 77);

    this.add.text(10, 0, 'Monster Storage', {
      ...UI_TEXT_STYLE,
      fontSize: '48px',
    });
    this.add.text(70, 70, 'Monster Data', {
      ...UI_TEXT_STYLE,
      fontSize: '22px',
    });

    // create close box button
    const buttonContainer = this.add.container(820, 10, []);
    this.#cancelButton = this.add.image(0, 0, UI_ASSET_KEYS.BLUE_BUTTON, 0).setOrigin(0).setScale(1, 1).setAlpha(0.7);
    const cancelText = this.add.text(96, 20.6, 'Close Box', UI_TEXT_STYLE).setOrigin(0.5);
    buttonContainer.add([this.#cancelButton, cancelText]);

    // create box info container
    const infoContainer = this.add.container(460, 72, []);
    const infoDisplay = this.add.rectangle(0, 0, 400, 65, 0xede4f3, 1).setOrigin(0).setStrokeStyle(6, 0x9494ad, 1);
    this.#boxInfoTextGameObject = this.add.text(150, 14, 'Box 1', {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#000000',
      fontSize: '32px',
    });
    infoContainer.add([infoDisplay, this.#boxInfoTextGameObject]);

    // create monster box container
    this.add.rectangle(322, 154, 690, 400, 0xffffff, 0.8).setOrigin(0).setStrokeStyle(4, 0x9494ad, 1);

    // populate monster box
    this.#monsterSelectionBox = this.add.rectangle(0, 0, 74, 74, 0xffffff, 0).setStrokeStyle(2.5, 0xff0000, 1);
    this.add.container(365, 200, [
      this.add.image(74 * 0, 0, MONSTER_ASSET_KEYS.IGNIVOLT).setScale(0.25),
      this.add.image(74 * 1, 0, MONSTER_ASSET_KEYS.AQUAVALOR).setScale(0.25),
      this.add.image(74 * 2, 0, MONSTER_ASSET_KEYS.CARNODUSK).setScale(0.25),
      this.add.image(74 * 3, 0, MONSTER_ASSET_KEYS.IGNIVOLT).setScale(0.25),
      this.add.image(74 * 4, 0, MONSTER_ASSET_KEYS.AQUAVALOR).setScale(0.25),
      this.add.image(74 * 5, 0, MONSTER_ASSET_KEYS.CARNODUSK).setScale(0.25),
      this.add.image(74 * 6, 0, MONSTER_ASSET_KEYS.IGNIVOLT).setScale(0.25),
      this.add.image(74 * 7, 0, MONSTER_ASSET_KEYS.AQUAVALOR).setScale(0.25),
      this.add.image(74 * 8, 0, MONSTER_ASSET_KEYS.CARNODUSK).setScale(0.25),

      // this.add.image(74 * 0, 74 * 1, MONSTER_ASSET_KEYS.IGNIVOLT).setScale(0.25),
      // this.add.image(74 * 1, 74 * 1, MONSTER_ASSET_KEYS.AQUAVALOR).setScale(0.25),
      // this.add.image(74 * 2, 74 * 1, MONSTER_ASSET_KEYS.CARNODUSK).setScale(0.25),
      // this.add.image(74 * 3, 74 * 1, MONSTER_ASSET_KEYS.IGNIVOLT).setScale(0.25),
      // this.add.image(74 * 4, 74 * 1, MONSTER_ASSET_KEYS.AQUAVALOR).setScale(0.25),
      // this.add.image(74 * 5, 74 * 1, MONSTER_ASSET_KEYS.CARNODUSK).setScale(0.25),
      // this.add.image(74 * 6, 74 * 1, MONSTER_ASSET_KEYS.IGNIVOLT).setScale(0.25),
      // this.add.image(74 * 7, 74 * 1, MONSTER_ASSET_KEYS.AQUAVALOR).setScale(0.25),
      // this.add.image(74 * 8, 74 * 1, MONSTER_ASSET_KEYS.CARNODUSK).setScale(0.25),

      // this.add.image(74 * 0, 74 * 2, MONSTER_ASSET_KEYS.IGNIVOLT).setScale(0.25),
      // this.add.image(74 * 1, 74 * 2, MONSTER_ASSET_KEYS.AQUAVALOR).setScale(0.25),
      // this.add.image(74 * 2, 74 * 2, MONSTER_ASSET_KEYS.CARNODUSK).setScale(0.25),
      // this.add.image(74 * 3, 74 * 2, MONSTER_ASSET_KEYS.IGNIVOLT).setScale(0.25),
      // this.add.image(74 * 4, 74 * 2, MONSTER_ASSET_KEYS.AQUAVALOR).setScale(0.25),
      // this.add.image(74 * 5, 74 * 2, MONSTER_ASSET_KEYS.CARNODUSK).setScale(0.25),
      // this.add.image(74 * 6, 74 * 2, MONSTER_ASSET_KEYS.IGNIVOLT).setScale(0.25),
      // this.add.image(74 * 7, 74 * 2, MONSTER_ASSET_KEYS.AQUAVALOR).setScale(0.25),
      // this.add.image(74 * 8, 74 * 2, MONSTER_ASSET_KEYS.CARNODUSK).setScale(0.25),

      // this.add.image(74 * 0, 74 * 3, MONSTER_ASSET_KEYS.IGNIVOLT).setScale(0.25),
      // this.add.image(74 * 1, 74 * 3, MONSTER_ASSET_KEYS.AQUAVALOR).setScale(0.25),
      // this.add.image(74 * 2, 74 * 3, MONSTER_ASSET_KEYS.CARNODUSK).setScale(0.25),
      // this.add.image(74 * 3, 74 * 3, MONSTER_ASSET_KEYS.IGNIVOLT).setScale(0.25),
      // this.add.image(74 * 4, 74 * 3, MONSTER_ASSET_KEYS.AQUAVALOR).setScale(0.25),
      // this.add.image(74 * 5, 74 * 3, MONSTER_ASSET_KEYS.CARNODUSK).setScale(0.25),
      // this.add.image(74 * 6, 74 * 3, MONSTER_ASSET_KEYS.IGNIVOLT).setScale(0.25),
      // this.add.image(74 * 7, 74 * 3, MONSTER_ASSET_KEYS.AQUAVALOR).setScale(0.25),
      // this.add.image(74 * 8, 74 * 3, MONSTER_ASSET_KEYS.CARNODUSK).setScale(0.25),

      // this.add.image(74 * 0, 74 * 4, MONSTER_ASSET_KEYS.IGNIVOLT).setScale(0.25),
      // this.add.image(74 * 1, 74 * 4, MONSTER_ASSET_KEYS.AQUAVALOR).setScale(0.25),
      // this.add.image(74 * 2, 74 * 4, MONSTER_ASSET_KEYS.CARNODUSK).setScale(0.25),
      // this.add.image(74 * 3, 74 * 4, MONSTER_ASSET_KEYS.IGNIVOLT).setScale(0.25),
      // this.add.image(74 * 4, 74 * 4, MONSTER_ASSET_KEYS.AQUAVALOR).setScale(0.25),
      // this.add.image(74 * 5, 74 * 4, MONSTER_ASSET_KEYS.CARNODUSK).setScale(0.25),
      // this.add.image(74 * 6, 74 * 4, MONSTER_ASSET_KEYS.IGNIVOLT).setScale(0.25),
      // this.add.image(74 * 7, 74 * 4, MONSTER_ASSET_KEYS.AQUAVALOR).setScale(0.25),
      // this.add.image(74 * 8, 74 * 4, MONSTER_ASSET_KEYS.CARNODUSK).setScale(0.25),

      this.#monsterSelectionBox,
    ]);
  }

  /**
   * @returns {void}
   */
  update() {
    super.update();

    if (this._controls.isInputLocked) {
      return;
    }

    const selectedDirection = this._controls.getDirectionKeyJustPressed();
    const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();
    const wasBackKeyPressed = this._controls.wasBackKeyPressed();

    switch (selectedDirection) {
      case DIRECTION.UP:
        this.#selectedMonsterIndex -= 9;
        if (this.#selectedMonsterIndex < 0) {
          this.#selectedMonsterIndex += 45;
        }
        break;
      case DIRECTION.DOWN:
        this.#selectedMonsterIndex += 9;
        if (this.#selectedMonsterIndex >= 45) {
          this.#selectedMonsterIndex -= 45;
        }
        break;
      case DIRECTION.LEFT:
        if ([0, 9, 18, 27, 36].includes(this.#selectedMonsterIndex)) {
          this.#selectedMonsterIndex += 8;
          return;
        }
        this.#selectedMonsterIndex -= 1;
        break;
      case DIRECTION.RIGHT:
        if ([8, 17, 26, 35, 44].includes(this.#selectedMonsterIndex)) {
          this.#selectedMonsterIndex -= 8;
          return;
        }
        this.#selectedMonsterIndex += 1;
        break;
    }

    const x = this.#selectedMonsterIndex % 9;
    const y = Math.floor(this.#selectedMonsterIndex / 9);
    this.#monsterSelectionBox.setPosition(x * 74, y * 74);
  }
}
