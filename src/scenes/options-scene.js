import Phaser from '../lib/phaser.js';
import { SCENE_KEYS } from './scene-keys.js';
import { UI_ASSET_KEYS } from '../assets/asset-keys.js';
import { NineSlice } from '../utils/nine-slice.js';

export class OptionsScene extends Phaser.Scene {
  /** @type {Phaser.GameObjects.Container} */
  #mainContainer;
  /** @type {NineSlice} */
  #nineSliceMainContainer;

  constructor() {
    super({ key: SCENE_KEYS.OPTIONS_SCENE });
  }

  init() {
    console.log(`[${OptionsScene.name}:init] invoked`);

    this.#nineSliceMainContainer = new NineSlice({
      cornerCutSize: 32,
      textureManager: this.sys.textures,
      assetKey: UI_ASSET_KEYS.MENU_BACKGROUND,
    });
  }

  create() {
    console.log(`[${OptionsScene.name}:create] invoked`);

    const { width, height } = this.scale;
    const optionMenuWidth = width - 200;

    // main options container
    this.#mainContainer = this.#nineSliceMainContainer.createNineSliceContainer(this, optionMenuWidth, 432);
    this.#mainContainer.setX(100).setY(20);

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
