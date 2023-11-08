import Phaser from '../lib/phaser.js';

/**
 * @typedef PhaserTextureFrame
 * @type {object}
 * @property {Phaser.Textures.Frame} __BASE
 */

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

// setup config for new custom nine slice objects
const CORNER_CUT = 32;

/**
 * @param {Phaser.Scene} scene
 * @param {string} assetKey
 * @returns {void}
 */
export function createNineSliceTextures(scene, assetKey) {
  const texture = scene.sys.textures.get(assetKey);
  if (texture.key === '__MISSING') {
    console.warn(`[createNineSliceTextures] the provided texture asset key was not found`);
    return;
  }

  // get the original frame so we can the image dimensions
  if (!texture.frames['__BASE']) {
    console.warn(`[createNineSliceTextures] the provided texture asset key does not have a base texture`);
    return;
  }

  /** @type {Phaser.Textures.Frame} */
  const baseFrame = texture.frames['__BASE'];

  // start in the top left corner for our first cut
  texture.add(ASSET_CUT_FRAMES.TL, 0, 0, 0, CORNER_CUT, CORNER_CUT);
  // for the middle, we need to calculate the width remaining after we take our two cuts
  texture.add(ASSET_CUT_FRAMES.TM, 0, CORNER_CUT, 0, baseFrame.width - CORNER_CUT * 2, CORNER_CUT);
  // for the top right side corner we just need to take the total width and remove the cut length
  texture.add(ASSET_CUT_FRAMES.TR, 0, baseFrame.width - CORNER_CUT, 0, CORNER_CUT, CORNER_CUT);

  // for the middle left, we take the overall image height and subtract the size of the two corner cuts to get new height
  texture.add(ASSET_CUT_FRAMES.ML, 0, 0, CORNER_CUT, CORNER_CUT, baseFrame.height - CORNER_CUT * 2);
  // for the middle, we need to take the overall image height and width, subtract the two corner cuts to get the new dimensions
  texture.add(
    ASSET_CUT_FRAMES.MM,
    0,
    CORNER_CUT,
    CORNER_CUT,
    baseFrame.width - CORNER_CUT * 2,
    baseFrame.height - CORNER_CUT * 2
  );
  // for the middle right, we need to do similar logic that was done for the middle left piece
  texture.add(
    ASSET_CUT_FRAMES.MR,
    0,
    baseFrame.width - CORNER_CUT,
    CORNER_CUT,
    CORNER_CUT,
    baseFrame.height - CORNER_CUT * 2
  );

  // for the bottom left, we take the overall image height and subtract the corner cut
  texture.add(ASSET_CUT_FRAMES.BL, 0, 0, baseFrame.height - CORNER_CUT, CORNER_CUT, CORNER_CUT);
  // for the middle and right, we do the same logic we did in th tm and tr frames, just at a lower y value
  texture.add(
    ASSET_CUT_FRAMES.BM,
    0,
    CORNER_CUT,
    baseFrame.height - CORNER_CUT,
    baseFrame.width - CORNER_CUT * 2,
    CORNER_CUT
  );
  texture.add(
    ASSET_CUT_FRAMES.BR,
    0,
    baseFrame.width - CORNER_CUT,
    baseFrame.height - CORNER_CUT,
    CORNER_CUT,
    CORNER_CUT
  );
}

/**
 * @param {Phaser.Scene} scene
 * @param {string} assetKey
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @returns {Phaser.GameObjects.Container}
 */
export function createNineSliceContainer(scene, assetKey, targetWidth, targetHeight) {
  const tl = scene.add.image(0, 0, assetKey, ASSET_CUT_FRAMES.TL).setOrigin(0);
  tl.setData({
    assetCutFrame: ASSET_CUT_FRAMES.TL,
  });

  const tm = scene.add.image(tl.displayWidth, 0, assetKey, ASSET_CUT_FRAMES.TM).setOrigin(0);
  tm.displayWidth = targetWidth - CORNER_CUT * 2;
  tm.setData({
    assetCutFrame: ASSET_CUT_FRAMES.TM,
  });

  const tr = scene.add.image(tl.displayWidth + tm.displayWidth, 0, assetKey, ASSET_CUT_FRAMES.TR).setOrigin(0);
  tr.setData({
    assetCutFrame: ASSET_CUT_FRAMES.TR,
  });

  const ml = scene.add.image(0, tl.displayHeight, assetKey, ASSET_CUT_FRAMES.ML).setOrigin(0);
  ml.displayHeight = targetHeight - CORNER_CUT * 2;
  ml.setData({
    assetCutFrame: ASSET_CUT_FRAMES.ML,
  });

  const mm = scene.add.image(ml.displayWidth, ml.y, assetKey, ASSET_CUT_FRAMES.MM).setOrigin(0);
  mm.displayHeight = targetHeight - CORNER_CUT * 2;
  mm.displayWidth = targetWidth - CORNER_CUT * 2;
  mm.setData({
    assetCutFrame: ASSET_CUT_FRAMES.MM,
  });

  const mr = scene.add.image(ml.displayWidth + mm.displayWidth, ml.y, assetKey, ASSET_CUT_FRAMES.MR).setOrigin(0);
  mr.displayHeight = mm.displayHeight;
  mr.setData({
    assetCutFrame: ASSET_CUT_FRAMES.MR,
  });

  const bl = scene.add.image(0, tl.displayHeight + ml.displayHeight, assetKey, ASSET_CUT_FRAMES.BL).setOrigin(0);
  bl.setData({
    assetCutFrame: ASSET_CUT_FRAMES.BL,
  });

  const bm = scene.add.image(bl.displayWidth, bl.y, assetKey, ASSET_CUT_FRAMES.BM).setOrigin(0);
  bm.displayWidth = tm.displayWidth;
  bm.setData({
    assetCutFrame: ASSET_CUT_FRAMES.BM,
  });

  const br = scene.add.image(bl.displayWidth + bm.displayWidth, bl.y, assetKey, ASSET_CUT_FRAMES.BR).setOrigin(0);
  br.setData({
    assetCutFrame: ASSET_CUT_FRAMES.BR,
  });

  // finally, create a container to group our new game objects together in
  const container = scene.add.container(0, 0, [tl, tm, tr, ml, mm, mr, bl, bm, br]);
  return container;
}

/**
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Container} container
 * @param {string} assetKey
 * @returns {void}
 */
export function updateNineSliceContainerTexture(scene, container, assetKey) {
  // validate we have the provided texture for the given asset key
  const texture = scene.sys.textures.get(assetKey);
  if (texture.key === '__MISSING') {
    console.warn(`[updateNineSliceContainerTexture] the provided texture asset key was not found`);
    return;
  }
  container.each((gameObject) => {
    /** @type {Phaser.GameObjects.Image} */
    const phaserImageGameObject = gameObject;
    phaserImageGameObject.setTexture(assetKey, phaserImageGameObject.getData('assetCutFrame'));
  });
}
