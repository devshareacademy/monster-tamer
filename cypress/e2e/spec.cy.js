function getKeyDownConfig(keyCode) {
  return {
    keyCode: keyCode,
    which: keyCode,
    shiftKey: false,
    ctrlKey: false,
    force: false,
  };
}

describe('Monster Tamer', () => {
  beforeEach(() => {
    cy.intercept('assets/images/axulart/character/custom.png', { fixture: 'mock-player.png' });

    // visit game page
    cy.visit('');

    // retry until game is fully loaded and div no longer exists
    cy.get('[data-test-id="loading"]').should('not.exist');
  });

  it('should start the game and show the title screen', () => {
    // snapshot name will be the name passed in
    cy.matchImageSnapshot('game-loaded');
  });

  it('should show the options menu', () => {
    cy.get('body').trigger('keydown', getKeyDownConfig(40));
    cy.get('body').trigger('keydown', getKeyDownConfig(32));

    // retry until options scene is ready
    cy.get('[data-test-scene-id="OPTIONS_SCENE"]').should('exist');

    cy.matchImageSnapshot('options-menu');
  });

  it('should start a new game', () => {
    cy.get('body').trigger('keydown', getKeyDownConfig(32));

    // retry until options scene is ready
    cy.get('[data-test-scene-id="WORLD_SCENE"]').should('exist');

    cy.matchImageSnapshot('new-game');
  });
});
