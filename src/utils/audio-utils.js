import { SOUND_OPTIONS } from '../common/options.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from './data-manager.js';

/**
 * @param {Phaser.Scene} scene The Phaser 3 scene to play audio in
 * @param {string} audioKey The key of the audio asset that should be played
 * @returns {void}
 */
export function playBackgroundMusic(scene, audioKey) {
  if (dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND) !== SOUND_OPTIONS.ON) {
    return;
  }

  // get all of the audio objects that are currently playing so we can check if the sound we
  // want to play is already playing, and to stop all other sounds
  const existingSounds = scene.sound.getAllPlaying();
  let musicAlreadyPlaying = false;

  existingSounds.forEach((sound) => {
    if (sound.key === audioKey) {
      musicAlreadyPlaying = true;
      return;
    }
    sound.stop();
  });

  if (!musicAlreadyPlaying) {
    scene.sound.play(audioKey, {
      loop: true,
    });
  }
}

/**
 * @param {Phaser.Scene} scene The Phaser 3 scene to play audio in
 * @param {string} audioKey The key of the audio asset that should be played
 * @returns {void}
 */
export function playSoundFx(scene, audioKey) {
  if (dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND) !== SOUND_OPTIONS.ON) {
    return;
  }

  const baseVolume = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME) * 0.25;

  scene.sound.play(audioKey, {
    volume: 20 * baseVolume,
  });
}

/**
 * @param {Phaser.Scene} scene The Phaser 3 scene to get the sound manager reference from
 * @returns {void}
 */
export function setGlobalSoundSettings(scene) {
  scene.sound.setVolume(dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME) * 0.25);
  scene.sound.setMute(dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND) === SOUND_OPTIONS.OFF);
}
