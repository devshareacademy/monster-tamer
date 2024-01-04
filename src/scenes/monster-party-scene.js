import {
  BATTLE_ASSET_KEYS,
  HEALTH_BAR_ASSET_KEYS,
  MONSTER_PARTY_ASSET_KEYS,
  UI_ASSET_KEYS,
} from '../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { HealthBar } from '../battle/ui/health-bar.js';
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
    super({ key: SCENE_KEYS.MONSTER_PARTY_SCENE });
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
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 1).setOrigin(0);
    this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, MONSTER_PARTY_ASSET_KEYS.PARTY_BACKGROUND, 0)
      .setOrigin(0)
      .setAlpha(0.7);

    // create back button
    const buttonContainer = this.add.container(883, 519, []);
    this.#cancelButton = this.add.image(0, 0, UI_ASSET_KEYS.BLUE_BUTTON, 0).setOrigin(0).setScale(0.7, 1).setAlpha(0.7);
    const cancelButtonText = this.add.text(66.5, 20.5, 'cancel', UI_TEXT_STYLE).setOrigin(0.5);
    buttonContainer.add([this.#cancelButton, cancelButtonText]);

    // create info container
    const infoContainer = this.add.container(4, this.scale.height - 69, []);
    const infoDisplay = this.add.rectangle(0, 0, 867, 65, 0xede4f3, 1).setOrigin(0).setStrokeStyle(8, 0x905ac2, 1);
    this.#infoTextGameObject = this.add.text(15, 14, '', {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#000000',
      fontSize: '32px',
    });
    infoContainer.add([infoDisplay, this.#infoTextGameObject]);
    this.#updateInfoContainerText();

    // create monsters in party

    // alpha is used for knowing if monster is selected, not selected, or knocked out
    this.add.image(0, 0, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2);
    this.add.image(510, 40, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    this.add.image(0, 160, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    this.add.image(510, 190, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    this.add.image(0, 310, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    this.add.image(510, 340, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.35);
  }

  /**
   * @returns {void}
   */
  #updateInfoContainerText() {
    if (this.#selectedPartyMonsterIndex === -1) {
      this.#infoTextGameObject.setText('Go back to previous menu');
      return;
    }
    this.#infoTextGameObject.setText('Choose a monster');
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {import('../types/typedef.js').Monster} monsterDetails
   * @returns {Phaser.GameObjects.Container}
   */
  #createMonster(x, y, monsterDetails) {
    const container = this.add.container(x, y, []);

    const background = this.add.image(0, 0, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2);
    this.#monsterPartyBackgrounds.push(background);

    const leftShadowCap = this.add.image(160, 67, HEALTH_BAR_ASSET_KEYS.LEFT_CAP_SHADOW).setOrigin(0).setAlpha(0.5);
    const middleShadow = this.add
      .image(leftShadowCap.x + leftShadowCap.width, 67, HEALTH_BAR_ASSET_KEYS.MIDDLE_SHADOW)
      .setOrigin(0)
      .setAlpha(0.5);
    middleShadow.displayWidth = 285;
    const rightShadowCap = this.add
      .image(middleShadow.x + middleShadow.displayWidth, 67, HEALTH_BAR_ASSET_KEYS.RIGHT_CAP_SHADOW)
      .setOrigin(0)
      .setAlpha(0.5);

    const healthBar = new HealthBar(this, 100, 40);
    healthBar.setMeterPercentageAnimated(monsterDetails.currentHp / monsterDetails.maxHp, {
      duration: 0,
      skipBattleAnimations: true,
    });
    this.#healthBars.push(healthBar);

    const monsterHpText = this.add.text(164, 66, 'HP', {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#FF6505',
      fontSize: '24px',
      fontStyle: 'italic',
    });

    const monsterHealthBarLevelText = this.add.text(26, 116, `Lv. ${monsterDetails.currentLevel}`, {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#ffffff',
      fontSize: '22px',
    });

    const monsterNameGameText = this.add.text(162, 36, monsterDetails.name, {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#ffffff',
      fontSize: '30px',
    });

    const healthBarTextGameObject = this.add
      .text(458, 95, `${monsterDetails.currentHp} / ${monsterDetails.maxHp}`, {
        fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
        color: '#ffffff',
        fontSize: '38px',
      })
      .setOrigin(1, 0);
    this.#healthBarTextGameObjects.push(healthBarTextGameObject);

    const monsterImage = this.add.image(35, 20, monsterDetails.assetKey).setOrigin(0).setScale(0.35);

    container.add([
      background,
      healthBar.container,
      monsterHpText,
      monsterHealthBarLevelText,
      monsterNameGameText,
      leftShadowCap,
      middleShadow,
      rightShadowCap,
      healthBarTextGameObject,
      monsterImage,
    ]);

    return container;
  }
}
