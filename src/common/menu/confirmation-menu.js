import { Menu } from './menu.js';

/**
 * @typedef {keyof typeof CONFIRMATION_MENU_OPTIONS} ConfirmationMenuOptions
 */

/** @enum {ConfirmationMenuOptions} */
export const CONFIRMATION_MENU_OPTIONS = Object.freeze({
  YES: 'YES',
  No: 'No',
});

export class ConfirmationMenu extends Menu {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    super(scene, [CONFIRMATION_MENU_OPTIONS.YES, CONFIRMATION_MENU_OPTIONS.No]);
  }
}
