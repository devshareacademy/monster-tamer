# NPC Trainer Battle Implementation Plan

## 1. Goal

This document outlines the necessary code changes to implement battles against NPC trainers. This feature will expand the existing battle system from only supporting wild encounters to supporting multi-monster battles with specific rules against NPCs.

## 2. Proposed Changes

The implementation will be broken down into the following steps:

1.  **Define New Data Structures:** Create new types for NPC battle events and update existing types to support trainer battle flags.
2.  **Implement the `BATTLE` Event:** Add logic in the `WorldScene` to trigger a battle when an NPC's `BATTLE` event is fired.
3.  **Enhance the `BattleScene`:** Modify the battle state machine to handle multiple enemy monsters in a sequence and to recognize trainer-specific rules.
4.  **Update the UI:** Modify the `BattleMenu` to disable controls like "FLEE" and prevent the use of capture items during trainer battles.

---

## 3. Detailed Implementation Steps

### 3.1. Type Definitions (`src/types/typedef.js`)

First, we need to define the shape of the battle event data and update the `BattleScene`'s data payload.

```javascript
// In src/types/typedef.js

/**
 * @typedef NpcEventBattle
 * @type {object}
 * @property {'BATTLE'} type
 * @property {string[]} requires
 * @property {object} data
 * @property {number[]} data.monsters
 * @property {string} data.winMessage
 * @property {string} data.lossMessage
 */

/**
 * @typedef NpcEvent
 * @type {NpcEventMessage | NpcEventSceneFadeInAndOut | NpcEventHeal | NpcEventBattle}
 */

/**
 * @typedef BattleSceneData
 * @type {object}
 * @property {import('../types/typedef.js').Monster[]} playerMonsters
 * @property {import('../types/typedef.js').Monster[]} enemyMonsters
 * @property {boolean} [isTrainerBattle=false] // Add this new property
 */
```

### 3.2. World Scene Event Handling (`src/scenes/world-scene.js`)

Next, we'll implement the logic to start a battle from an NPC interaction.

```javascript
// In src/scenes/world-scene.js, inside #handleNpcInteraction switch statement

      // ... existing cases
      case NPC_EVENT_TYPE.BATTLE:
        this.#isProcessingNpcEvent = true;
        // Get monster data from the event
        const npcMonsters = eventToHandle.data.monsters.map(monsterId => {
          return DataUtils.getMonsterById(this, monsterId);
        });

        /** @type {import('./battle-scene.js').BattleSceneData} */
        const dataToPass = {
          enemyMonsters: npcMonsters,
          playerMonsters: dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY),
          isTrainerBattle: true,
        };

        this.scene.start(SCENE_KEYS.BATTLE_SCENE, dataToPass);
        break;
      // ... existing cases
```

### 3.3. Battle Scene Enhancements (`src/scenes/battle-scene.js`)

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

### 3.4. Battle Menu UI Updates (`src/battle/ui/menu/battle-menu.js`)

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

## 4. Conclusion

These changes provide a complete foundation for NPC trainer battles. Further enhancements could include adding prize money, unique dialogue for winning or losing, and more complex AI for trainer move selection.
