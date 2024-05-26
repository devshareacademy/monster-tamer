import Phaser from '../lib/phaser.js';
import { BattleMenu } from '../battle/ui/menu/battle-menu.js';
import { SCENE_KEYS } from './scene-keys.js';
import { DIRECTION } from '../common/direction.js';
import { EnemyBattleMonster } from '../battle/monsters/enemy-battle-monster.js';
import { PlayerBattleMonster } from '../battle/monsters/player-battle-monster.js';
import { StateMachine } from '../utils/state-machine.js';
import { Background } from '../battle/background.js';
import { ATTACK_TARGET, AttackManager } from '../battle/attacks/attack-manager.js';
import { createSceneTransition } from '../utils/scene-transition.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import { BATTLE_SCENE_OPTIONS } from '../common/options.js';
import { BaseScene } from './base-scene.js';
import { DataUtils } from '../utils/data-utils.js';
import { AUDIO_ASSET_KEYS } from '../assets/asset-keys.js';
import { playBackgroundMusic, playSoundFx } from '../utils/audio-utils.js';
import { calculateExpGainedFromMonster } from '../utils/leveling-utils.js';

const BATTLE_STATES = Object.freeze({
  INTRO: 'INTRO',
  PRE_BATTLE_INFO: 'PRE_BATTLE_INFO',
  BRING_OUT_MONSTER: 'BRING_OUT_MONSTER',
  PLAYER_INPUT: 'PLAYER_INPUT',
  ENEMY_INPUT: 'ENEMY_INPUT',
  BATTLE: 'BATTLE',
  POST_ATTACK_CHECK: 'POST_ATTACK_CHECK',
  FINISHED: 'FINISHED',
  FLEE_ATTEMPT: 'FLEE_ATTEMPT',
  GAIN_EXPERIENCE: 'GAIN_EXPERIENCE',
  USED_ITEM: 'USED_ITEM',
  HEAL_ITEM_USED: 'HEAL_ITEM_USED',
  CAPTURE_ITEM_USED: 'CAPTURE_ITEM_USED',
});

/**
 * @typedef BattleSceneData
 * @type {object}
 * @property {import('../types/typedef.js').Monster[]} playerMonsters
 * @property {import('../types/typedef.js').Monster[]} enemyMonsters
 */

export class BattleScene extends BaseScene {
  /** @type {BattleMenu} */
  #battleMenu;
  /** @type {EnemyBattleMonster} */
  #activeEnemyMonster;
  /** @type {PlayerBattleMonster} */
  #activePlayerMonster;
  /** @type {number} */
  #activePlayerAttackIndex;
  /** @type {StateMachine} */
  #battleStateMachine;
  /** @type {AttackManager} */
  #attackManager;
  /** @type {boolean} */
  #skipAnimations;
  /** @type {number} */
  #activeEnemyAttackIndex;
  /** @type {BattleSceneData} */
  #sceneData;
  /** @type {number} */
  #activePlayerMonsterPartyIndex;
  /** @type {boolean} */
  #playerKnockedOut;

  constructor() {
    super({
      key: SCENE_KEYS.BATTLE_SCENE,
    });
  }

  /**
   * @param {BattleSceneData} data
   * @returns {void}
   */
  init(data) {
    super.init(data);
    this.#sceneData = data;

    // added for testing from preload scene
    if (Object.keys(data).length === 0) {
      this.#sceneData = {
        enemyMonsters: [DataUtils.getMonsterById(this, 2)],
        playerMonsters: [dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY)[0]],
      };
    }

    this.#activePlayerAttackIndex = -1;
    this.#activeEnemyAttackIndex = -1;
    this.#activePlayerMonsterPartyIndex = 0;

    /** @type {import('../common/options.js').BattleSceneMenuOptions | undefined} */
    const chosenBattleSceneOption = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_BATTLE_SCENE_ANIMATIONS);
    if (chosenBattleSceneOption === undefined || chosenBattleSceneOption === BATTLE_SCENE_OPTIONS.ON) {
      this.#skipAnimations = false;
      return;
    }
    this.#skipAnimations = true;
    this.#playerKnockedOut = false;
  }

  /**
   * @returns {void}
   */
  create() {
    super.create();

    // create main background
    const background = new Background(this);
    background.showForest();

    // create the player and enemy monsters
    this.#activeEnemyMonster = new EnemyBattleMonster({
      scene: this,
      monsterDetails: this.#sceneData.enemyMonsters[0],
      skipBattleAnimations: this.#skipAnimations,
    });
    this.#activePlayerMonster = new PlayerBattleMonster({
      scene: this,
      monsterDetails: this.#sceneData.playerMonsters[0],
      skipBattleAnimations: this.#skipAnimations,
    });

    // render out the main info and sub info panes
    this.#battleMenu = new BattleMenu(this, this.#activePlayerMonster, this.#skipAnimations);
    this.#createBattleStateMachine();
    this.#attackManager = new AttackManager(this, this.#skipAnimations);

    this._controls.lockInput = true;

    // add audio
    playBackgroundMusic(this, AUDIO_ASSET_KEYS.BATTLE);
  }

  /**
   * @returns {void}
   */
  update() {
    super.update();

    this.#battleStateMachine.update();

    if (this._controls.isInputLocked) {
      return;
    }

    const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();
    // limit input based on the current battle state we are in
    // if we are not in the right battle state, return early and do not process input
    if (
      wasSpaceKeyPressed &&
      (this.#battleStateMachine.currentStateName === BATTLE_STATES.PRE_BATTLE_INFO ||
        this.#battleStateMachine.currentStateName === BATTLE_STATES.POST_ATTACK_CHECK ||
        this.#battleStateMachine.currentStateName === BATTLE_STATES.GAIN_EXPERIENCE ||
        this.#battleStateMachine.currentStateName === BATTLE_STATES.FLEE_ATTEMPT)
    ) {
      this.#battleMenu.handlePlayerInput('OK');
      return;
    }
    if (this.#battleStateMachine.currentStateName !== BATTLE_STATES.PLAYER_INPUT) {
      return;
    }

    if (wasSpaceKeyPressed) {
      this.#battleMenu.handlePlayerInput('OK');

      // check if the player used an item
      if (this.#battleMenu.wasItemUsed) {
        this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_INPUT);
        return;
      }

      // check if the player attempted to flee
      if (this.#battleMenu.isAttemptingToFlee) {
        this.#battleStateMachine.setState(BATTLE_STATES.FLEE_ATTEMPT);
        return;
      }

      // check if the player selected an attack, and start battle sequence for the fight
      if (this.#battleMenu.selectedAttack === undefined) {
        return;
      }
      this.#activePlayerAttackIndex = this.#battleMenu.selectedAttack;

      if (!this.#activePlayerMonster.attacks[this.#activePlayerAttackIndex]) {
        return;
      }

      console.log(
        `Player selected the following move: ${this.#activePlayerMonster.attacks[this.#activePlayerAttackIndex].name}`
      );
      this.#battleMenu.hideMonsterAttackSubMenu();
      this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_INPUT);
      return;
    }

    if (this._controls.wasBackKeyPressed()) {
      this.#battleMenu.handlePlayerInput('CANCEL');
      return;
    }

    const selectedDirection = this._controls.getDirectionKeyJustPressed();
    if (selectedDirection !== DIRECTION.NONE) {
      this.#battleMenu.handlePlayerInput(selectedDirection);
    }
  }

  /**
   * @param {() => void} callback
   * @returns {void}
   */
  #playerAttack(callback) {
    if (this.#activePlayerMonster.isFainted) {
      callback();
      return;
    }

    this.#battleMenu.updateInfoPaneMessageNoInputRequired(
      `${this.#activePlayerMonster.name} used ${this.#activePlayerMonster.attacks[this.#activePlayerAttackIndex].name}`,
      () => {
        // play attack animation based on the selected attack
        // when attack is finished, play damage animation and then update health bar
        this.time.delayedCall(500, () => {
          this.time.delayedCall(100, () => {
            playSoundFx(this, this.#activePlayerMonster.attacks[this.#activePlayerAttackIndex].audioKey);
          });
          this.#attackManager.playAttackAnimation(
            this.#activePlayerMonster.attacks[this.#activePlayerAttackIndex].animationName,
            ATTACK_TARGET.ENEMY,
            () => {
              this.#activeEnemyMonster.playTakeDamageAnimation(() => {
                this.#activeEnemyMonster.takeDamage(this.#activePlayerMonster.baseAttack, () => {
                  callback();
                });
              });
            }
          );
        });
      }
    );
  }

  /**
   * @param {() => void} callback
   * @returns {void}
   */
  #enemyAttack(callback) {
    if (this.#activeEnemyMonster.isFainted) {
      callback();
      return;
    }

    this.#battleMenu.updateInfoPaneMessageNoInputRequired(
      `foe ${this.#activeEnemyMonster.name} used ${
        this.#activeEnemyMonster.attacks[this.#activeEnemyAttackIndex].name
      }`,
      () => {
        // play attack animation based on the selected attack
        // when attack is finished, play damage animation and then update health bar
        this.time.delayedCall(500, () => {
          this.time.delayedCall(100, () => {
            playSoundFx(this, this.#activeEnemyMonster.attacks[this.#activeEnemyAttackIndex].audioKey);
          });
          this.#attackManager.playAttackAnimation(
            this.#activeEnemyMonster.attacks[this.#activeEnemyAttackIndex].animationName,
            ATTACK_TARGET.PLAYER,
            () => {
              this.#activePlayerMonster.playTakeDamageAnimation(() => {
                this.#activePlayerMonster.takeDamage(this.#activeEnemyMonster.baseAttack, () => {
                  callback();
                });
              });
            }
          );
        });
      }
    );
  }

  /**
   * @returns {void}
   */
  #postBattleSequenceCheck() {
    // update monster details in scene data and data manager to align with changes from battle
    this.#sceneData.playerMonsters[this.#activePlayerMonsterPartyIndex].currentHp = this.#activePlayerMonster.currentHp;
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY, this.#sceneData.playerMonsters);

    if (this.#activeEnemyMonster.isFainted) {
      // play monster fainted animation and wait for animation to finish
      this.#activeEnemyMonster.playDeathAnimation(() => {
        this.#battleMenu.updateInfoPaneMessagesAndWaitForInput(
          [`Wild ${this.#activeEnemyMonster.name} fainted.`],
          () => {
            this.#battleStateMachine.setState(BATTLE_STATES.GAIN_EXPERIENCE);
          }
        );
      });
      return;
    }

    if (this.#activePlayerMonster.isFainted) {
      // play monster fainted animation and wait for animation to finish
      this.#activePlayerMonster.playDeathAnimation(() => {
        // TODO: this will need to be updated once we support multiple monsters
        this.#battleMenu.updateInfoPaneMessagesAndWaitForInput(
          [`${this.#activePlayerMonster.name} fainted.`, 'You have no more monsters, escaping to safety...'],
          () => {
            this.#playerKnockedOut = true;
            this.#battleStateMachine.setState(BATTLE_STATES.FINISHED);
          }
        );
      });
      return;
    }

    this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT);
  }

  /**
   * @returns {void}
   */
  #transitionToNextScene() {
    /** @type {import('./world-scene.js').WorldSceneData} */
    const sceneDataToPass = {
      isPlayerKnockedOut: this.#playerKnockedOut,
    };
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENE_KEYS.WORLD_SCENE, sceneDataToPass);
    });
  }

  /**
   * @returns {void}
   */
  #createBattleStateMachine() {
    /**
     * General state flow for battle scene
     *
     * scene transition to the battle menu
     * battle states
     * intro -> setup everything that is needed
     * pre-battle -> animations as characters and stuff appears
     * monster info text renders onto the page & wait for player input
     * any key press, and now menu stuff shows up
     * player_turn -> choose what to do, wait for input from player
     * enemy_turn -> random choice,
     * battle_fight -> enemy and player options evaluated, play each attack animation
     * battle_fight_post_check -> see if one of the characters died, repeat
     */

    this.#battleStateMachine = new StateMachine('battle', this);

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.INTRO,
      onEnter: () => {
        // wait for any scene setup and transitions to complete
        createSceneTransition(this, {
          skipSceneTransition: this.#skipAnimations,
          callback: () => {
            this.#battleStateMachine.setState(BATTLE_STATES.PRE_BATTLE_INFO);
          },
        });
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PRE_BATTLE_INFO,
      onEnter: () => {
        // wait for enemy monster to appear on the screen and notify player about the wild monster
        this.#activeEnemyMonster.playMonsterAppearAnimation(() => {
          this.#activeEnemyMonster.playMonsterHealthBarAppearAnimation(() => undefined);
          this._controls.lockInput = false;
          this.#battleMenu.updateInfoPaneMessagesAndWaitForInput(
            [`wild ${this.#activeEnemyMonster.name} appeared!`],
            () => {
              // wait for text animation to complete and move to next state
              this.#battleStateMachine.setState(BATTLE_STATES.BRING_OUT_MONSTER);
            }
          );
        });
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.BRING_OUT_MONSTER,
      onEnter: () => {
        // wait for player monster to appear on the screen and notify the player about monster
        this.#activePlayerMonster.playMonsterAppearAnimation(() => {
          this.#activePlayerMonster.playMonsterHealthBarAppearAnimation(() => undefined);
          this.#battleMenu.updateInfoPaneMessageNoInputRequired(`go ${this.#activePlayerMonster.name}!`, () => {
            // wait for text animation to complete and move to next state
            this.time.delayedCall(1200, () => {
              this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT);
            });
          });
        });
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_INPUT,
      onEnter: () => {
        this.#battleMenu.showMainBattleMenu();
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ENEMY_INPUT,
      onEnter: () => {
        // pick a random move for the enemy monster, and in the future implement some type of AI behavior
        this.#activeEnemyAttackIndex = this.#activeEnemyMonster.pickRandomMove();
        this.#battleStateMachine.setState(BATTLE_STATES.BATTLE);
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.BATTLE,
      onEnter: () => {
        // general battle flow
        // show attack used, brief pause
        // then play attack animation, brief pause
        // then play damage animation, brief pause
        // then play health bar animation, brief pause
        // then repeat the steps above for the other monster

        // if item was used, only have enemy attack
        if (this.#battleMenu.wasItemUsed) {
          this.#battleStateMachine.setState(BATTLE_STATES.USED_ITEM);
          return;
        }

        // if player failed to flee, only have enemy attack
        if (this.#battleMenu.isAttemptingToFlee) {
          this.time.delayedCall(500, () => {
            this.#enemyAttack(() => {
              this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_CHECK);
            });
          });
          return;
        }

        const randomNumber = Phaser.Math.Between(0, 1);
        if (randomNumber === 0) {
          this.#playerAttack(() => {
            this.#enemyAttack(() => {
              this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_CHECK);
            });
          });
          return;
        }

        this.#enemyAttack(() => {
          this.#playerAttack(() => {
            this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_CHECK);
          });
        });
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.POST_ATTACK_CHECK,
      onEnter: () => {
        this.#postBattleSequenceCheck();
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.FINISHED,
      onEnter: () => {
        this.#transitionToNextScene();
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.FLEE_ATTEMPT,
      onEnter: () => {
        const randomNumber = Phaser.Math.Between(1, 10);
        if (randomNumber > 5) {
          // player has run away successfully
          this.#battleMenu.updateInfoPaneMessagesAndWaitForInput(['You got away safely!'], () => {
            this.time.delayedCall(200, () => {
              playSoundFx(this, AUDIO_ASSET_KEYS.FLEE);
              this.#battleStateMachine.setState(BATTLE_STATES.FINISHED);
            });
          });
          return;
        }
        // player failed to run away, allow enemy to take their turn
        this.#battleMenu.updateInfoPaneMessagesAndWaitForInput(['You failed to run away...'], () => {
          this.time.delayedCall(200, () => {
            this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_INPUT);
          });
        });
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.GAIN_EXPERIENCE,
      onEnter: () => {
        // update exp bar based on experience gained, then transition to finished state
        const gainedExpForActiveMonster = calculateExpGainedFromMonster(
          this.#activeEnemyMonster.baseExpValue,
          this.#activeEnemyMonster.level,
          true
        );
        const gainedExpForInactiveMonster = calculateExpGainedFromMonster(
          this.#activeEnemyMonster.baseExpValue,
          this.#activeEnemyMonster.level,
          false
        );

        /** @type {string[]} */
        const messages = [];
        this.#sceneData.playerMonsters.forEach((monster, index) => {
          /** @type {import('../utils/leveling-utils.js').StatChanges} */
          let statChanges;
          if (index === this.#activePlayerAttackIndex) {
            statChanges = this.#activePlayerMonster.updateMonsterExp(gainedExpForActiveMonster);
            messages.push(`${this.#sceneData.playerMonsters[index].name} gained ${gainedExpForActiveMonster} exp.`);
          } else {
            statChanges = this.#activePlayerMonster.updateMonsterExp(gainedExpForInactiveMonster);
            messages.push(`${this.#sceneData.playerMonsters[index].name} gained ${gainedExpForInactiveMonster} exp.`);
          }
          if (statChanges.level !== 0) {
            messages.push(
              `${this.#sceneData.playerMonsters[index].name} level increased to ${
                this.#sceneData.playerMonsters[index].currentLevel
              }!`,
              `${this.#sceneData.playerMonsters[index].name} attack increased by ${
                statChanges.attack
              } and health increased by ${statChanges.health}`
            );
          }
        });

        this._controls.lockInput = true;
        this.#activePlayerMonster.updateMonsterExpBar(() => {
          this.#battleMenu.updateInfoPaneMessagesAndWaitForInput(messages, () => {
            this.time.delayedCall(200, () => {
              // update the data manager with latest monster data
              dataManager.store.set(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY, this.#sceneData.playerMonsters);
              this.#battleStateMachine.setState(BATTLE_STATES.FINISHED);
            });
          });
          this._controls.lockInput = false;
        });
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.USED_ITEM,
      onEnter: () => {
        // TODO: figure out type of item used
        this.#battleStateMachine.setState(BATTLE_STATES.HEAL_ITEM_USED);
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.HEAL_ITEM_USED,
      onEnter: () => {
        // TODO: enhance once we support multiple monsters
        this.#activePlayerMonster.updateMonsterHealth(
          /** @type {import('../types/typedef.js').Monster[]} */ (
            dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY)
          )[0].currentHp
        );
        this.time.delayedCall(500, () => {
          this.#enemyAttack(() => {
            this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_CHECK);
          });
        });
      },
    });

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.CAPTURE_ITEM_USED,
      onEnter: () => {
        // TODO: figure out logic
        this.time.delayedCall(500, () => {
          this.#enemyAttack(() => {
            this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_CHECK);
          });
        });
      },
    });

    // start state machine
    this.#battleStateMachine.setState(BATTLE_STATES.INTRO);
  }
}
