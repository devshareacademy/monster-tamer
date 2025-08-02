import Phaser from '../../lib/phaser.js';
import { SCENE_KEYS } from '../scene-keys.js';
import { BaseInventoryScene, INVENTORY_TEXT_STYLE } from './base-inventory-scene.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../../utils/data-manager.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../../assets/font-keys.js';
import { UI_ASSET_KEYS } from '../../assets/asset-keys.js';
import { DataUtils } from '../../utils/data-utils.js';

/**
 * @typedef ShopInventorySceneData
 * @type {object}
 * @property {string} previousSceneName
 * @property {number[]} itemIds
 */

export class ShopInventoryScene extends BaseInventoryScene {
  /** @protected @type {ShopInventorySceneData} */
  _sceneData;
  /** @type {Phaser.GameObjects.Text} */
  #playerMoneyTextGameObject;
  /** @type {import('../../types/typedef.js').Item | undefined} */
  #selectedItem;

  constructor() {
    super(
      {
        key: SCENE_KEYS.SHOP_INVENTORY_SCENE,
      },
      {
        inventoryRowItemSpecialCharacter: '$',
        cancelTextDescription: 'Leave shop, and go back to adventuring!',
        includeConfirmationMenu: true,
      }
    );
  }

  /**
   * Core Phaser.Scene Method. Responsible for initializing any values and setup before the CREATE method is invoked.
   * @param {ShopInventorySceneData} data
   * @returns {void}
   */
  init(data) {
    super.init(data);

    // added for testing from preload scene
    if (data === undefined || Object.keys(data).length === 0) {
      this._sceneData = {
        itemIds: [1, 2],
        previousSceneName: SCENE_KEYS.WORLD_SCENE,
      };
    }

    console.log(this._sceneData);
    const items = this._sceneData.itemIds.map((itemId) => DataUtils.getItem(this, itemId));
    this._inventory = items.map((item) => {
      return {
        item: item,
        numericDisplay: item.price,
        gameObjects: {},
      };
    });
    this._itemNumericDisplayTextPrefixXPosition = 580;
    this._itemNumericDisplayTextXPosition = 610;
  }

  /**
   * Core Phaser.Scene Method. Responsible for creating our various Phaser Game Objects to show on the screen.
   * @returns {void}
   */
  create() {
    super.create();
    this._sceneTitleTextGameObject.setText('Shop');

    const moneyContainer = this._nineSliceMainContainer
      .createNineSliceContainer(this, 240, 84, UI_ASSET_KEYS.MENU_BACKGROUND)
      .setPosition(64, 100);
    const moneyContainerBackground = this.add.rectangle(4, 4, 232, 76, 0xffff88).setOrigin(0).setAlpha(0.6);
    moneyContainer.add(moneyContainerBackground);

    const moneyPrefix = this.add.text(116, 28, 'Money', INVENTORY_TEXT_STYLE).setOrigin(0.5);
    moneyContainer.add(moneyPrefix);

    this.#playerMoneyTextGameObject = this.add.text(116, 58, '', INVENTORY_TEXT_STYLE).setOrigin(0.5);
    moneyContainer.add(this.#playerMoneyTextGameObject);
    this.#updateMoneyTextGameObjectText();
  }

  /**
   * Invoked when the player selects one of the items from the currently menu. This method
   * must be implemented in the child classes.
   * @protected
   * @returns {void}
   */
  _handleItemSelected() {
    this.#selectedItem = this._inventory[this._selectedInventoryOptionIndex].item;
    const playerMoney = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_MONEY);

    // if player does not have enough money to buy the item, return early
    if (playerMoney < this.#selectedItem.price) {
      return;
    }

    // prompt player if they want to purchase the item
    this._confirmationMenu.show();
    this._selectedInventoryDescriptionText.setText(`Buy ${this.#selectedItem.name}?`);
  }

  /**
   * Invoked when the player selects YES from the confirmation menu. This method
   * must be implemented in the child classes that use the confirmation menu.
   * @protected
   * @returns {void}
   */
  _handleConfirmationMenuConfirmOptionSelected() {
    this._updateItemDescriptionText();
    dataManager.spendMoney(this.#selectedItem.price);
    dataManager.addItem(this.#selectedItem, 1);
    this.#updateMoneyTextGameObjectText();
  }

  /**
   * Invoked when the player selects NO from the confirmation menu. This method
   * must be implemented in the child classes that use the confirmation menu.
   * @protected
   * @returns {void}
   */
  _handleConfirmationMenuDeclineOptionSelected() {
    this._updateItemDescriptionText();
  }

  /**
   * Creates the data that is needed to be based back to the previous scene.
   * @protected
   * @returns {object}
   */
  _createSceneDataToPass() {
    /** @type {import('../../types/typedef.js').BaseSceneResumedData} */
    const sceneDataToPass = {
      previousScene: SCENE_KEYS.SHOP_INVENTORY_SCENE,
    };
    return sceneDataToPass;
  }

  /**
   * Updated the money text game object with the amount of money the player has and the currency symbol prefix.
   * @returns {void}
   */
  #updateMoneyTextGameObjectText() {
    this.#playerMoneyTextGameObject.setText(
      `${this._baseInventorySceneConfig.inventoryRowItemSpecialCharacter} ${dataManager.store.get(
        DATA_MANAGER_STORE_KEYS.PLAYER_MONEY
      )}`
    );
  }
}
