# NPC Line of Sight Battle Trigger

## 1. Goal

This document outlines the plan to implement a new battle trigger mechanism for NPC trainers. This feature will allow battles to be initiated automatically when the player character enters an NPC's field of vision, adding a new layer of dynamic interaction to the game world. This will be an alternative to the existing interaction-based battle trigger.

## 2. Proposed Changes

The implementation will be broken down into the following steps:

1.  **Update NPC Data:** Add new properties to `assets/data/npcs.json` to define which NPCs use the line-of-sight trigger and their vision range.
2.  **Update `NPC` Class:** Enhance the `NPC` class in `src/world/characters/npc.js` to store the new properties and include a method for checking if the player is in its line of sight.
3.  **Update `WorldScene`:** Modify `src/scenes/world-scene.js` to perform the line-of-sight check at the appropriate time (after the player moves) and trigger the battle sequence.

---

## 3. Detailed Implementation Steps

### 3.1. NPC Data (`assets/data/npcs.json`)

To enable this feature, we will add two new properties to the data for any NPC that should be triggered by line of sight.

*   `battleTrigger`: A string set to `"lineOfSight"`.
*   `visionRange`: A number that specifies how many tiles the NPC can see in a straight line.

```json
// In assets/data/npcs.json
{
  "4": {
    "frame": 190,
    "animationKeyPrefix": "NPC_20",
    "battleTrigger": "lineOfSight",
    "visionRange": 4,
    "events": [
      {
        "requires": ["TRAINER_NOT_DEFEATED"],
        "type": "MESSAGE",
        "data": {
          "messages": ["Hey! Let's battle!"]
        }
      },
      {
        "requires": ["TRAINER_NOT_DEFEATED"],
        "type": "BATTLE",
        "data": {
          "monsters": [6],
          "trainerLostMessages": ["You defeated me!"],
          "assetKey": "TRAINER_YOUTH_GIRL",
          "trainerName": "Jr. Trainer"
        }
      },
      {
        "requires": ["TRAINER_DEFEATED"],
        "type": "MESSAGE",
        "data": {
          "messages": ["That was a great battle!"]
        }
      }
    ]
  }
}
```

### 3.2. NPC Class (`src/world/characters/npc.js`)

The `NPC` class will be updated to manage the new properties and contain the core line-of-sight logic.

```javascript
// In src/world/characters/npc.js

// ... imports

/**
 * @typedef NPCConfigProps
 * @type {object}
 * // ... existing properties
 * @property {import('../../types/typedef.js').BattleTrigger} [battleTrigger]
 * @property {number} [visionRange]
 */

// ...

export class NPC extends Character {
  // ... existing properties
  #battleTrigger;
  #visionRange;

  /**
   * @param {NPCConfig} config
   */
  constructor(config) {
    super({
      // ... existing constructor logic
    });

    // ... existing constructor logic
    this.#battleTrigger = config.battleTrigger;
    this.#visionRange = config.visionRange;
  }

  // ... existing getters and setters

  /**
   * @type {import('../../types/typedef.js').BattleTrigger | undefined}
   */
  get battleTrigger() {
    return this.#battleTrigger;
  }

  /**
   * Checks if a target is within the NPC's line of sight.
   * @param {import('./player.js').Player} target The player to check against.
   * @param {Phaser.Tilemaps.TilemapLayer} collisionLayer The layer with collision data.
   * @returns {boolean}
   */
  isInLineOfSight(target, collisionLayer) {
    // 1. Return false immediately if this NPC doesn't use this trigger or has no vision range.
    if (this.#battleTrigger !== 'lineOfSight' || this.#visionRange === undefined) {
      return false;
    }

    // 2. Use tile coordinates for grid-based logic.
    const npcTileX = Math.floor(this.sprite.x / TILE_SIZE);
    const npcTileY = Math.floor(this.sprite.y / TILE_SIZE);
    const targetTileX = Math.floor(target.sprite.x / TILE_SIZE);
    const targetTileY = Math.floor(target.sprite.y / TILE_SIZE);

    // 3. Check if player is in the correct direction and within range.
    switch (this.direction) {
      case DIRECTION.DOWN:
        if (targetTileX !== npcTileX || targetTileY <= npcTileY || targetTileY > npcTileY + this.#visionRange) return false;
        break;
      case DIRECTION.UP:
        if (targetTileX !== npcTileX || targetTileY >= npcTileY || targetTileY < npcTileY - this.#visionRange) return false;
        break;
      case DIRECTION.LEFT:
        if (targetTileY !== npcTileY || targetTileX >= npcTileX || targetTileX < npcTileX - this.#visionRange) return false;
        break;
      case DIRECTION.RIGHT:
        if (targetTileY !== npcTileY || targetTileX <= npcTileX || targetTileX > npcTileX + this.#visionRange) return false;
        break;
      default:
        return false;
    }

    // 4. Check for obstacles between the NPC and the player.
    // This involves iterating through the tiles in the path and checking for a collision property.
    // If any tile is collidable, return false.

    return true; // Return true if all checks pass.
  }

  // ... other methods
}
```

### 3.3. World Scene (`src/scenes/world-scene.js`)

The `WorldScene` will be responsible for triggering the check at the correct time.

#### 3.3.1. NPC Creation (`#createNPCs`)

The NPC creation logic will be updated to pass the new properties from the JSON data to the `NPC` constructor.

```javascript
// In #createNPCs method of src/scenes/world-scene.js

// ... inside the loop for creating NPCs
const npcDetails = DataUtils.getNpcData(this, npcId);

const npc = new NPC({
  // ... existing properties
  battleTrigger: npcDetails.battleTrigger,
  visionRange: npcDetails.visionRange,
});
this.#npcs.push(npc);
```

#### 3.3.2. Player Movement Handling (`#handlePlayerMovementUpdate`)

This method is the ideal place to add the trigger logic, as it runs after the player has finished moving to a new tile.

```javascript
// In #handlePlayerMovementUpdate method of src/scenes/world-scene.js

#handlePlayerMovementUpdate() {
  // ... existing logic to update player position and camera ...

  // Check for line-of-sight battle triggers
  for (const npc of this.#npcs) {
    // Skip if NPC is not a line-of-sight trainer or has already been defeated
    if (npc.battleTrigger !== 'lineOfSight' || dataManager.getDefeatedNpcs().has(npc.id)) {
      continue;
    }

    // Check for line of sight (assuming collisionLayer is accessible as this.#collisionLayer)
    if (npc.isInLineOfSight(this.#player, this.#collisionLayer)) {
      // If player is spotted, initiate the NPC interaction sequence
      this.#npcPlayerIsInteractingWith = npc;
      this.#handleNpcInteraction();
      // Stop checking to prevent multiple simultaneous battle triggers
      break;
    }
  }

  // ... rest of the method for wild encounters, etc. ...
}
```

## 4. Conclusion

This implementation provides a robust and efficient way to trigger battles based on line of sight. It reuses existing event handling logic (`#handleNpcInteraction`) and is optimized to only run checks when the player's position changes, ensuring minimal performance impact.

## 5. NPC Approach

As a follow-up to the line-of-sight battle trigger, we will implement a feature where the NPC walks up to the player after spotting them. This will enhance the dynamic interaction by making the NPC appear more proactive.

### 5.1. World Scene (`src/scenes/world-scene.js`)

We will add a new property to the `WorldScene` class to manage the state of the NPC approach sequence.

```javascript
// In src/scenes/world-scene.js

// ... existing properties
#npcPlayerIsInteractingWith;
#isProcessingLineOfSightEncounter;
/** @type {WorldMenu} */
#menu;

// ...

init(data) {
  // ... existing init logic
  this.#isProcessingLineOfSightEncounter = false;
}
```

### 5.2. Player Movement Handling (`#handlePlayerMovementUpdate`)

We will modify the `#handlePlayerMovementUpdate` method to trigger the NPC approach sequence instead of directly initiating the interaction.

```javascript
// In #handlePlayerMovementUpdate method of src/scenes/world-scene.js

#handlePlayerMovementUpdate() {
  // ... existing logic ...

  // Check for line-of-sight battle triggers
  if (this.#isProcessingLineOfSightEncounter) {
    return;
  }

  for (const npc of this.#npcs) {
    // ... existing checks ...

    if (npc.isInLineOfSight(this.#player, this.#collisionLayer)) {
      this.#isProcessingLineOfSightEncounter = true;
      this.#npcPlayerIsInteractingWith = npc;
      this.#moveNpcToPlayer(npc);
      break;
    }
  }

  // ... rest of the method ...
}
```

### 5.3. NPC Movement (`#moveNpcToPlayer`)

We will create a new method, `#moveNpcToPlayer`, to handle the NPC's movement towards the player. This method will calculate the path and move the NPC one tile away from the player.

```javascript
// In src/scenes/world-scene.js

#moveNpcToPlayer(npc) {
  const targetPath = getTargetPathToGameObject(npc.sprite, this.#player.sprite);
  const pathToFollow = targetPath.pathToFollow.slice(0, -1);

  if (pathToFollow.length === 0) {
    this.#player.moveCharacter(getTargetDirectionFromGameObjectPosition(this.#player.sprite, npc.sprite));
    npc.facePlayer(this.#player.direction);
    this.#handleNpcInteraction();
    return;
  }

  const npcPath = { 0: { x: npc.sprite.x, y: npc.sprite.y } };
  pathToFollow.forEach((coordinate, index) => {
    npcPath[index + 1] = coordinate;
  });

  npc.finishedMovementCallback = () => {
    if (pathToFollow.length > 0 && pathToFollow[pathToFollow.length - 1].x === npc.sprite.x && pathToFollow[pathToFollow.length - 1].y === npc.sprite.y) {
      this.#player.moveCharacter(getTargetDirectionFromGameObjectPosition(this.#player.sprite, npc.sprite));
      npc.facePlayer(this.#player.direction);
      this.#handleNpcInteraction();
    }
  };

  npc.npcMovementPattern = NPC_MOVEMENT_PATTERN.SET_PATH;
  npc.npcPath = npcPath;
  npc.resetMovementTime();
}
```

### 5.4. Resetting the State

Finally, we need to reset the `#isProcessingLineOfSightEncounter` flag after the interaction is complete.

```javascript
// In #handleNpcInteraction method of src/scenes/world-scene.js

#handleNpcInteraction() {
  // ... existing logic ...

  if (!isMoreEventsToProcess) {
    // ... existing logic ...
    this.#isProcessingLineOfSightEncounter = false; // Add this line
    return;
  }

  // ... rest of the method ...
}
```
