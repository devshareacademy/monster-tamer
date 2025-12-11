# Player Running Feature

## 1. Goal

This document outlines the plan to implement a running mechanic for the player character. This feature will allow the player to move at an increased speed by holding down a designated key, similar to classic RPGs. This will improve the pace of the game and enhance the player's control over their movement.

## 2. Proposed Changes

The implementation will be broken down into the following steps:

1.  **Update `Controls` Class:** Modify `src/utils/controls.js` to add a control for the run action (e.g., the `Shift` key).
2.  **Update `Character` Class:** Enhance `src/world/characters/character.js` to support variable movement speeds.
3.  **Update `Player` Class:** Modify `src/world/characters/player.js` to use the new running speed and adjust animations accordingly.
4.  **Update `WorldScene`:** Update `src/scenes/world-scene.js` to pass the running state to the player character based on user input.

---

## 3. Detailed Implementation Steps

### 3.1. Controls Class (`src/utils/controls.js`)

To support running, a new method will be added to check if the `Shift` key is being held down. We will use the existing `shift` key object created by `createCursorKeys()` to avoid adding a redundant listener.

```javascript
// In src/utils/controls.js
import Phaser from '../lib/phaser.js';
import { DIRECTION } from '../common/direction.js';

export class Controls {
  // ... existing properties and constructor

  // ... existing methods

  /** @returns {boolean} */
  wasBackKeyPressed() {
    if (this.#cursorKeys === undefined) {
      return false;
    }
    return Phaser.Input.Keyboard.JustDown(this.#cursorKeys.shift);
  }

  /**
   * Returns if the shift key is currently being held down.
   * @returns {boolean}
   */
  isShiftKeyDown() {
    if (this.#cursorKeys === undefined) {
      return false;
    }
    return this.#cursorKeys.shift.isDown;
  }
}
```

### 3.2. Character Class (`src/world/characters/character.js`)

The `Character` class will be updated to handle different movement speeds. A new `_speed` property will control the duration of the movement tween.

```javascript
// In src/world/characters/character.js
// ... imports

// ...

export class Character {
  // ... existing properties
  /** @protected @type {number} */
  _speed;
  /** @protected @type {boolean} */
  _isRunning;

  constructor(config) {
    // ... existing constructor logic
    this._speed = 800; // Default speed
    this._isRunning = false;
  }

  // ... existing methods

  /**
   * @param {import('../../common/direction.js').Direction} direction
   * @param {boolean} [isRunning=false]
   * @returns {void}
   */
  moveCharacter(direction, isRunning = false) {
    if (this._isMoving) {
      return;
    }
    this._isRunning = isRunning;
    this._speed = this._isRunning ? 400 : 800; // Faster speed when running
    this._moveSprite(direction);
  }

  // ...

  #handleSpriteMovement() {
    // ... existing logic before tween

    this._scene.add.tween({
      delay: 0,
      duration: this._speed, // Use the new speed property
      y: {
        from: this._phaserGameObject.y,
        start: this._phaserGameObject.y,
        to: this._targetPosition.y,
      },
      x: {
        from: this._phaserGameObject.x,
        start: this._phaserGameObject.x,
        to: this._targetPosition.x,
      },
      targets: this._phaserGameObject,
      onComplete: () => {
        this._isMoving = false;
        this._isRunning = false; // Reset running state
        this._previousTargetPosition = { ...this._targetPosition };
        if (this._spriteGridMovementFinishedCallback) {
          this._spriteGridMovementFinishedCallback();
        }
      },
    });
  }
}
```

### 3.3. Player Class (`src/world/characters/player.js`)

The `Player` class will override `moveCharacter` to handle animation speed changes when running by adjusting the animation's `timeScale`.

```javascript
// In src/world/characters/player.js
// ... imports

export class Player extends Character {
  // ... existing properties and constructor

  /**
   * @param {import('../../common/direction.js').Direction} direction
   * @param {boolean} [isRunning=false]
   * @returns {void}
   */
  moveCharacter(direction, isRunning = false) {
    super.moveCharacter(direction, isRunning);

    switch (this._direction) {
      case DIRECTION.DOWN:
      case DIRECTION.LEFT:
      case DIRECTION.RIGHT:
      case DIRECTION.UP:
        if (
          !this._phaserGameObject.anims.isPlaying ||
          this._phaserGameObject.anims.currentAnim?.key !== `PLAYER_${this._direction}`
        ) {
          this._phaserGameObject.play(`PLAYER_${this._direction}`);
        }
        // Adjust animation speed using timeScale. 2 is double speed, 1 is normal.
        this._phaserGameObject.anims.timeScale = this._isRunning ? 2 : 1;
        break;
      case DIRECTION.NONE:
        break;
      default:
        // We should never reach this default case
        exhaustiveGuard(this._direction);
    }

    // ... existing entrance logic
  }
}
```

### 3.4. World Scene (`src/scenes/world-scene.js`)

The `WorldScene`'s `update` method will be modified to check for the run input and pass it to the player.

```javascript
// In src/scenes/world-scene.js
// ... imports

export class WorldScene extends BaseScene {
  // ... existing properties

  update(time) {
    // ... existing update logic before player movement

    const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();
    const selectedDirectionHeldDown = this._controls.getDirectionKeyPressedDown();
    const isRunning = this._controls.isShiftKeyPressedDown(); // Check for run input

    // ...

    if (selectedDirectionHeldDown !== DIRECTION.NONE && !this.#isPlayerInputLocked()) {
      this.#player.moveCharacter(selectedDirectionHeldDown, isRunning); // Pass running state
    }

    // ... rest of the update method
  }
}
```

## 4. Conclusion

This implementation provides a simple and effective running mechanic. It cleanly separates the input handling from the character logic and allows for easy adjustments to speed and animations. This feature enhances the gameplay experience by giving players more control over their movement through the world.
