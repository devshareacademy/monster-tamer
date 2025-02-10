import Phaser from '../lib/phaser.js';
import { AUDIO_ASSET_KEYS, WORLD_ASSET_KEYS } from '../assets/asset-keys.js';
import { SCENE_KEYS } from './scene-keys.js';
import { Player } from '../world/characters/player.js';
import { DIRECTION } from '../common/direction.js';
import { ENABLE_ZONE_DEBUGGING, TILED_COLLISION_LAYER_ALPHA, TILE_SIZE } from '../config.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import {
  getTargetDirectionFromGameObjectPosition,
  getTargetPathToGameObject,
  getTargetPositionFromGameObjectPositionAndDirection,
} from '../utils/grid-utils.js';
import { CANNOT_READ_SIGN_TEXT, SAMPLE_TEXT } from '../utils/text-utils.js';
import { NPC, NPC_MOVEMENT_PATTERN } from '../world/characters/npc.js';
import { WorldMenu } from '../world/world-menu.js';
import { BaseScene } from './base-scene.js';
import { DataUtils } from '../utils/data-utils.js';
import { playBackgroundMusic, playSoundFx } from '../utils/audio-utils.js';
import { weightedRandom } from '../utils/random.js';
import { Item } from '../world/item.js';
import { ENCOUNTER_TILE_TYPE, GAME_EVENT_TYPE, NPC_EVENT_TYPE } from '../types/typedef.js';
import { exhaustiveGuard } from '../utils/guard.js';
import { sleep } from '../utils/time-utils.js';
import { CutsceneScene } from './cutscene-scene.js';
import { DialogScene } from './dialog-scene.js';

/**
 * @typedef TiledObjectProperty
 * @type {object}
 * @property {string} name
 * @property {string} type
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
  MOVEMENT_PATTERN: 'movement_pattern',
  FRAME: 'frame',
  ID: 'id',
});

const TILED_ENCOUNTER_PROPERTY = Object.freeze({
  AREA: 'area',
  TILE_TYPE: 'tileType',
});

const TILED_ITEM_PROPERTY = Object.freeze({
  ITEM_ID: 'item_id',
  ID: 'id',
});

const TILED_AREA_METADATA_PROPERTY = Object.freeze({
  FAINT_LOCATION: 'faint_location',
  ID: 'id',
});

const TILED_EVENT_PROPERTY = Object.freeze({
  ID: 'id',
});

/**
 * @typedef WorldSceneData
 * @type {object}
 * @property {boolean} [isPlayerKnockedOut]
 * @property {string} [area]
 * @property {boolean} [isInterior]
 */

/*
  Our scene will be 16 x 9 (1024 x 576 pixels)
  each grid size will be 64 x 64 pixels
*/

export class WorldScene extends BaseScene {
  /** @type {Player} */
  #player;
  /** @type {Phaser.Tilemaps.TilemapLayer[]} */
  #encounterLayers;
  /** @type {boolean} */
  #wildMonsterEncountered;
  /** @type {Phaser.Tilemaps.ObjectLayer | undefined} */
  #signLayer;
  /** @type {DialogScene} */
  #dialogUi;
  /** @type {NPC[]} */
  #npcs;
  /** @type {NPC | undefined} */
  #npcPlayerIsInteractingWith;
  /** @type {WorldMenu} */
  #menu;
  /** @type {WorldSceneData} */
  #sceneData;
  /** @type {Item[]} */
  #items;
  /** @type {Phaser.Tilemaps.ObjectLayer | undefined} */
  #entranceLayer;
  /** @type {number} */
  #lastNpcEventHandledIndex;
  /** @type {boolean} */
  #isProcessingNpcEvent;
  /** @type {{[key: string]: Phaser.GameObjects.Zone}} */
  #eventZones;
  /** @type {{[key: string]: Phaser.GameObjects.Rectangle}} */
  #debugEventZoneObjects;
  /** @type {Phaser.Geom.Rectangle} */
  #rectangleForOverlapCheck1;
  /** @type {Phaser.Geom.Rectangle} */
  #rectangleForOverlapCheck2;
  /** @type {Phaser.Geom.Rectangle} */
  #rectangleOverlapResult;
  /** @type {Phaser.GameObjects.Graphics} */
  #gfx;
  /** @type {number | undefined} */
  #currentCutSceneId;
  /** @type {boolean} */
  #isProcessingCutSceneEvent;
  /** @type {number} */
  #lastCutSceneEventHandledIndex;
  /** @type {Phaser.GameObjects.Group} */
  #specialEncounterTileImageGameObjectGroup;
  /** @type {Phaser.Tilemaps.TilemapLayer | undefined} */
  #encounterZonePlayerIsEntering;

  constructor() {
    super({
      key: SCENE_KEYS.WORLD_SCENE,
    });
  }

  /**
   * @param {WorldSceneData} data
   * @returns {void}
   */
  init(data) {
    super.init(data);
    this.#sceneData = data;

    // handle when some of the fields for scene data are not populated, default to values provided, otherwise use safe defaults
    /** @type {string} */
    const area = this.#sceneData?.area || dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_LOCATION).area;
    let isInterior = this.#sceneData?.isInterior;
    if (isInterior === undefined) {
      isInterior = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_LOCATION).isInterior;
    }
    const isPlayerKnockedOut = this.#sceneData?.isPlayerKnockedOut || false;

    this.#sceneData = {
      area,
      isInterior,
      isPlayerKnockedOut,
    };

    // update player location, and map data if the player was knocked out in a battle
    if (this.#sceneData.isPlayerKnockedOut) {
      // get the nearest knocked out spawn location from the map meta data
      let map = this.make.tilemap({ key: `${this.#sceneData.area.toUpperCase()}_LEVEL` });
      const areaMetaDataProperties = map.getObjectLayer('Area-Metadata').objects[0].properties;
      const knockOutSpawnLocation = /** @type {TiledObjectProperty[]} */ (areaMetaDataProperties).find(
        (property) => property.name === TILED_AREA_METADATA_PROPERTY.FAINT_LOCATION
      )?.value;

      // check to see if the level data we need to load is different and load that map to get player spawn data
      if (knockOutSpawnLocation !== this.#sceneData.area) {
        this.#sceneData.area = knockOutSpawnLocation;
        map = this.make.tilemap({ key: `${this.#sceneData.area.toUpperCase()}_LEVEL` });
      }

      // set players spawn location to that map and finds the revive location based on that object
      const reviveLocation = map.getObjectLayer('Revive-Location').objects[0];
      dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
        x: reviveLocation.x,
        y: reviveLocation.y - TILE_SIZE,
      });
      dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION, DIRECTION.UP);
    }

    dataManager.store.set(
      DATA_MANAGER_STORE_KEYS.PLAYER_LOCATION,
      /** @type {import('../utils/data-manager.js').PlayerLocation} */ ({
        area: this.#sceneData.area,
        isInterior: this.#sceneData.isInterior,
      })
    );

    this.#wildMonsterEncountered = false;
    this.#npcPlayerIsInteractingWith = undefined;
    this.#items = [];
    this.#lastNpcEventHandledIndex = -1;
    this.#isProcessingNpcEvent = false;
    this.#encounterLayers = [];
    this.#signLayer = undefined;
    this.#entranceLayer = undefined;
    this.#eventZones = {};
    this.#debugEventZoneObjects = {};
    this.#rectangleForOverlapCheck1 = undefined;
    this.#rectangleForOverlapCheck2 = undefined;
    this.#rectangleOverlapResult = undefined;
    this.#gfx = undefined;
    this.#currentCutSceneId = undefined;
    this.#isProcessingCutSceneEvent = false;
    this.#lastCutSceneEventHandledIndex = -1;
    this.#specialEncounterTileImageGameObjectGroup = undefined;
    this.#encounterZonePlayerIsEntering = undefined;
  }

  /**
   * @returns {void}
   */
  create() {
    super.create();

    // create rectangles for checking for overlaps between game objects, added so we can recycle game objects
    this.#rectangleForOverlapCheck1 = new Phaser.Geom.Rectangle();
    this.#rectangleForOverlapCheck2 = new Phaser.Geom.Rectangle();
    this.#rectangleOverlapResult = new Phaser.Geom.Rectangle();

    // create map and collision layer
    const map = this.make.tilemap({ key: `${this.#sceneData.area.toUpperCase()}_LEVEL` });
    // The first parameter is the name of the tileset in Tiled and the second parameter is the key
    // of the tileset image used when loading the file in preload.
    const collisionTiles = map.addTilesetImage('collision', WORLD_ASSET_KEYS.WORLD_COLLISION);
    if (!collisionTiles) {
      console.log(`[${WorldScene.name}:create] encountered error while creating collision tiles from tiled`);
      return;
    }
    const collisionLayer = map.createLayer('Collision', collisionTiles, 0, 0);
    if (!collisionLayer) {
      console.log(`[${WorldScene.name}:create] encountered error while creating collision layer using data from tiled`);
      return;
    }
    collisionLayer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2);

    // create interactive layer
    const hasSignLayer = map.getObjectLayer('Sign') !== null;
    if (hasSignLayer) {
      this.#signLayer = map.getObjectLayer('Sign');
    }

    // create layer for scene transitions entrances
    const hasSceneTransitionLayer = map.getObjectLayer('Scene-Transitions') !== null;
    if (hasSceneTransitionLayer) {
      this.#entranceLayer = map.getObjectLayer('Scene-Transitions');
    }

    // create collision layers for encounters
    this.#createEncounterAreas(map);

    if (!this.#sceneData.isInterior) {
      this.cameras.main.setBounds(0, 0, 1280, 2176);
    }
    this.cameras.main.setZoom(0.8);
    this.add.image(0, 0, `${this.#sceneData.area.toUpperCase()}_BACKGROUND`, 0).setOrigin(0);

    // create items and collisions
    this.#createItems(map);

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
      spriteChangedDirectionCallback: () => {
        this.#handlePlayerDirectionUpdate();
      },
      otherCharactersToCheckForCollisionsWith: this.#npcs,
      objectsToCheckForCollisionsWith: this.#items,
      entranceLayer: this.#entranceLayer,
      enterEntranceCallback: (entranceName, entranceId, isBuildingEntrance) => {
        this.#handleEntranceEnteredCallback(entranceName, entranceId, isBuildingEntrance);
      },
      spriteGridMovementStartedCallback: (position) => {
        this.#handlePlayerMovementStarted(position);
      },
    });
    this.cameras.main.startFollow(this.#player.sprite);

    // update our collisions with npcs
    this.#npcs.forEach((npc) => {
      npc.addCharacterToCheckForCollisionsWith(this.#player);
    });

    // create foreground for depth
    this.add.image(0, 0, `${this.#sceneData.area.toUpperCase()}_FOREGROUND`, 0).setOrigin(0);

    // create menu
    this.#menu = new WorldMenu(this);

    // create event zones
    this.#createEventEncounterZones(map);

    if (ENABLE_ZONE_DEBUGGING) {
      // used for debugging the overlaps for event zones
      this.#gfx = this.add.graphics({ lineStyle: { width: 4, color: 0x00ffff } });
    }

    this.cameras.main.fadeIn(1000, 0, 0, 0, (camera, progress) => {
      if (progress === 1) {
        // if the player was knocked out, we want to lock input, heal player, and then have npc show message
        if (this.#sceneData.isPlayerKnockedOut) {
          this.#healPlayerParty();
          this.#dialogUi.showDialogModal([
            'It looks like your team put up quite a fight...',
            'I went ahead and healed them up for you.',
          ]);
        }
      }
    });
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.GAME_STARTED, true);

    // add audio
    playBackgroundMusic(this, AUDIO_ASSET_KEYS.MAIN);
    // add UI scene for cutscene and dialog
    this.scene.launch(SCENE_KEYS.CUTSCENE_SCENE);
    this.scene.launch(SCENE_KEYS.DIALOG_SCENE);
    this.#dialogUi = /** @type {DialogScene} */ (this.scene.get(SCENE_KEYS.DIALOG_SCENE));
    this.#specialEncounterTileImageGameObjectGroup = this.add.group({ classType: Phaser.GameObjects.Image });
  }

  /**
   * @param {DOMHighResTimeStamp} time
   * @returns {void}
   */
  update(time) {
    super.update(time);

    if (this.#wildMonsterEncountered) {
      this.#player.update(time);
      return;
    }

    const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();
    const selectedDirectionHeldDown = this._controls.getDirectionKeyPressedDown();
    const selectedDirectionPressedOnce = this._controls.getDirectionKeyJustPressed();

    if (this.#isProcessingCutSceneEvent) {
      this.#player.update(time);
      this.#npcs.forEach((npc) => {
        npc.update(time);
      });
      if (wasSpaceKeyPressed && this.#npcPlayerIsInteractingWith) {
        this.#handlePlayerInteraction();
      }
      return;
    }

    if (selectedDirectionHeldDown !== DIRECTION.NONE && !this.#isPlayerInputLocked()) {
      this.#player.moveCharacter(selectedDirectionHeldDown);
    }

    if (wasSpaceKeyPressed && !this.#player.isMoving && !this.#menu.isVisible) {
      this.#handlePlayerInteraction();
    }

    if (this._controls.wasEnterKeyPressed() && !this.#player.isMoving) {
      if (this.#dialogUi.isVisible || this.#isProcessingNpcEvent) {
        return;
      }

      if (this.#menu.isVisible) {
        this.#menu.hide();
        return;
      }

      this.#menu.show();
    }

    if (this.#menu.isVisible) {
      if (selectedDirectionPressedOnce !== DIRECTION.NONE) {
        this.#menu.handlePlayerInput(selectedDirectionPressedOnce);
      }

      if (wasSpaceKeyPressed) {
        this.#menu.handlePlayerInput('OK');

        if (this.#menu.selectedMenuOption === 'SAVE') {
          this.#menu.hide();
          dataManager.saveData();
          this.#dialogUi.showDialogModal(['Game progress has been saved']);
        }

        if (this.#menu.selectedMenuOption === 'MONSTERS') {
          // at start of the game, handle when we have no monsters in our party
          if (dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY).length === 0) {
            this.#dialogUi.showDialogModal(['You have no monsters in your party.']);
            this.#menu.hide();
            return;
          }

          // pause this scene and launch the monster party scene
          /** @type {import('./monster-party-scene.js').MonsterPartySceneData} */
          const sceneDataToPass = {
            previousSceneName: SCENE_KEYS.WORLD_SCENE,
          };
          this.scene.launch(SCENE_KEYS.MONSTER_PARTY_SCENE, sceneDataToPass);
          this.scene.pause(SCENE_KEYS.WORLD_SCENE);
        }

        if (this.#menu.selectedMenuOption === 'BAG') {
          // pause this scene and launch the inventory scene
          /** @type {import('./inventory-scene.js').InventorySceneData} */
          const sceneDataToPass = {
            previousSceneName: SCENE_KEYS.WORLD_SCENE,
          };
          this.scene.launch(SCENE_KEYS.INVENTORY_SCENE, sceneDataToPass);
          this.scene.pause(SCENE_KEYS.WORLD_SCENE);
        }

        if (this.#menu.selectedMenuOption === 'EXIT') {
          this.#menu.hide();
        }
      }

      if (this._controls.wasBackKeyPressed()) {
        this.#menu.hide();
      }
    }

    this.#player.update(time);

    this.#npcs.forEach((npc) => {
      npc.update(time);
    });
  }

  /**
   * @returns {void}
   */
  #handlePlayerInteraction() {
    if (this.#dialogUi.isAnimationPlaying) {
      return;
    }

    if (this.#dialogUi.isVisible && !this.#dialogUi.moreMessagesToShow) {
      this.#dialogUi.hideDialogModal();
      if (this.#currentCutSceneId !== undefined) {
        this.#isProcessingCutSceneEvent = false;
        this.#handleCutSceneInteraction();
      }
      if (this.#npcPlayerIsInteractingWith) {
        this.#handleNpcInteraction();
      }
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
    const nearbySign = this.#signLayer?.objects.find((object) => {
      if (!object.x || !object.y) {
        return false;
      }

      // In Tiled, the x value is how far the object starts from the left, and the y is the bottom of tiled object that is being added
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
      this.#npcPlayerIsInteractingWith = nearbyNpc;
      this.#handleNpcInteraction();
      return;
    }

    // check for a nearby item and display message about player finding the item
    let nearbyItemIndex;
    const nearbyItem = this.#items.find((item, index) => {
      if (item.position.x === targetPosition.x && item.position.y === targetPosition.y) {
        nearbyItemIndex = index;
        return true;
      }
      return false;
    });
    if (nearbyItem) {
      // add item to inventory and display message to player
      const item = DataUtils.getItem(this, nearbyItem.itemId);
      dataManager.addItem(item, 1);
      nearbyItem.gameObject.destroy();
      this.#items.splice(nearbyItemIndex, 1);
      dataManager.addItemPickedUp(nearbyItem.id);
      this.#dialogUi.showDialogModal([`You found a ${item.name}`]);
    }
  }

  /**
   * @returns {void}
   */
  #handlePlayerMovementUpdate() {
    // update player position on global data store
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
      x: this.#player.sprite.x,
      y: this.#player.sprite.y,
    });

    // check to see if the player encountered cut scene zone
    this.#player.sprite.getBounds(this.#rectangleForOverlapCheck1);
    for (const zone of Object.values(this.#eventZones)) {
      // get the bounds of the player and zone for checking for overlap
      zone.getBounds(this.#rectangleForOverlapCheck2);

      // reset rectangle overlap size, needed since method below will
      // return the original rectangle unmodified if a previous match
      // was found.
      this.#rectangleOverlapResult.setSize(0, 0);
      Phaser.Geom.Intersects.GetRectangleIntersection(
        this.#rectangleForOverlapCheck1,
        this.#rectangleForOverlapCheck2,
        this.#rectangleOverlapResult
      );

      if (ENABLE_ZONE_DEBUGGING) {
        // for debugging the overlap checks for the events
        this.#gfx.clear();
        this.#gfx.strokeRectShape(this.#rectangleOverlapResult);
      }

      const isOverlapping =
        this.#rectangleOverlapResult.width >= TILE_SIZE - 10 && this.#rectangleOverlapResult.height >= TILE_SIZE - 10;

      if (isOverlapping) {
        const eventId = parseInt(zone.name, 10);
        const eventData = DataUtils.getEventData(this, eventId);
        const currentGameFlags = dataManager.getFlags();
        const eventRequirementsMet = eventData.requires.every((flag) => {
          return currentGameFlags.has(flag);
        });
        if (eventRequirementsMet) {
          this.#currentCutSceneId = parseInt(zone.name, 10);
          this.#startCutScene();
          break;
        }
      }
    }
    if (this.#currentCutSceneId !== undefined) {
      return;
    }
    if (this.#encounterLayers.length === 0) {
      return;
    }
    this.#handlePlayerMovementInEncounterZone();
  }

  /**
   * @returns {void}
   */
  #handlePlayerMovementInEncounterZone() {
    // cleanup any special tiles that are not at the players current position
    this.#specialEncounterTileImageGameObjectGroup
      .getChildren()
      .forEach((/** @type {Phaser.GameObjects.Image} */ child) => {
        if (!child.active) {
          return;
        }
        if (child.x === this.#player.sprite.x && child.y === this.#player.sprite.y) {
          child.visible = true;
          return;
        }
        child.active = false;
        child.visible = false;
      });
    if (this.#encounterZonePlayerIsEntering === undefined) {
      return;
    }
    console.log(`[${WorldScene.name}:handlePlayerMovementInEncounterZone] player is in an encounter zone`);

    this.#wildMonsterEncountered = Math.random() < 0.2;
    if (this.#wildMonsterEncountered) {
      const encounterAreaId = /** @type {TiledObjectProperty[]} */ (
        this.#encounterZonePlayerIsEntering.layer.properties
      ).find((property) => property.name === TILED_ENCOUNTER_PROPERTY.AREA).value;
      const possibleMonsters = DataUtils.getEncounterAreaDetails(this, encounterAreaId);
      const randomMonsterId = weightedRandom(possibleMonsters);

      console.log(
        `[${WorldScene.name}:handlePlayerMovementUpdate] player encountered a wild monster in area ${encounterAreaId} and monster id has been picked randomly ${randomMonsterId}`
      );
      this.cameras.main.fadeOut(2000);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        /** @type {import('./battle-scene.js').BattleSceneData} */
        const dataToPass = {
          enemyMonsters: [DataUtils.getMonsterById(this, randomMonsterId)],
          playerMonsters: dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY),
        };

        this.scene.start(SCENE_KEYS.BATTLE_SCENE, dataToPass);
      });
    }
  }

  /**
   * @returns {boolean}
   */
  #isPlayerInputLocked() {
    return (
      this._controls.isInputLocked ||
      this.#dialogUi.isVisible ||
      this.#menu.isVisible ||
      this.#isProcessingNpcEvent ||
      this.#currentCutSceneId !== undefined
    );
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

      // get the path objects for this npc
      const pathObjects = layer.objects.filter((obj) => {
        return obj.type === CUSTOM_TILED_TYPES.NPC_PATH;
      });
      /** @type {import('../world/characters/npc.js').NPCPath} */
      const npcPath = {
        0: { x: npcObject.x, y: npcObject.y - TILE_SIZE },
      };
      pathObjects.forEach((obj) => {
        if (obj.x === undefined || obj.y === undefined) {
          return;
        }
        npcPath[parseInt(obj.name, 10)] = { x: obj.x, y: obj.y - TILE_SIZE };
      });

      /** @type {import('../world/characters/npc.js').NpcMovementPattern} */
      const npcMovement =
        /** @type {TiledObjectProperty[]} */ (npcObject.properties).find(
          (property) => property.name === TILED_NPC_PROPERTY.MOVEMENT_PATTERN
        )?.value || 'IDLE';

      /** @type {number} */
      const npcId = /** @type {TiledObjectProperty[]} */ (npcObject.properties).find(
        (property) => property.name === TILED_NPC_PROPERTY.ID
      )?.value;
      const npcDetails = DataUtils.getNpcData(this, npcId);

      // In Tiled, the x value is how far the object starts from the left, and the y is the bottom of tiled object that is being added
      const npc = new NPC({
        scene: this,
        position: { x: npcObject.x, y: npcObject.y - TILE_SIZE },
        direction: DIRECTION.DOWN,
        frame: npcDetails.frame,
        npcPath,
        movementPattern: npcMovement,
        events: npcDetails.events,
        animationKeyPrefix: npcDetails.animationKeyPrefix,
        id: npcId,
      });
      this.#npcs.push(npc);
    });
  }

  /**
   * @returns {void}
   */
  #handlePlayerDirectionUpdate() {
    // update player direction on global data store
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION, this.#player.direction);
  }

  /**
   * @returns {void}
   */
  #healPlayerParty() {
    // heal all monsters in party
    /** @type {import('../types/typedef.js').Monster[]} */
    const monsters = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY);
    monsters.forEach((monster) => {
      monster.currentHp = monster.maxHp;
    });
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY, monsters);
  }

  /**
   * @param {Phaser.Tilemaps.Tilemap} map
   * @returns {void}
   */
  #createItems(map) {
    const itemObjectLayer = map.getObjectLayer('Item');
    if (!itemObjectLayer) {
      return;
    }
    const items = itemObjectLayer.objects;
    const validItems = items.filter((item) => {
      return item.x !== undefined && item.y !== undefined;
    });

    /** @type {number[]} */
    const itemsPickedUp = dataManager.store.get(DATA_MANAGER_STORE_KEYS.ITEMS_PICKED_UP) || [];

    for (const tiledItem of validItems) {
      /** @type {number} */
      const itemId = /** @type {TiledObjectProperty[]} */ (tiledItem.properties).find(
        (property) => property.name === TILED_ITEM_PROPERTY.ITEM_ID
      )?.value;

      /** @type {number} */
      const id = /** @type {TiledObjectProperty[]} */ (tiledItem.properties).find(
        (property) => property.name === TILED_ITEM_PROPERTY.ID
      )?.value;

      if (itemsPickedUp.includes(id)) {
        continue;
      }

      // create object
      const item = new Item({
        scene: this,
        position: {
          x: tiledItem.x,
          y: tiledItem.y - TILE_SIZE,
        },
        itemId,
        id,
      });
      this.#items.push(item);
    }
  }

  /**
   * @param {string} entranceName
   * @param {string} entranceId
   * @param {boolean} isBuildingEntrance
   * @returns {void}
   */
  #handleEntranceEnteredCallback(entranceName, entranceId, isBuildingEntrance) {
    this._controls.lockInput = true;

    // update player position to match the new entrance data
    // create tilemap using the provided entrance data
    const map = this.make.tilemap({ key: `${entranceName.toUpperCase()}_LEVEL` });
    // get the position of the entrance object using the entrance id
    const entranceObjectLayer = map.getObjectLayer('Scene-Transitions');

    const entranceObject = entranceObjectLayer.objects.find((object) => {
      const tempEntranceName = object.properties.find((property) => property.name === 'connects_to').value;
      const tempEntranceId = object.properties.find((property) => property.name === 'entrance_id').value;

      return tempEntranceName === this.#sceneData.area && tempEntranceId === entranceId;
    });
    // create position player will be placed at and update based on players facing direction
    let x = entranceObject.x;
    let y = entranceObject.y - TILE_SIZE;
    if (this.#player.direction === DIRECTION.UP) {
      y -= TILE_SIZE;
    }
    if (this.#player.direction === DIRECTION.DOWN) {
      y += TILE_SIZE;
    }

    this.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
      if (progress === 1) {
        dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
          x,
          y,
        });

        /** @type {WorldSceneData} */
        const dataToPass = {
          area: entranceName,
          isInterior: isBuildingEntrance,
        };
        this.scene.start(SCENE_KEYS.WORLD_SCENE, dataToPass);
      }
    });
  }

  /**
   * @returns {void}
   */
  #handleNpcInteraction() {
    if (this.#isProcessingNpcEvent) {
      return;
    }

    // check to see if the npc has any events associated with them
    const isMoreEventsToProcess = this.#npcPlayerIsInteractingWith.events.length - 1 !== this.#lastNpcEventHandledIndex;

    if (!isMoreEventsToProcess) {
      this.#npcPlayerIsInteractingWith.isTalkingToPlayer = false;
      this.#npcPlayerIsInteractingWith = undefined;
      this.#lastNpcEventHandledIndex = -1;
      this.#isProcessingNpcEvent = false;
      return;
    }

    // get the next event from the queue and process for this npc
    this.#lastNpcEventHandledIndex += 1;
    const eventToHandle = this.#npcPlayerIsInteractingWith.events[this.#lastNpcEventHandledIndex];
    const eventType = eventToHandle.type;

    // check to see if this event should be handled based on story flags
    const currentGameFlags = dataManager.getFlags();
    const eventRequirementsMet = eventToHandle.requires.every((flag) => {
      return currentGameFlags.has(flag);
    });
    if (!eventRequirementsMet) {
      // jump to next event
      this.#handleNpcInteraction();
      return;
    }

    switch (eventType) {
      case NPC_EVENT_TYPE.MESSAGE:
        this.#dialogUi.showDialogModal(eventToHandle.data.messages);
        break;
      case NPC_EVENT_TYPE.HEAL:
        this.#isProcessingNpcEvent = true;
        this.#healPlayerParty();
        this.#isProcessingNpcEvent = false;
        this.#handleNpcInteraction();
        break;
      case NPC_EVENT_TYPE.SCENE_FADE_IN_AND_OUT:
        this.#isProcessingNpcEvent = true;
        // lock input, and wait for scene to fade in and out
        this.cameras.main.fadeOut(eventToHandle.data.fadeOutDuration, 0, 0, 0, (fadeOutCamera, fadeOutProgress) => {
          if (fadeOutProgress !== 1) {
            return;
          }
          this.time.delayedCall(eventToHandle.data.waitDuration, () => {
            this.cameras.main.fadeIn(eventToHandle.data.fadeInDuration, 0, 0, 0, (fadeInCamera, fadeInProgress) => {
              if (fadeInProgress !== 1) {
                return;
              }
              this.#isProcessingNpcEvent = false;
              this.#handleNpcInteraction();
            });
          });
        });
        // TODO: play audio cue
        break;
      default:
        exhaustiveGuard(eventType);
    }
  }

  /**
   * Creates the Phaser Zone game objects based on the `Events` tilemap data from the Tiled Map.
   * These game objects are used for creating the various in game events and cut scenes for the game.
   * The Zone game objects allow for us to check for overlaps between the player and the area that
   * is defined in the map data.
   *
   * @param {Phaser.Tilemaps.Tilemap} map
   * @returns {void}
   */
  #createEventEncounterZones(map) {
    const eventObjectLayer = map.getObjectLayer('Events');
    if (!eventObjectLayer) {
      return;
    }
    const events = eventObjectLayer.objects;
    const validEvents = events.filter((event) => {
      return event.x !== undefined && event.y !== undefined;
    });

    /** @type {string[]} */
    const viewedEvents = dataManager.store.get(DATA_MANAGER_STORE_KEYS.VIEWED_EVENTS);

    for (const tiledEvent of validEvents) {
      /** @type {string} */
      const eventId = /** @type {TiledObjectProperty[]} */ (tiledEvent.properties).find(
        (property) => property.name === TILED_EVENT_PROPERTY.ID
      )?.value;

      if (viewedEvents.includes(eventId)) {
        continue;
      }

      const eventZone = this.add
        .zone(tiledEvent.x, tiledEvent.y - TILE_SIZE * 2, tiledEvent.width, tiledEvent.height)
        .setOrigin(0)
        .setName(eventId);
      this.#eventZones[eventId] = eventZone;

      if (ENABLE_ZONE_DEBUGGING) {
        const debugZoneRectangle = this.add
          .rectangle(eventZone.x, eventZone.y, eventZone.width, eventZone.height, 0xff0000, 0.5)
          .setOrigin(0);
        this.#debugEventZoneObjects[eventId] = debugZoneRectangle;
      }
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async #startCutScene() {
    this.#isProcessingCutSceneEvent = true;
    await /** @type {CutsceneScene} */ (this.scene.get(SCENE_KEYS.CUTSCENE_SCENE)).startCutScene();
    await sleep(500, this);
    this.#isProcessingCutSceneEvent = false;
    this.#handleCutSceneInteraction();
  }

  /**
   * @returns {Promise<void>}
   */
  async #handleCutSceneInteraction() {
    if (this.#isProcessingCutSceneEvent) {
      return;
    }
    if (this.#currentCutSceneId === undefined) {
      return;
    }

    const eventsToProcess = DataUtils.getEventData(this, this.#currentCutSceneId);

    // check to see if the cut scene has any more events to be processed
    const isMoreEventsToProcess = eventsToProcess.events.length - 1 !== this.#lastCutSceneEventHandledIndex;
    if (!isMoreEventsToProcess) {
      // once we are done processing the events for the cutscene, we need to do the following:
      //   1. update our data manager to show we watched the event
      //   2. cleanup zone game object used for the event and overlap detection
      //   3. reset our current cut scene property
      //   4. remove the cut scene bars from the scene
      this.#lastCutSceneEventHandledIndex = -1;
      this.#isProcessingCutSceneEvent = false;
      dataManager.viewedEvent(this.#currentCutSceneId);
      this.#eventZones[this.#currentCutSceneId].destroy();
      delete this.#eventZones[this.#currentCutSceneId];
      if (ENABLE_ZONE_DEBUGGING) {
        this.#gfx.clear();
        this.#debugEventZoneObjects[this.#currentCutSceneId].destroy();
        delete this.#debugEventZoneObjects[this.#currentCutSceneId];
      }
      this.#currentCutSceneId = undefined;

      await /** @type {CutsceneScene} */ (this.scene.get(SCENE_KEYS.CUTSCENE_SCENE)).endCutScene();
      await sleep(500, this);
      return;
    }

    // get the next event from the queue and process for this npc
    this.#lastCutSceneEventHandledIndex += 1;
    const eventToHandle = eventsToProcess.events[this.#lastCutSceneEventHandledIndex];
    const eventType = eventToHandle.type;

    this.#isProcessingCutSceneEvent = true;
    switch (eventType) {
      case GAME_EVENT_TYPE.ADD_NPC:
        this.#createNpcForCutScene(eventToHandle);
        break;
      case GAME_EVENT_TYPE.MOVE_TO_PLAYER:
        this.#moveNpcToPlayer(eventToHandle);
        break;
      case GAME_EVENT_TYPE.RETRACE_PATH:
        this.#haveNpcRetracePath(eventToHandle);
        break;
      case GAME_EVENT_TYPE.REMOVE_NPC:
        this.#removeNpcForCutScene(eventToHandle);
        break;
      case GAME_EVENT_TYPE.TALK_TO_PLAYER:
        this.#haveNpcTalkToPlayer(eventToHandle);
        break;
      case GAME_EVENT_TYPE.GIVE_MONSTER:
        this.#addMonsterFromNpc(eventToHandle);
        break;
      case GAME_EVENT_TYPE.ADD_FLAG:
        this.#addGameFlag(eventToHandle);
        break;
      case GAME_EVENT_TYPE.REMOVE_FLAG:
        this.#removeGameFlag(eventToHandle);
        break;
      default:
        exhaustiveGuard(eventType);
    }
  }

  /**
   * @param {import('../types/typedef.js').GameEventAddNpc} gameEvent
   * @returns {void}
   */
  #createNpcForCutScene(gameEvent) {
    const npc = new NPC({
      scene: this,
      position: { x: gameEvent.data.x * TILE_SIZE, y: gameEvent.data.y * TILE_SIZE },
      direction: gameEvent.data.direction,
      frame: gameEvent.data.frame,
      npcPath: {
        0: { x: gameEvent.data.x * TILE_SIZE, y: gameEvent.data.y * TILE_SIZE },
      },
      movementPattern: NPC_MOVEMENT_PATTERN.IDLE,
      events: [],
      animationKeyPrefix: gameEvent.data.animationKeyPrefix,
      id: gameEvent.data.id,
    });
    this.#npcs.push(npc);
    npc.addCharacterToCheckForCollisionsWith(this.#player);

    this.#isProcessingCutSceneEvent = false;
    this.#handleCutSceneInteraction();
  }

  /**
   * @param {import('../types/typedef.js').GameEventMoveToPlayer} gameEvent
   * @returns {void}
   */
  #moveNpcToPlayer(gameEvent) {
    const targetNpc = this.#npcs.find((npc) => npc.id === gameEvent.data.id);
    if (targetNpc === undefined) {
      this.#isProcessingCutSceneEvent = false;
      this.#handleCutSceneInteraction();
      return;
    }

    // determine direction to move based on distance from player
    const targetPath = getTargetPathToGameObject(targetNpc.sprite, this.#player.sprite);
    const pathToFollow = targetPath.pathToFollow.splice(0, targetPath.pathToFollow.length - 1);

    // if npc is already next to player, just update directions
    if (pathToFollow.length === 0) {
      this.#player.moveCharacter(getTargetDirectionFromGameObjectPosition(this.#player.sprite, targetNpc.sprite));
      targetNpc.facePlayer(this.#player.direction);
      this.#isProcessingCutSceneEvent = false;
      this.#handleCutSceneInteraction();
      return;
    }

    // move npc according to the path
    /** @type {import('../world/characters/npc.js').NPCPath} */
    const npcPath = {
      0: { x: targetNpc.sprite.x, y: targetNpc.sprite.y },
    };
    pathToFollow.forEach((coordinate, index) => {
      npcPath[index + 1] = coordinate;
    });

    targetNpc.finishedMovementCallback = () => {
      if (
        pathToFollow[pathToFollow.length - 1].x === targetNpc.sprite.x &&
        pathToFollow[pathToFollow.length - 1].y === targetNpc.sprite.y
      ) {
        this.#player.moveCharacter(getTargetDirectionFromGameObjectPosition(this.#player.sprite, targetNpc.sprite));
        targetNpc.facePlayer(this.#player.direction);
        this.time.delayedCall(500, () => {
          this.#isProcessingCutSceneEvent = false;
          this.#handleCutSceneInteraction();
        });
      }
    };
    targetNpc.npcMovementPattern = NPC_MOVEMENT_PATTERN.SET_PATH;
    targetNpc.npcPath = npcPath;
    targetNpc.resetMovementTime();
  }

  /**
   * @param {import('../types/typedef.js').GameEventRetracePath} gameEvent
   * @returns {void}
   */
  #haveNpcRetracePath(gameEvent) {
    const targetNpc = this.#npcs.find((npc) => npc.id === gameEvent.data.id);
    if (targetNpc === undefined) {
      this.#isProcessingCutSceneEvent = false;
      this.#handleCutSceneInteraction();
      return;
    }

    // have npc retrace their steps by reversing the existing npc path
    /** @type {import('../world/characters/npc.js').NPCPath} */
    const updatedPath = {};
    const pathKeys = Object.keys(targetNpc.npcPath).reverse();

    pathKeys.forEach((pathKey, index) => {
      updatedPath[index] = targetNpc.npcPath[pathKey];
    });

    // if npc is already next to player, there will be only 1 position in the npc path
    // when this happens, we need to just updates the npcs direction
    if (pathKeys.length === 1) {
      targetNpc.facePlayer(gameEvent.data.direction);
      this.time.delayedCall(500, () => {
        this.#isProcessingCutSceneEvent = false;
        this.#handleCutSceneInteraction();
      });
      return;
    }

    targetNpc.finishedMovementCallback = () => {
      if (
        updatedPath[pathKeys.length - 1].x === targetNpc.sprite.x &&
        updatedPath[pathKeys.length - 1].y === targetNpc.sprite.y
      ) {
        this.time.delayedCall(500, () => {
          this.#isProcessingCutSceneEvent = false;
          this.#handleCutSceneInteraction();
        });
      }
    };

    targetNpc.npcMovementPattern = NPC_MOVEMENT_PATTERN.SET_PATH;
    targetNpc.npcPath = updatedPath;
    targetNpc.resetMovementTime();
  }

  /**
   * @param {import('../types/typedef.js').GameEventRemoveNpc} gameEvent
   * @returns {void}
   */
  #removeNpcForCutScene(gameEvent) {
    // once we are done with an npc for a cutscene, we can remove that npc
    // from our npc array and then start the cleanup process of destroying the game object
    const npcToRemoveIndex = this.#npcs.findIndex((npc) => npc.id === gameEvent.data.id);
    /** @type {NPC | undefined} */
    let npcToRemove;
    if (npcToRemoveIndex !== -1) {
      npcToRemove = this.#npcs.splice(npcToRemoveIndex)[0];
    }
    this.time.delayedCall(100, () => {
      if (npcToRemove !== undefined) {
        npcToRemove.sprite.destroy();
      }
      this.#isProcessingCutSceneEvent = false;
      this.#handleCutSceneInteraction();
    });
  }

  /**
   * @param {import('../types/typedef.js').GameEventTalkToPlayer} gameEvent
   * @returns {void}
   */
  #haveNpcTalkToPlayer(gameEvent) {
    const targetNpc = this.#npcs.find((npc) => npc.id === gameEvent.data.id);
    if (targetNpc === undefined) {
      this.#isProcessingCutSceneEvent = false;
      this.#handleCutSceneInteraction();
      return;
    }

    targetNpc.isTalkingToPlayer = true;
    this.#npcPlayerIsInteractingWith = targetNpc;
    this.#dialogUi.showDialogModal(gameEvent.data.messages);
  }

  /**
   * @param {import('../types/typedef.js').GameEventGiveMonster} gameEvent
   * @returns {void}
   */
  #addMonsterFromNpc(gameEvent) {
    // TODO: add check to see if party is full and do something with 7th monster that is being added
    /** @type {import('../types/typedef.js').Monster[]} */
    const monstersInParty = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY);
    const newMonster = DataUtils.getMonsterById(this, gameEvent.data.id);
    monstersInParty.push(newMonster);
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY, monstersInParty);
    this.#isProcessingCutSceneEvent = false;
    this.#handleCutSceneInteraction();
  }

  /**
   * @param {import('../types/typedef.js').GameEventAddFlag} gameEvent
   * @returns {void}
   */
  #addGameFlag(gameEvent) {
    dataManager.addFlag(gameEvent.data.flag);
    this.#isProcessingCutSceneEvent = false;
    this.#handleCutSceneInteraction();
  }

  /**
   * @param {import('../types/typedef.js').GameEventRemoveFlag} gameEvent
   * @returns {void}
   */
  #removeGameFlag(gameEvent) {
    dataManager.removeFlag(gameEvent.data.flag);
    this.#isProcessingCutSceneEvent = false;
    this.#handleCutSceneInteraction();
  }

  /**
   * @param {Phaser.Tilemaps.Tilemap} map
   * @returns {void}
   */
  #createEncounterAreas(map) {
    const encounterLayers = map.getTileLayerNames().filter((layerName) => layerName.includes('Encounter'));
    if (encounterLayers.length > 0) {
      const encounterTiles = map.addTilesetImage('encounter', WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE);
      if (!encounterTiles) {
        console.log(
          `[${WorldScene.name}:createEncounterAreas] encountered error while creating encounter tiles from tiled`
        );
        return;
      }

      encounterLayers.forEach((layerName) => {
        const layer = map.createLayer(layerName, encounterTiles, 0, 0);
        layer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2);
        this.#encounterLayers.push(layer);
      });
    }
  }

  /**
   * This method is invoked any time the player is about to start moving between grid spaces.
   * Before the player moves, check to see they will be moving into an encounter zone, and store the result.
   * We will use this result after the player finishes moving to see if there should be an encounter.
   * @param {import('../types/typedef.js').Coordinate} position
   * @returns {void}
   */
  #handlePlayerMovementStarted(position) {
    this.#encounterZonePlayerIsEntering = undefined;

    /** @type {Phaser.Tilemaps.Tile} */
    let encounterTile;
    this.#encounterLayers.some((encounterLayer) => {
      encounterTile = encounterLayer.getTileAtWorldXY(position.x, position.y, true);
      if (encounterTile.index === -1) {
        return false;
      }
      this.#encounterZonePlayerIsEntering = encounterLayer;
      return true;
    });

    if (this.#encounterZonePlayerIsEntering === undefined) {
      if (this.#player.direction === DIRECTION.DOWN) {
        // if player is moving in the down direction, hide current tile so player does not move under it
        this.#hideSpecialEncounterTiles();
      }
      return;
    }

    console.log(`[${WorldScene.name}:handlePlayerMovementStarted] player is moving to an encounter zone`);
    // check the tile type for the encounter layer the player is moving through and play related effects
    this.#handleEncounterTileTypeEffects(this.#encounterZonePlayerIsEntering, encounterTile, this.#player.direction);
  }

  /**
   * Plays the associated special effects when player is about to move through a particular tile type.
   * Example, when moving through the grass, we play a sound effect and show an additional
   * game object to make it look like the player is moving through the grass.
   *
   * @param {Phaser.Tilemaps.TilemapLayer} encounterLayer
   * @param {Phaser.Tilemaps.Tile} encounterTile
   * @param {import('../common/direction.js').Direction} playerDirection
   * @returns {void}
   */
  #handleEncounterTileTypeEffects(encounterLayer, encounterTile, playerDirection) {
    // check the tile type for the encounter layer the player is moving through and play related effects
    /** @type {import('../types/typedef.js').EncounterTileType} */
    const encounterTileType = /** @type {TiledObjectProperty[]} */ (encounterLayer.layer.properties).find(
      (property) => property.name === TILED_ENCOUNTER_PROPERTY.TILE_TYPE
    ).value;

    switch (encounterTileType) {
      case ENCOUNTER_TILE_TYPE.GRASS:
        // create grass sprite for when player moves through grass
        /** @type {Phaser.GameObjects.Image} */
        const object = this.#specialEncounterTileImageGameObjectGroup
          .getFirstDead(true, encounterTile.pixelX, encounterTile.pixelY, WORLD_ASSET_KEYS.GRASS, 1, true)
          .setOrigin(0)
          .setVisible(true)
          .setActive(true);
        // if player is moving up or down, don't show grass so they don't appear to be moving under it, will show after they reach the destination
        if (playerDirection === DIRECTION.DOWN || playerDirection === DIRECTION.UP) {
          object.visible = false;
        }
        playSoundFx(this, AUDIO_ASSET_KEYS.GRASS);
        break;
      case ENCOUNTER_TILE_TYPE.NONE:
        break;
      default:
        exhaustiveGuard(encounterTileType);
    }

    if (playerDirection !== DIRECTION.DOWN) {
      return;
    }

    // if player is moving in the down direction, hide current tile so player does not move under it
    this.#hideSpecialEncounterTiles();
  }

  /**
   * @returns {void}
   */
  #hideSpecialEncounterTiles() {
    this.#specialEncounterTileImageGameObjectGroup
      .getChildren()
      .some((/** @type {Phaser.GameObjects.Image} */ child) => {
        if (!child.active) {
          return false;
        }
        if (child.x === this.#player.sprite.x && child.y === this.#player.sprite.y) {
          child.active = false;
          child.visible = false;
          return true;
        }
        return false;
      });
  }
}
