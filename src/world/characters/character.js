import Phaser from '../../lib/phaser.js';
import { DIRECTION } from '../../common/direction.js';
import { getTargetPositionFromGameObjectPositionAndDirection } from '../../utils/grid-utils.js';

/**
 * @typedef CharacterConfig
 * @type {object}
 * @property {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
 * @property {string} assetKey the name of the asset key that should be used for this character
 * @property {number} [assetFrame=0] if the asset key is tied to a spritesheet, this frame will be used, defaults to 0
 * @property {import('../../types/typedef.js').Coordinate} position the starting position of the character
 * @property {import('../../common/direction.js').Direction} direction the direction the character is currently facing
 * @property {() => void} [spriteGridMovementFinishedCallback] an optional callback that will be called after each step of the grid movement is complete
 */

export class Character {
  /** @type {Phaser.Scene} */
  _scene;
  /** @type {Phaser.GameObjects.Sprite} */
  _phaserGameObject;
  /** @protected @type {import('../../common/direction.js').Direction} */
  _direction;
  /** @protected @type {import('../../common/direction.js').Direction} */
  _inputDirection;
  /** @protected @type {boolean} */
  _isMoving;
  /** @protected @type {import('../../types/typedef.js').Coordinate} */
  _targetPosition;
  /** @protected @type {import('../../types/typedef.js').Coordinate} */
  _previousTargetPosition;
  /** @protected @type {() => void | undefined} */
  _spriteGridMovementFinishedCallback;

  /**
   * @param {CharacterConfig} config
   */
  constructor(config) {
    if (this.constructor === Character) {
      throw new Error('Character is an abstract class and cannot be instantiated.');
    }

    this._scene = config.scene;
    this._direction = config.direction;
    this._inputDirection = DIRECTION.NONE;
    this._isMoving = false;
    this._targetPosition = { ...config.position };
    this._previousTargetPosition = { ...config.position };
    this._phaserGameObject = this._scene.add
      .sprite(config.position.x, config.position.y, config.assetKey, config.assetFrame || 0)
      .setOrigin(0);
    this._spriteGridMovementFinishedCallback = config.spriteGridMovementFinishedCallback;
  }

  /** @type {boolean} */
  get isMoving() {
    return this._isMoving;
  }

  /** @type {import('../../common/direction.js').Direction} */
  get direction() {
    return this._direction;
  }

  /**
   * @param {import('../../common/direction.js').Direction} direction
   * @returns {void}
   */
  moveCharacter(direction) {
    if (this._isMoving) {
      return;
    }
    this._direction = direction;
    this._moveSprite(this._direction);

    /* // moves to grid utils function
    switch (direction) {
      case DIRECTION.DOWN:
        this._phaserGameObject.y += TILE_SIZE;
        break;
      case DIRECTION.UP:
        this._phaserGameObject.y -= TILE_SIZE;
        break;
      case DIRECTION.LEFT:
        this._phaserGameObject.x -= TILE_SIZE;
        break;
      case DIRECTION.RIGHT:
        this._phaserGameObject.x += TILE_SIZE;
        break;
      case DIRECTION.NONE:
        break;
      default:
        exhaustiveGuard(direction);
    }
    */
  }

  /**
   * @protected
   * @param {import('../../common/direction.js').Direction} direction
   * @returns {void}
   */
  _moveSprite(direction) {
    this._inputDirection = direction;
    if (this._isMoving) {
      return;
    }
    this._direction = this._inputDirection;

    if (this._isBlockingTile()) {
      return;
    }
    this._isMoving = true;

    this.#handleSpriteMovement();
  }

  /**
   * @protected
   * @returns {boolean}
   */
  _isBlockingTile() {
    if (this._direction === DIRECTION.NONE) {
      return false;
    }

    // TODO: add in collision logic
    return false;
  }

  /**
   * @returns {void}
   */
  #handleSpriteMovement() {
    if (this._direction === DIRECTION.NONE) {
      return;
    }

    const updatedPosition = getTargetPositionFromGameObjectPositionAndDirection(this._targetPosition, this._direction);
    this._previousTargetPosition = { ...this._targetPosition };
    this._targetPosition.x = updatedPosition.x;
    this._targetPosition.y = updatedPosition.y;

    this._scene.add.tween({
      delay: 0,
      duration: 600,
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
        // update previous and target positions
        this._previousTargetPosition = { ...this._targetPosition };
        if (this._spriteGridMovementFinishedCallback) {
          this._spriteGridMovementFinishedCallback();
        }
      },
    });
  }
}
