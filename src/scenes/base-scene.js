import { ENABLE_DEV_PANEL } from '../config.js';
import { DeveloperPanel } from '../dev-tools/developer-panel.js';
import Phaser from '../lib/phaser.js';
import { Controls } from '../utils/controls.js';

export class BaseScene extends Phaser.Scene {
  /** @protected @type {Controls} */
  _controls;
  /** @protected @type {import('../dev-tools/developer-panel.js').DeveloperPanel | undefined} */
  _devPanel;

  /**
   * @param {string | Phaser.Types.Scenes.SettingsConfig} [config]
   */
  constructor(config) {
    super(config);
    if (this.constructor === BaseScene) {
      throw new Error('BaseScene is an abstract class and cannot be instantiated.');
    }
    if (ENABLE_DEV_PANEL) {
      this._devPanel = DeveloperPanel.instance;
    }
  }

  /**
   * @type {Controls}
   */
  get controls() {
    return this._controls;
  }

  /**
   * @param {any | undefined} [data]
   * @returns {void}
   */
  init(data) {
    if (data) {
      this._log(`[${this.constructor.name}:init] invoked, data provided: ${JSON.stringify(data)}`);
      return;
    }
    this._log(`[${this.constructor.name}:init] invoked`);
  }

  /**
   * @returns {void}
   */
  preload() {
    this._log(`[${this.constructor.name}:preload] invoked`);
  }

  /**
   * @returns {void}
   */
  create() {
    this._log(`[${this.constructor.name}:create] invoked`);

    this._controls = new Controls(this);
    this.events.on(Phaser.Scenes.Events.RESUME, this.handleSceneResume, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneCleanup, this);

    this.scene.bringToTop();

    if (ENABLE_DEV_PANEL) {
      this._devPanel.scene = this;
    }
  }

  /**
   * @param {DOMHighResTimeStamp} [time]
   * @returns {void}
   */
  update(time) {
    if (this._controls === undefined || this._controls.isInputLocked) {
      return;
    }

    if (!this._controls.wasFKeyPressed()) {
      return;
    }

    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
      return;
    }

    this.scale.startFullscreen();
  }

  /**
   * @param {Phaser.Scenes.Systems} sys
   * @param {any | undefined} [data]
   * @returns {void}
   */
  handleSceneResume(sys, data) {
    this._controls.lockInput = false;
    if (data) {
      this._log(`[${this.constructor.name}:handleSceneResume] invoked, data provided: ${JSON.stringify(data)}`);
      return;
    }
    this._log(`[${this.constructor.name}:handleSceneResume] invoked`);
  }

  handleSceneCleanup() {
    this._log(`[${this.constructor.name}:handleSceneCleanup] invoked`);
    this.events.off(Phaser.Scenes.Events.RESUME, this.handleSceneResume, this);
  }

  /**
   * @protected
   * @param {string} message
   */
  _log(message) {
    console.log(`%c${message}`, 'color: orange; background: black;');
  }
}
