import { BaseScene } from './base-scene';
import { SCENE_KEYS } from './scene-keys';

export class AudioManagerScene extends BaseScene {
  constructor() {
    super({
      key: SCENE_KEYS.AUDIO_MANAGER_SCENE,
    });
  }

  create() {
    super.create();

    /**
    const bgMusic = this.sound.add(AssetKeys.BGMusic, {
      loop: true,
      volume: 0.1,
    });
    bgMusic.play();
    */
  }
}
