import Phaser from '../lib/phaser.js';
import {
  BATTLE_ASSET_KEYS,
  HEALTH_BAR_ASSET_KEYS,
  MONSTER_PARTY_ASSET_KEYS,
  UI_ASSET_KEYS,
} from '../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { HealthBar } from '../common/health-bar.js';
import { DIRECTION } from '../common/direction.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import { exhaustiveGuard } from '../utils/guard.js';
import { BaseScene } from './base-scene.js';
import { SCENE_KEYS } from './scene-keys.js';
import { ITEM_EFFECT } from '../types/typedef.js';
import { MONSTER_PARTY_MENU_OPTIONS, MonsterPartyMenu } from '../party/monster-party-menu.js';
import { CONFIRMATION_MENU_OPTIONS, ConfirmationMenu } from '../common/menu/confirmation-menu.js';

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

/**
 * @typedef MonsterPartySceneData
 * @type {object}
 * @property {string} previousSceneName
 * @property {import('../types/typedef.js').Item} [itemSelected]
 * @property {number} [activeBattleMonsterPartyIndex] the current active monsters party index if we are attempting to switch monsters
 * @property {boolean} [activeMonsterKnockedOut] flag to indicate if the current active monster was knocked out during battle, which means player has
 *                                               to choose a new monster before going back to the battle scene
 */

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
  /** @type {import('../types/typedef.js').Monster[]} */
  #monsters;
  /** @type {MonsterPartySceneData} */
  #sceneData;
  /** @type {boolean} */
  #waitingForInput;
  /** @type {MonsterPartyMenu} */
  #menu;
  /** @type {ConfirmationMenu} */
  #confirmationMenu;
  /** @type {boolean} */
  #isMovingMonster;
  /** @type {number | undefined} */
  #monsterToBeMovedIndex;
  /** @type {Phaser.GameObjects.Container[]} */
  #monsterContainers;

  constructor() {
    super({
      key: SCENE_KEYS.MONSTER_PARTY_SCENE,
    });
  }

  /**
   * @param {MonsterPartySceneData} data
   * @returns {void}
   */
  init(data) {
    super.init(data);

    if (!data || !data.previousSceneName) {
      data.previousSceneName = SCENE_KEYS.WORLD_SCENE;
    }

    this.#sceneData = data;
    this.#monsterPartyBackgrounds = [];
    this.#healthBars = [];
    this.#healthBarTextGameObjects = [];
    this.#selectedPartyMonsterIndex = 0;
    this.#monsters = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY);
    this.#waitingForInput = false;
    this.#isMovingMonster = false;
    this.#monsterToBeMovedIndex = undefined;
    this.#monsterContainers = [];
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
      fontSize: '32px',
    });
    infoContainer.add([infoDisplay, this.#infoTextGameObject]);
    this.#updateInfoContainerText();

    // create monsters in party
    this.#monsters.forEach((monster, index) => {
      // 1, 3, 5
      const isEven = index % 2 === 0;
      const x = isEven ? MONSTER_PARTY_POSITIONS.EVEN.x : MONSTER_PARTY_POSITIONS.ODD.x;
      const y =
        (isEven ? MONSTER_PARTY_POSITIONS.EVEN.y : MONSTER_PARTY_POSITIONS.ODD.y) +
        MONSTER_PARTY_POSITIONS.increment * Math.floor(index / 2);
      const monsterContainer = this.#createMonster(x, y, monster);
      this.#monsterContainers.push(monsterContainer);
    });
    this.#movePlayerInputCursor(DIRECTION.NONE);

    // create menu
    this.#menu = new MonsterPartyMenu(this, this.#sceneData.previousSceneName);
    this.#confirmationMenu = new ConfirmationMenu(this);

    // alpha is used for knowing if monster is selected, not selected, or knocked out
    /*
    this.add.image(0, 10, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2);
    this.add.image(510, 40, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    this.add.image(0, 160, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    this.add.image(510, 190, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    this.add.image(0, 310, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.7);
    this.add.image(510, 340, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND).setOrigin(0).setScale(1.1, 1.2).setAlpha(0.35);
    */
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

    if (this.#confirmationMenu.isVisible) {
      this.#handleInputForConfirmationMenu(wasBackKeyPressed, wasSpaceKeyPressed, selectedDirection);
      return;
    }

    if (this.#menu.isVisible) {
      this.#handleInputForMenu(wasBackKeyPressed, wasSpaceKeyPressed, selectedDirection);
      return;
    }

    if (wasBackKeyPressed) {
      if (this.#waitingForInput) {
        this.#updateInfoContainerText();
        this.#waitingForInput = false;
        return;
      }

      if (this.#isMovingMonster) {
        // if we are attempting to switch monsters location, cancel action
        this.#isMovingMonster = false;
        this.#updateInfoContainerText();
        return;
      }

      this.#goBackToPreviousScene(false, false);
      return;
    }

    if (wasSpaceKeyPressed) {
      if (this.#waitingForInput) {
        this.#updateInfoContainerText();
        this.#waitingForInput = false;
        return;
      }

      if (this.#selectedPartyMonsterIndex === -1) {
        // if we are attempting to switch monsters location, cancel action
        if (this.#isMovingMonster) {
          this.#isMovingMonster = false;
          this.#updateInfoContainerText();
          return;
        }

        this.#goBackToPreviousScene(false, false);
        return;
      }

      if (this.#isMovingMonster) {
        // make sure we select a different monster
        if (this.#selectedPartyMonsterIndex === this.#monsterToBeMovedIndex) {
          return;
        }

        this.#moveMonsters();
        return;
      }

      this.#menu.show();
      return;
    }

    if (this.#waitingForInput) {
      return;
    }

    if (selectedDirection !== DIRECTION.NONE) {
      this.#movePlayerInputCursor(selectedDirection);
      // if we are attempting to move a monster, we want to leave the text up on the screen
      if (this.#isMovingMonster) {
        return;
      }
      this.#updateInfoContainerText();
    }
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

    const healthBar = new HealthBar(this, 100, 40, 240);
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

  /**
   * @param {boolean} wasItemUsed
   * @param {boolean} wasMonsterSelected
   * @returns {void}
   */
  #goBackToPreviousScene(wasItemUsed, wasMonsterSelected) {
    if (
      this.#sceneData.activeMonsterKnockedOut &&
      this.#sceneData.previousSceneName === SCENE_KEYS.BATTLE_SCENE &&
      !wasMonsterSelected
    ) {
      // if active monster was knocked out, return early since we need to pick a new monster for battle
      this.#infoTextGameObject.setText('You must select a new monster for battle.');
      this.#waitingForInput = true;
      this.#menu.hide();
      return;
    }

    this._controls.lockInput = true;
    this.scene.stop(SCENE_KEYS.MONSTER_PARTY_SCENE);
    this.scene.resume(this.#sceneData.previousSceneName, {
      wasItemUsed,
      selectedMonsterIndex: wasMonsterSelected ? this.#selectedPartyMonsterIndex : undefined,
      wasMonsterSelected,
    });
  }

  /**
   * @param {import('../common/direction.js').Direction} direction
   * @returns {void}
   */
  #movePlayerInputCursor(direction) {
    switch (direction) {
      case DIRECTION.UP:
        // if we are already at the cancel button, then reset index
        if (this.#selectedPartyMonsterIndex === -1) {
          this.#selectedPartyMonsterIndex = this.#monsters.length;
        }
        this.#selectedPartyMonsterIndex -= 1;
        // prevent from looping to the bottom
        if (this.#selectedPartyMonsterIndex < 0) {
          this.#selectedPartyMonsterIndex = 0;
        }
        this.#monsterPartyBackgrounds[this.#selectedPartyMonsterIndex].setAlpha(1);
        this.#cancelButton.setTexture(UI_ASSET_KEYS.BLUE_BUTTON, 0).setAlpha(0.7);
        break;
      case DIRECTION.DOWN:
        // already at the bottom of the menu
        if (this.#selectedPartyMonsterIndex === -1) {
          break;
        }
        // increment index and check if we are pass the threshold
        this.#selectedPartyMonsterIndex += 1;
        if (this.#selectedPartyMonsterIndex > this.#monsters.length - 1) {
          this.#selectedPartyMonsterIndex = -1;
        }
        if (this.#selectedPartyMonsterIndex === -1) {
          this.#cancelButton.setTexture(UI_ASSET_KEYS.BLUE_BUTTON_SELECTED, 0).setAlpha(1);
          break;
        }
        this.#monsterPartyBackgrounds[this.#selectedPartyMonsterIndex].setAlpha(1);
        break;
      case DIRECTION.LEFT:
      case DIRECTION.RIGHT:
      case DIRECTION.NONE:
        break;
      default:
        exhaustiveGuard(direction);
    }

    this.#monsterPartyBackgrounds.forEach((background, index) => {
      if (index === this.#selectedPartyMonsterIndex) {
        return;
      }
      background.setAlpha(0.7);
    });
  }

  /**
   * @returns {void}
   */
  #handleItemUsed() {
    switch (this.#sceneData.itemSelected.effect) {
      case ITEM_EFFECT.HEAL_30:
        this.#handleHealItemUsed(30);
        break;
      case ITEM_EFFECT.CAPTURE_1:
        // these items should not be useable in this scene
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
    // validate that the monster is not fainted
    if (this.#monsters[this.#selectedPartyMonsterIndex].currentHp === 0) {
      this.#infoTextGameObject.setText('Cannot heal fainted monster');
      this.#waitingForInput = true;
      this.#menu.hide();
      return;
    }

    // validate that the monster is not already fully healed
    if (
      this.#monsters[this.#selectedPartyMonsterIndex].currentHp ===
      this.#monsters[this.#selectedPartyMonsterIndex].maxHp
    ) {
      this.#infoTextGameObject.setText('Monster is already fully healed');
      this.#waitingForInput = true;
      this.#menu.hide();
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
          this.#healthBarTextGameObjects[this.#selectedPartyMonsterIndex].setText(
            `${this.#monsters[this.#selectedPartyMonsterIndex].currentHp} / ${
              this.#monsters[this.#selectedPartyMonsterIndex].maxHp
            }`
          );
          dataManager.store.set(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY, this.#monsters);
          this.time.delayedCall(300, () => {
            this.#goBackToPreviousScene(true, false);
          });
        },
      }
    );
  }

  /**
   * @returns {void}
   */
  #handleMonsterSelectedForSwitch() {
    // validate that the monster is not fainted
    if (this.#monsters[this.#selectedPartyMonsterIndex].currentHp === 0) {
      this.#infoTextGameObject.setText('Selected monster is not able to fight.');
      this.#waitingForInput = true;
      this.#menu.hide();
      return;
    }

    // validate that the selected monster is not the current active monster in battle
    if (this.#sceneData.activeBattleMonsterPartyIndex === this.#selectedPartyMonsterIndex) {
      this.#infoTextGameObject.setText('Selected monster is already battling');
      this.#waitingForInput = true;
      this.#menu.hide();
      return;
    }

    this.#goBackToPreviousScene(false, true);
  }

  /**
   * @param {boolean} wasBackKeyPressed
   * @param {boolean} wasSpaceKeyPressed
   * @param {import('../common/direction.js').Direction} selectedDirection
   * @returns {void}
   */
  #handleInputForMenu(wasBackKeyPressed, wasSpaceKeyPressed, selectedDirection) {
    if (wasBackKeyPressed) {
      this.#menu.hide();
      return;
    }

    if (wasSpaceKeyPressed) {
      this.#menu.handlePlayerInput('OK');

      if (this.#menu.selectedMenuOption === MONSTER_PARTY_MENU_OPTIONS.CANCEL) {
        this.#menu.hide();
        return;
      }

      if (this.#menu.selectedMenuOption === MONSTER_PARTY_MENU_OPTIONS.SUMMARY) {
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

      if (this.#menu.selectedMenuOption === MONSTER_PARTY_MENU_OPTIONS.SELECT) {
        // handle input based on what player intention was (use item, view monster details, select monster to switch to)
        if (this.#sceneData.previousSceneName === SCENE_KEYS.INVENTORY_SCENE && this.#sceneData.itemSelected) {
          this.#handleItemUsed();
          return;
        }

        if (this.#sceneData.previousSceneName === SCENE_KEYS.BATTLE_SCENE) {
          this.#handleMonsterSelectedForSwitch();
          return;
        }
      }

      if (this.#menu.selectedMenuOption === MONSTER_PARTY_MENU_OPTIONS.RELEASE) {
        if (this.#monsters.length <= 1) {
          this.#infoTextGameObject.setText('Cannot release last monster in party');
          this.#waitingForInput = true;
          this.#menu.hide();
          return;
        }

        this.#menu.hide();
        this.#confirmationMenu.show();
        this.#infoTextGameObject.setText(`Release ${this.#monsters[this.#selectedPartyMonsterIndex].name}?`);
        return;
      }

      if (this.#menu.selectedMenuOption === MONSTER_PARTY_MENU_OPTIONS.MOVE) {
        if (this.#monsters.length <= 1) {
          this.#infoTextGameObject.setText('Cannot move monster');
          this.#waitingForInput = true;
          this.#menu.hide();
          return;
        }

        this.#isMovingMonster = true;
        this.#monsterToBeMovedIndex = this.#selectedPartyMonsterIndex;
        this.#infoTextGameObject.setText('Choose a monster to switch positions with');
        this.#menu.hide();
        return;
      }

      return;
    }

    if (selectedDirection !== DIRECTION.NONE) {
      this.#menu.handlePlayerInput(selectedDirection);
      return;
    }
  }

  /**
   * @param {boolean} wasBackKeyPressed
   * @param {boolean} wasSpaceKeyPressed
   * @param {import('../common/direction.js').Direction} selectedDirection
   * @returns {void}
   */
  #handleInputForConfirmationMenu(wasBackKeyPressed, wasSpaceKeyPressed, selectedDirection) {
    if (wasBackKeyPressed) {
      this.#confirmationMenu.hide();
      this.#menu.show();
      this.#updateInfoContainerText();
      return;
    }

    if (wasSpaceKeyPressed) {
      this.#confirmationMenu.handlePlayerInput('OK');

      if (this.#confirmationMenu.selectedMenuOption === CONFIRMATION_MENU_OPTIONS.YES) {
        this.#confirmationMenu.hide();

        if (this.#menu.selectedMenuOption === MONSTER_PARTY_MENU_OPTIONS.RELEASE) {
          this._controls.lockInput = true;
          this.#infoTextGameObject.setText(
            `You released ${this.#monsters[this.#selectedPartyMonsterIndex].name} into the wild.`
          );
          this.time.delayedCall(1000, () => {
            this.#removeMonster();
            this._controls.lockInput = false;
          });
          return;
        }

        return;
      }

      this.#confirmationMenu.hide();
      this.#menu.show();
      this.#updateInfoContainerText();
      return;
    }

    if (selectedDirection !== DIRECTION.NONE) {
      this.#confirmationMenu.handlePlayerInput(selectedDirection);
      return;
    }
  }

  /**
   * Updates the game objects positions and monsters in the party positions.
   * @returns {void}
   */
  #moveMonsters() {
    // update monsters in party
    const monsterRef = this.#monsters[this.#monsterToBeMovedIndex];
    this.#monsters[this.#monsterToBeMovedIndex] = this.#monsters[this.#selectedPartyMonsterIndex];
    this.#monsters[this.#selectedPartyMonsterIndex] = monsterRef;
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY, this.#monsters);

    // update monster container positions
    const monsterContainerRefPosition1 = {
      x: this.#monsterContainers[this.#monsterToBeMovedIndex].x,
      y: this.#monsterContainers[this.#monsterToBeMovedIndex].y,
    };
    const monsterContainerRefPosition2 = {
      x: this.#monsterContainers[this.#selectedPartyMonsterIndex].x,
      y: this.#monsterContainers[this.#selectedPartyMonsterIndex].y,
    };
    this.#monsterContainers[this.#monsterToBeMovedIndex].setPosition(
      monsterContainerRefPosition2.x,
      monsterContainerRefPosition2.y
    );
    this.#monsterContainers[this.#selectedPartyMonsterIndex].setPosition(
      monsterContainerRefPosition1.x,
      monsterContainerRefPosition1.y
    );
    const containerRef = this.#monsterContainers[this.#monsterToBeMovedIndex];
    this.#monsterContainers[this.#monsterToBeMovedIndex] = this.#monsterContainers[this.#selectedPartyMonsterIndex];
    this.#monsterContainers[this.#selectedPartyMonsterIndex] = containerRef;

    // update monster backgrounds
    const backgroundRef = this.#monsterPartyBackgrounds[this.#monsterToBeMovedIndex];
    this.#monsterPartyBackgrounds[this.#monsterToBeMovedIndex] =
      this.#monsterPartyBackgrounds[this.#selectedPartyMonsterIndex];
    this.#monsterPartyBackgrounds[this.#selectedPartyMonsterIndex] = backgroundRef;

    this.#isMovingMonster = false;
    this.#selectedPartyMonsterIndex = this.#monsterToBeMovedIndex;
    this.#monsterToBeMovedIndex = undefined;
  }

  #removeMonster() {
    // remove monster from party
    this.#monsters.splice(this.#selectedPartyMonsterIndex, 1);
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY, this.#monsters);

    // remove background object
    this.#monsterPartyBackgrounds.splice(this.#selectedPartyMonsterIndex, 1);

    // remove container object and update other container positions
    const containerToRemove = this.#monsterContainers.splice(this.#selectedPartyMonsterIndex, 1)[0];
    let prevContainerPos = {
      x: containerToRemove.x,
      y: containerToRemove.y,
    };
    containerToRemove.destroy();

    this.#monsterContainers.forEach((container, index) => {
      if (index < this.#selectedPartyMonsterIndex) {
        return;
      }
      const tempPosition = {
        x: container.x,
        y: container.y,
      };
      container.setPosition(prevContainerPos.x, prevContainerPos.y);
      prevContainerPos = tempPosition;
    });
    this.#movePlayerInputCursor('UP');
  }
}
