import { BattleMonster } from './battle-monster.js';

/** @type {import('../../types/typedef.js').Coordinate} */
const Player_POSITION = Object.freeze({
  x: 256,
  y: 316,
});

export class PlayerBattleMonster extends BattleMonster {
  /**
   * @param {import('../../types/typedef.js').BattleMonsterConfig} config
   */
  constructor(config) {
    super(config, Player_POSITION);
    this._phaserGameObject.setFlipX(true);
  }
}
