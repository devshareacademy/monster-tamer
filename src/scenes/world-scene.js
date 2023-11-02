import Phaser from '../lib/phaser.js';
import { SCENE_KEYS } from './scene-keys.js';
import { WORLD_ASSET_KEYS } from '../assets/asset-keys.js';

export class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.WORLD_SCENE });
  }

  create() {
    console.log(`[${WorldScene.name}:create] invoked`);

    this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_BACKGROUND, 0).setOrigin(0);
  }
}
