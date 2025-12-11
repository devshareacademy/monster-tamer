# NPC Trainer Battle Implementation Plan

## 1. Goal

This document outlines the necessary code changes to implement battles against NPC trainers. This feature will expand the existing battle system from only supporting wild encounters to supporting multi-monster battles with specific rules against NPCs. This plan covers interaction-based battles, where the player must talk to an NPC to initiate combat.

## 2. Proposed Changes

The implementation will be broken down into the following steps:

1.  **Define New Data Structures:** Align the documentation with the existing types for NPC battle events.
2.  **Update NPC Data:** Show an example from `assets/data/npcs.json` that includes battle event data.
3.  **Implement Battle Triggers:** Detail the logic in the `WorldScene` that triggers battles based on NPC interactions.
4.  **Enhance the `BattleScene`:** Detail how the battle state machine handles multiple enemy monsters in a sequence and recognizes trainer-specific rules.
5.  **Update the UI:** Detail how the `BattleMenu` disables controls like "FLEE" and prevents the use of capture items during trainer battles.
6.  **Tracking Defeated NPCs:** Outline the system for tracking defeated NPCs to prevent re-battling.

---

## 3. Detailed Implementation Steps

### 3.1. Type Definitions (`src/types/typedef.js`)

The following types are used to define the shape of the battle event data and the `BattleScene`'s data payload.

```javascript
// In src/types/typedef.js

/**
 * @typedef NpcEventBattle
 * @type {object}
 * @property {'BATTLE'} type
 * @property {string[]} requires
 * @property {object} data
 * @property {number[]} data.monsters
 * @property {string[]} data.trainerLostMessages
 * @property {string} data.assetKey
 * @property {string} data.trainerName
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
 */

/**
 * @typedef BattleSceneData
 * @type {object}
 * @property {import('../types/typedef.js').Monster[]} playerMonsters
 * @property {import('../types/typedef.js').Monster[]} enemyMonsters
 * @property {boolean} [isTrainerBattle=false]
 * @property {object} [npc]
 * @property {number} npc.id
 * @property {string} npc.assetKey
 * @property {string} npc.name
 * @property {string[]} npc.trainerLostMessages
 */
```

### 3.2. NPC Data (`assets/data/npcs.json`)

The NPC's `events` array contains the `BATTLE` event type to initiate combat.

```json
// In assets/data/npcs.json
{
  "4": {
    "frame": 190,
    "animationKeyPrefix": "NPC_20",
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

### 3.3. World Scene Event Handling (`src/scenes/world-scene.js`)

The `WorldScene` handles the interaction-based battle trigger within the `#handleNpcInteraction` method.

```javascript
// In src/scenes/world-scene.js

export class WorldScene extends BaseScene {
  // ... existing properties

  #handleNpcInteraction() {
    // ... existing interaction logic that finds the nearbyNpc ...
    // The event processing logic inside this method checks for an event of type 'BATTLE'
    // and then calls #startBattleScene if the requirements are met.
  }

  #startBattleScene(battleSceneData) {
    this.cameras.main.fadeOut(2000);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENE_KEYS.BATTLE_SCENE, battleSceneData);
    });
  }
}
```

### 3.4. Battle Scene Enhancements (`src/scenes/battle-scene.js`)

The `BattleScene` is aware of trainer battles and manages a sequence of enemies.

```javascript
// In src/scenes/battle-scene.js

export class BattleScene extends BaseScene {
  // ... existing properties
  #isTrainerBattle;
  #activeEnemyMonsterIndex;
  #npcId;

  init(data) {
    // ... existing init logic
    this.#isTrainerBattle = data.isTrainerBattle || false;
    this.#activeEnemyMonsterIndex = 0;
    if (data.isTrainerBattle) {
      this.#npcId = data.npc.id;
    }
  }

  #postBattleSequenceCheck() {
    // ...

    if (this.#activeEnemyMonster.isFainted) {
      // ENEMY FAINTED LOGIC
      this.#activeEnemyMonsterIndex++;
      if (this.#isTrainerBattle && this.#activeEnemyMonsterIndex < this.#sceneData.enemyMonsters.length) {
        // If it's a trainer battle and there are more monsters, bring out the next one
        const nextMonster = this.#sceneData.enemyMonsters[this.#activeEnemyMonsterIndex];
        this.#battleMenu.updateInfoPaneMessagesAndWaitForInput([`Foe is about to send in ${nextMonster.name}.`], () => {
          this.#activeEnemyMonster.switchMonster(nextMonster);
          this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT);
        });
      } else {
        // This was the last monster, player wins
        this.#activeEnemyMonster.playDeathAnimation(() => {
          this.#battleMenu.updateInfoPaneMessagesAndWaitForInput(this.#sceneData.npc.trainerLostMessages, () => {
            this.#battleStateMachine.setState(BATTLE_STATES.GAIN_EXPERIENCE);
          });
        });
      }
      return;
    }
    // ... rest of the method
  }
}
```

### 3.5. Battle Menu UI Updates (`src/battle/ui/menu/battle-menu.js`)

The UI is updated to prevent actions that are not allowed in trainer battles.

```javascript
// In src/battle/ui/menu/battle-menu.js

export class BattleMenu {
  #isTrainerBattle;

  constructor(scene, activePlayerMonster, skipBattleAnimations = false, isTrainerBattle = false) {
    // ... existing constructor logic
    this.#isTrainerBattle = isTrainerBattle;
    // ...
  }

  showMainBattleMenu() {
    // ... existing logic

    // Conditionally disable FLEE button
    if (this.#isTrainerBattle) {
      // logic to find and disable flee button
    }
  }

  handlePlayerInput(input) {
    // ...
    // logic to prevent selecting disabled options like FLEE
    // ...
  }

  #handleSceneResume(sys, data) {
    // ... existing logic

    // Add check to prevent using capture items in a trainer battle
    if (this.#isTrainerBattle && data?.item?.category === 'CAPTURE') {
      this.updateInfoPaneMessagesAndWaitForInput(["You can't use that in a trainer battle!"]);
      this.#wasItemUsed = false; // Prevent the turn from being consumed
      return;
    }
    // ... rest of the method
  }
}
```

### 3.6. Tracking Defeated NPCs

To prevent players from re-battling NPCs, the game tracks which NPCs have been defeated.

#### 3.6.1. Update Data Manager (`src/utils/data-manager.js`)

A key in the `dataManager` is used to store defeated NPC IDs.

```javascript
// In src/utils/data-manager.js
export const DATA_MANAGER_STORE_KEYS = Object.freeze({
  // ... existing keys
  DEFEATED_NPCS: 'DEFEATED_NPCS',
});
```

#### 3.6.2. Pass NPC Data to Battle Scene (`src/scenes/world-scene.js`)

When starting a battle, the NPC's data is passed to the `BattleScene`.

```javascript
// In src/scenes/world-scene.js
// inside #handleNpcInteraction, when eventType is BATTLE
const dataToPass = {
  // ... other data
  isTrainerBattle: true,
  npc: {
    id: this.#npcPlayerIsInteractingWith.id,
    assetKey: eventToHandle.data.assetKey,
    name: eventToHandle.data.trainerName,
    trainerLostMessages: eventToHandle.data.trainerLostMessages,
  },
};
this.#startBattleScene(dataToPass);
```

#### 3.6.3. Mark NPC as Defeated (`src/scenes/battle-scene.js`)

After a successful battle, the NPC's ID is added to the `DEFEATED_NPCS` set.

```javascript
// In src/scenes/battle-scene.js
// inside #postBattleSequenceCheck
if (isLastEnemyMonster && this.#isTrainerBattle && this.#npcId !== undefined) {
  dataManager.addDefeatedNpc(this.#npcId);
}
```

#### 3.6.4. Prevent Re-Battling (`src/scenes/world-scene.js`)

Before processing a battle event, the game checks if the NPC has already been defeated using the `requires` array and the `BATTLE_FLAG` enum.

```javascript
// In src/scenes/world-scene.js
// inside #handleNpcInteraction
const eventRequirementsMet = eventToHandle.requires.every((flag) => {
  if (flag === BATTLE_FLAG.TRAINER_DEFEATED) {
    return dataManager.getDefeatedNpcs().has(this.#npcPlayerIsInteractingWith.id);
  }
  if (flag === BATTLE_FLAG.TRAINER_NOT_DEFEATED) {
    return !dataManager.getDefeatedNpcs().has(this.#npcPlayerIsInteractingWith.id);
  }
  return currentGameFlags.has(flag);
});
```

## 4. Conclusion

These changes provide a complete foundation for interaction-based NPC trainer battles. Further enhancements could include adding prize money, unique dialogue for winning or losing, and more complex AI for trainer move selection.
