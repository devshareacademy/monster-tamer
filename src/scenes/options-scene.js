import Phaser from '../lib/phaser.js';
import { SCENE_KEYS } from './scene-keys.js';

export class OptionsScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.OPTIONS_SCENE });
  }

  create() {
    console.log(`[${OptionsScene.name}:create] invoked`);
  }
}
