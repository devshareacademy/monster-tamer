import Phaser from '../../lib/phaser.js';

const BATTLE_MENU_OPTIONS = Object.freeze({
  FIGHT: 'FIGHT',
  SWITCH: 'SWITCH',
  ITEM: 'ITEM',
  FLEE: 'FLEE',
});

/**
 * @type {Phaser.Types.GameObjects.Text.TextStyle}
 */
const battleUiTextStyle = {
  color: 'black',
  fontSize: '30px',
};

export class BattleMenu {

  #mainBattleMenuPhaserContainerGameObject;

  constructor {

  }

  #createMainInfoPane() {
    const padding = 4;
    const rectHeight = 124;

    this.add
      .rectangle(
        padding,
        this.scale.height - rectHeight - padding,
        this.scale.width - padding * 2,
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

    return this.add
      .rectangle(0, 0, rectWidth, rectHeight, 0xede4f3, 1)
      .setOrigin(0)
      .setStrokeStyle(8, 0x905ac2, 1);
  }
}
