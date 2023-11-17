import Phaser from '../lib/phaser.js';
import { WORLD_ASSET_KEYS } from '../assets/asset-keys.js';
import { SCENE_KEYS } from './scene-keys.js';
import { Player } from '../world/characters/player.js';
import { Controls } from '../utils/controls.js';
import { DIRECTION } from '../common/direction.js';
import { TILED_COLLISION_LAYER_ALPHA, TILE_SIZE } from '../config.js';

/** @type {import('../types/typedef.js').Coordinate} */
const PLAYER_POSITION = Object.freeze({
  x: 6 * TILE_SIZE,
  y: 21 * TILE_SIZE,
});

/*
  Our scene will be 16 x 9 (1024 x 576 pixels)
  each grid size will be 64 x 64 pixels
*/

// this value comes from the width of the level background image we are using
// we set the max camera width to the size of our image in order to control what
// is visible to the player, since the phaser game world is infinite.
const MAX_WORLD_WIDTH = 1280;

export class WorldScene extends Phaser.Scene {
  /** @type {Player} */
  #player;
  /** @type {Controls} */
  #controls;

  constructor() {
    super({
      key: SCENE_KEYS.WORLD_SCENE,
    });
  }

  create() {
    console.log(`[${WorldScene.name}:preload] invoked`);

    // update camera settings
    const x = 6 * TILE_SIZE;
    const y = 22 * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, MAX_WORLD_WIDTH, 2176);
    this.cameras.main.setZoom(0.8);
    this.cameras.main.centerOn(x, y);

    this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_BACKGROUND, 0).setOrigin(0);

    // create map and collision layer
    const map = this.make.tilemap({ key: WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL });
    // The first parameter is the name of the tileset in Tiled and the second parameter is the key
    // of the tileset image used when loading the file in preload.
    const collisionTiles = map.addTilesetImage('collision', WORLD_ASSET_KEYS.WORLD_COLLISION);
    if (!collisionTiles) {
      console.log(`[${WorldScene.name}:create] encountered error while creating world data from tiled`);
      return;
    }
    const collisionLayer = map.createLayer('Collision', collisionTiles, 0, 0);
    if (!collisionLayer) {
      console.log(`[${WorldScene.name}:create] encountered error while creating collision layer using data from tiled`);
      return;
    }
    collisionLayer.setAlpha(TILED_COLLISION_LAYER_ALPHA);

    this.#player = new Player({
      scene: this,
      position: PLAYER_POSITION,
      direction: DIRECTION.DOWN,
    });
    this.cameras.main.startFollow(this.#player.sprite);

    this.#controls = new Controls(this);

    this.cameras.main.fadeIn(1000, 0, 0, 0);
  }

  /**
   * @param {DOMHighResTimeStamp} time
   * @returns {void}
   */
  update(time) {
    const selectedDirection = this.#controls.getDirectionKeyPressedDown();
    if (selectedDirection !== DIRECTION.NONE) {
      this.#player.moveCharacter(selectedDirection);
    }

    this.#player.update(time);
  }
}
