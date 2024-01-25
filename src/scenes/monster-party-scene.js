import { BATTLE_ASSET_KEYS, MONSTER_PARTY_ASSET_KEYS, UI_ASSET_KEYS } from '../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { HealthBar } from '../battle/ui/health-bar.js';
import Phaser from '../lib/phaser.js';
import { BaseScene } from './base-scene.js';
import { SCENE_KEYS } from './scene-keys.js';

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const UI_TEXT_STYLE = {
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#FFFFFF',
  fontSize: '24px',
};

export class MonsterPartyScene extends BaseScene {
  /** @type {Phaser.GameObjects.Image[]} */
  #monsterPartyBackgrounds;
  /** @type {Phaser.GameObjects.Image} */
  #cancelButton;
  /** @type {Phaser.GameObjects.Text} */
  #infoTextGameObject;
  /** @type {HealthBar[]} */
  #healthBars;
  /** @type {Phaser.GameObjects.Text[]} */
  #healthBarTextGameObjects;
  /** @type {number} */
  #selectedPartyMonsterIndex;

  constructor() {
    super({
      key: SCENE_KEYS.MONSTER_PARTY_SCENE,
    });
  }

  /**
   * @returns {void}
   */
  init() {
    super.init();

    this.#monsterPartyBackgrounds = [];
    this.#healthBars = [];
    this.#healthBarTextGameObjects = [];
    this.#selectedPartyMonsterIndex = 0;
  }

  /**
   * @returns {void}
   */
  create() {
    super.create();

    // create custom background
    this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, MONSTER_PARTY_ASSET_KEYS.PARTY_BACKGROUND, 0)
      .setOrigin(0)
      .setAlpha(0.7);

    // create button
    const buttonContainer = this.add.container(883, 519, []);
    this.#cancelButton = this.add.image(0, 0, UI_ASSET_KEYS.BLUE_BUTTON, 0).setOrigin(0).setScale(0.7, 1).setAlpha(0.7);
    const cancelText = this.add.text(66.5, 20.6, 'cancel', UI_TEXT_STYLE).setOrigin(0.5);
    buttonContainer.add([this.#cancelButton, cancelText]);

    // create info container
    const infoContainer = this.add.container(4, this.scale.height - 69, []);
    const infoDisplay = this.add.rectangle(0, 0, 867, 65, 0xede4f3, 1).setOrigin(0).setStrokeStyle(8, 0x905ac2, 1);
    this.#infoTextGameObject = this.add.text(15, 14, '', {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#000000',
      fontSize: '23px',
    });
    infoContainer.add([infoDisplay, this.#infoTextGameObject]);
    this.#updateInfoContainerText();

    // create monsters in party
    this.add.image(0, 10, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2);
    this.add.image(510, 40, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    this.add.image(0, 160, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    this.add.image(510, 190, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    this.add.image(0, 310, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    this.add.image(510, 340, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.35);
  }

  #updateInfoContainerText() {
    if (this.#selectedPartyMonsterIndex === -1) {
      this.#infoTextGameObject.setText('Go back to previous menu');
      return;
    }
    this.#infoTextGameObject.setText('Choose a monster');
  }
}
