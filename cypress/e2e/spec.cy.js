describe('Monster Tamer', () => {
  before(() => {
    cy.intercept('assets/images/axulart/character/custom.png', { fixture: 'mock-player.png' });
  });

  it('should load the game', () => {
    cy.visit('');

    // retry until game is fully loaded and div no longer exists
    cy.get('[data-testid="loading"]').should('not.exist');

    // snapshot name will be the name passed in
    cy.matchImageSnapshot('game-loaded');
  });
});
