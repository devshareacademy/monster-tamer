# Feature Enhancement: NPC Timed Turning

This document outlines an enhancement to the **NPC Line of Sight Battle Trigger** feature. It adds the ability for NPCs to change their facing direction periodically, making their line of sight dynamic and creating more engaging challenges for the player.

## 1. Goal

The goal is to allow specific NPCs to automatically change their facing direction at a configured time interval. This enhancement will make NPCs with line-of-sight battle triggers more dynamic, as their field of vision will shift without them moving from their position.

## 2. Proposed Changes

The implementation will follow these steps:

1.  **Update NPC Data:** Add a new optional `turnDelay` property to `assets/data/npcs.json` to define which NPCs use this behavior and how frequently they turn.
2.  **Update `NPC` Class:** Enhance the `NPC` class in `src/world/characters/npc.js` to include the logic for timed turning within its `update` method.
3.  **Update `WorldScene`:** Modify the `#createNPCs` method in `src/scenes/world-scene.js` to pass the new `turnDelay` data to the `NPC` instance upon creation.

## 3. Detailed Implementation Steps

### 3.1. NPC Data (`assets/data/npcs.json`)

To enable this feature, we will add a new `turnDelay` property to the NPC data. The value is in milliseconds.

```json
// In assets/data/npcs.json
{
  "4": {
    "frame": 190,
    "animationKeyPrefix": "NPC_20",
    "battleTrigger": "lineOfSight",
    "visionRange": 4,
    "turnDelay": 5000,
    "events": [
      // ... existing event data
    ]
  }
}
```

### 3.2. NPC Class (`src/world/characters/npc.js`)

The `NPC` class will be updated to handle the new turning logic. This involves adding the `turnDelay` property and implementing the turning mechanism in the `update` method.

```javascript
// In src/world/characters/npc.js

// ... imports and existing typedefs

/**
 * @typedef NPCConfigProps
 * @type {object}
 * // ... existing properties
 * @property {number} [turnDelay]
 */

// ...

export class NPC extends Character {
  // ... existing properties
  #turnDelay;
  #lastTurnTime;
  #turnDirections = [DIRECTION.DOWN, DIRECTION.LEFT, DIRECTION.UP, DIRECTION.RIGHT];

  /**
   * @param {NPCConfig} config
   */
  constructor(config) {
    super({
      // ... existing constructor logic
    });

    // ... existing constructor logic
    this.#turnDelay = config.turnDelay;
    this.#lastTurnTime = 0;
  }

  // ... existing methods

  /**
   * @param {DOMHighResTimeStamp} time
   * @returns {void}
   */
  update(time) {
    if (this._isMoving || this.#talkingToPlayer) {
      return;
    }
    super.update(time);

    // Handle timed turning if configured
    if (this.#turnDelay) {
      if (this.#lastTurnTime === 0) {
        this.#lastTurnTime = time;
      }
      if (time >= this.#lastTurnTime + this.#turnDelay) {
        this.#turn();
        this.#lastTurnTime = time;
        return;
      }
    }

    // existing movement pattern logic
    if (this.#movementPattern === NPC_MOVEMENT_PATTERN.IDLE) {
      return;
    }

    if (this.#lastMovementTime < time) {
      // ... existing movement logic
    }
  }

  #turn() {
    const currentDirectionIndex = this.#turnDirections.indexOf(this._direction);
    // If current direction is not in our list, default to the first one
    const nextDirectionIndex = (currentDirectionIndex + 1) % this.#turnDirections.length;
    const newDirection = this.#turnDirections[nextDirectionIndex];

    this._direction = newDirection;
    this._phaserGameObject.setFrame(this._getIdleFrame());

    // Handle sprite flipping for left direction
    if (this._direction === DIRECTION.LEFT) {
      this._phaserGameObject.setFlipX(true);
    } else {
      this._phaserGameObject.setFlipX(false);
    }
  }
}
```

### 3.3. World Scene (`src/scenes/world-scene.js`)

The `WorldScene` will be updated to pass the new `turnDelay` property to the `NPC` constructor.

```javascript
// In #createNPCs method of src/scenes/world-scene.js

// ... inside the loop for creating NPCs
const npcDetails = DataUtils.getNpcData(this, npcId);

const npc = new NPC({
  // ... existing properties
  battleTrigger: npcDetails.battleTrigger,
  visionRange: npcDetails.visionRange,
  turnDelay: npcDetails.turnDelay, // Pass the new property
});
this.#npcs.push(npc);
```

## 4. Conclusion

This enhancement integrates seamlessly with the existing line-of-sight feature. By leveraging the `NPC` class's `update` method, we can introduce more dynamic and unpredictable NPC behavior with minimal and targeted changes. The `isInLineOfSight` method proposed in the original document will automatically use the NPC's updated direction, making this enhancement immediately effective for any NPC configured with both `lineOfSight` and `turnDelay`.
