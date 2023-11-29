import Phaser from '../lib/phaser.js';
import { SCENE_KEYS } from './scene-keys.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.TITLE_SCENE });
  }

  create() {
    console.log(`[${TitleScene.name}:create] invoked`);
  }
}
