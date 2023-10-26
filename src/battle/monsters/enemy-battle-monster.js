import { BattleMonster } from './battle-monster.js';

/** @type {import('../../types/typedef.js').Coordinate} */
const ENEMY_POSITION = Object.freeze({
  x: 768,
  y: 144,
});

export class EnemyBattleMonster extends BattleMonster {
  /**
   * @param {import('../../types/typedef.js').BattleMonsterConfig} config
   */
  constructor(config) {
    super(config, ENEMY_POSITION);
  }
}
