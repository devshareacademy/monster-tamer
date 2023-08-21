import {
  BATTLE_ASSET_KEYS,
  BATTLE_BACKGROUND_ASSET_KEYS,
  HEALTH_BAR_ASSET_KEYS,
  MONSTER_ASSET_KEYS,
} from '../assets/asset-keys.js';
import Phaser from '../lib/phaser.js';
import { PHASER_SCENE_LOG_STYLE } from '../utils/logging.js';
import { SCENE_KEYS } from './scene-keys.js';

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

/**
 * This scene will be used to display the monster battle screen, which should be shown
 * when the player encounters a wild monster, or they are battling another trainer.
 */
export class BattleScene extends Phaser.Scene {
  constructor() {
    super({
      key: SCENE_KEYS.BATTLE_SCENE,
    });
  }

  create() {
    console.log(
      `%c[${BattleScene.name}:create] invoked`,
      PHASER_SCENE_LOG_STYLE
    );
    // create main background
    this.add.image(0, 0, BATTLE_BACKGROUND_ASSET_KEYS.FOREST, 0).setOrigin(0);

    // render out the player and enemy monsters
    this.add.image(768, 144, MONSTER_ASSET_KEYS.CARNODUSK, 0);
    this.add.image(256, 316, MONSTER_ASSET_KEYS.IGUANIGNITE, 0).setFlipX(true);

    // render out the player health bar
    const playerMonsterName = this.add
      .text(30, 20, MONSTER_ASSET_KEYS.IGUANIGNITE, {
        color: '#7E3D3F',
        fontSize: '32px',
      })
      .setOrigin(0);
    this.add.container(556, 318, [
      this.add
        .image(0, 0, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND)
        .setOrigin(0),
      this.#createHealthBar(34, 34),
      playerMonsterName,
      this.add
        .text(playerMonsterName.width + 35, 23, 'L5', {
          color: '#ED474B',
          fontSize: '28px',
        })
        .setOrigin(0),
      this.add
        .text(443, 80, `25/25`, {
          color: '#7E3D3F',
          fontSize: '16px',
        })
        .setOrigin(1, 0),
      this.add.text(30, 55, 'HP', {
        color: '#ff6505',
        fontSize: '24px',
        fontStyle: 'italic',
      }),
    ]);

    // render out the enemy health bar
    const enemyMonsterName = this.add
      .text(30, 20, MONSTER_ASSET_KEYS.CARNODUSK, {
        color: '#7E3D3F',
        fontSize: '32px',
      })
      .setOrigin(0);
    this.add.container(0, 0, [
      this.add
        .image(0, 0, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND)
        .setOrigin(0)
        .setScale(1, 0.8),
      this.#createHealthBar(34, 34),
      enemyMonsterName,
      this.add
        .text(enemyMonsterName.width + 35, 23, 'L5', {
          color: '#ED474B',
          fontSize: '28px',
        })
        .setOrigin(0),
      this.add.text(30, 55, 'HP', {
        color: '#ff6505',
        fontSize: '24px',
        fontStyle: 'italic',
      }),
    ]);

    // render out the main info panel
    this.#createMainInfoPane();

    // render out the battle option panel
    this.add.container(520, 448, [
      this.#createMainInfoSubPane(),
      this.add.text(55, 22, BATTLE_MENU_OPTIONS.FIGHT, battleUiTextStyle),
      this.add.text(240, 22, BATTLE_MENU_OPTIONS.SWITCH, battleUiTextStyle),
      this.add.text(55, 70, BATTLE_MENU_OPTIONS.ITEM, battleUiTextStyle),
      this.add.text(240, 70, BATTLE_MENU_OPTIONS.FLEE, battleUiTextStyle),
    ]);

    // render out the attack option panel
    this.add.container(0, 448, [
      this.add.text(55, 22, 'slash', battleUiTextStyle),
      this.add.text(240, 22, 'growl', battleUiTextStyle),
      this.add.text(55, 70, '-', battleUiTextStyle),
      this.add.text(240, 70, '-', battleUiTextStyle),
    ]);
  }

  #createMainInfoPane() {
    const rectWidth = 1016;
    const rectHeight = 124;
    const padding = 4;

    const g = this.add.graphics();
    const x = this.scale.width - rectWidth - padding;
    const y = this.scale.height - rectHeight - padding;
    g.fillStyle(0xede4f3, 1);
    g.fillRect(x + 1, y + 1, rectWidth - 1, rectHeight - 1);
    g.lineStyle(8, 0xe4434a, 10);
    g.strokeRect(x, y, rectWidth, rectHeight);
  }

  #createMainInfoSubPane() {
    const rectWidth = 500;
    const rectHeight = 124;

    const g = this.add.graphics();
    const x = 0;
    const y = 0;
    g.fillStyle(0xede4f3, 1);
    g.fillRect(x + 1, y + 1, rectWidth - 1, rectHeight - 1);
    g.lineStyle(8, 0x905ac2, 10);
    g.strokeRect(x, y, rectWidth, rectHeight);

    return g;
  }

  #createHealthBar(x, y) {
    const scaleY = 0.7;
    const leftCap = this.add
      .image(x, y, HEALTH_BAR_ASSET_KEYS.LEFT_CAP)
      .setOrigin(0, 0.5)
      .setScale(1, scaleY);
    const middle = this.add
      .image(leftCap.x + leftCap.width, y, HEALTH_BAR_ASSET_KEYS.MIDDLE)
      .setOrigin(0, 0.5)
      .setScale(1, scaleY);
    middle.displayWidth = 360;
    const rightCap = this.add
      .image(middle.x + middle.displayWidth, y, HEALTH_BAR_ASSET_KEYS.RIGHT_CAP)
      .setOrigin(0, 0.5)
      .setScale(1, scaleY);

    return this.add.container(x, y, [leftCap, middle, rightCap]);
  }
}
