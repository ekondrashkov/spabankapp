import { el } from 'redom';
import './css/style.css';

export function header() {
  const atmBtn = el('button.header__nav-btn.button#btn-atm', 'Банкоматы');
  const countsBtn = el('button.header__nav-btn.button#btn-counts', 'Счета');
  const moneyBtn = el('button.header__nav-btn.button#btn-currency', 'Валюта');
  const exitBtn = el('button.header__nav-btn.button#btn-exit', 'Выйти');
  const burger = el('button.header__burger.button', [
    el('span.header__burger-line'),
    el('span.header__burger-line'),
    el('span.header__burger-line'),
  ]);
  const nav = el('nav.header__nav', [
    el('ul.header__nav-list.list-reset', [
      el('li.header__nav-item', [atmBtn]),
      el('li.header__nav-item', [countsBtn]),
      el('li.header__nav-item', [moneyBtn]),
      el('li.header__nav-item', [exitBtn]),
    ]),
  ]);

  const header = el('header.header', [
    el('div.container.header__container', [
      el('h1.header__logo', 'COIN.'),
      nav,
      burger,
    ]),
  ]);

  burger.addEventListener('click', () => {
    burger.classList.toggle('header__burger--active');
    nav.classList.toggle('header__nav--visible');
  });
  [atmBtn, countsBtn, moneyBtn, exitBtn].forEach((btn) => {
    btn.addEventListener('click', () => {
      burger.classList.remove('header__burger--active');
      nav.classList.remove('header__nav--visible');
    });
  });
  nav.addEventListener('click', (event) => {
    event._isNav = true;
  });
  document.body.addEventListener('click', (event) => {
    if (
      !event._isNav &&
      burger.classList.contains('header__burger--active') &&
      event.target !== burger
    ) {
      burger.classList.remove('header__burger--active');
      nav.classList.remove('header__nav--visible');
    }
  });

  return { header, atmBtn, countsBtn, moneyBtn, exitBtn };
}
