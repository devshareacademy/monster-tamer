import { CHARACTER_ASSET_KEYS } from '../../assets/asset-keys.js';
import { Character } from './character.js';

/**
 * @typedef {Omit<import('./character.js').CharacterConfig, 'assetKey'>} PlayerConfig
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
