# NPC and Object-Based Shop Implementation Plan

## 1. Goal

This document outlines the plan to implement a shop feature, allowing players to purchase items. The shop can be triggered in two ways:
1.  By interacting with a designated NPC shopkeeper.
2.  By interacting with a specific in-game object, such as a computer terminal or a vending machine.

This feature will also introduce a currency system and enhance the interaction logic to support scenarios where the shopkeeper is behind a counter.

## 2. Proposed Changes

The implementation will be broken down into the following steps:

1.  **Update Data Layer:** Modify `data-manager.js` to handle player currency and update `typedef.js` and data files (`items.json`, `npcs.json`) to support item prices and shop events.
2.  **Create `ShopScene`:** Develop a new scene dedicated to the shop user interface, for displaying items, prices, and handling purchase transactions.
3.  **Update `WorldScene`:** Integrate the shop feature by adding triggers for both NPC and object-based shops.
4.  **Implement Counter Interactions:** Enhance the player interaction logic to allow engagement with NPCs across impassable tiles like counters.

---

## 3. Detailed Implementation Steps

### 3.1. Data Layer Updates

#### 3.1.1. Data Manager (`src/utils/data-manager.js`)

We will add a `money` property to the player's data.

```javascript
// In src/utils/data-manager.js

/**
 * @typedef GlobalState
 * @type {object}
 * // ... existing properties
 * @property {number} money
 */

const initialState = {
  // ... existing initial state
  money: 1000,
};

export const DATA_MANAGER_STORE_KEYS = Object.freeze({
  // ... existing keys
  PLAYER_MONEY: 'PLAYER_MONEY',
});

class DataManager extends Phaser.Events.EventEmitter {
  // ... existing methods

  addMoney(amount) {
    const currentMoney = this.#store.get(DATA_MANAGER_STORE_KEYS.PLAYER_MONEY);
    this.#store.set(DATA_MANAGER_STORE_KEYS.PLAYER_MONEY, currentMoney + amount);
  }

  spendMoney(amount) {
    const currentMoney = this.#store.get(DATA_MANAGER_STORE_KEYS.PLAYER_MONEY);
    this.#store.set(DATA_MANAGER_STORE_KEYS.PLAYER_MONEY, currentMoney - amount);
  }
}
```

#### 3.1.2. Type Definitions (`src/types/typedef.js`)

We need to add a `price` to items and define a new `SHOP` event.

```javascript
// In src/types/typedef.js

/**
 * @typedef Item
 * @type {object}
 * // ... existing properties
 * @property {number} price
 */

/** @enum {NpcEventType} */
export const NPC_EVENT_TYPE = Object.freeze({
  // ... existing types
  SHOP: 'SHOP',
});

/**
 * @typedef NpcEventShop
 * @type {object}
 * @property {'SHOP'} type
 * @property {string[]} requires
 * @property {object} data
 * @property {number[]} data.items // Array of item IDs available in the shop
 */

/**
 * @typedef NpcEvent
 * @type {NpcEventMessage | NpcEventSceneFadeInAndOut | NpcEventHeal | NpcEventBattle | NpcEventShop}
 */
```

#### 3.1.3. Item Data (`assets/data/items.json`)

Each item will be updated with a `price`.

```json
// In assets/data/items.json
{
  "id": 1,
  "name": "Potion",
  "effect": "HEAL_30",
  "description": "A simple potion that heals for 30 HP.",
  "category": "HEAL",
  "price": 100
}
```

#### 3.1.4. NPC Data (`assets/data/npcs.json`)

An NPC can now be designated as a shopkeeper.

```json
// In assets/data/npcs.json
{
  "6": {
    "frame": 210,
    "animationKeyPrefix": "NPC_22",
    "events": [
      {
        "requires": [],
        "type": "MESSAGE",
        "data": {
          "messages": ["Welcome! What would you like to buy?"]
        }
      },
      {
        "requires": [],
        "type": "SHOP",
        "data": {
          "items": [1, 2]
        }
      }
    ]
  }
}
```

### 3.2. Shop Scene Implementation

A new scene is required for the shop UI.

#### 3.2.1. Scene Key (`src/scenes/scene-keys.js`)

```javascript
// In src/scenes/scene-keys.js
export const SCENE_KEYS = Object.freeze({
  // ... existing keys
  SHOP_SCENE: 'SHOP_SCENE',
});
```

#### 3.2.2. Scene Registration (`src/main.js`)

```javascript
// In src/main.js
import { ShopScene } from './scenes/shop-scene.js';
// ...
game.scene.add(SCENE_KEYS.SHOP_SCENE, ShopScene);
```

#### 3.2.3. `ShopScene` (New File: `src/scenes/shop-scene.js`)

This scene will manage the shop UI and logic. It will be similar to `InventoryScene` but adapted for purchasing.

*   **UI:** It will display a list of items with their prices and the player's current money.
*   **Input:** It will use a `Menu` to navigate items and a `ConfirmationMenu` to confirm purchases.
*   **Logic:**
    *   On item selection, it checks if `player.money >= item.price`.
    *   If the player can afford it, it shows a confirmation menu.
    *   On confirmation, it subtracts the cost from the player's money via `dataManager.spendMoney()` and adds the item to their inventory via `dataManager.addItem()`.
    *   It will then return to the `WorldScene`.

### 3.3. World Scene Integration

#### 3.3.1. NPC Interaction (`src/scenes/world-scene.js`)

The `#handleNpcInteraction` method will be updated to launch the `ShopScene`.

```javascript
// In #handleNpcInteraction method of src/scenes/world-scene.js
switch (eventType) {
  // ... existing cases
  case NPC_EVENT_TYPE.SHOP:
    this.#startShopScene(eventToHandle.data.items);
    break;
  default:
    exhaustiveGuard(eventType);
}

// Add a new private method to launch the scene
#startShopScene(items) {
  this.scene.launch(SCENE_KEYS.SHOP_SCENE, {
    items,
    previousSceneName: SCENE_KEYS.WORLD_SCENE,
  });
  this.scene.pause(SCENE_KEYS.WORLD_SCENE);
}
```

### 3.4. Handling Counter Interactions

To allow interaction with NPCs across counters, we will introduce interactive tiles.

#### 3.4.1. Tiled Configuration (`src/assets/tiled-keys.js`)

```javascript
// In src/assets/tiled-keys.js
export const OBJECT_LAYER_NAMES = Object.freeze({
  // ... existing layers
  INTERACTION_POINTS: 'Interaction-Points',
});

export const TILED_INTERACTION_POINT_PROPERTY = Object.freeze({
  NPC_ID: 'npcId',
  DIRECTION: 'direction',
});
```

#### 3.4.2. Tiled Map Setup

1.  In Tiled, create a new **Object Layer** named `Interaction-Points`.
2.  Place a rectangle object on the tile in front of the counter.
3.  Add custom properties to this object:
    *   `npcId` (number): The ID of the NPC behind the counter.
    *   `direction` (string): The direction the player must face (e.g., `UP`).

#### 3.4.3. World Scene Logic (`src/scenes/world-scene.js`)

The `#handlePlayerInteraction` method will be updated to prioritize these interaction points.

```javascript
// In src/scenes/world-scene.js

// ... in create()
const hasInteractionPointsLayer = map.getObjectLayer(OBJECT_LAYER_NAMES.INTERACTION_POINTS) !== null;
if (hasInteractionPointsLayer) {
  this.#interactionPointsLayer = map.getObjectLayer(OBJECT_LAYER_NAMES.INTERACTION_POINTS);
}

// ... in #handlePlayerInteraction()
#handlePlayerInteraction() {
  // ... existing initial checks ...

  const { x, y } = this.#player.sprite;
  const targetPosition = getTargetPositionFromGameObjectPositionAndDirection({ x, y }, this.#player.direction);

  // 1. Check for counter interaction
  const nearbyInteractionPoint = this.#interactionPointsLayer?.objects.find(obj => obj.x === targetPosition.x && obj.y - TILE_SIZE === targetPosition.y);

  if (nearbyInteractionPoint) {
    const props = nearbyInteractionPoint.properties;
    const requiredDirection = props.find(prop => prop.name === 'direction')?.value;
    const npcId = props.find(prop => prop.name === 'npcId')?.value;

    if (npcId !== undefined && this.#player.direction === requiredDirection) {
      const targetNpc = this.#npcs.find(npc => npc.id === npcId);
      if (targetNpc) {
        targetNpc.facePlayer(this.#player.direction);
        this.#npcPlayerIsInteractingWith = targetNpc;
        this.#handleNpcInteraction();
        return; // Interaction handled
      }
    }
  }

  // 2. If no counter interaction, proceed with existing checks (direct NPC, signs, etc.)
  // ... rest of the method
}
```

## 4. Conclusion

This plan provides a comprehensive and scalable way to implement a shop feature. It reuses existing UI and event systems while introducing new, flexible interaction methods like the counter system, which can be extended for other purposes.
