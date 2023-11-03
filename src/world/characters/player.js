import { Character } from './character.js';
import { CHARACTER_ASSET_KEYS } from '../../assets/asset-keys.js';

/**
 * @typedef {Omit<import('./character').CharacterConfig, 'assetKey'>} PlayerConfig
 */

export class Player extends Character {
  /**
   * @param {PlayerConfig} config
   */
  constructor(config) {
    super({
      ...config,
      assetKey: CHARACTER_ASSET_KEYS.PLAYER,
      assetFrame: 7,
    });
  }
}
