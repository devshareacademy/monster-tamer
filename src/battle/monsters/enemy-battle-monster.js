import { BattleMonster } from './battle-monster.js';

/** @type {import('../../types/typedef').Coordinate} */
const ENEMY_POSITION = Object.freeze({
  x: 768,
  y: 144,
});

export class EnemyBattleMonster extends BattleMonster {
  /**
   *
   * @param {import("../../types/typedef").BattleMonsterConfig} config
   */
  constructor(config) {
    super({ ...config, scaleHealthBarBackgroundImageByY: 0.8 }, ENEMY_POSITION);
  }
}
