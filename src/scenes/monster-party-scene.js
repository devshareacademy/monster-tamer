import Phaser from '../lib/phaser.js';
import { SCENE_KEYS } from './scene-keys.js';
import {
  BATTLE_ASSET_KEYS,
  HEALTH_BAR_ASSET_KEYS,
  MONSTER_ASSET_KEYS,
  MONSTER_PARTY_ASSET_KEYS,
  UI_ASSET_KEYS,
} from '../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { HealthBar } from '../battle/ui/health-bar.js';
import { DataUtils } from '../utils/data-utils.js';
import { Controls } from '../utils/controls.js';
import { DIRECTION } from '../common/direction.js';
import { exhaustiveGuard } from '../utils/guard.js';

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const UI_TEXT_STYLE = {
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#FFFFFF',
  fontSize: '24px',
};

const MONSTER_PARTY_POSITIONS = Object.freeze({
  EVEN: {
    x: 0,
    y: 10,
  },
  ODD: {
    x: 510,
    y: 40,
  },
  increment: 150,
});

export class MonsterPartyScene extends Phaser.Scene {
  /** @type {Phaser.GameObjects.Image} */
  #cancelButton;
  /** @type {Phaser.GameObjects.Image[]} */
  #monsterPartyBackgrounds;
  /** @type {number} */
  #selectedPartyMonsterIndex;
  /** @type {import('../types/typedef.js').Monster[]} */
  #monsters;
  /** @type {Controls} */
  #controls;

  constructor() {
    super({ key: SCENE_KEYS.MONSTER_PARTY_SCENE });
  }

  /**
   * @returns {void}
   */
  init() {
    console.log(`[${MonsterPartyScene.name}:init] invoked`);

    this.#selectedPartyMonsterIndex = 0;
    this.#monsters = [];
    this.#monsters.push(DataUtils.getIguanignite(this));
    this.#monsterPartyBackgrounds = [];
  }

  /**
   * @returns {void}
   */
  create() {
    console.log(`[${MonsterPartyScene.name}:create] invoked`);

    // create custom background
    this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, MONSTER_PARTY_ASSET_KEYS.PARTY_BACKGROUND, 0)
      .setOrigin(0)
      .setAlpha(0.7);

    // create back button
    const buttonContainer = this.add.container(883, 519, []);
    this.#cancelButton = this.add.image(0, 0, UI_ASSET_KEYS.BLUE_BUTTON, 0).setOrigin(0).setScale(0.7, 1);
    const cancelButtonText = this.add.text(66.5, 20.5, 'cancel', UI_TEXT_STYLE).setOrigin(0.5);
    buttonContainer.add([this.#cancelButton, cancelButtonText]);

    // create info container
    const infoContainer = this.add.container(4, this.scale.height - 69, [this.#createGraphics()]);

    // create monsters in party
    this.#monsters.forEach((monster, index) => {
      const isEven = index % 2 === 0;
      const x = isEven ? MONSTER_PARTY_POSITIONS.EVEN.x : MONSTER_PARTY_POSITIONS.ODD.x;
      const y =
        (isEven ? MONSTER_PARTY_POSITIONS.EVEN.y : MONSTER_PARTY_POSITIONS.ODD.y) +
        MONSTER_PARTY_POSITIONS.increment * (index / 2);
      this.#createMonster(x, y, monster.currentLevel, monster.name, monster.currentHp, monster.maxHp);
    });

    // this.#createMonster(0, 10, 5, 'Apple', 25, 25);
    // this.add.image(510, 40, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    // this.add.image(0, 160, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2);
    // this.add.image(510, 190, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    // this.add.image(0, 310, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    // this.add.image(510, 340, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.35);

    this.#controls = new Controls(this);

    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      // TODO: figure out what to do here
    });
  }

  /**
   * @returns {void}
   */
  update() {
    if (this.#controls.isInputLocked) {
      return;
    }

    if (this.#controls.wasBackKeyPressed()) {
      this.#controls.lockInput = true;
      this.cameras.main.fadeOut(500, 0, 0, 0);
      return;
    }

    const selectedDirection = this.#controls.getDirectionKeyJustPressed();
    if (selectedDirection !== DIRECTION.NONE) {
      this.#movePlayerInputCursor(selectedDirection);
      this.#updateInfoContainerText();
    }
  }

  /**
   * @returns {Phaser.GameObjects.Rectangle}
   */
  #createGraphics() {
    const width = 867;
    const height = 65;

    return this.add.rectangle(0, 0, width, height, 0xede4f3, 1).setOrigin(0).setStrokeStyle(8, 0x905ac2, 1);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} level
   * @param {string} name
   * @param {number} currentHp
   * @param {number} maxHp
   * @returns {Phaser.GameObjects.Container}
   */
  #createMonster(x, y, level, name, currentHp, maxHp) {
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

    const healthBarTextGameObject = this.add
      .text(458, 95, `${currentHp} / ${maxHp}`, {
        fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
        color: '#ffffff',
        fontSize: '38px',
      })
      .setOrigin(1, 0);

    const monsterImage = this.add.image(35, 20, MONSTER_ASSET_KEYS.CARNODUSK).setOrigin(0).setScale(0.35);

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

  /**
   * @param {import('../common/direction.js').Direction} direction
   * @returns {void}
   */
  #movePlayerInputCursor(direction) {
    switch (direction) {
      case DIRECTION.UP:
        this.#selectedPartyMonsterIndex = 0;
        this.#monsterPartyBackgrounds[this.#selectedPartyMonsterIndex].setAlpha(1);
        this.#cancelButton.setTexture(UI_ASSET_KEYS.BLUE_BUTTON, 0);
        break;
      case DIRECTION.DOWN:
        this.#selectedPartyMonsterIndex = -1;
        // TODO: fix the ui button so it is more noticable
        this.#cancelButton.setTexture(UI_ASSET_KEYS.BLUE_BUTTON_SELECTED, 0);
        break;
      case DIRECTION.LEFT:
      case DIRECTION.RIGHT:
      case DIRECTION.NONE:
        break;
      default:
        exhaustiveGuard(direction);
    }
    this.#monsterPartyBackgrounds.forEach((monster, index) => {
      if (index === this.#selectedPartyMonsterIndex) {
        return;
      }
      monster.setAlpha(0.7);
    });
  }

  /**
   * @returns {void}
   */
  #updateInfoContainerText() {}
}
