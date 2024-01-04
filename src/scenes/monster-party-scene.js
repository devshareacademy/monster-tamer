import { HealthBar } from '../battle/ui/health-bar.js';
import { BaseScene } from './base-scene.js';
import { SCENE_KEYS } from './scene-keys.js';

export class MonsterPartyScene extends BaseScene {
  /** @type {Phaser.GameObjects.Image[]} */
  #monsterPartyBackgrounds;
  /** @type {Phaser.GameObjects.Image} */
  #cancelButton;
  /** @type {Phaser.GameObjects.Text} */
  #infoTextGameObject;
  /** @type {HealthBar[]} */
  #healthBars;
  /** @type {Phaser.GameObjects.Text[]} */
  #healthBarTextGameObjects;

  constructor() {
    super({ key: SCENE_KEYS.MONSTER_PARTY_SCENE });
  }

  /**
   * @returns {void}
   */
  init() {
    super.init();

    this.#monsterPartyBackgrounds = [];
    this.#healthBars = [];
    this.#healthBarTextGameObjects = [];
  }

  /**
   * @returns {void}
   */
  create() {
    super.create();

    // create custom background
    // create back button
    // create info container
    // create monsters in party
  }
}
