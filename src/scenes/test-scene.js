import Phaser from '../lib/phaser.js';
import TweakPane from '../lib/tweakpane.js';
import { Background } from '../battle/background.js';
import { ATTACK_KEYS } from '../battle/attacks/attack-keys.js';
import { IceShard } from '../battle/attacks/ice-shard.js';
import { Slash } from '../battle/attacks/slash.js';
import { BATTLE_ASSET_KEYS, MONSTER_ASSET_KEYS } from '../assets/asset-keys.js';
import { SCENE_KEYS } from './scene-keys.js';
import { makeDraggable } from '../utils/draggable.js';
import { Ball } from '../battle/ball.js';
import { sleep } from '../utils/time-utils.js';
import { Bubble1 } from '../battle/attacks/bubble1.js';
import { Bubble2 } from '../battle/attacks/bubble2.js';
import { Bubble3 } from '../battle/attacks/bubble3.js';

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
  /** @type {Ball} */
  #ball;

  /** @type {Bubble1} */
  #bubbleAttack1;
  /** @type {Bubble2} */
  #bubbleAttack2;
  /** @type {Bubble3} */
  #bubbleAttack3;

  constructor() {
    super({ key: SCENE_KEYS.TEST_SCENE });
  }

  /**
   * @returns {void}
   */
  init() {
    this.#selectedAttack = ATTACK_KEYS.BUBBLE_3;
  }

  preload() {
    this.load.setPath('assets/images/demo');
    this.load.spritesheet('BUBBLE_1', 'bubble_attack.png', {
      frameWidth: 128,
      frameHeight: 96,
    });
    this.load.image('BUBBLE_2', 'bubble_2.png');
    this.load.image('BUBBLE_3', 'bubble_225.png');
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

    this.#bubbleAttack1 = new Bubble1(this, { x: 320, y: 344 });
    this.#bubbleAttack2 = new Bubble2(this, { x: 320, y: 344 }, { x: 768, y: 144 });
    this.#bubbleAttack3 = new Bubble3(this, { x: 320, y: 344 }, { x: 768, y: 144 });

    this.#ball = new Ball({
      scene: this,
      assetKey: BATTLE_ASSET_KEYS.DAMAGED_BALL,
      assetFrame: 0,
      scale: 0.1,
    });
    this.#ball.hideBallPath();

    this.#addDataGui();

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer) => {
      console.log(pointer.x, pointer.y);
    });
  }

  /**
   * @returns {void}
   */
  #addDataGui() {
    const pane = new TweakPane.Pane();

    const f1 = pane.addFolder({
      title: 'Monsters',
      expanded: false,
    });
    const playerMonsterFolder = f1.addFolder({
      title: 'Player',
      expanded: true,
    });
    playerMonsterFolder.addBinding(this.#playerMonster, 'x', {
      min: 0,
      max: 1024,
      step: 1,
    });
    playerMonsterFolder.addBinding(this.#playerMonster, 'y', {
      min: 0,
      max: 576,
      step: 1,
    });

    const enemyMonsterFolder = f1.addFolder({
      title: 'Enemy',
      expanded: true,
    });
    enemyMonsterFolder.addBinding(this.#enemyMonster, 'x', { readonly: true });
    enemyMonsterFolder.addBinding(this.#enemyMonster, 'y', { readonly: true });

    const f2Params = {
      attack: this.#selectedAttack,
      x: 745,
      y: 120,
    };
    const f2 = pane.addFolder({
      title: 'Attacks',
      expanded: true,
    });
    f2.addBinding(f2Params, 'attack', {
      options: {
        [ATTACK_KEYS.BUBBLE_1]: ATTACK_KEYS.BUBBLE_1,
        [ATTACK_KEYS.BUBBLE_2]: ATTACK_KEYS.BUBBLE_2,
        [ATTACK_KEYS.BUBBLE_3]: ATTACK_KEYS.BUBBLE_3,
        [ATTACK_KEYS.SLASH]: ATTACK_KEYS.SLASH,
        [ATTACK_KEYS.ICE_SHARD]: ATTACK_KEYS.ICE_SHARD,
      },
    }).on('change', (ev) => {
      if (ev.value === ATTACK_KEYS.ICE_SHARD) {
        this.#selectedAttack = ATTACK_KEYS.ICE_SHARD;
        f2Params.x = this.#iceShardAttack.gameObject.x;
        f2Params.y = this.#iceShardAttack.gameObject.y;
        f2.refresh();
        return;
      }
      if (ev.value === ATTACK_KEYS.SLASH) {
        this.#selectedAttack = ATTACK_KEYS.SLASH;
        f2Params.x = this.#slashAttack.gameObject.x;
        f2Params.y = this.#slashAttack.gameObject.y;
        f2.refresh();
        return;
      }
      if (ev.value === ATTACK_KEYS.BUBBLE_1) {
        this.#selectedAttack = ATTACK_KEYS.BUBBLE_1;
        f2.refresh();
        return;
      }
      if (ev.value === ATTACK_KEYS.BUBBLE_2) {
        this.#selectedAttack = ATTACK_KEYS.BUBBLE_2;
        f2.refresh();
        return;
      }
      if (ev.value === ATTACK_KEYS.BUBBLE_3) {
        this.#selectedAttack = ATTACK_KEYS.BUBBLE_3;
        f2.refresh();
        return;
      }
    });

    const playAttackButton = f2.addButton({
      title: 'Play',
    });
    playAttackButton.on('click', () => {
      if (this.#selectedAttack === ATTACK_KEYS.ICE_SHARD) {
        this.#iceShardAttack.playAnimation();
        return;
      }
      if (this.#selectedAttack === ATTACK_KEYS.SLASH) {
        this.#slashAttack.playAnimation();
        return;
      }
      if (this.#selectedAttack === ATTACK_KEYS.BUBBLE_1) {
        this.#bubbleAttack1.playAnimation();
        return;
      }
      if (this.#selectedAttack === ATTACK_KEYS.BUBBLE_2) {
        this.#bubbleAttack2.playAnimation();
        return;
      }
      if (this.#selectedAttack === ATTACK_KEYS.BUBBLE_3) {
        this.#bubbleAttack3.playAnimation();
        return;
      }
    });

    f2.addBinding(f2Params, 'x', {
      min: 0,
      max: 1024,
      step: 1,
    }).on('change', (ev) => {
      this.#updateAttackGameObjectPosition('x', ev.value);
    });
    f2.addBinding(f2Params, 'y', {
      min: 0,
      max: 576,
      step: 1,
    }).on('change', (ev) => {
      this.#updateAttackGameObjectPosition('y', ev.value);
    });

    const f3 = pane.addFolder({
      title: 'Monster Ball',
      expanded: false,
    });
    const f3Params = {
      showPath: false,
    };
    f3.addBinding(f3Params, 'showPath', {
      label: 'show path',
    }).on('change', (ev) => {
      if (ev.value) {
        this.#ball.showBallPath();
      } else {
        this.#ball.hideBallPath();
      }
    });
    const playThrowBallButton = f3.addButton({
      title: 'Play Catch Animation',
    });
    playThrowBallButton.on('click', async () => {
      await this.#ball.playThrowBallAnimation();
      await this.#catchEnemy();
      await this.#ball.playShakeBallAnimation(2);
      await sleep(500, this);
      this.#ball.hide();
      await this.#catchEnemyFailed();
    });
  }

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

  #catchEnemy() {
    return new Promise((resolve) => {
      this.tweens.add({
        duration: 500,
        targets: this.#enemyMonster,
        alpha: {
          from: 1,
          start: 1,
          to: 0,
        },
        ease: Phaser.Math.Easing.Sine.InOut,
        onComplete: () => {
          resolve();
        },
      });
    });
  }

  #catchEnemyFailed() {
    return new Promise((resolve) => {
      this.tweens.add({
        duration: 500,
        targets: this.#enemyMonster,
        alpha: {
          from: 0,
          start: 0,
          to: 1,
        },
        ease: Phaser.Math.Easing.Sine.InOut,
        onComplete: () => {
          resolve();
        },
      });
    });
  }
}
