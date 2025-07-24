# NPC Trainer Battle Implementation Plan

## 1. Goal

This document outlines the necessary code changes to implement battles against NPC trainers. This feature will expand the existing battle system from only supporting wild encounters to supporting multi-monster battles with specific rules against NPCs. This updated plan includes support for various battle triggers, including sight-based encounters, interaction-based battles, and the ability for players to decline a battle.

## 2. Proposed Changes

The implementation will be broken down into the following steps:

1.  **Define New Data Structures:** Create new types for NPC battle events and update existing types to support trainer battle flags.
2.  **Update NPC Data:** Add new properties to the `assets/data/npcs.json` file to control how NPC battles are triggered.
3.  **Update NPC Class:** Enhance the `NPC` class to support vision-based battle triggers.
4.  **Implement Battle Triggers:** Add logic in the `WorldScene` to trigger battles based on NPC interactions and vision checks.
5.  **Enhance the `BattleScene`:** Modify the battle state machine to handle multiple enemy monsters in a sequence and to recognize trainer-specific rules.
6.  **Update the UI:** Modify the `BattleMenu` to disable controls like "FLEE" and prevent the use of capture items during trainer battles.

---

## 3. Detailed Implementation Steps

### 3.1. Type Definitions (`src/types/typedef.js`)

First, we need to define the shape of the battle event data and update the `BattleScene`'s data payload.

```javascript
// In src/types/typedef.js

/**
 * @typedef {'ON_SIGHT' | 'ON_INTERACTION'} BattleTrigger
 */

/**
 * @typedef NpcEventBattle
 * @type {object}
 * @property {'BATTLE'} type
 * @property {string[]} requires
 * @property {object} data
 * @property {number[]} data.monsters
 * @property {string} data.winMessage
 * @property {string} data.lossMessage
 * @property {boolean} [data.canDeclineBattle=false]
 * @property {string} [data.battleDeclinedMessage]
 */

/**
 * @typedef NpcEvent
 * @type {NpcEventMessage | NpcEventSceneFadeInAndOut | NpcEventHeal | NpcEventBattle}
 */

/**
 * @typedef NpcDetails
 * @type {object}
 * @property {number} frame
 * @property {string} animationKeyPrefix
 * @property {NpcEvent[]} events
 * @property {BattleTrigger} [battleTrigger]
 * @property {number} [visionRange]
 * @property {import('../common/direction.js').Direction[]} [visionDirections]
 */

/**
 * @typedef BattleSceneData
 * @type {object}
 * @property {import('../types/typedef.js').Monster[]} playerMonsters
 * @property {import('../types/typedef.js').Monster[]} enemyMonsters
 * @property {boolean} [isTrainerBattle=false] // Add this new property
 */
```

### 3.2. NPC Data (`assets/data/npcs.json`)

Next, we'll add new properties to our NPC data to control how battles are initiated.

```json
// In assets/data/npcs.json
{
  "6": {
    "frame": 24,
    "animationKeyPrefix": "NPC_2",
    "battleTrigger": "ON_SIGHT",
    "visionRange": 3,
    "visionDirections": ["DOWN"],
    "events": [
      {
        "requires": [],
        "type": "BATTLE",
        "data": {
          "monsters": [1, 2],
          "winMessage": "You defeated me!",
          "lossMessage": "You are not strong enough."
        }
      }
    ]
  },
  "7": {
    "frame": 26,
    "animationKeyPrefix": "NPC_3",
    "battleTrigger": "ON_INTERACTION",
    "events": [
      {
        "requires": [],
        "type": "BATTLE",
        "data": {
          "monsters": [3],
          "winMessage": "You are a strong trainer!",
          "lossMessage": "Better luck next time.",
          "canDeclineBattle": true,
          "battleDeclinedMessage": "Let's battle next time."
        }
      }
    ]
  }
}
```

### 3.3. NPC Class (`src/world/characters/npc.js`)

The `NPC` class will be updated to handle vision-based battle triggers.

```javascript
// In src/world/characters/npc.js

export class NPC extends Character {
  // ... existing properties
  #battleTrigger;
  #visionRange;
  #visionDirections;

  constructor(config) {
    // ... existing constructor logic
    this.#battleTrigger = config.battleTrigger;
    this.#visionRange = config.visionRange;
    this.#visionDirections = config.visionDirections;
  }

  // ... existing methods

  checkForPlayerInVision(player) {
    if (this.#battleTrigger !== 'ON_SIGHT' || !this.#visionDirections || !this.#visionRange) {
      return false;
    }

    // Logic to check if the player is within the NPC's vision range and direction
    // This will involve checking the player's grid position against the NPC's position,
    // vision range, and vision directions.
    // If the player is in sight, this method will return true.
  }

  update(time) {
    // ... existing update logic

    // The vision check will be handled in the WorldScene's update loop.
  }
}
```

### 3.4. World Scene Event Handling (`src/scenes/world-scene.js`)

The `WorldScene` will be updated to handle the new battle triggers.

```javascript
// In src/scenes/world-scene.js

export class WorldScene extends BaseScene {
  // ... existing properties

  update(time) {
    // ... existing update logic

    this.#npcs.forEach((npc) => {
      npc.update(time);
      if (npc.checkForPlayerInVision(this.#player)) {
        // Logic to initiate a battle
        // This will involve getting the battle event data from the NPC and starting the BattleScene
      }
    });
  }

  #handleNpcInteraction() {
    // ... existing interaction logic

    const nearbyNpc = this.#npcs.find((npc) => {
      // ... existing logic
    });

    if (nearbyNpc) {
      if (nearbyNpc.battleTrigger === 'ON_INTERACTION') {
        const battleEvent = nearbyNpc.events.find(event => event.type === 'BATTLE');
        if (battleEvent.data.canDeclineBattle) {
          // Show a confirmation menu to the player
          // If the player accepts, start the battle
          // If the player declines, show the battleDeclinedMessage
        } else {
          // Start the battle immediately
        }
      }
    } else {
      // Handle other NPC interactions
    }
  }
}
```

### 3.5. Battle Scene Enhancements (`src/scenes/battle-scene.js`)

The `BattleScene` needs to be aware of trainer battles and manage a sequence of enemies.

```javascript
// In src/scenes/battle-scene.js

export class BattleScene extends BaseScene {
  // ... existing properties
  #isTrainerBattle; // Add new property
  #activeEnemyMonsterIndex; // Add new property

  init(data) {
    // ... existing init logic
    this.#isTrainerBattle = data.isTrainerBattle || false; // Store the flag
    this.#activeEnemyMonsterIndex = 0; // Start with the first monster
  }

  create() {
    // ... existing create logic

    // Update enemy monster creation to use the index
    this.#activeEnemyMonster = new EnemyBattleMonster({
      scene: this,
      monsterDetails: this.#sceneData.enemyMonsters[this.#activeEnemyMonsterIndex],
      skipBattleAnimations: this.#skipAnimations,
    });

    // Pass the trainer flag to the battle menu
    this.#battleMenu = new BattleMenu(this, this.#activePlayerMonster, this.#skipAnimations, this.#isTrainerBattle);

    // ...
  }

  #postBattleSequenceCheck() {
    // ...

    if (this.#activeEnemyMonster.isFainted) {
      // ENEMY FAINTED LOGIC
      this.#activeEnemyMonsterIndex++;
      if (this.#isTrainerBattle && this.#activeEnemyMonsterIndex < this.#sceneData.enemyMonsters.length) {
        // If it's a trainer battle and there are more monsters, bring out the next one
        const nextMonster = this.#sceneData.enemyMonsters[this.#activeEnemyMonsterIndex];
        this.#battleMenu.updateInfoPaneMessagesAndWaitForInput(
          [`Foe is about to send in ${nextMonster.name}.`],
          () => {
            this.#activeEnemyMonster.switchMonster(nextMonster);
            this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT);
          }
        );
      } else {
        // This was the last monster, player wins
        this.#activeEnemyMonster.playDeathAnimation(() => {
          this.#battleMenu.updateInfoPaneMessagesAndWaitForInput(
            [`You defeated the trainer!`], // Use win message from event data
            () => {
              this.#battleStateMachine.setState(BATTLE_STATES.GAIN_EXPERIENCE);
            }
          );
        });
      }
      return;
    }

    // ... rest of the method
  }
}
```

### 3.6. Battle Menu UI Updates (`src/battle/ui/menu/battle-menu.js`)

The UI must be updated to prevent actions that are not allowed in trainer battles.

```javascript
// In src/battle/ui/menu/battle-menu.js

export class BattleMenu {
  // ... existing properties
  #isTrainerBattle; // Add new property

  constructor(scene, activePlayerMonster, skipBattleAnimations = false, isTrainerBattle = false) {
    // ... existing constructor logic
    this.#isTrainerBattle = isTrainerBattle;
    // ...
  }

  showMainBattleMenu() {
    // ... existing logic

    // Conditionally disable FLEE button
    if (this.#isTrainerBattle) {
      const fleeButton = this.#mainBattleMenuPhaserContainerGameObject.getAt(4); // Assuming FLEE is the 4th text object
      if (fleeButton) {
        fleeButton.setAlpha(0.5);
      }
    }
  }

  handlePlayerInput(input) {
    // ...

    if (input === 'OK') {
      if (this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MAIN) {
        // Add check to prevent selecting disabled options
        if (this.#isTrainerBattle && this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FLEE) {
          return;
        }
        this.#handlePlayerChooseMainBattleOption();
        return;
      }
      // ...
    }
    // ...
  }

  #handleSceneResume(sys, data) {
    // ... existing logic

    // Add check to prevent using capture items in a trainer battle
    if (this.#isTrainerBattle && data?.item?.category === 'CAPTURE') {
        this.updateInfoPaneMessagesAndWaitForInput(['You can\'t use that in a trainer battle!']);
        this.#wasItemUsed = false; // Prevent the turn from being consumed
        return;
    }

    // ... rest of the method
  }
}
```

### 3.7. Tracking Defeated NPCs

To prevent players from re-battling NPCs, we need to track which NPCs have been defeated. We will use a `Set` for efficient lookups, similar to how `viewed_events` are tracked.

#### 3.7.1. Update Data Manager (`src/utils/data-manager.js`)

Add a new key to the `dataManager` to store defeated NPC IDs.

```javascript
// In src/utils/data-manager.js
export const DATA_MANAGER_STORE_KEYS = Object.freeze({
  // ... existing keys
  DEFEATED_NPCS: 'DEFEATED_NPCS',
});
```

#### 3.7.2. Update Battle Scene Data (`src/types/typedef.js`)

Add the `npcId` to the `BattleSceneData` type definition.

```javascript
// In src/types/typedef.js
/**
 * @typedef BattleSceneData
 * @type {object}
 * @property {import('../types/typedef.js').Monster[]} playerMonsters
 * @property {import('../types/typedef.js').Monster[]} enemyMonsters
 * @property {boolean} [isTrainerBattle=false]
 * @property {number} [npcId] // Add this new property
 */
```

#### 3.7.3. Pass NPC ID to Battle Scene (`src/scenes/world-scene.js`)

When starting a battle, pass the NPC's ID to the `BattleScene`.

```javascript
// In src/scenes/world-scene.js
const dataToPass = {
  // ... other data
  npcId: nearbyNpc.id,
};
this.scene.start(SCENE_KEYS.BATTLE_SCENE, dataToPass);
```

#### 3.7.4. Mark NPC as Defeated (`src/scenes/battle-scene.js`)

After a successful battle, add the NPC's ID to the `DEFEATED_NPCS` set.

```javascript
// In src/scenes/battle-scene.js
export class BattleScene extends BaseScene {
  #npcId;

  init(data) {
    // ... existing init logic
    this.#npcId = data.npcId;
  }

  #postBattleSequenceCheck() {
    // ...
    if (this.#activeEnemyMonster.isFainted) {
      // ...
      if (isLastEnemyMonster && this.#isTrainerBattle && this.#npcId !== undefined) {
        dataManager.addDefeatedNpc(this.#npcId);
      }
      // ...
    }
  }
}
```

#### 3.7.5. Prevent Re-Battling (`src/scenes/world-scene.js`)

Before starting a battle, check if the NPC has already been defeated.

```javascript
// In src/scenes/world-scene.js
const defeatedNpcs = dataManager.store.get(DATA_MANAGER_STORE_KEYS.DEFEATED_NPCS) || new Set();
if (!defeatedNpcs.has(npc.id)) {
  // Initiate battle...
}
```

## 4. Conclusion

These changes provide a complete foundation for NPC trainer battles. Further enhancements could include adding prize money, unique dialogue for winning or losing, and more complex AI for trainer move selection.
