export function sleep(milliseconds, scene) {
  return new Promise((resolve) => {
    scene.time.delayedCall(milliseconds, () => {
      resolve();
    });
  });
}
