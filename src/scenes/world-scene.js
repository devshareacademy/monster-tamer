import Phaser from '../lib/phaser.js';
import { SCENE_KEYS } from './scene-keys.js';

export class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.WORLD_SCENE });
  }

  create() {
    console.log(`[${WorldScene.name}:create] invoked`);
  }
}
