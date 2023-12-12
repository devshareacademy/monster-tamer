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
import { DataUtils } from '../utils/data-utils.js';
import { DIRECTION } from '../common/direction.js';
import { exhaustiveGuard } from '../utils/guard.js';
import { ITEM_EFFECT } from '../types/typedef.js';
import { BaseScene } from './base-scene.js';

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const UI_TEXT_STYLE = {
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#FFFFFF',
  fontSize: '24px',
};

/**
 * @typedef MonsterPartySceneData
 * @type {object}
 * @property {string} previousSceneName
 * @property {import('../types/typedef.js').Item} [itemSelected]
 */

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

export class MonsterPartyScene extends BaseScene {
  /** @type {Phaser.GameObjects.Image} */
  #cancelButton;
  /** @type {Phaser.GameObjects.Image[]} */
  #monsterPartyBackgrounds;
  /** @type {number} */
  #selectedPartyMonsterIndex;
  /** @type {import('../types/typedef.js').Monster[]} */
  #monsters;
  /** @type {Phaser.GameObjects.Text} */
  #infoTextGameObject;
  /** @type {MonsterPartySceneData} */
  #sceneData;
  /** @type {boolean} */
  #waitingForInput;
  /** @type {HealthBar[]} */
  #healthBars;

  constructor() {
    super({ key: SCENE_KEYS.MONSTER_PARTY_SCENE });
  }

  /**
   * @param {MonsterPartySceneData} data
   * @returns {void}
   */
  init(data) {
    super.init(data);

    this.#selectedPartyMonsterIndex = 0;
    this.#monsters = [];

    // added for testing from preload scene
    // TODO: need to add logic to grab monster party data from the data manager
    if (this.#monsters.length === 0) {
      this.#monsters.push(DataUtils.getIguanignite(this));
      // this.#monsters.push(DataUtils.getCarnodusk(this));
    }

    this.#monsterPartyBackgrounds = [];
    this.#sceneData = data;
    this.#waitingForInput = false;
    this.#healthBars = [];
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
    this.#monsters.forEach((monster, index) => {
      const isEven = index % 2 === 0;
      const x = isEven ? MONSTER_PARTY_POSITIONS.EVEN.x : MONSTER_PARTY_POSITIONS.ODD.x;
      const y =
        (isEven ? MONSTER_PARTY_POSITIONS.EVEN.y : MONSTER_PARTY_POSITIONS.ODD.y) +
        MONSTER_PARTY_POSITIONS.increment * (index / 2);
      this.#createMonster(x, y, monster);
    });

    // this.#createMonster(0, 10, 5, 'Apple', 25, 25);
    // this.add.image(510, 40, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    // this.add.image(0, 160, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2);
    // this.add.image(510, 190, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    // this.add.image(0, 310, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    // this.add.image(510, 340, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.35);

    this.events.on(Phaser.Scenes.Events.RESUME, this.#handleSceneResume, this);
  }

  /**
   * @returns {void}
   */
  update() {
    super.update();

    if (this._controls.isInputLocked) {
      return;
    }

    if (this._controls.wasBackKeyPressed()) {
      if (this.#waitingForInput) {
        this.#updateInfoContainerText();
        this.#waitingForInput = false;
        return;
      }

      this.#goBackToPreviousScene(false);
      return;
    }

    const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();
    if (wasSpaceKeyPressed) {
      if (this.#waitingForInput) {
        this.#updateInfoContainerText();
        this.#waitingForInput = false;
        return;
      }

      if (this.#selectedPartyMonsterIndex === -1) {
        this.#goBackToPreviousScene(false);
        return;
      }

      // handle input based on what player intention was (use item, view monster details, select monster to switch to)
      if (this.#sceneData.previousSceneName === SCENE_KEYS.INVENTORY_SCENE && this.#sceneData.itemSelected) {
        this.#handleItemUsed();
        return;
      }

      this._controls.lockInput = true;
      // pause this scene and launch the monster details scene
      /** @type {import('./monster-details-scene.js').MonsterDetailsSceneData} */
      const sceneDataToPass = {
        monster: this.#monsters[this.#selectedPartyMonsterIndex],
      };
      this.scene.launch(SCENE_KEYS.MONSTER_DETAILS_SCENE, sceneDataToPass);
      this.scene.pause(SCENE_KEYS.MONSTER_PARTY_SCENE);

      return;
    }

    if (this.#waitingForInput) {
      return;
    }

    const selectedDirection = this._controls.getDirectionKeyJustPressed();
    if (selectedDirection !== DIRECTION.NONE) {
      this.#movePlayerInputCursor(selectedDirection);
      this.#updateInfoContainerText();
    }
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

    const healthBar = new HealthBar(this, 100, 40, 240);
    healthBar.setMeterPercentageAnimated(monsterDetails.currentHp / monsterDetails.maxHp, { duration: 0 });
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

  /**
   * @param {import('../common/direction.js').Direction} direction
   * @returns {void}
   */
  #movePlayerInputCursor(direction) {
    switch (direction) {
      case DIRECTION.UP:
        this.#selectedPartyMonsterIndex = 0;
        this.#monsterPartyBackgrounds[this.#selectedPartyMonsterIndex].setAlpha(1);
        this.#cancelButton.setTexture(UI_ASSET_KEYS.BLUE_BUTTON, 0).setAlpha(0.7);
        break;
      case DIRECTION.DOWN:
        this.#selectedPartyMonsterIndex = -1;
        this.#cancelButton.setTexture(UI_ASSET_KEYS.BLUE_BUTTON_SELECTED, 0).setAlpha(1);
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
  #updateInfoContainerText() {
    if (this.#selectedPartyMonsterIndex === -1) {
      this.#infoTextGameObject.setText('Go back to previous menu');
      return;
    }
    this.#infoTextGameObject.setText('Choose a monster');
  }

  /**
   * @param {boolean} itemUsed
   * @returns {void}
   */
  #goBackToPreviousScene(itemUsed) {
    this._controls.lockInput = true;
    this.scene.stop(SCENE_KEYS.MONSTER_PARTY_SCENE);

    if (this.#sceneData.previousSceneName === SCENE_KEYS.WORLD_SCENE) {
      this.scene.resume(SCENE_KEYS.WORLD_SCENE);
      return;
    }

    /** @type {import('./inventory-scene.js').InventorySceneResumeData} */
    const sceneDataToPass = {
      itemUsed,
    };
    this.scene.resume(this.#sceneData.previousSceneName, sceneDataToPass);
  }

  /**
   * @returns {void}
   */
  #handleItemUsed() {
    switch (this.#sceneData.itemSelected.effect) {
      case ITEM_EFFECT.HEAL_30:
        this.#handleHealItemUsed(30);
        break;
      default:
        exhaustiveGuard(this.#sceneData.itemSelected.effect);
    }
  }

  /**
   * @param {number} amount the amount of health to heal the monster by
   * @returns {void}
   */
  #handleHealItemUsed(amount) {
    console.log(this.#sceneData.itemSelected);
    // validate that the monster is not fainted
    if (this.#monsters[this.#selectedPartyMonsterIndex].currentHp === 0) {
      this.#infoTextGameObject.setText('Cannot heal fainted monster');
      this.#waitingForInput = true;
      return;
    }

    // validate that the monster is not already fully healed
    if (
      this.#monsters[this.#selectedPartyMonsterIndex].currentHp ===
      this.#monsters[this.#selectedPartyMonsterIndex].maxHp
    ) {
      this.#infoTextGameObject.setText('Monster is already fully healed');
      this.#waitingForInput = true;
      return;
    }

    // otherwise, heal monster by the amount if we are not in a battle and show animation
    this._controls.lockInput = true;
    this.#monsters[this.#selectedPartyMonsterIndex].currentHp += amount;
    if (
      this.#monsters[this.#selectedPartyMonsterIndex].currentHp > this.#monsters[this.#selectedPartyMonsterIndex].maxHp
    ) {
      this.#monsters[this.#selectedPartyMonsterIndex].currentHp = this.#monsters[this.#selectedPartyMonsterIndex].maxHp;
    }
    this.#infoTextGameObject.setText(`Healed monster by ${amount} HP`);
    this.#healthBars[this.#selectedPartyMonsterIndex].setMeterPercentageAnimated(
      this.#monsters[this.#selectedPartyMonsterIndex].currentHp / this.#monsters[this.#selectedPartyMonsterIndex].maxHp,
      {
        callback: () => {
          this.time.delayedCall(300, () => {
            this.#goBackToPreviousScene(true);
          });
        },
      }
    );
  }

  /**
   * @returns {void}
   */
  #handleSceneResume() {
    console.log(`[${MonsterPartyScene.name}:handleSceneResume] scene has been resumed`);
    this._controls.lockInput = false;
  }
}
