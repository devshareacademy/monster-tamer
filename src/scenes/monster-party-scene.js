import Phaser from '../lib/phaser.js';
import { BaseScene } from './base-scene.js';
import { SCENE_KEYS } from './scene-keys.js';

export class MonsterPartyScene extends BaseScene {
  constructor() {
    super({
      key: SCENE_KEYS.MONSTER_PARTY_SCENE,
    });
  }
}
