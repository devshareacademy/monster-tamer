import Phaser from '../lib/phaser.js';

const ASSET_CUT_FRAMES = Object.freeze({
  TL: 'TL',
  TM: 'TM',
  TR: 'TR',
  ML: 'ML',
  MM: 'MM',
  MR: 'MR',
  BL: 'BL',
  BM: 'BM',
  BR: 'BR',
});

/**
 * @typedef NineSliceConfig
 * @type {object}
 * @property {number} cornerCutSize the width and height of the corner pieces that will be created from the image
 * @property {Phaser.Textures.TextureManager} textureManager the Phaser 3 Texture Manger instance that will be used for getting textures from
 * @property {string} assetKey the name of the asset to pull from the Phaser 3 Texture Manager
 */

export class NineSlice {
  /** @type {number} */
  #cornerCutSize;
  /** @type {string} */
  #assetKey;

  /**
   * @param {NineSliceConfig} config
   */
  constructor(config) {
    this.#cornerCutSize = config.cornerCutSize;
    this.#assetKey = config.assetKey;
    this.#createNineSliceTextures(config.textureManager, config.assetKey);
  }

  /**
   * Retrieves a texture from the Phaser 3 Texture Manager and adds nine new frames to the texture that represent the parts
   * of the image that will make up the nine slice cuts of the original image.
   * @param {Phaser.Textures.TextureManager} textureManager the Phaser 3 Texture Manger instance that will be used for getting textures from
   * @param {string} assetKey the name of the asset to pull from the Phaser 3 Texture Manager
   * @returns {void}
   */
  #createNineSliceTextures(textureManager, assetKey) {
    const methodName = 'createNineSliceTextures';

    const texture = textureManager.get(assetKey);
    if (texture.key === '__MISSING') {
      console.warn(`[${NineSlice.name}:${methodName}] the provided texture asset key was not found`);
      return;
    }

    // get the original frame so we can the image dimensions
    if (!texture.frames['__BASE']) {
      console.warn(`[${NineSlice.name}:${methodName}] the provided texture asset key does not have a base texture`);
      return;
    }

    // check to see if the texture already has more frames than the original base frame
    if (texture.getFrameNames(false).length !== 0) {
      console.debug(`[${NineSlice.name}:${methodName}] the provided texture asset key already has additional frames`);
      return;
    }

    /** @type {Phaser.Textures.Frame} */
    const baseFrame = texture.frames['__BASE'];
    console.log(baseFrame.width, baseFrame.height);

    // start in the top left corner for our first cut
    texture.add(ASSET_CUT_FRAMES.TL, 0, 0, 0, this.#cornerCutSize, this.#cornerCutSize);
    // for the middle, we need to calculate the width remaining after we take our two cuts
    texture.add(
      ASSET_CUT_FRAMES.TM,
      0,
      this.#cornerCutSize,
      0,
      baseFrame.width - this.#cornerCutSize * 2,
      this.#cornerCutSize
    );
    // for the top right side corner we just need to take the total width and remove the cut length
    texture.add(
      ASSET_CUT_FRAMES.TR,
      0,
      baseFrame.width - this.#cornerCutSize,
      0,
      this.#cornerCutSize,
      this.#cornerCutSize
    );

    // for the middle left, we take the overall image height and subtract the size of the two corner cuts to get new height
    texture.add(
      ASSET_CUT_FRAMES.ML,
      0,
      0,
      this.#cornerCutSize,
      this.#cornerCutSize,
      baseFrame.height - this.#cornerCutSize * 2
    );
    // for the middle, we need to take the overall image height and width, subtract the two corner cuts to get the new dimensions
    texture.add(
      ASSET_CUT_FRAMES.MM,
      0,
      this.#cornerCutSize,
      this.#cornerCutSize,
      baseFrame.width - this.#cornerCutSize * 2,
      baseFrame.height - this.#cornerCutSize * 2
    );
    // for the middle right, we need to do similar logic that was done for the middle left piece
    texture.add(
      ASSET_CUT_FRAMES.MR,
      0,
      baseFrame.width - this.#cornerCutSize,
      this.#cornerCutSize,
      this.#cornerCutSize,
      baseFrame.height - this.#cornerCutSize * 2
    );

    // for the bottom left, we take the overall image height and subtract the corner cut
    texture.add(
      ASSET_CUT_FRAMES.BL,
      0,
      0,
      baseFrame.height - this.#cornerCutSize,
      this.#cornerCutSize,
      this.#cornerCutSize
    );
    // for the middle and right, we do the same logic we did in th tm and tr frames, just at a lower y value
    texture.add(
      ASSET_CUT_FRAMES.BM,
      0,
      this.#cornerCutSize,
      baseFrame.height - this.#cornerCutSize,
      baseFrame.width - this.#cornerCutSize * 2,
      this.#cornerCutSize
    );
    texture.add(
      ASSET_CUT_FRAMES.BR,
      0,
      baseFrame.width - this.#cornerCutSize,
      baseFrame.height - this.#cornerCutSize,
      this.#cornerCutSize,
      this.#cornerCutSize
    );
  }

  /**
   * Uses the provided Phaser 3 Scene to create nine image game objects which use the nine slice image textures that were
   * created on this NineSlice instance. The objects are then positioned and aligned so that they form just one image that
   * is scaled properly. The new objects are returned in a Phaser 3 Container game object.
   * @param {Phaser.Scene} scene the Phaser 3 Scene that the image and container game objects will be added to
   * @param {number} targetWidth the width of the new nine slice image that the original image should be scaled to
   * @param {number} targetHeight the height of the new nine slice image that the original image should be scaled to
   * @returns {Phaser.GameObjects.Container}
   */
  createNineSliceContainer(scene, targetWidth, targetHeight) {
    const tl = scene.add.image(0, 0, this.#assetKey, ASSET_CUT_FRAMES.TL).setOrigin(0);
    const tm = scene.add.image(tl.displayWidth, 0, this.#assetKey, ASSET_CUT_FRAMES.TM).setOrigin(0);
    tm.displayWidth = targetWidth - this.#cornerCutSize * 2;
    const tr = scene.add.image(tl.displayWidth + tm.displayWidth, 0, this.#assetKey, ASSET_CUT_FRAMES.TR).setOrigin(0);

    const ml = scene.add.image(0, tl.displayHeight, this.#assetKey, ASSET_CUT_FRAMES.ML).setOrigin(0);
    ml.displayHeight = targetHeight - this.#cornerCutSize * 2;
    const mm = scene.add.image(ml.displayWidth, ml.y, this.#assetKey, ASSET_CUT_FRAMES.MM).setOrigin(0);
    mm.displayHeight = targetHeight - this.#cornerCutSize * 2;
    mm.displayWidth = targetWidth - this.#cornerCutSize * 2;
    const mr = scene.add
      .image(ml.displayWidth + mm.displayWidth, ml.y, this.#assetKey, ASSET_CUT_FRAMES.MR)
      .setOrigin(0);
    mr.displayHeight = mm.displayHeight;

    const bl = scene.add
      .image(0, tl.displayHeight + ml.displayHeight, this.#assetKey, ASSET_CUT_FRAMES.BL)
      .setOrigin(0);
    const bm = scene.add.image(bl.displayWidth, bl.y, this.#assetKey, ASSET_CUT_FRAMES.BM).setOrigin(0);
    bm.displayWidth = tm.displayWidth;
    const br = scene.add
      .image(bl.displayWidth + bm.displayWidth, bl.y, this.#assetKey, ASSET_CUT_FRAMES.BR)
      .setOrigin(0);

    // finally, create a container to group our new game objects together in
    return scene.add.container(0, 0, [tl, tm, tr, ml, mm, mr, bl, bm, br]);
  }
}
