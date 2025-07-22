import { OBJECT_LAYER_NAMES } from '../assets/tiled-keys.js';

/**
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
 * Creates an object with the id property as the key and the value as the related TileObject.
 * @param {Phaser.Types.Tilemaps.TiledObject[]} objects
 * @returns {{ [key: number]: Phaser.Types.Tilemaps.TiledObject; }}
 */
function createMapFromObjectsWithIdProperty(objects) {
  /** @type {{ [key: number]: Phaser.Types.Tilemaps.TiledObject; }} */
  const map = {};
  objects.forEach((obj) => {
    const id = /** @type {import('../types/typedef.js').TiledObjectProperty[]} */ (obj.properties).find(
      (property) => property.name === 'id'
    ).value;
    map[id] = obj;
  });
  return map;
}

/**
 * Creates an object with the camera bounds ids as keys and the values as the related TileObjects
 * for the camera bounds.
 * @param {Phaser.Tilemaps.Tilemap} map
 * @returns {{ [key: number]: Phaser.Types.Tilemaps.TiledObject }}
 */
export function createCameraBoundsMap(map) {
  const filteredObjects = getObjectsFromLayerWithIdProperty(map, OBJECT_LAYER_NAMES.CAMERA_BOUNDS);
  return createMapFromObjectsWithIdProperty(filteredObjects);
}

/**
 * Creates an array of camera regions from the camera bounds layer.
 * @param {Phaser.Tilemaps.Tilemap} map
 * @returns {import('../types/typedef.js').CameraRegion[]}
 */
export function createCameraRegions(map) {
  const filteredObjects = getObjectsFromLayerWithIdProperty(map, OBJECT_LAYER_NAMES.CAMERA_BOUNDS);
  const cameraRegions = filteredObjects.map((obj) => ({
    id: obj.properties.find((p) => p.name === 'id').value,
    x: obj.x,
    y: obj.y - obj.height, // adjust y since tile objects are bottom aligned
    width: obj.width,
    height: obj.height,
  }));
  return cameraRegions;
}
