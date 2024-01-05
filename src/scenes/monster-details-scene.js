import { SCENE_KEYS } from './scene-keys.js';
import { BaseScene } from './base-scene.js';

export class MonsterDetailsScene extends BaseScene {
  constructor() {
    super({ key: SCENE_KEYS.MONSTER_DETAILS_SCENE });
  }
}
