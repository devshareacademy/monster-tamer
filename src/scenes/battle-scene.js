import { BATTLE_BACKGROUND_ASSET_KEYS } from '../assets/asset-keys.js';
import Phaser from '../lib/phaser.js';
import { PHASER_SCENE_LOG_STYLE } from '../utils/logging.js';
import { SCENE_KEYS } from './scene-keys.js';

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
    // render out the player and enemy health bars
    // render out the main info panel
    // render out the battle option panel
    // render out the attack option panel
  }
}
