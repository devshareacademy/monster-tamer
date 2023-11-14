import Phaser from '../../lib/phaser.js';
import { exhaustiveGuard } from '../../utils/guard.js';
import { ATTACK_KEYS } from './attack-keys.js';
import { IceShard } from './ice-shard.js';
import { Slash } from './slash.js';

/**
 * @typedef {keyof typeof ATTACK_TARGET} AttackTarget
 */

/** @enum {AttackTarget} */
export const ATTACK_TARGET = Object.freeze({
  PLAYER: 'PLAYER',
  ENEMY: 'ENEMY',
});

export class AttackManager {
  /** @type {Phaser.Scene} */
  #scene;
  /** @type {boolean} */
  #skipBattleAnimations;
  /** @type {IceShard} */
  #iceShardAttack;
  /** @type {Slash} */
  #slashAttack;

  /**
   * @param {Phaser.Scene} scene the Phaser 3 Scene the attack game object will be added to
   * @param {boolean} [skipBattleAnimations=false] used to skip all animations tied to the monster attack during battle
   */
  constructor(scene, skipBattleAnimations = false) {
    this.#scene = scene;
    this.#skipBattleAnimations = skipBattleAnimations;
  }

  /**
   * @param {import('./attack-keys.js').AttackKeys} attack
   * @param {AttackTarget} target
   * @param {() => void} callback
   * @returns {void}
   */
  playAttackAnimation(attack, target, callback) {
    if (this.#skipBattleAnimations) {
      callback();
      return;
    }

    // if attack target is enemy
    let x = 745;
    let y = 140;
    if (target === ATTACK_TARGET.PLAYER) {
      x = 256;
      y = 344;
    }

    switch (attack) {
      case ATTACK_KEYS.ICE_SHARD:
        if (!this.#iceShardAttack) {
          this.#iceShardAttack = new IceShard(this.#scene, { x, y });
        }
        this.#iceShardAttack.gameObject.setPosition(x, y);
        this.#iceShardAttack.playAnimation(callback);
        break;
      case ATTACK_KEYS.SLASH:
        if (!this.#slashAttack) {
          this.#slashAttack = new Slash(this.#scene, { x, y });
        }
        this.#slashAttack.gameObject.setPosition(x, y);
        this.#slashAttack.playAnimation(callback);
        break;
      default:
        exhaustiveGuard(attack);
    }
  }
}
