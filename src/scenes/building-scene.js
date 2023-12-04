import { BUILDING_ASSET_KEYS, WORLD_ASSET_KEYS } from '../assets/asset-keys.js';
import Phaser from '../lib/phaser.js';
import { Controls } from '../utils/controls.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import { Player } from '../world/characters/player.js';
import { SCENE_KEYS } from './scene-keys.js';

/**
 * @typedef BuildingSceneData
 * @type {object}
 * @property {string} buildingAssetName
 */

export class BuildingScene extends Phaser.Scene {
  /** @type {Player} */
  #player;
  /** @type {Controls} */
  #controls;

  constructor() {
    super({
      key: SCENE_KEYS.BUILDING_SCENE,
    });
  }

  /**
   * @param {BuildingSceneData} data
   * @returns {void}
   */
  init(data) {
    console.log(`[${BuildingScene.name}:init] invoked, data provided: ${JSON.stringify(data)}`);
  }

  /**
   * @returns {void}
   */
  create() {
    console.log(`[${BuildingScene.name}:create] invoked`);

    // create background
    this.add.image(0, 0, BUILDING_ASSET_KEYS.BUILDING_1_BACKGROUND, 0).setOrigin(0);

    // create player and have camera focus on the player
    // this.#player = new Player({
    //   scene: this,
    //   position: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION),
    //   collisionLayer: collisionLayer,
    //   direction: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION),
    //   otherCharactersToCheckForCollisionWith: this.#npcs,
    //   spriteGridMovementFinishedCallback: () => {
    //     this.#handlePlayerMovementUpdate();
    //   },
    //   spriteChangedDirectionCallback: () => {
    //     this.#handlePlayerDirectionUpdate();
    //   },
    //   entranceLayer: this.#entranceLayer,
    //   enterBuildingCallback: (buildingName) => {
    //     this.#handlePlayerEnterBuilding(buildingName);
    //   },
    // });
    // this.cameras.main.startFollow(this.#player.sprite);

    this.#controls = new Controls(this);
  }
}
