import Phaser from '../lib/phaser.js';
import { INVENTORY_ASSET_KEYS, UI_ASSET_KEYS } from '../assets/asset-keys.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';
import { DIRECTION } from '../common/direction.js';
import { dataManager } from '../utils/data-manager.js';
import { exhaustiveGuard } from '../utils/guard.js';
import { NineSlice } from '../utils/nine-slice.js';
import { BaseScene } from './base-scene.js';
import { SCENE_KEYS } from './scene-keys.js';
import { ITEM_CATEGORY } from '../types/typedef.js';

const CANCEL_TEXT_DESCRIPTION = 'Close your bag, and go back to adventuring!';
const CANNOT_USE_ITEM_TEXT = 'That item cannot be used right now.';

const INVENTORY_ITEM_POSITION = Object.freeze({
  x: 50,
  y: 14,
  space: 50,
});

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const INVENTORY_TEXT_STYLE = {
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#000000',
  fontSize: '30px',
};

/**
 * @typedef InventoryItemGameObjects
 * @type {object}
 * @property {Phaser.GameObjects.Text} [itemName]
 * @property {Phaser.GameObjects.Text} [quantitySign]
 * @property {Phaser.GameObjects.Text} [quantity]
 */

/**
 * @typedef {import('../types/typedef.js').InventoryItem & { gameObjects: InventoryItemGameObjects }} InventoryItemWithGameObjects
 */

/**
 * @typedef CustomInventory
 * @type {InventoryItemWithGameObjects[]}
 */

/**
 * @typedef InventorySceneData
 * @type {object}
 * @property {string} previousSceneName
 */

/**
 * @typedef InventorySceneWasResumedData
 * @type {object}
 * @property {boolean} wasItemUsed
 */

/**
 * @typedef InventorySceneItemUsedData
 * @type {object}
 * @property {boolean} wasItemUsed
 * @property {import('../types/typedef.js').Item} [item]
 */

export class InventoryScene extends BaseScene {
  /** @type {InventorySceneData} */
  #sceneData;
  /** @type {NineSlice} */
  #nineSliceMainContainer;
  /** @type {Phaser.GameObjects.Text} */
  #selectedInventoryDescriptionText;
  /** @type {Phaser.GameObjects.Image} */
  #userInputCursor;
  /** @type {CustomInventory} */
  #inventory;
  /** @type {number} */
  #selectedInventoryOptionIndex;
  /** @type {boolean} */
  #waitingForInput;

  constructor() {
    super({
      key: SCENE_KEYS.INVENTORY_SCENE,
    });
  }

  /**
   * @param {InventorySceneData} data
   * @returns {void}
   */
  init(data) {
    super.init(data);

    this.#waitingForInput = false;
    this.#sceneData = data;
    this.#selectedInventoryOptionIndex = 0;
    const inventory = dataManager.getInventory(this);
    this.#inventory = inventory.map((inventoryItem) => {
      return {
        item: inventoryItem.item,
        quantity: inventoryItem.quantity,
        gameObjects: {},
      };
    });
    this.#nineSliceMainContainer = new NineSlice({
      cornerCutSize: 32,
      textureManager: this.sys.textures,
      assetKeys: [UI_ASSET_KEYS.MENU_BACKGROUND],
    });
  }

  /**
   * @returns {void}
   */
  create() {
    super.create();

    // create custom background
    this.add.image(0, 0, INVENTORY_ASSET_KEYS.INVENTORY_BACKGROUND).setOrigin(0);
    this.add.image(40, 120, INVENTORY_ASSET_KEYS.INVENTORY_BAG).setOrigin(0).setScale(0.5);

    const container = this.#nineSliceMainContainer
      .createNineSliceContainer(this, 700, 360, UI_ASSET_KEYS.MENU_BACKGROUND)
      .setPosition(300, 20);
    const containerBackground = this.add.rectangle(4, 4, 692, 352, 0xffff88).setOrigin(0).setAlpha(0.6);
    container.add(containerBackground);

    const titleContainer = this.#nineSliceMainContainer
      .createNineSliceContainer(this, 240, 64, UI_ASSET_KEYS.MENU_BACKGROUND)
      .setPosition(64, 20);
    const titleContainerBackground = this.add.rectangle(4, 4, 232, 56, 0xffff88).setOrigin(0).setAlpha(0.6);
    titleContainer.add(titleContainerBackground);

    const textTitle = this.add.text(116, 28, 'Items', INVENTORY_TEXT_STYLE).setOrigin(0.5);
    titleContainer.add(textTitle);

    // create inventory text from available items
    this.#inventory.forEach((inventoryItem, index) => {
      const itemText = this.add.text(
        INVENTORY_ITEM_POSITION.x,
        INVENTORY_ITEM_POSITION.y + index * INVENTORY_ITEM_POSITION.space,
        inventoryItem.item.name,
        INVENTORY_TEXT_STYLE
      );
      const qty1Text = this.add.text(620, INVENTORY_ITEM_POSITION.y + 2 + index * INVENTORY_ITEM_POSITION.space, 'x', {
        color: '#000000',
        fontSize: '30px',
      });
      const qty2Text = this.add.text(
        650,
        INVENTORY_ITEM_POSITION.y + index * INVENTORY_ITEM_POSITION.space,
        `${inventoryItem.quantity}`,
        INVENTORY_TEXT_STYLE
      );
      container.add([itemText, qty1Text, qty2Text]);
      inventoryItem.gameObjects = {
        itemName: itemText,
        quantity: qty2Text,
        quantitySign: qty1Text,
      };
    });

    // create cancel text
    const cancelText = this.add.text(
      INVENTORY_ITEM_POSITION.x,
      INVENTORY_ITEM_POSITION.y + this.#inventory.length * INVENTORY_ITEM_POSITION.space,
      'Cancel',
      INVENTORY_TEXT_STYLE
    );
    container.add(cancelText);

    // create player input cursor
    this.#userInputCursor = this.add.image(30, 30, UI_ASSET_KEYS.CURSOR).setScale(3);
    container.add(this.#userInputCursor);

    // create inventory description text
    this.#selectedInventoryDescriptionText = this.add.text(25, 420, '', {
      ...INVENTORY_TEXT_STYLE,
      ...{
        wordWrap: {
          width: this.scale.width - 18,
        },
        color: '#ffffff',
      },
    });
    this.#updateItemDescriptionText();
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
        // update text description and let player select new items
        this.#updateItemDescriptionText();
        this.#waitingForInput = false;
        return;
      }

      this.#goBackToPreviousScene(false);
      return;
    }

    const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();
    if (wasSpaceKeyPressed) {
      if (this.#waitingForInput) {
        // update text description and let player select new items
        this.#updateItemDescriptionText();
        this.#waitingForInput = false;
        return;
      }

      if (this.#isCancelButtonSelected()) {
        this.#goBackToPreviousScene(false);
        return;
      }

      if (this.#inventory[this.#selectedInventoryOptionIndex].quantity < 1) {
        return;
      }

      const selectedItem = this.#inventory[this.#selectedInventoryOptionIndex].item;

      // validate that the item can be used if we are outside battle (capture ball example)
      if (this.#sceneData.previousSceneName === SCENE_KEYS.BATTLE_SCENE) {
        // check to see if the selected item needs a target monster, example if selecting
        // a capture ball, no monster needed, vs selecting a potion, player needs to choose the
        // target monster
        if (selectedItem.category === ITEM_CATEGORY.CAPTURE) {
          // TODO: this logic will need to be updated if we support a monster storage system
          // validate we have room in our party before attempting capture
          if (dataManager.isPartyFull()) {
            this.#selectedInventoryDescriptionText.setText('You have no room in your party! Cannot use that item.');
            this.#waitingForInput = true;
            return;
          }

          this.#handleItemUsed();
          this.#goBackToPreviousScene(true, selectedItem);
          return;
        }
      }

      if (selectedItem.category === ITEM_CATEGORY.CAPTURE) {
        // display message to player that the item cant be used now
        this.#selectedInventoryDescriptionText.setText(CANNOT_USE_ITEM_TEXT);
        this.#waitingForInput = true;
        return;
      }

      this._controls.lockInput = true;
      // pause this scene and launch the monster party scene
      /** @type {import('./monster-party-scene.js').MonsterPartySceneData} */
      const sceneDataToPass = {
        previousSceneName: SCENE_KEYS.INVENTORY_SCENE,
        itemSelected: this.#inventory[this.#selectedInventoryOptionIndex].item,
      };
      this.scene.launch(SCENE_KEYS.MONSTER_PARTY_SCENE, sceneDataToPass);
      this.scene.pause(SCENE_KEYS.INVENTORY_SCENE);

      // in a future update
      // TODO: add submenu for accept/cancel after picking an item
      return;
    }

    if (this.#waitingForInput) {
      return;
    }

    const selectedDirection = this._controls.getDirectionKeyJustPressed();
    if (selectedDirection !== DIRECTION.NONE) {
      this.#movePlayerInputCursor(selectedDirection);
      this.#updateItemDescriptionText();
    }
  }

  /**
   * @param {Phaser.Scenes.Systems} sys
   * @param {InventorySceneWasResumedData | undefined} [data]
   * @returns {void}
   */
  handleSceneResume(sys, data) {
    super.handleSceneResume(sys, data);

    if (!data || !data.wasItemUsed) {
      return;
    }

    const updatedItem = this.#handleItemUsed();
    // TODO: add logic to handle when the last of an item was just used

    // if previous scene was battle scene, switch back to that scene
    if (this.#sceneData.previousSceneName === SCENE_KEYS.BATTLE_SCENE) {
      this.#goBackToPreviousScene(true, updatedItem.item);
    }
  }

  /**
   * @returns {void}
   */
  #updateItemDescriptionText() {
    if (this.#isCancelButtonSelected()) {
      this.#selectedInventoryDescriptionText.setText(CANCEL_TEXT_DESCRIPTION);
      return;
    }

    this.#selectedInventoryDescriptionText.setText(
      this.#inventory[this.#selectedInventoryOptionIndex].item.description
    );
  }

  /**
   * @returns {boolean}
   */
  #isCancelButtonSelected() {
    return this.#selectedInventoryOptionIndex === this.#inventory.length;
  }

  /**
   * @param {boolean} wasItemUsed
   * @param {import('../types/typedef.js').Item} [item]
   * @returns {void}
   */
  #goBackToPreviousScene(wasItemUsed, item) {
    this._controls.lockInput = true;
    this.scene.stop(SCENE_KEYS.INVENTORY_SCENE);
    /** @type {InventorySceneItemUsedData} */
    const sceneDataToPass = {
      wasItemUsed,
      item,
    };
    this.scene.resume(this.#sceneData.previousSceneName, sceneDataToPass);
  }

  /**
   * @param {import('../common/direction.js').Direction} direction
   * @returns {void}
   */
  #movePlayerInputCursor(direction) {
    switch (direction) {
      case DIRECTION.UP:
        this.#selectedInventoryOptionIndex -= 1;
        if (this.#selectedInventoryOptionIndex < 0) {
          this.#selectedInventoryOptionIndex = this.#inventory.length;
        }
        break;
      case DIRECTION.DOWN:
        this.#selectedInventoryOptionIndex += 1;
        if (this.#selectedInventoryOptionIndex > this.#inventory.length) {
          this.#selectedInventoryOptionIndex = 0;
        }
        break;
      case DIRECTION.LEFT:
      case DIRECTION.RIGHT:
        return;
      case DIRECTION.NONE:
        break;
      default:
        exhaustiveGuard(direction);
    }

    const y = 30 + this.#selectedInventoryOptionIndex * 50;

    this.#userInputCursor.setY(y);
  }

  /**
   * @returns {InventoryItemWithGameObjects}
   */
  #handleItemUsed() {
    const selectedItem = this.#inventory[this.#selectedInventoryOptionIndex];
    selectedItem.quantity -= 1;
    selectedItem.gameObjects.quantity.setText(`${selectedItem.quantity}`);
    dataManager.updateInventory(this.#inventory);
    return selectedItem;
  }
}
