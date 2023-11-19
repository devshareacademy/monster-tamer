import Phaser from '../lib/phaser.js';
import { WORLD_ASSET_KEYS } from '../assets/asset-keys.js';
import { SCENE_KEYS } from './scene-keys.js';
import { Player } from '../world/characters/player.js';
import { Controls } from '../utils/controls.js';
import { DIRECTION } from '../common/direction.js';
import { TILED_COLLISION_LAYER_ALPHA, TILE_SIZE } from '../config.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import { getTargetPositionFromGameObjectPositionAndDirection } from '../utils/grid-utils.js';
import { CANNOT_READ_SIGN_TEXT, SAMPLE_TEXT } from '../utils/text-utils.js';
import { DialogUi } from '../world/dialog-ui.js';
import { NPC } from '../world/characters/npc.js';

/**
 * @typedef TiledObjectProperty
 * @type {object}
 * @property {string} name
 * @property {string} messages
 * @property {any} value
 */

const TILED_SIGN_PROPERTY = Object.freeze({
  MESSAGE: 'message',
});

const CUSTOM_TILED_TYPES = Object.freeze({
  NPC: 'npc',
  NPC_PATH: 'npc_path',
});

const TILED_NPC_PROPERTY = Object.freeze({
  IS_SPAWN_POINT: 'is_spawn_point',
  MOVEMENT_PATTERN: 'movement_pattern',
  MESSAGES: 'messages',
  FRAME: 'frame',
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
  /** @type {Phaser.Tilemaps.TilemapLayer} */
  #encounterLayer;
  /** @type {boolean} */
  #wildMonsterEncountered;
  /** @type {Phaser.Tilemaps.ObjectLayer} */
  #signLayer;
  /** @type {DialogUi} */
  #dialogUi;
  /** @type {NPC[]} */
  #npcs;

  constructor() {
    super({
      key: SCENE_KEYS.WORLD_SCENE,
    });
  }

  init() {
    console.log(`[${WorldScene.name}:init] invoked`);
    this.#wildMonsterEncountered = false;
  }

  create() {
    console.log(`[${WorldScene.name}:preload] invoked`);

    // update camera settings
    const x = 6 * TILE_SIZE;
    const y = 22 * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, MAX_WORLD_WIDTH, 2176);
    this.cameras.main.setZoom(0.8);
    this.cameras.main.centerOn(x, y);

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
    collisionLayer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2);

    // create interactive layer
    this.#signLayer = map.getObjectLayer('Sign');
    if (!this.#signLayer) {
      console.log(`[${WorldScene.name}:create] encountered error while creating sign layer using data from tiled`);
      return;
    }

    // create collision layer for encounters
    const encounterTiles = map.addTilesetImage('encounter', WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE);
    if (!encounterTiles) {
      console.log(`[${WorldScene.name}:create] encountered error while creating world data from tiled`);
      return;
    }
    this.#encounterLayer = map.createLayer('Encounter', encounterTiles, 0, 0);
    if (!this.#encounterLayer) {
      console.log(`[${WorldScene.name}:create] encountered error while creating encounter layer using data from tiled`);
      return;
    }
    this.#encounterLayer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2);

    this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_BACKGROUND, 0).setOrigin(0);

    // create npcs
    this.#createNPCs(map);

    // create player and have camera focus on the player
    this.#player = new Player({
      scene: this,
      position: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION),
      direction: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION),
      collisionLayer: collisionLayer,
      spriteGridMovementFinishedCallback: () => {
        this.#handlePlayerMovementUpdate();
      },
      otherCharactersToCheckForCollisionWith: this.#npcs,
    });
    this.cameras.main.startFollow(this.#player.sprite);

    // update our collisions with npcs
    this.#npcs.forEach((npc) => {
      npc.addCharacterToCheckForCollisionsWith(this.#player);
    });

    // create foreground for depth
    this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_FOREGROUND, 0).setOrigin(0);

    this.#controls = new Controls(this);

    // create dialog ui
    this.#dialogUi = new DialogUi(this, MAX_WORLD_WIDTH);

    this.cameras.main.fadeIn(1000, 0, 0, 0);
  }

  /**
   * @param {DOMHighResTimeStamp} time
   * @returns {void}
   */
  update(time) {
    if (this.#wildMonsterEncountered) {
      this.#player.update(time);
      return;
    }

    const selectedDirection = this.#controls.getDirectionKeyPressedDown();
    if (selectedDirection !== DIRECTION.NONE && !this.#isPlayerInputLocked()) {
      this.#player.moveCharacter(selectedDirection);
    }

    if (this.#controls.wasSpaceKeyPressed() && !this.#player.isMoving) {
      this.#handlePlayerInteraction();
    }

    this.#player.update(time);

    this.#npcs.forEach((npc) => {
      npc.update(time);
    });
  }

  #handlePlayerInteraction() {
    if (this.#dialogUi.isAnimationPlaying) {
      return;
    }

    if (this.#dialogUi.isVisible && !this.#dialogUi.moreMessagesToShow) {
      this.#dialogUi.hideDialogModal();
      return;
    }

    if (this.#dialogUi.isVisible && this.#dialogUi.moreMessagesToShow) {
      this.#dialogUi.showNextMessage();
      return;
    }

    // get players current direction and check 1 tile over in that direction to see if there is an object that can be interacted with
    const { x, y } = this.#player.sprite;
    const targetPosition = getTargetPositionFromGameObjectPositionAndDirection({ x, y }, this.#player.direction);

    // check for sign, and display appropriate message if player is not facing up
    const nearbySign = this.#signLayer.objects.find((object) => {
      if (!object.x || !object.y) {
        return false;
      }
      return object.x === targetPosition.x && object.y - TILE_SIZE === targetPosition.y;
    });

    if (nearbySign) {
      /** @type {TiledObjectProperty[]} */
      const props = nearbySign.properties;
      /** @type {string} */
      const msg = props.find((prop) => prop.name === TILED_SIGN_PROPERTY.MESSAGE)?.value;

      const usePlaceholderText = this.#player.direction !== DIRECTION.UP;
      let textToShow = CANNOT_READ_SIGN_TEXT;
      if (!usePlaceholderText) {
        textToShow = msg || SAMPLE_TEXT;
      }
      this.#dialogUi.showDialogModal([textToShow]);
      return;
    }

    const nearbyNpc = this.#npcs.find((npc) => {
      return npc.sprite.x === targetPosition.x && npc.sprite.y === targetPosition.y;
    });
    if (nearbyNpc) {
      nearbyNpc.facePlayer(this.#player.direction);
      nearbyNpc.isTalkingToPlayer = true;
      this.#dialogUi.showDialogModal(nearbyNpc.messages);
      return;
    }
  }

  #handlePlayerMovementUpdate() {
    // update player position on global data store
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
      x: this.#player.sprite.x,
      y: this.#player.sprite.y,
    });
    // update player direction on global data store
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION, this.#player.direction);

    if (!this.#encounterLayer) {
      return;
    }
    const isInEncounterZone =
      this.#encounterLayer.getTileAtWorldXY(this.#player.sprite.x, this.#player.sprite.y, true).index !== -1;
    if (!isInEncounterZone) {
      return;
    }

    console.log(`[${WorldScene.name}:handlePlayerMovementUpdate] player is in an encounter zone`);
    this.#wildMonsterEncountered = Math.random() < 0.2;
    if (this.#wildMonsterEncountered) {
      console.log(`[${WorldScene.name}:handlePlayerMovementUpdate] player encountered a wild monster`);
      // TODO: add in a custom animation that is similar to the old games
      this.cameras.main.fadeOut(2000);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start(SCENE_KEYS.BATTLE_SCENE);
      });
    }
  }

  #isPlayerInputLocked() {
    return this.#dialogUi.isVisible;
  }

  /**
   * @param {Phaser.Tilemaps.Tilemap} map
   * @returns {void}
   */
  #createNPCs(map) {
    this.#npcs = [];

    const npcLayers = map.getObjectLayerNames().filter((layerName) => layerName.includes('NPC'));
    npcLayers.forEach((layerName) => {
      const layer = map.getObjectLayer(layerName);
      const npcObject = layer.objects.find((obj) => {
        return obj.type === CUSTOM_TILED_TYPES.NPC;
      });
      if (!npcObject || npcObject.x === undefined || npcObject.y === undefined) {
        return;
      }

      /** @type {string} */
      const npcFrame =
        /** @type {TiledObjectProperty[]} */ (npcObject.properties).find(
          (property) => property.name === TILED_NPC_PROPERTY.FRAME
        )?.value || '0';
      /** @type {string} */
      const npcMessagesString =
        /** @type {TiledObjectProperty[]} */ (npcObject.properties).find(
          (property) => property.name === TILED_NPC_PROPERTY.MESSAGES
        )?.value || '';
      const npcMessages = npcMessagesString.split('::');

      // In Tiled, the x value is how far the object starts from the left, and the y is the bottom of tiled object that is being added
      const npc = new NPC({
        scene: this,
        position: new Phaser.Math.Vector2(npcObject.x, npcObject.y - TILE_SIZE),
        direction: DIRECTION.DOWN,
        frame: parseInt(npcFrame, 10),
        messages: npcMessages,
      });
      this.#npcs.push(npc);
    });
  }
}
