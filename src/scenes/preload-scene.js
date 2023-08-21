import Phaser from '../lib/phaser.js';
import { PHASER_SCENE_LOG_STYLE } from '../utils/logging.js';
import { SCENE_KEYS } from './scene-keys.js';

/**
 * This scene is used for loading in all of the assets that we will use in our
 * game. This includes things like images, sprite sheets, audio, fonts, and
 * JSON data.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({
      key: SCENE_KEYS.PRELOAD_SCENE,
    });
  }

  preload() {
    console.log(
      `%c[${PreloadScene.name}:preload] invoked`,
      PHASER_SCENE_LOG_STYLE
    );
  }

  create() {
    console.log(
      `%c[${PreloadScene.name}:create] invoked`,
      PHASER_SCENE_LOG_STYLE
    );
    this.scene.start(SCENE_KEYS.BATTLE_SCENE);
  }
}
