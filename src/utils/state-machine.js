/**
 * @typedef State
 * @type {object}
 * @property {string} name
 * @property {() => void} [onEnter]
 */

export class StateMachine {
  /** @type {Map<string, State>} */
  #states;
  /** @type {State | undefined} */
  #currentState;
  /** @type {string} */
  #id;
  /** @type {object | undefined} */
  #context;
  /** @type {boolean} */
  #isChangingState;
  /** @type {string[]} */
  #changingStateQueue;

  /**
   * @param {string} id the unique identifier for this state machine instance.
   * @param {object} [context] the context to use when invoking each method on the state.
   */
  constructor(id, context) {
    this.#id = id;
    this.#context = context;
    this.#isChangingState = false;
    this.#changingStateQueue = [];
    this.#currentState = undefined;
    this.#states = new Map();
  }

  /** @type {string | undefined} */
  get currentStateName() {
    return this.#currentState?.name;
  }

  /**
   * Used for processing any queued states and is meant to be called during every step of our game loop.
   * @returns {void}
   */
  update() {
    if (this.#changingStateQueue.length > 0) {
      this.setState(this.#changingStateQueue.shift());
    }
  }

  /**
   * Updates the current state of the state machine to the provided state name. If the state machine
   * is already transitioning states, or if there is a queue of states, the new state will be added
   * to that queue and processed after the queue is processed.
   * @param {string} name
   * @returns {void}
   */
  setState(name) {
    const methodName = 'setState';

    if (!this.#states.has(name)) {
      console.warn(`[${StateMachine.name}-${this.#id}:${methodName}] tried to change to unknown state: ${name}`);
      return;
    }

    if (this.#isCurrentState(name)) {
      return;
    }

    if (this.#isChangingState) {
      this.#changingStateQueue.push(name);
      return;
    }

    this.#isChangingState = true;
    console.log(
      `[${StateMachine.name}-${this.#id}:${methodName}] change from ${this.#currentState?.name ?? 'none'} to ${name}`
    );

    this.#currentState = this.#states.get(name);

    if (this.#currentState.onEnter) {
      console.log(`[${StateMachine.name}-${this.#id}:${methodName}] ${this.#currentState.name} on enter invoked`);
      this.#currentState.onEnter();
    }

    this.#isChangingState = false;
  }

  /**
   * Adds a new state to the current state machine instance. If a state already exists with the given name
   * that previous state will be replaced with the new state that was provided.
   * @param {State} state
   * @returns {void}
   */
  addState(state) {
    this.#states.set(state.name, {
      name: state.name,
      onEnter: this.#context ? state.onEnter?.bind(this.#context) : state.onEnter,
    });
  }

  /**
   * Checks to see if the provided state name is the state that is currently being handled by the state machine instance.
   * @param {string} name
   * @returns {boolean}
   */
  #isCurrentState(name) {
    if (!this.#currentState) {
      return false;
    }
    return this.#currentState.name === name;
  }
}
