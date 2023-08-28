import Phaser from './lib/phaser.js';
import { SCENE_KEYS } from './scenes/scene-keys.js';
import { PreloadScene } from './scenes/preload-scene.js';

const game = new Phaser.Game({
  parent: 'game-container',
});

game.scene.add(SCENE_KEYS.PRELOAD_SCENE, PreloadScene);
game.scene.start(SCENE_KEYS.PRELOAD_SCENE);
