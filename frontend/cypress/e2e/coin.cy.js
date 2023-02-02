/* eslint-disable no-undef */
/// <reference types="cypress" />

describe('COIN. App', () => {
  // checking set tocken in sessionStorage before each test
  beforeEach(() => {
    cy.visit('http://localhost:8080');
    cy.get('#login').type('developer');
    cy.get('#password').type('skillbox');
    cy.get('.auth__btn').click().wait(1000);
    cy.window().its('sessionStorage').should('have.keys', 'token');
  });
  // push 'exit' after each test
  afterEach(() => {
    cy.get('#btn-exit').click().url().should('eq', 'http://localhost:8080/');
  });

  // login
  it('В приложение можно успешно залогиниться по логину developer и паролю skillbox, вход на страницу со счетами, счёт создаётся и добавляется на страницу', () => {
    cy.url().should('eq', 'http://localhost:8080/account');
    cy.get('.title').should('have.text', 'Ваши счета');
    // create count
    cy.get('.counts__item')
      .its('length')
      .then((length) => {
        cy.get('.counts__create-btn').click().wait(1000);
        cy.get('.counts__item').should('have.length', length + 1);
      });
  });

  it('Можно перейти на страницу счёта и сделать перевод, перевод отражается в списке транзакций последним (если после перевода не пришло ничего извне)', () => {
    cy.get('.counts__item-number')
      .eq(0)
      .invoke('text')
      .then((text) => {
        cy.get('.counts__item-btn')
          .eq(0)
          .click()
          .url()
          .should('eq', `http://localhost:8080/account/${text}`)
          .wait(1000);
        cy.get('.details__count-num').should('have.text', `№ ${text}`);
        cy.get('.title').should('have.text', 'Просмотр счёта');
      });
    // transfer is ok (if there is no error from server)
    cy.get('#count-num').type('61253747452820828268825011');
    cy.get('#sum').type('10');
    cy.get('.details__chart-value-y-max')
      .invoke('text')
      .then((text) => {
        const balanceBefore = Number(text.split(' ').join(''));
        cy.get('.details__new-trans-btn')
          .should('be.enabled')
          .click()
          .wait(1000);
        cy.get('.details__chart-value-y-max')
          .invoke('text')
          .then((textAfter) => {
            const balanceAfter = Number(textAfter.split(' ').join(''));
            // transaction display checking in list and graph
            if (balanceAfter == balanceBefore - 10) {
              cy.get('.details__table-body-cell_sum')
                .eq(0)
                .should('have.text', '-10 ₽');
            }
          });
      });
  });

  it('Работает переход на страницу банкоматы', () => {
    cy.get('#btn-atm').click().url().should('eq', 'http://localhost:8080/atm');
    cy.get('.title').should('have.text', 'Карта банкоматов');
  });

  it('Работает переход на страницу валюта', () => {
    cy.get('#btn-currency')
      .click()
      .url()
      .should('eq', 'http://localhost:8080/currencies');
    cy.get('.title').should('have.text', 'Валютный обмен');
    // currncy exchange should be done (if there is no error from server)
    cy.get('#exchange-sum').type('0.1');
    cy.get('.currency__exchange-btn').should('be.enabled').click();
  });
});
