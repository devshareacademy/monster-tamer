/**
 * @param {Phaser.GameObjects.Sprite} gameObject
 * @param {import("../types/typedef").CameraRegion[]} cameraRegions
 */
function getCameraRegionsForGameObject(gameObject, cameraRegions) {
  return cameraRegions.filter((region) => {
    return (
      gameObject.x >= region.x &&
      gameObject.x <= region.x + region.width &&
      gameObject.y >= region.y &&
      gameObject.y <= region.y + region.height
    );
  });
}

/**
 * Updates the main camera bounds in a phaser scene based on the provided
 * game objects position and the available camera regions.
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Sprite} gameObject
 * @param {import("../types/typedef").CameraRegion[]} cameraRegions
 */
export function updateMainCameraBounds(scene, gameObject, cameraRegions) {
  const filteredRegions = getCameraRegionsForGameObject(gameObject, cameraRegions);
  console.log(filteredRegions);
  if (filteredRegions.length === 0) {
    return;
  }
  const region = filteredRegions[0];
  scene.cameras.main.setBounds(region.x, region.y, region.width, region.height);
}
