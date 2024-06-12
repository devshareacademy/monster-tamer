import Phaser from '../lib/phaser.js';
import { AUDIO_ASSET_KEYS, WORLD_ASSET_KEYS } from '../assets/asset-keys.js';
import { SCENE_KEYS } from './scene-keys.js';
import { Player } from '../world/characters/player.js';
import { DIRECTION } from '../common/direction.js';
import { TILED_COLLISION_LAYER_ALPHA, TILE_SIZE } from '../config.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import { getTargetPositionFromGameObjectPositionAndDirection } from '../utils/grid-utils.js';
import { CANNOT_READ_SIGN_TEXT, SAMPLE_TEXT } from '../utils/text-utils.js';
import { DialogUi } from '../world/dialog-ui.js';
import { NPC } from '../world/characters/npc.js';
import { WorldMenu } from '../world/world-menu.js';
import { BaseScene } from './base-scene.js';
import { DataUtils } from '../utils/data-utils.js';
import { playBackgroundMusic, playSoundFx } from '../utils/audio-utils.js';
import { weightedRandom } from '../utils/random.js';
import { Item } from '../world/item.js';
import { NPC_EVENT_TYPE } from '../types/typedef.js';
import { exhaustiveGuard } from '../utils/guard.js';

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
});

const TILED_ITEM_PROPERTY = Object.freeze({
  ITEM_ID: 'item_id',
  ID: 'id',
});

const TILED_AREA_METADATA_PROPERTY = Object.freeze({
  FAINT_LOCATION: 'faint_location',
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
  /** @type {Phaser.Tilemaps.TilemapLayer | undefined} */
  #encounterLayer;
  /** @type {boolean} */
  #wildMonsterEncountered;
  /** @type {Phaser.Tilemaps.ObjectLayer | undefined} */
  #signLayer;
  /** @type {DialogUi} */
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
    this.#encounterLayer = undefined;
    this.#signLayer = undefined;
    this.#entranceLayer = undefined;
  }

  /**
   * @returns {void}
   */
  create() {
    super.create();

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

    // create collision layer for encounters
    const hasEncounterLayer = map.getLayerIndexByName('Encounter') !== null;
    if (hasEncounterLayer) {
      const encounterTiles = map.addTilesetImage('encounter', WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE);
      if (!encounterTiles) {
        console.log(`[${WorldScene.name}:create] encountered error while creating encounter tiles from tiled`);
        return;
      }
      this.#encounterLayer = map.createLayer('Encounter', encounterTiles, 0, 0);
      this.#encounterLayer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2);
    }

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
    });
    this.cameras.main.startFollow(this.#player.sprite);

    // update our collisions with npcs
    this.#npcs.forEach((npc) => {
      npc.addCharacterToCheckForCollisionsWith(this.#player);
    });

    // create foreground for depth
    this.add.image(0, 0, `${this.#sceneData.area.toUpperCase()}_FOREGROUND`, 0).setOrigin(0);

    // create dialog ui
    this.#dialogUi = new DialogUi(this, 1280);

    // create menu
    this.#menu = new WorldMenu(this);

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

    if (!this.#encounterLayer) {
      return;
    }

    const isInEncounterZone =
      this.#encounterLayer.getTileAtWorldXY(this.#player.sprite.x, this.#player.sprite.y, true).index !== -1;
    if (!isInEncounterZone) {
      return;
    }

    console.log(`[${WorldScene.name}:handlePlayerMovementUpdate] player is in an encounter zone`);
    playSoundFx(this, AUDIO_ASSET_KEYS.GRASS);
    this.#wildMonsterEncountered = Math.random() < 0.2;
    if (this.#wildMonsterEncountered) {
      const encounterAreaId = /** @type {TiledObjectProperty[]} */ (this.#encounterLayer.layer.properties).find(
        (property) => property.name === TILED_ENCOUNTER_PROPERTY.AREA
      ).value;
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
      this._controls.isInputLocked || this.#dialogUi.isVisible || this.#menu.isVisible || this.#isProcessingNpcEvent
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
}
