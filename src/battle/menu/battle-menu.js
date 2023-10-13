import Phaser from '../../lib/phaser.js';
import { MONSTER_ASSET_KEYS, UI_ASSET_KEYS } from '../../assets/asset-keys.js';
import { BATTLE_UI_TEXT_STYLE } from './battle-menu-config.js';
import { ACTIVE_BATTLE_MENU, ATTACK_MOVE_OPTIONS, BATTLE_MENU_OPTIONS } from './battle-menu-options.js';
import { DIRECTION } from '../../common/direction.js';
import { exhaustiveGuard } from '../../utils/guard.js';

const battleMenuCursorPos = {
  x: 42,
  y: 38,
};

const attackMenuCursorPos = {
  x: 42,
  y: 38,
};

const playerInputCursorPos = {
  y: 488,
};

export class BattleMenu {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {Phaser.GameObjects.Container} */
  #mainBattleMenuPhaserContainerGameObject;
  /** @type {Phaser.GameObjects.Container} */
  #moveSelectionSubBattleMenuPhaserContainerGameObject;
  /** @type {Phaser.GameObjects.Text} */
  #battleTextGameObjectLine1;
  /** @type {Phaser.GameObjects.Text} */
  #battleTextGameObjectLine2;
  /** @type {import('./battle-menu-options.js').BattleMenuOptions} */
  #selectedBattleMenuOption;
  /** @type {import('./battle-menu-options.js').AttackMoveOptions} */
  #selectedAttackMenuOption;
  /** @type {import('./battle-menu-options.js').ActiveBattleMenu} */
  #activeBattleMenu;
  /** @type {Phaser.GameObjects.Image} */
  #mainBattleMenuCursorPhaserImageGameObject;
  /** @type {Phaser.GameObjects.Image} */
  #attackBattleMenuCursorPhaserImageGameObject;
  /** @type {string[]} */
  #queuedInfoPanelMessages;
  /** @type {() => void | undefined} */
  #queuedInfoPanelMessagesCallback;
  /** @type {boolean} */
  #waitingForPlayerInput;

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
   */
  constructor(scene) {
    this.#scene = scene;
    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
    this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1;
    this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN;
    this.#queuedInfoPanelMessages = [];
    this.#waitingForPlayerInput = false;
    this.#createMainInfoPane();
    this.#createMainBattleMenu();
    this.#createMonsterAttackSubMenu();
  }

  showMainBattleMenu() {
    this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN;
    this.#battleTextGameObjectLine1.setText('what should');
    this.#mainBattleMenuPhaserContainerGameObject.setAlpha(1);
    this.#battleTextGameObjectLine1.setAlpha(1);
    this.#battleTextGameObjectLine2.setAlpha(1);

    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
    this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(battleMenuCursorPos.x, battleMenuCursorPos.y);
  }

  hideMainBattleMenu() {
    this.#mainBattleMenuPhaserContainerGameObject.setAlpha(0);
    this.#battleTextGameObjectLine1.setAlpha(0);
    this.#battleTextGameObjectLine2.setAlpha(0);
  }

  showMonsterAttackSubMenu() {
    this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT;
    this.#moveSelectionSubBattleMenuPhaserContainerGameObject.setAlpha(1);
  }

  hideMonsterAttackSubMenu() {
    this.#moveSelectionSubBattleMenuPhaserContainerGameObject.setAlpha(0);
  }

  /**
   *
   * @param {import('../../common/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  handlePlayerInput(input) {
    if (this.#waitingForPlayerInput && this.#queuedInfoPanelMessagesCallback) {
      this.#updateInfoPaneWithMessage();
      return;
    }

    if (input === 'CANCEL') {
      this.#switchToMainBattleMenu();
      return;
    }

    if (input === 'OK') {
      if (this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MAIN) {
        this.#handlePlayerChooseMainBattleOption();
        return;
      }
      if (this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT) {
        // TODO
        // this.#handlePlayerChooseAttack()
        return;
      }
      return;
    }
    this.#updateSelectedBattleMenuOptionFromInput(input);
    this.#updateSelectedMoveMenuOptionFromInput(input);
    this.#moveMainBattleMenuCursor();
    this.#moveMoveSelectBattleMenuCursor();
  }

  /**
   * @param {string[]} messages
   * @param {() => void} [callback]
   */
  updateInfoPaneMessagesAndWaitForInput(messages, callback) {
    this.#queuedInfoPanelMessages = messages;
    this.#queuedInfoPanelMessagesCallback = callback;

    this.#updateInfoPaneWithMessage();
  }

  #createMainBattleMenu() {
    this.#battleTextGameObjectLine1 = this.#scene.add.text(20, 468, 'what should', BATTLE_UI_TEXT_STYLE);
    // TODO: update to use monster data that is passed into this class instance
    this.#battleTextGameObjectLine2 = this.#scene.add.text(
      20,
      512,
      `${MONSTER_ASSET_KEYS.IGUANIGNITE} do next?`,
      BATTLE_UI_TEXT_STYLE
    );
    this.#battleTextGameObjectLine1.setAlpha(0);
    this.#battleTextGameObjectLine2.setAlpha(0);

    this.#mainBattleMenuCursorPhaserImageGameObject = this.#scene.add
      .image(battleMenuCursorPos.x, battleMenuCursorPos.y, UI_ASSET_KEYS.CURSOR)
      .setOrigin(0.5)
      .setScale(2.5);

    this.#mainBattleMenuPhaserContainerGameObject = this.#scene.add.container(520, 448, [
      this.#createMainInfoSubPane(),
      this.#scene.add.text(55, 22, BATTLE_MENU_OPTIONS.FIGHT, BATTLE_UI_TEXT_STYLE),
      this.#scene.add.text(240, 22, BATTLE_MENU_OPTIONS.SWITCH, BATTLE_UI_TEXT_STYLE),
      this.#scene.add.text(55, 70, BATTLE_MENU_OPTIONS.ITEM, BATTLE_UI_TEXT_STYLE),
      this.#scene.add.text(240, 70, BATTLE_MENU_OPTIONS.FLEE, BATTLE_UI_TEXT_STYLE),
      this.#mainBattleMenuCursorPhaserImageGameObject,
    ]);

    this.#mainBattleMenuPhaserContainerGameObject.setAlpha(0);
  }

  #createMonsterAttackSubMenu() {
    this.#attackBattleMenuCursorPhaserImageGameObject = this.#scene.add
      .image(attackMenuCursorPos.x, attackMenuCursorPos.y, UI_ASSET_KEYS.CURSOR)
      .setOrigin(0.5)
      .setScale(2.5);

    this.#moveSelectionSubBattleMenuPhaserContainerGameObject = this.#scene.add.container(0, 448, [
      this.#scene.add.text(55, 22, 'slash', BATTLE_UI_TEXT_STYLE),
      this.#scene.add.text(240, 22, 'growl', BATTLE_UI_TEXT_STYLE),
      this.#scene.add.text(55, 70, '-', BATTLE_UI_TEXT_STYLE),
      this.#scene.add.text(240, 70, '-', BATTLE_UI_TEXT_STYLE),
      this.#attackBattleMenuCursorPhaserImageGameObject,
    ]);
    this.#moveSelectionSubBattleMenuPhaserContainerGameObject.setAlpha(0);
  }

  #createMainInfoPane() {
    const padding = 4;
    const rectHeight = 124;

    return this.#scene.add
      .rectangle(
        padding,
        this.#scene.scale.height - rectHeight - padding,
        this.#scene.scale.width - padding * 2,
        rectHeight,
        0xede4f3,
        1
      )
      .setOrigin(0)
      .setStrokeStyle(8, 0xe4434a, 1);
  }

  #createMainInfoSubPane() {
    const rectWidth = 500;
    const rectHeight = 124;

    return this.#scene.add
      .rectangle(0, 0, rectWidth, rectHeight, 0xede4f3, 1)
      .setOrigin(0)
      .setStrokeStyle(8, 0x905ac2, 1);
  }

  /**
   * @param {import('../../common/direction.js').Direction} direction
   * @returns void
   */
  #updateSelectedBattleMenuOptionFromInput(direction) {
    if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MAIN) {
      return;
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FIGHT) {
      switch (direction) {
        case DIRECTION.RIGHT:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.SWITCH;
          return;
        case DIRECTION.DOWN:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.ITEM;
          return;
        case DIRECTION.LEFT:
        case DIRECTION.UP:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.SWITCH) {
      switch (direction) {
        case DIRECTION.LEFT:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
          return;
        case DIRECTION.DOWN:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FLEE;
          return;
        case DIRECTION.RIGHT:
        case DIRECTION.UP:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.ITEM) {
      switch (direction) {
        case DIRECTION.UP:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT;
          return;
        case DIRECTION.RIGHT:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FLEE;
          return;
        case DIRECTION.LEFT:
        case DIRECTION.DOWN:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FLEE) {
      switch (direction) {
        case DIRECTION.UP:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.SWITCH;
          return;
        case DIRECTION.LEFT:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.ITEM;
          return;
        case DIRECTION.RIGHT:
        case DIRECTION.DOWN:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    // We should never reach this default case
    exhaustiveGuard(this.#selectedBattleMenuOption);
  }

  /**
   * @param {import('../../common/direction.js').Direction} direction
   * @returns void
   */
  #updateSelectedMoveMenuOptionFromInput(direction) {
    if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT) {
      return;
    }

    if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_1) {
      switch (direction) {
        case DIRECTION.RIGHT:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_2;
          return;
        case DIRECTION.DOWN:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_3;
          return;
        case DIRECTION.LEFT:
        case DIRECTION.UP:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_2) {
      switch (direction) {
        case DIRECTION.LEFT:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1;
          return;
        case DIRECTION.DOWN:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_4;
          return;
        case DIRECTION.RIGHT:
        case DIRECTION.UP:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_3) {
      switch (direction) {
        case DIRECTION.UP:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1;
          return;
        case DIRECTION.RIGHT:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_4;
          return;
        case DIRECTION.LEFT:
        case DIRECTION.DOWN:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_4) {
      switch (direction) {
        case DIRECTION.UP:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_2;
          return;
        case DIRECTION.LEFT:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_3;
          return;
        case DIRECTION.RIGHT:
        case DIRECTION.DOWN:
        case DIRECTION.NONE:
          return;
        default:
          exhaustiveGuard(direction);
      }
      return;
    }

    // We should never reach this default case
    exhaustiveGuard(this.#selectedAttackMenuOption);
  }

  #moveMoveSelectBattleMenuCursor() {
    if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT) {
      return;
    }

    switch (this.#selectedAttackMenuOption) {
      case ATTACK_MOVE_OPTIONS.MOVE_1:
        this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(attackMenuCursorPos.x, attackMenuCursorPos.y);
        return;
      case ATTACK_MOVE_OPTIONS.MOVE_3:
        this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(42, 86);
        return;
      case ATTACK_MOVE_OPTIONS.MOVE_4:
        this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(228, 86);
        return;
      case ATTACK_MOVE_OPTIONS.MOVE_2:
        this.#attackBattleMenuCursorPhaserImageGameObject.setPosition(228, 38);
        return;
      default:
        // We should never reach this default case
        exhaustiveGuard(this.#selectedAttackMenuOption);
    }
  }

  #moveMainBattleMenuCursor() {
    if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MAIN) {
      return;
    }

    switch (this.#selectedBattleMenuOption) {
      case BATTLE_MENU_OPTIONS.FIGHT:
        this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(battleMenuCursorPos.x, battleMenuCursorPos.y);
        return;
      case BATTLE_MENU_OPTIONS.ITEM:
        this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(42, 86);
        return;
      case BATTLE_MENU_OPTIONS.FLEE:
        this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(228, 86);
        return;
      case BATTLE_MENU_OPTIONS.SWITCH:
        this.#mainBattleMenuCursorPhaserImageGameObject.setPosition(228, 38);
        return;
      default:
        // We should never reach this default case
        exhaustiveGuard(this.#selectedBattleMenuOption);
    }
  }

  #handlePlayerChooseMainBattleOption() {
    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FIGHT) {
      this.hideMainBattleMenu();
      this.showMonsterAttackSubMenu();
      this.#waitingForPlayerInput = true;
      this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT;
      return;
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.ITEM) {
      this.hideMainBattleMenu();
      // TODO: add feature in a future update
      /*
        for the time being, we will display text about the player having no items
        and allow the player to navigate back to the main menu
      */
      this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_ITEM;
      this.updateInfoPaneMessagesAndWaitForInput(['Your bag is empty...'], () => {
        this.#switchToMainBattleMenu();
      });
      return;
    }
    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.SWITCH) {
      this.hideMainBattleMenu();
      // TODO: add feature in a future update
      /*
        for the time being, we will display text about the player having no more monsters
        and allow the player to navigate back to the main menu
      */
      this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_SWITCH;
      this.updateInfoPaneMessagesAndWaitForInput(['You have no other monsters in your party...'], () => {
        this.#switchToMainBattleMenu();
      });
      return;
    }
    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FLEE) {
      this.hideMainBattleMenu();
      // TODO: add feature in a future update
      /*
        for the time being, we will display text about the player successfully running away
        and then restart the Phaser scene after doing a screen fade out
      */
      this.#activeBattleMenu = ACTIVE_BATTLE_MENU.FLEE;
      this.updateInfoPaneMessagesAndWaitForInput(['You fail to run away...'], () => {
        this.#switchToMainBattleMenu();
      });
      // TODO: emit event about player fleeing
      return;
    }

    // We should never reach this default case
    exhaustiveGuard(this.#selectedBattleMenuOption);
  }

  #updateInfoPaneWithMessage() {
    this.#waitingForPlayerInput = false;
    this.#battleTextGameObjectLine1.setText('').setAlpha(1);

    // check if all messages have been displayed from the queue and call the callback
    if (this.#queuedInfoPanelMessages.length === 0) {
      this.#waitingForPlayerInput = false;
      if (this.#queuedInfoPanelMessagesCallback) {
        this.#queuedInfoPanelMessagesCallback();
        this.#queuedInfoPanelMessagesCallback = undefined;
      }
      return;
    }

    // get first message from queue and animate message
    const messageToDisplay = this.#queuedInfoPanelMessages.shift();
    this.#battleTextGameObjectLine1.setText(messageToDisplay);
    this.#waitingForPlayerInput = true;
  }

  #switchToMainBattleMenu() {
    this.#waitingForPlayerInput = false;
    this.hideMonsterAttackSubMenu();
    this.showMainBattleMenu();
  }
}
