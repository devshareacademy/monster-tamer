import Phaser from '../../lib/phaser.js';
import { INVENTORY_ASSET_KEYS } from '../../assets/asset-keys.js';
import { SCENE_KEYS } from '../scene-keys.js';
import { BaseInventoryScene } from './base-inventory-scene.js';
import { dataManager } from '../../utils/data-manager.js';
import { ITEM_CATEGORY } from '../../types/typedef.js';

const CANNOT_USE_ITEM_TEXT = 'That item cannot be used right now.';

/**
 * @typedef InventorySceneItemUsedData
 * @type {object}
 * @property {boolean} wasItemUsed
 * @property {import('../../types/typedef.js').Item} [item]
 */

/**
 * @typedef InventorySceneWasResumedData
 * @type {object}
 * @property {boolean} wasItemUsed
 */

export class InventoryScene extends BaseInventoryScene {
  /** @type {import('../../types/typedef.js').Item | undefined} */
  #selectedItem;

  constructor() {
    super(
      {
        key: SCENE_KEYS.INVENTORY_SCENE,
      },
      {
        inventoryRowItemSpecialCharacter: 'x',
        cancelTextDescription: 'Close your bag, and go back to adventuring!',
        includeConfirmationMenu: false,
      }
    );
  }

  /**
   * Core Phaser.Scene Method. Responsible for initializing any values and setup before the CREATE method is invoked.
   * @param {import('./base-inventory-scene').BaseInventorySceneData} data
   * @returns {void}
   */
  init(data) {
    super.init(data);
    const inventory = dataManager.getInventory(this);
    this._inventory = inventory.map((inventoryItem) => {
      return {
        item: inventoryItem.item,
        numericDisplay: inventoryItem.quantity,
        gameObjects: {},
      };
    });
    this.#selectedItem = undefined;
  }

  /**
   * Core Phaser.Scene Method. Responsible for creating our various Phaser Game Objects to show on the screen.
   * @returns {void}
   */
  create() {
    super.create();
    this.add.image(40, 120, INVENTORY_ASSET_KEYS.INVENTORY_BAG).setOrigin(0).setScale(0.5);
    this._sceneTitleTextGameObject.setText('Items');
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
    // TODO:future add logic to handle when the last of an item was just used

    // if previous scene was battle scene, switch back to that scene
    if (this._sceneData.previousSceneName === SCENE_KEYS.BATTLE_SCENE) {
      this.#selectedItem = updatedItem.item;
      this._goBackToPreviousScene(this._createSceneDataToPass(true, this.#selectedItem));
    }
  }

  /**
   * Invoked when the player selects one of the items from the currently menu. This method
   * must be implemented in the child classes.
   * @protected
   * @returns {void}
   */
  _handleItemSelected() {
    if (this._inventory[this._selectedInventoryOptionIndex].numericDisplay < 1) {
      return;
    }

    this.#selectedItem = this._inventory[this._selectedInventoryOptionIndex].item;

    // check if this category cannot be used at this time
    if (
      this._sceneData.itemCategoriesThatCannotBeUsed !== undefined &&
      this._sceneData.itemCategoriesThatCannotBeUsed.includes(this.#selectedItem.category)
    ) {
      // display message to player that the item cant be used now
      this._selectedInventoryDescriptionText.setText(CANNOT_USE_ITEM_TEXT);
      this._waitingForInput = true;
      return;
    }

    // validate that the item can be used if we are outside battle (capture ball example)
    if (this._sceneData.previousSceneName === SCENE_KEYS.BATTLE_SCENE) {
      // check to see if the selected item needs a target monster, example if selecting
      // a capture ball, no monster needed, vs selecting a potion, player needs to choose the
      // target monster
      if (this.#selectedItem.category === ITEM_CATEGORY.CAPTURE) {
        // TODO:future this logic will need to be updated if we support a monster storage system
        // validate we have room in our party before attempting capture
        if (dataManager.isPartyFull()) {
          this._selectedInventoryDescriptionText.setText('You have no room in your party! Cannot use that item.');
          this._waitingForInput = true;
          return;
        }

        this.#handleItemUsed();
        this._goBackToPreviousScene(this._createSceneDataToPass(true, this.#selectedItem));
        return;
      }
    }

    this._controls.lockInput = true;
    // pause this scene and launch the monster party scene
    /** @type {import('../monster-party-scene.js').MonsterPartySceneData} */
    const sceneDataToPass = {
      previousSceneName: SCENE_KEYS.INVENTORY_SCENE,
      itemSelected: this._inventory[this._selectedInventoryOptionIndex].item,
    };
    this.scene.launch(SCENE_KEYS.MONSTER_PARTY_SCENE, sceneDataToPass);
    this.scene.pause(SCENE_KEYS.INVENTORY_SCENE);

    // TODO:future add submenu for accept/cancel after picking an item
  }

  /**
   * Creates the data that is needed to be based back to the previous scene.
   * @protected
   * @param {boolean} [wasItemUsed = false]
   * @param {import('../../types/typedef.js').Item} [item = undefined]
   * @returns {object}
   */
  _createSceneDataToPass(wasItemUsed = false, item = undefined) {
    /** @type {InventorySceneItemUsedData} */
    const sceneDataToPass = {
      wasItemUsed,
      item,
    };
    this.#selectedItem = undefined;
    return sceneDataToPass;
  }

  /**
   * @returns {import('./base-inventory-scene.js').BaseInventoryItemWithGameObjects}
   */
  #handleItemUsed() {
    const selectedItem = this._inventory[this._selectedInventoryOptionIndex];
    selectedItem.numericDisplay -= 1;
    selectedItem.gameObjects.numericDisplayText.setText(`${selectedItem.numericDisplay}`);

    /** @type {import('../../types/typedef.js').InventoryItem[]} */
    const playerInventoryItems = this._inventory.map((inventoryItem) => {
      return {
        item: inventoryItem.item,
        quantity: inventoryItem.numericDisplay,
      };
    });

    dataManager.updateInventory(playerInventoryItems);
    return selectedItem;
  }
}
