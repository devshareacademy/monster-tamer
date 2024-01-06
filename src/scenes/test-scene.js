import Phaser from '../lib/phaser.js';
import TweakPane from '../lib/tweakpane.js';
import { Background } from '../battle/background.js';
import { ATTACK_KEYS } from '../battle/attacks/attack-keys.js';
import { IceShard } from '../battle/attacks/ice-shard.js';
import { Slash } from '../battle/attacks/slash.js';
import { MONSTER_ASSET_KEYS } from '../assets/asset-keys.js';
import { SCENE_KEYS } from './scene-keys.js';
import { makeDraggable } from '../utils/draggable.js';

export class TestScene extends Phaser.Scene {
  /** @type {import('../battle/attacks/attack-keys.js').AttackKeys} */
  #selectedAttack;
  /** @type {IceShard} */
  #iceShardAttack;
  /** @type {Slash} */
  #slashAttack;
  /** @type {Phaser.GameObjects.Image} */
  #playerMonster;
  /** @type {Phaser.GameObjects.Image} */
  #enemyMonster;

  constructor() {
    super({ key: SCENE_KEYS.TEST_SCENE });
  }

  /**
   * @returns {void}
   */
  init() {
    this.#selectedAttack = ATTACK_KEYS.SLASH;
  }

  /**
   * @returns {void}
   */
  create() {
    const background = new Background(this);
    background.showForest();

    this.#playerMonster = this.add.image(256, 316, MONSTER_ASSET_KEYS.IGUANIGNITE, 0).setFlipX(true);
    this.#enemyMonster = this.add.image(768, 144, MONSTER_ASSET_KEYS.CARNODUSK, 0).setFlipX(false);
    makeDraggable(this.#enemyMonster);

    this.#iceShardAttack = new IceShard(this, { x: 256, y: 344 });
    this.#slashAttack = new Slash(this, { x: 745, y: 140 });

    this.#addDataGui();
  }

  /**
   * @returns {void}
   */
  #addDataGui() {}

  /**
   * @param {'x' | 'y'} param
   * @param {number} value
   * @returns {void}
   */
  #updateAttackGameObjectPosition(param, value) {
    if (param === 'x') {
      if (this.#selectedAttack === ATTACK_KEYS.SLASH) {
        this.#slashAttack.gameObject.setX(value);
        return;
      }
      if (this.#selectedAttack === ATTACK_KEYS.ICE_SHARD) {
        this.#iceShardAttack.gameObject.setX(value);
        return;
      }
    }
    if (this.#selectedAttack === ATTACK_KEYS.SLASH) {
      this.#slashAttack.gameObject.setY(value);
      return;
    }
    if (this.#selectedAttack === ATTACK_KEYS.ICE_SHARD) {
      this.#iceShardAttack.gameObject.setY(value);
      return;
    }
  }
}
