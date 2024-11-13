import { DIRECTION } from '../common/direction.js';
import { TILE_SIZE } from '../config.js';
import { exhaustiveGuard } from './guard.js';

/**
 * @param {import('../types/typedef').Coordinate} currentPosition
 * @param {import('../common/direction').Direction} direction
 * @returns {import('../types/typedef').Coordinate}
 */
export function getTargetPositionFromGameObjectPositionAndDirection(currentPosition, direction) {
  /** @type {import('../types/typedef').Coordinate} */
  const targetPosition = { ...currentPosition };
  switch (direction) {
    case DIRECTION.DOWN:
      targetPosition.y += TILE_SIZE;
      break;
    case DIRECTION.UP:
      targetPosition.y -= TILE_SIZE;
      break;
    case DIRECTION.LEFT:
      targetPosition.x -= TILE_SIZE;
      break;
    case DIRECTION.RIGHT:
      targetPosition.x += TILE_SIZE;
      break;
    case DIRECTION.NONE:
      break;
    default:
      // We should never reach this default case
      exhaustiveGuard(direction);
  }
  return targetPosition;
}

/**
 * @param {import('../types/typedef').Coordinate} currentPosition
 * @param {import('../types/typedef').Coordinate} targetPosition
 * @returns {{ directionsToFollow: import('../common/direction.js').Direction[]; pathToFollow: import('../types/typedef').Coordinate[]; }}
 */
export function getTargetPathToGameObject(currentPosition, targetPosition) {
  /** @type {import('../common/direction.js').Direction[]} */
  const directionsToFollow = [];
  /** @type {import('../types/typedef').Coordinate[]} */
  const pathToFollow = [];
  let position = { x: currentPosition.x, y: currentPosition.y };

  // check to see if the current position is on 2d grid
  if (position.x % TILE_SIZE !== 0 || position.y % TILE_SIZE !== 0) {
    console.warn(
      'getTargetPathToGameObject: game object position does not line up with grid based on tile size, will attempt to convert'
    );
    position.x = Math.floor(position.x / TILE_SIZE) * TILE_SIZE;
    position.y = Math.floor(position.y / TILE_SIZE) * TILE_SIZE;
  }

  // check to see if target position is on 2d grid
  const positionToMoveTo = { x: targetPosition.x, y: targetPosition.y };
  if (positionToMoveTo.x % TILE_SIZE !== 0 || positionToMoveTo.y % TILE_SIZE !== 0) {
    console.warn(
      'getTargetPathToGameObject: target position does not line up with grid based on tile size, will attempt to convert'
    );
    positionToMoveTo.x = Math.floor(positionToMoveTo.x / TILE_SIZE) * TILE_SIZE;
    positionToMoveTo.y = Math.floor(positionToMoveTo.y / TILE_SIZE) * TILE_SIZE;
  }

  while (position.x !== targetPosition.x || position.y !== targetPosition.y) {
    const targetDirection = getTargetDirectionFromGameObjectPosition(position, targetPosition);
    directionsToFollow.push(targetDirection);
    position = getTargetPositionFromGameObjectPositionAndDirection(position, targetDirection);
    pathToFollow.push(position);
  }

  return {
    directionsToFollow,
    pathToFollow,
  };
}

/**
 * @param {import('../types/typedef').Coordinate} currentPosition
 * @param {import('../types/typedef').Coordinate} targetPosition
 * @returns {import('../common/direction.js').Direction}
 */
export function getTargetDirectionFromGameObjectPosition(currentPosition, targetPosition) {
  /** @type {import('../common/direction.js').Direction} */
  let targetDirection = DIRECTION.RIGHT;
  if (targetPosition.y > currentPosition.y) {
    targetDirection = DIRECTION.DOWN;
  } else if (targetPosition.y < currentPosition.y) {
    targetDirection = DIRECTION.UP;
  } else if (targetPosition.x < currentPosition.x) {
    targetDirection = DIRECTION.LEFT;
  }
  return targetDirection;
}
