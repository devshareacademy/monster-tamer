import Phaser from './lib/phaser.js';

const gameConfig = {
  type: Phaser.CANVAS,
  pixelArt: false,
  scale: {
    parent: 'game-container',
    width: 1024,
    height: 576,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    mode: Phaser.Scale.FIT,
  },
  backgroundColor: '#000000',
  scene: [],
};

const game = new Phaser.Game(gameConfig);
