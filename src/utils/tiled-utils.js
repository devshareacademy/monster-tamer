import { OBJECT_LAYER_NAMES } from '../assets/tiled-keys.js';

/**
 * Gets the objects from a Tiled Object layer.
 * @param {Phaser.Tilemaps.Tilemap} map
 * @param {string} layerName
 * @returns {Phaser.Types.Tilemaps.TiledObject[]}
 */
function getObjectsFromLayer(map, layerName) {
  const layer = map.getObjectLayer(layerName);
  if (!layer) {
    return [];
  }
  return layer.objects;
}

/**
 * Gets the objects from a Tiled Object layer, and only returns objects
 * that have a custom property called id.
 * @param {Phaser.Tilemaps.Tilemap} map
 * @param {string} layerName
 * @returns {Phaser.Types.Tilemaps.TiledObject[]}
 */
function getObjectsFromLayerWithIdProperty(map, layerName) {
  const objects = getObjectsFromLayer(map, layerName);
  return objects.filter((obj) => {
    return /** @type {import('../types/typedef.js').TiledObjectProperty[]} */ (obj.properties).some(
      (property) => property.name === 'id'
    );
  });
}

/**
 * Creates an array of camera regions from the camera bounds layer.
 * @param {Phaser.Tilemaps.Tilemap} map
 * @returns {import('../types/typedef.js').CameraRegion[]}
 */
export function createCameraRegions(map) {
  const filteredObjects = getObjectsFromLayerWithIdProperty(map, OBJECT_LAYER_NAMES.CAMERA_BOUNDS);
  /** @type {import('../types/typedef').CameraRegion[]} */
  const cameraRegions = filteredObjects.map((obj) => {
    return {
      id: obj.properties.find((property) => property.name == 'id').value,
      x: obj.x,
      y: obj.y - obj.height,
      width: obj.width,
      height: obj.height,
    };
  });
  return cameraRegions;
}
