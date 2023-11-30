import Phaser from '../lib/phaser.js';
import { SCENE_KEYS } from './scene-keys.js';
import { UI_ASSET_KEYS } from '../assets/asset-keys.js';
import { NineSlice } from '../utils/nine-slice.js';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';

/** @type {Phaser.Types.GameObjects.Text.TextStyle} */
const OPTIONS_TEXT_STYLE = {
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#FFFFFF',
  fontSize: '30px',
};

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
    this.add.text(width / 2, 40, 'Options', OPTIONS_TEXT_STYLE).setOrigin(0.5);
    const menuOptions = ['Text Speed', 'Battle Scene', 'Battle Style', 'Sound', 'Volume', 'Menu Color', 'Close'];
    const menuOptionPosition = {
      x: 25,
      yStart: 55,
      yIncrement: 55,
    };
    menuOptions.forEach((option, index) => {
      const x = menuOptionPosition.x;
      const y = menuOptionPosition.yStart + menuOptionPosition.yIncrement * index;
      const textGameObject = this.add.text(x, y, option, OPTIONS_TEXT_STYLE);
      this.#mainContainer.add(textGameObject);
    });

    // create text speed options

    // create battle scene options

    // create battle style options

    // create sound options

    // volume options

    // frame options

    // option details container
  }
}
