import Phaser from '../lib/phaser.js';
import { SCENE_KEYS } from './scene-keys.js';
import {
  BATTLE_ASSET_KEYS,
  HEALTH_BAR_ASSET_KEYS,
  MONSTER_PARTY_ASSET_KEYS,
  UI_ASSET_KEYS,
} from '../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { HealthBar } from '../battle/ui/health-bar.js';

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const UI_TEXT_STYLE = {
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#FFFFFF',
  fontSize: '24px',
};

export class MonsterPartyScene extends Phaser.Scene {
  /** @type {Phaser.GameObjects.Image} */
  #cancelButton;

  constructor() {
    super({ key: SCENE_KEYS.MONSTER_PARTY_SCENE });
  }

  /**
   * @returns {void}
   */
  create() {
    console.log(`[${MonsterPartyScene.name}:create] invoked`);

    this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, MONSTER_PARTY_ASSET_KEYS.PARTY_BACKGROUND, 0)
      .setOrigin(0)
      .setAlpha(0.7);

    const buttonContainer = this.add.container(883, 519, []);
    this.#cancelButton = this.add.image(0, 0, UI_ASSET_KEYS.BLUE_BUTTON, 0).setOrigin(0).setScale(0.7, 1);
    const cancelButtonText = this.add.text(66.5, 20.5, 'cancel', UI_TEXT_STYLE).setOrigin(0.5);
    buttonContainer.add([this.#cancelButton, cancelButtonText]);

    const infoContainer = this.add.container(4, this.scale.height - 69, [this.#createGraphics()]);

    this.add.image(510, 40, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    this.add.image(0, 160, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2);
    this.add.image(510, 190, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    this.add.image(0, 310, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    this.add.image(510, 340, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.35);

    this.#createMonster(0, 10, 5, 'Apple');
  }

  /**
   * @returns {Phaser.GameObjects.Rectangle}
   */
  #createGraphics() {
    const width = 867;
    const height = 65;

    return this.add.rectangle(0, 0, width, height, 0xede4f3, 1).setOrigin(0).setStrokeStyle(8, 0x905ac2, 1);
  }

  #createMonster(x, y, level, name) {
    const container = this.add.container(x, y, []);

    const background = this.add.image(0, 0, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2);

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

    const healthBar = new HealthBar(this, 100, 40, 240);

    const monsterHpText = this.add.text(164, 66, 'HP', {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#FF6505',
      fontSize: '24px',
      fontStyle: 'italic',
    });

    const monsterHealthBarLevelText = this.add.text(26, 116, `Lv. ${level}`, {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#ffffff',
      fontSize: '22px',
    });

    const monsterNameGameText = this.add.text(162, 36, name, {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#ffffff',
      fontSize: '30px',
    });

    container.add([
      background,
      healthBar.container,
      monsterHpText,
      monsterHealthBarLevelText,
      monsterNameGameText,
      leftShadowCap,
      middleShadow,
      rightShadowCap,
    ]);

    return container;
  }
}
