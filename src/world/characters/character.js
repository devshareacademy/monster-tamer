import Phaser from '../../lib/phaser.js';
import { DIRECTION } from '../../common/direction.js';
import { getTargetPositionFromGameObjectPositionAndDirection } from '../../utils/grid-utils.js';
import { exhaustiveGuard } from '../../utils/guard.js';

/**
 * @typedef CharacterIdleFrameConfig
 * @type {object}
 * @property {number} LEFT
 * @property {number} RIGHT
 * @property {number} UP
 * @property {number} DOWN
 * @property {number} NONE
 */

/**
 * @typedef BaseCharacterConfig
 * @type {object}
 * @property {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
 * @property {import('../../types/typedef.js').Coordinate} position the starting position of the character
 * @property {Phaser.Tilemaps.TilemapLayer} [collisionLayer]
 * @property {Character[]} [otherCharactersToCheckForCollisionWith=[]]
 * @property {import('../../common/direction.js').Direction} direction
 * @property {() => void} [spriteGridMovementFinishedCallback]
 */

/**
 * @typedef CharacterConfigProps
 * @type {object}
 * @property {string} assetKey the name of the asset key that should be used for this character
 * @property {import('../../types/typedef.js').Coordinate} [origin={ x:0, y:0 }]
 * @property {boolean} [isPlayer=false]
 * @property {CharacterIdleFrameConfig} idleFrame
 */

/**
 * @typedef {BaseCharacterConfig & CharacterConfigProps} CharacterConfig
 */

export class Character {
  /** @protected @type {Phaser.Scene} */
  _scene;
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _phaserGameObject;
  /** @protected @type {import('../../common/direction.js').Direction} */
  _direction;
  /** @protected @type {import('../../common/direction.js').Direction} */
  _inputDirection;
  /** @protected @type {Phaser.Tilemaps.TilemapLayer} */
  _collisionLayer;
  /** @protected @type {boolean} */
  _isMoving;
  /** @protected @type {import('../../types/typedef.js').Coordinate} */
  _targetPosition;
  /** @protected @type {import('../../types/typedef.js').Coordinate} */
  _previousTargetPosition;
  /** @protected @type {boolean} */
  _isPlayer;
  /** @protected @type {import('../../types/typedef.js').Coordinate} */
  _origin;
  /** @protected @type {CharacterIdleFrameConfig} */
  _idleFrame;
  /** @protected @type {Character[]} */
  _otherCharactersToCheckForCollisionWith;
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
    this._collisionLayer = config.collisionLayer;
    this._isMoving = false;
    this._targetPosition = { ...config.position };
    this._previousTargetPosition = { ...config.position };
    this._isPlayer = config.isPlayer || false;
    this._origin = config.origin ? { ...config.origin } : { x: 0, y: 0 };
    this._idleFrame = { ...config.idleFrame };
    this._otherCharactersToCheckForCollisionWith = config.otherCharactersToCheckForCollisionWith || [];
    this._phaserGameObject = this._scene.add
      .sprite(config.position.x, config.position.y, config.assetKey, this._getIdleFrame())
      .setOrigin(this._origin.x, this._origin.y);
    this._spriteGridMovementFinishedCallback = config.spriteGridMovementFinishedCallback;
  }

  /** @type {Phaser.GameObjects.Sprite} */
  get sprite() {
    return this._phaserGameObject;
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
  }

  /**
   * @param {Character} character
   * @returns {void}
   */
  addCharacterToCheckForCollisionsWith(character) {
    this._otherCharactersToCheckForCollisionWith.push(character);
  }

  /**
   * @param {DOMHighResTimeStamp} time
   * @returns {void}
   */
  update(time) {
    if (this._isMoving) {
      return;
    }

    // stop current animation and show idle frame
    const idleFrame = this._phaserGameObject.anims.currentAnim?.frames[1].frame.name;
    this._phaserGameObject.anims.stop();
    if (!idleFrame) {
      return;
    }
    switch (this._direction) {
      case DIRECTION.DOWN:
      case DIRECTION.LEFT:
      case DIRECTION.RIGHT:
      case DIRECTION.UP:
        this._phaserGameObject.setFrame(idleFrame);
        break;
      case DIRECTION.NONE:
        break;
      default:
        // We should never reach this default case
        exhaustiveGuard(this._direction);
    }
  }

  /**
   * @protected
   * @returns {number}
   */
  _getIdleFrame() {
    return this._idleFrame[this._direction];
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

    // if (this._isPlayer) {
    //   // customEmitter.emit(PLAYER_EVENTS.PLAYER_MOVEMENT_STARTED);
    // }

    this.#handleSpriteMovement();
  }

  /**
   * @returns {boolean}
   */
  _isBlockingTile() {
    if (this._direction === DIRECTION.NONE) {
      return false;
    }

    const targetPosition = { ...this._targetPosition };
    const updatedPosition = getTargetPositionFromGameObjectPositionAndDirection(targetPosition, this._direction);

    return (
      this.#doesPositionCollideWithCollisionLayer(updatedPosition) ||
      this.#doesPositionCollideWithOtherCharacter(updatedPosition)
    );
  }

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
        // if (this._isPlayer) {
        //   //customEmitter.emit(PLAYER_EVENTS.PLAYER_MOVEMENT_FINISHED, this._direction);
        // }
        if (this._isPlayer && this._spriteGridMovementFinishedCallback) {
          this._spriteGridMovementFinishedCallback();
        }
      },
    });
  }

  /**
   * @param {import('../../types/typedef.js').Coordinate} position
   * @returns {boolean}
   */
  #doesPositionCollideWithCollisionLayer(position) {
    const { x, y } = position;
    if (!this._collisionLayer) {
      return false;
    }
    const tile = this._collisionLayer.getTileAtWorldXY(x, y, true);
    return tile.index !== -1;
  }

  /**
   * @param {import('../../types/typedef.js').Coordinate} position
   * @returns {boolean}
   */
  #doesPositionCollideWithOtherCharacter(position) {
    const { x, y } = position;
    if (this._otherCharactersToCheckForCollisionWith.length === 0) {
      return false;
    }

    // checks if the new position that this character wants to move to is the same position that another
    // character is currently at, or was previously at and is moving towards currently
    const collidesWithACharacter = this._otherCharactersToCheckForCollisionWith.some((character) => {
      return (
        (character._targetPosition.x === x && character._targetPosition.y === y) ||
        (character._previousTargetPosition.x === x && character._previousTargetPosition.y === y)
      );
    });
    return collidesWithACharacter;
  }
}