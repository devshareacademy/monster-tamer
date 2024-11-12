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
