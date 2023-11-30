import Phaser from '../lib/phaser.js';
import { SCENE_KEYS } from './scene-keys.js';

export class OptionsScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.OPTIONS_SCENE });
  }

  create() {
    console.log(`[${OptionsScene.name}:create] invoked`);

    // main options container

    // create main option sections

    // create text speed options

    // create battle scene options

    // create battle style options

    // create sound options

    // volume options

    // frame options

    // option details container
  }
}
