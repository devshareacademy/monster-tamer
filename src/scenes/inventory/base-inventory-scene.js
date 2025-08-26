import Phaser from '../../lib/phaser.js';
import { BaseScene } from '../base-scene.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../../assets/font-keys.js';
import { NineSlice } from '../../utils/nine-slice.js';
import { INVENTORY_ASSET_KEYS, UI_ASSET_KEYS } from '../../assets/asset-keys.js';
import { SCENE_KEYS } from '../scene-keys.js';
import { DIRECTION } from '../../common/direction.js';
import { exhaustiveGuard } from '../../utils/guard.js';
import { CONFIRMATION_MENU_OPTIONS, ConfirmationMenu } from '../../common/menu/confirmation-menu.js';

const INVENTORY_ITEM_POSITION = Object.freeze({
  x: 50,
  y: 14,
  space: 50,
});

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
export const INVENTORY_TEXT_STYLE = {
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#000000',
  fontSize: '30px',
};

/**
 * @typedef BaseInventorySceneData
 * @type {object}
 * @property {string} previousSceneName
 * @property {import('../../types/typedef.js').ItemCategory[]} [itemCategoriesThatCannotBeUsed]
 */

/**
 * @typedef BaseInventoryItemGameObjects
 * @type {object}
 * @property {Phaser.GameObjects.Text} [itemName]
 * @property {Phaser.GameObjects.Text} [numericDisplayTextPrefix]
 * @property {Phaser.GameObjects.Text} [numericDisplayText]
 */

/**
 * @typedef BaseInventoryItem
 * @type {object}
 * @property {import('../../types/typedef.js').Item} item
 * @property {number} numericDisplay
 */

/**
 * @typedef {BaseInventoryItem & { gameObjects: BaseInventoryItemGameObjects }} BaseInventoryItemWithGameObjects
 */

/**
 * @typedef CustomInventory
 * @type {BaseInventoryItemWithGameObjects[]}
 */

/**
 * @typedef BaseInventorySceneConfig
 * @type {object}
 * @property {string} inventoryRowItemSpecialCharacter
 * @property {string} cancelTextDescription
 * @property {boolean} includeConfirmationMenu
 */

export class BaseInventoryScene extends BaseScene {
  /** @protected @type {string} */
  _sceneKey;
  /** @protected @type {BaseInventorySceneData} */
  _sceneData;
  /** @protected @type {BaseInventorySceneConfig} */
  _baseInventorySceneConfig;
  /** @protected @type {NineSlice} */
  _nineSliceMainContainer;
  /** @protected @type {Phaser.GameObjects.Text} */
  _selectedInventoryDescriptionText;
  /** @protected @type {Phaser.GameObjects.Image} */
  _userInputCursor;
  /** @protected @type {number} */
  _selectedInventoryOptionIndex;
  /** @protected @type {boolean} */
  _waitingForInput;
  /** @protected @type {CustomInventory} */
  _inventory;
  /** @protected @type {Phaser.GameObjects.Text} */
  _sceneTitleTextGameObject;
  /** @protected @type {number} */
  _itemNumericDisplayTextPrefixXPosition;
  /** @protected @type {number} */
  _itemNumericDisplayTextXPosition;
  /** @protected @type {ConfirmationMenu | undefined} */
  _confirmationMenu;

  /**
   * @param {Phaser.Types.Scenes.SettingsConfig} config
   * @param {BaseInventorySceneConfig} inventorySceneConfig
   */
  constructor(config, inventorySceneConfig) {
    super(config);
    if (this.constructor === BaseInventoryScene) {
      throw new Error('BaseInventoryScene is an abstract class and cannot be instantiated.');
    }
    this._sceneKey = config.key;
    this._baseInventorySceneConfig = inventorySceneConfig;
  }

  /**
   * Core Phaser.Scene Method. Responsible for initializing any values and setup before the CREATE method is invoked.
   * @param {BaseInventorySceneData} data
   * @returns {void}
   */
  init(data) {
    super.init(data);

    this._waitingForInput = false;
    this._sceneData = data;
    this._selectedInventoryOptionIndex = 0;
    this._nineSliceMainContainer = new NineSlice({
      cornerCutSize: 32,
      textureManager: this.sys.textures,
      assetKeys: [UI_ASSET_KEYS.MENU_BACKGROUND],
    });
    this._inventory = [];
    this._itemNumericDisplayTextPrefixXPosition = 620;
    this._itemNumericDisplayTextXPosition = 650;
    this._confirmationMenu = undefined;
  }

  /**
   * Core Phaser.Scene Method. Responsible for creating our various Phaser Game Objects to show on the screen.
   * @returns {void}
   */
  create() {
    super.create();

    // create custom background
    this.add.image(0, 0, INVENTORY_ASSET_KEYS.INVENTORY_BACKGROUND).setOrigin(0);

    const container = this._nineSliceMainContainer
      .createNineSliceContainer(this, 700, 360, UI_ASSET_KEYS.MENU_BACKGROUND)
      .setPosition(300, 20);
    const containerBackground = this.add.rectangle(4, 4, 692, 352, 0xffff88).setOrigin(0).setAlpha(0.6);
    container.add(containerBackground);

    const titleContainer = this._nineSliceMainContainer
      .createNineSliceContainer(this, 240, 64, UI_ASSET_KEYS.MENU_BACKGROUND)
      .setPosition(64, 20);
    const titleContainerBackground = this.add.rectangle(4, 4, 232, 56, 0xffff88).setOrigin(0).setAlpha(0.6);
    titleContainer.add(titleContainerBackground);

    this._sceneTitleTextGameObject = this.add.text(116, 28, '', INVENTORY_TEXT_STYLE).setOrigin(0.5);
    titleContainer.add(this._sceneTitleTextGameObject);

    // create inventory text from available items
    this._inventory.forEach((inventoryItem, index) => {
      const itemText = this.add.text(
        INVENTORY_ITEM_POSITION.x,
        INVENTORY_ITEM_POSITION.y + index * INVENTORY_ITEM_POSITION.space,
        inventoryItem.item.name,
        INVENTORY_TEXT_STYLE
      );
      const numericDisplayTextPrefix = this.add.text(
        this._itemNumericDisplayTextPrefixXPosition,
        INVENTORY_ITEM_POSITION.y + 2 + index * INVENTORY_ITEM_POSITION.space,
        this._baseInventorySceneConfig.inventoryRowItemSpecialCharacter,
        {
          color: '#000000',
          fontSize: '30px',
        }
      );
      const numericDisplayText = this.add.text(
        this._itemNumericDisplayTextXPosition,
        INVENTORY_ITEM_POSITION.y + index * INVENTORY_ITEM_POSITION.space,
        `${inventoryItem.numericDisplay}`,
        INVENTORY_TEXT_STYLE
      );
      container.add([itemText, numericDisplayTextPrefix, numericDisplayText]);
      inventoryItem.gameObjects = {
        itemName: itemText,
        numericDisplayText: numericDisplayText,
        numericDisplayTextPrefix: numericDisplayTextPrefix,
      };
    });

    // create cancel text
    const cancelText = this.add.text(
      INVENTORY_ITEM_POSITION.x,
      INVENTORY_ITEM_POSITION.y + this._inventory.length * INVENTORY_ITEM_POSITION.space,
      'Cancel',
      INVENTORY_TEXT_STYLE
    );
    container.add(cancelText);

    // create player input cursor
    this._userInputCursor = this.add.image(30, 30, UI_ASSET_KEYS.CURSOR).setScale(3);
    container.add(this._userInputCursor);

    // create inventory description text
    this._selectedInventoryDescriptionText = this.add.text(25, 420, '', {
      ...INVENTORY_TEXT_STYLE,
      ...{
        wordWrap: {
          width: this.scale.width - 18,
        },
        color: '#ffffff',
      },
    });
    this._updateItemDescriptionText();

    // create confirmation menu
    if (this._baseInventorySceneConfig.includeConfirmationMenu) {
      this._confirmationMenu = new ConfirmationMenu(this);
    }
  }

  /**
   * Core Phaser.Scene Method. Invoked for each tick of our core game loop by Phaser. Responsible for listening for input
   * and updating game objects accordingly.
   * @returns {void}
   */
  update() {
    super.update();

    if (this._controls.isInputLocked) {
      return;
    }

    const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();
    const wasBackKeyPressed = this._controls.wasBackKeyPressed();
    const selectedDirection = this._controls.getDirectionKeyJustPressed();

    if (this._confirmationMenu !== undefined && this._confirmationMenu.isVisible) {
      this.#handleConfirmationMenuInput(wasSpaceKeyPressed, wasBackKeyPressed, selectedDirection);
      return;
    }

    if (wasBackKeyPressed) {
      if (this._waitingForInput) {
        // update text description and let player select new items
        this._updateItemDescriptionText();
        this._waitingForInput = false;
        return;
      }

      this._goBackToPreviousScene(this._createSceneDataToPass());
      return;
    }

    if (wasSpaceKeyPressed) {
      if (this._waitingForInput) {
        // update text description and let player select new items
        this._updateItemDescriptionText();
        this._waitingForInput = false;
        return;
      }

      if (this._isCancelButtonSelected()) {
        this._goBackToPreviousScene(this._createSceneDataToPass());
        return;
      }

      // handle which item was selected in the child class
      this._handleItemSelected();
      return;
    }

    if (this._waitingForInput) {
      return;
    }

    if (selectedDirection !== DIRECTION.NONE) {
      this._movePlayerInputCursor(selectedDirection);
      this._updateItemDescriptionText();
    }
  }

  /**
   * Updates the description text of the item, or menu button that is currently highlighted/selected in this scene.
   * @protected
   * @returns {void}
   */
  _updateItemDescriptionText() {
    if (this._isCancelButtonSelected()) {
      this._selectedInventoryDescriptionText.setText(this._baseInventorySceneConfig.cancelTextDescription);
      return;
    }

    this._selectedInventoryDescriptionText.setText(
      this._inventory[this._selectedInventoryOptionIndex].item.description
    );
  }

  /**
   * Returns true if the selected element in the menu is the last item, the cancel button.
   * @protected
   * @returns {boolean}
   */
  _isCancelButtonSelected() {
    return this._selectedInventoryOptionIndex === this._inventory.length;
  }

  /**
   * Updates the currently selected index of the item shown in the menu and then updates
   * the Cursor Game Object to reflect when the player is currently highlighting.
   * @protected
   * @param {import('../../common/direction.js').Direction} direction
   * @returns {void}
   */
  _movePlayerInputCursor(direction) {
    switch (direction) {
      case DIRECTION.UP:
        this._selectedInventoryOptionIndex -= 1;
        if (this._selectedInventoryOptionIndex < 0) {
          this._selectedInventoryOptionIndex = this._inventory.length;
        }
        break;
      case DIRECTION.DOWN:
        this._selectedInventoryOptionIndex += 1;
        if (this._selectedInventoryOptionIndex > this._inventory.length) {
          this._selectedInventoryOptionIndex = 0;
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

    const y = 30 + this._selectedInventoryOptionIndex * 50;

    this._userInputCursor.setY(y);
  }

  /**
   * Invoked when we need to navigate back to the previous scene.
   * @protected
   * @param {object} sceneDataToPass
   * @returns {void}
   */
  _goBackToPreviousScene(sceneDataToPass) {
    this._controls.lockInput = true;
    this.scene.stop(this._sceneKey);
    this.scene.resume(this._sceneData.previousSceneName, sceneDataToPass);
  }

  /**
   * Invoked when the player selects one of the items from the currently menu. This method
   * must be implemented in the child classes.
   * @abstract @protected
   * @returns {void}
   */
  _handleItemSelected() {
    throw new Error('method not implemented');
  }

  /**
   * Creates the data that is needed to be based back to the previous scene.
   * @protected
   * @returns {object}
   */
  _createSceneDataToPass() {
    return {};
  }

  /**
   * Invoked when the player selects YES from the confirmation menu. This method
   * must be implemented in the child classes that use the confirmation menu.
   * @abstract @protected
   * @returns {void}
   */
  _handleConfirmationMenuConfirmOptionSelected() {
    throw new Error('method not implemented');
  }

  /**
   * Invoked when the player selects NO from the confirmation menu. This method
   * must be implemented in the child classes that use the confirmation menu.
   * @abstract @protected
   * @returns {void}
   */
  _handleConfirmationMenuDeclineOptionSelected() {
    throw new Error('method not implemented');
  }

  /**
   * Handle input while confirmation menu is visible.
   * @param {boolean} wasSpaceKeyPressed
   * @param {boolean} wasBackKeyPressed
   * @param {import('../../common/direction.js').Direction} selectedDirection
   */
  #handleConfirmationMenuInput(wasSpaceKeyPressed, wasBackKeyPressed, selectedDirection) {
    if (selectedDirection !== DIRECTION.NONE) {
      this._confirmationMenu.handlePlayerInput(selectedDirection);
      return;
    }

    if (wasBackKeyPressed) {
      this._confirmationMenu.hide();
      return;
    }

    if (wasSpaceKeyPressed) {
      this._confirmationMenu.handlePlayerInput('OK');
      if (this._confirmationMenu.selectedMenuOption === CONFIRMATION_MENU_OPTIONS.YES) {
        this._handleConfirmationMenuConfirmOptionSelected();
        this._confirmationMenu.hide();
        return;
      }
      if (this._confirmationMenu.selectedMenuOption === CONFIRMATION_MENU_OPTIONS.NO) {
        this._handleConfirmationMenuDeclineOptionSelected();
        this._confirmationMenu.hide();
        return;
      }
    }
  }
}
