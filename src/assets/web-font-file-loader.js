import Phaser from '../lib/phaser.js';
import * as WebFontLoader from '../lib/webfontloader.js';

export class WebFontFileLoader extends Phaser.Loader.File {
  /** @type {string[]} */
  #fontNames;

  /**
   * @param {Phaser.Loader.LoaderPlugin} loader The Loader that is going to load this File.
   * @param {string[]} fontNames The list of font names that will be loaded by the WebFontLoader library.
   *                             The font names need to match the font-family name in the @font-face style declaration.
   */
  constructor(loader, fontNames) {
    super(loader, {
      type: 'webfont',
      key: fontNames.toString(),
    });

    this.#fontNames = fontNames;
  }

  load() {
    WebFontLoader.default.load({
      custom: {
        families: this.#fontNames,
      },
      active: () => {
        this.loader.nextFile(this, true);
      },
      inactive: () => {
        console.error(`Failed to load custom fonts ${JSON.stringify(this.#fontNames)}`);
        this.loader.nextFile(this, false);
      },
    });
  }
}
