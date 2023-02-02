import { el, mount } from 'redom';
import Navigo from 'navigo';
import { header } from './header';
import {
  authInputCheck,
  digits,
  balanceChart,
  balanceChartYear,
  removeSymbols,
  CreateSelectListener,
  AutocompleteCount,
  inputSumPrevent,
  inputsTransferPrevent,
} from './function-helpers';
import {
  authRequest,
  transferCountCheck,
  transferSumCheck,
} from './validation';
import { paySystem } from './paysystem';
import './css/style.css';
import './css/media.css';

import rateDowm from './assets/images/rate-down.png';
import rateUp from './assets/images/rate-up.png';
import rateNoChange from './assets/images/rate-nochange.png';
import errorIcon from './assets/images/error.png';
import addIcon from './assets/images/add-icon.png';
import backIcon from './assets/images/back-icon.png';
import sendIcon from './assets/images/send-icon.png';
import selectArrow from './assets/images/select-close.png';
import sortedCheckIcon from './assets/images/sorted-icon.png';

// eslint-disable-next-line no-undef
var luhn = require('luhn');
const router = new Navigo('/');
const main = el('main');
const headerEl = header();
const yMapsScript = el('script', {
  defer: 'defer',
  src: 'https://api-maps.yandex.ru/2.1/?lang=ru_RU',
});
mount(window.document.head, yMapsScript);
mount(window.document.body, headerEl.header);
mount(window.document.body, main);

// pop-up ошибки
function errorPopup(errorText, link, btnText) {
  let errorTextShow;
  switch (errorText) {
    case 'Unauthorized':
      errorTextShow = 'Проблемы с авторизацией';
      break;
    case 'No such account':
      errorTextShow = 'Счёт не найден';
      break;
    case 'Invalid account from':
      errorTextShow = 'Неверный счёт списания';
      break;
    case 'Invalid account to':
      errorTextShow = 'Неверный счёт назначения';
      break;
    case 'Invalid amount':
      errorTextShow = 'Неверная сумма';
      break;
    case 'Overdraft prevented':
      errorTextShow = 'Превышен лимит';
      break;
    case 'Unknown currency code':
      errorTextShow = 'Неверный валютный код';
      break;
    case 'Not enough currency':
      errorTextShow = 'Недостаточно средств';
      break;
    default:
      errorTextShow = 'Неизвестная ошибка. Попробуйте зайти позже';
      break;
  }

  const errorWrapper = el('div.error-el', [
    el('div.error-wrapper', [
      el('h3.error-title', 'Ошибка'),
      el('span.error-message', `${errorTextShow}`),
      el('button.error-button.button.button_blue', {
        textContent: btnText,
        onclick(event) {
          event.preventDefault();
          errorWrapper.parentNode.removeChild(errorWrapper);
          router.navigate(link);
        },
      }),
    ]),
  ]);
  return errorWrapper;
}

// страница авторизации
function authPage() {
  const loginInput = el('input.auth__input.input', {
    id: 'login',
    placeholder: 'Введите логин',
  });
  const passInput = el('input.auth__input.input', {
    id: 'password',
    placeholder: 'Введите пароль',
    type: 'password',
  });
  const loginErrorImgEl = el('img.auth__error-message-icon');
  const passwordErrorImgEl = el('img.auth__error-message-icon');
  const loginErrorMessage = el('div.auth__error-message');
  const passwordErrorMessage = el('div.auth__error-message');
  const spinner = el('div.auth__spinner-wrapper', [el('div.auth__spinner')]);

  const authBtn = el('button.auth__btn.button.button_blue', {
    textContent: 'Войти',
    href: `/account`,
    disabled: 'disabled',
    async onclick(event) {
      event.preventDefault();
      const form = document.querySelector('.auth__form-wrapper');
      mount(form, spinner);
      const data = await authRequest(loginInput.value, passInput.value);
      form.removeChild(spinner);
      if (data.error) {
        switch (data.error) {
          case 'No such user':
            loginErrorImgEl.src = errorIcon;
            loginInput.classList.add('input-error');
            loginErrorMessage.textContent = 'Несуществующий пользователь';
            break;
          case 'Invalid password':
            passwordErrorImgEl.src = errorIcon;
            passInput.classList.add('input-error');
            passwordErrorMessage.textContent = 'Неверный пароль';
            break;
          default: {
            throw new Error(data.error);
          }
        }
      } else {
        // запись токена в sessionStorage
        loginInput.value = '';
        passInput.value = '';
        sessionStorage.setItem('token', data.payload.token);
        router.navigate(event.target.getAttribute('href'));
      }
    },
  });

  const auth = el('section.auth', [
    el('div.container.auth__container', [
      el('div.auth__form-wrapper', [
        el('h2.auth__title', 'Вход в аккаунт'),
        el('form.auth__form', [
          el('div.auth__input-wrapper', [
            el('label.auth__input-label', {
              for: 'login',
              textContent: 'Логин',
            }),
            loginErrorImgEl,
            loginInput,
          ]),
          loginErrorMessage,
          el('div.auth__input-wrapper', [
            el('label.auth__input-label', {
              for: 'password',
              textContent: 'Пароль',
            }),
            passwordErrorImgEl,
            passInput,
          ]),
          passwordErrorMessage,
          authBtn,
        ]),
      ]),
    ]),
  ]);

  // первичная проверка логина и пароля на длину и пробелы
  authInputCheck(
    loginInput,
    passInput,
    loginErrorImgEl,
    loginErrorMessage,
    'Неверный логин',
    authBtn
  );
  authInputCheck(
    passInput,
    loginInput,
    passwordErrorImgEl,
    passwordErrorMessage,
    'Неверный пароль',
    authBtn
  );

  return auth;
}

// страница со счетами: создание карточки счёта
class CountsItemCreate {
  title = 'Последняя транзакция';

  constructor(num, sum, date) {
    this.num = num;
    this.sum = sum;
    this.date = date;
  }

  createCountItem() {
    const openDetailsBtn = el('button.counts__item-btn.button.button_blue', {
      href: `/account/${this.num}`,
      textContent: 'Открыть',
      id: `open-${this.num}`,
      onclick(event) {
        event.preventDefault();
        router.navigate(event.target.getAttribute('href'));
      },
    });

    const countsItem = el('li.counts__item', [
      el('span.counts__item-number', this.num),
      el('span.counts__item-sum', `${this.sum} ₽`),
      el('div.counts__item-bottom', [
        el('div.counts__item-trans-wrapper', [
          el('span.counts__item-trans-title', this.title),
          el('span.counts__item-trans-date', this.date),
        ]),
        openDetailsBtn,
      ]),
    ]);

    return {
      countsItem,
      openDetailsBtn,
    };
  }
}

// страница со счетами
function countsPage() {
  const createCountBtn = el('button.counts__create-btn.button.button_blue', [
    el('img.counts__create-btn-img', { src: addIcon }),
    el('span.counts__create-btn-text', 'Создать новый счёт'),
  ]);
  const sortCountsBtn = el(
    'button.counts__choice-sort-btn.button',
    'Сортировка',
    el('img.counts__choice-sort-icon', { src: selectArrow })
  );
  const sortDropdown = el('div.counts__choice-dropdown', [
    el(
      'span.counts__choice-dropdown-item#choice-number',
      'По номеру',
      el('img.counts__choice-dropdown-img', { src: sortedCheckIcon })
    ),
    el(
      'span.counts__choice-dropdown-item#choice-balance',
      'По балансу',
      el('img.counts__choice-dropdown-img', { src: sortedCheckIcon })
    ),
    el(
      'span.counts__choice-dropdown-item#choice-date',
      'По последней транзакции',
      el('img.counts__choice-dropdown-img', { src: sortedCheckIcon })
    ),
  ]);

  const counts = el('div.container.counts__container', [
    el('div.counts__control', [
      el('div.counts__choice-wrapper', [
        el('h2.counts__choice-title.title', 'Ваши счета'),
        el('div.counts__choice-dropdown-wrapper', [
          sortCountsBtn,
          sortDropdown,
        ]),
      ]),
      createCountBtn,
    ]),
  ]);

  sortCountsBtn.addEventListener('click', () => {
    const selectArrowImg = sortCountsBtn.querySelector(
      '.counts__choice-sort-icon'
    );
    selectArrowImg.classList.toggle('counts__choice-sort-icon--open');
    sortDropdown.classList.toggle('counts__choice-dropdown--open');
  });
  sortDropdown.addEventListener('click', (event) => {
    event.__isCLick = true;
  });
  document.body.addEventListener('click', (event) => {
    if (
      event.target !== sortCountsBtn &&
      !event.__isCLick &&
      document.querySelector('.counts__choice-dropdown--open')
    ) {
      sortDropdown.classList.remove('counts__choice-dropdown--open');
    }
  });

  return {
    counts,
    createCountBtn,
    sortDropdown,
  };
}

// страница со счетами: создание счета
function createAccount(token) {
  const spinner = el(
    'div.spinner-el',
    el('div.spinner-wrapper', el('div.spinner'))
  );
  mount(document.body, spinner);

  fetch('http://localhost:3000/create-account/', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
    },
  }).then(async (res) => {
    const data = await res.json();
    document.body.removeChild(spinner);
    if (data.error) {
      const errorEl = errorPopup(data.error, `/account/`, 'Закрыть');
      mount(document.body, errorEl);
      throw new Error(data.error);
    } else {
      const countsList = document.querySelector('.counts__list');
      const newCountCard = new CountsItemCreate(
        data.payload.account,
        data.payload.balance,
        '-'
      );
      const newCountCardEl = newCountCard.createCountItem();
      mount(countsList, newCountCardEl.countsItem);
    }
  });
  return;
}

// создание строки транзакции в таблице детального счёта
class Transaction {
  constructor(countSender, countRecipient, sum, date, className) {
    this.countSender = countSender;
    this.countRecipient = countRecipient;
    this.sum = sum;
    this.date = date;
    this.className = className;
  }

  createTableRow() {
    let sumView;
    let sumViewMobile;
    let countMobile;
    if (this.sum > 0) {
      sumView = el(
        `td.${this.className}__table-body-cell.${this.className}__table-body-cell_sum.${this.className}__table-body-cell_sum-green`,
        `+${digits(this.sum)} ₽`
      );
      sumViewMobile = el(`div.${this.className}__table-body-cell_sum-mob`, [
        el(
          `span.${this.className}__table-body-cell_sum-mob-date`,
          this.date.split('T')[0].split('-').reverse().join('.')
        ),
        el(
          `span.${this.className}__table-body-cell_sum-mob-value.${this.className}__table-body-cell_sum-green`,
          `${digits(this.sum)} ₽`
        ),
      ]);
      countMobile = el(`div.${this.className}__table-body-cell_count-mob`, [
        el(
          `span.${this.className}__table-body-cell_count-mob-title`,
          'Входящий'
        ),
        el(
          `span.${this.className}__table-body-cell_count-mob-num`,
          this.countSender
        ),
      ]);
    }
    if (this.sum < 0) {
      sumView = el(
        `td.${this.className}__table-body-cell.${this.className}__table-body-cell_sum.${this.className}__table-body-cell_sum-red`,
        `${digits(this.sum)} ₽`
      );
      sumViewMobile = el(`div.${this.className}__table-body-cell_sum-mob`, [
        el(
          `span.${this.className}__table-body-cell_sum-mob-date`,
          this.date.split('T')[0].split('-').reverse().join('.')
        ),
        el(
          `span.${this.className}__table-body-cell_sum-mob-value.${this.className}__table-body-cell_sum-red`,
          `${digits(this.sum)} ₽`
        ),
      ]);
      countMobile = el(`div.${this.className}__table-body-cell_count-mob`, [
        el(
          `span.${this.className}__table-body-cell_count-mob-title`,
          'Исходящий'
        ),
        el(
          `span.${this.className}__table-body-cell_count-mob-num`,
          this.countRecipient
        ),
      ]);
    }
    const countFromImg = el(`img.${this.className}__table-body-cell_count-img`);
    if (
      transferCountCheck(this.countSender) &&
      luhn.validate(this.countSender)
    ) {
      paySystem(this.countSender, countFromImg);
    } else countFromImg.src = '';
    const countToImg = el(`img.${this.className}__table-body-cell_count-img`);
    if (
      transferCountCheck(this.countRecipient) &&
      luhn.validate(this.countRecipient)
    ) {
      paySystem(this.countRecipient, countToImg);
    } else countToImg.src = '';
    const tableRow = el(`tr.${this.className}__table-body-row`, [
      el(
        `td.${this.className}__table-body-cell.${this.className}__table-body-cell_count`,
        [
          el(`div.${this.className}__table-body-cell_count-wrapper`, [
            el(
              `span.${this.className}__table-body-cell_count-num`,
              this.countSender
            ),
            countFromImg,
          ]),
        ]
      ),
      el(
        `td.${this.className}__table-body-cell.${this.className}__table-body-cell_count`,
        [
          el(`div.${this.className}__table-body-cell_count-wrapper`, [
            el(
              `span.${this.className}__table-body-cell_count-num`,
              this.countRecipient
            ),
            countToImg,
          ]),
        ]
      ),
      sumView,
      el(
        `td.${this.className}__table-body-cell.${this.className}__table-body-cell_date`,
        this.date.split('T')[0].split('-').reverse().join('.')
      ),
      el(
        `td.${this.className}__table-body-cell-mob.${this.className}__table-body-mob_count-wrapper`,
        countMobile
      ),
      el(
        `td.${this.className}__table-body-cell-mob.${this.className}__table-body-mob_sum-wrapper`,
        sumViewMobile
      ),
    ]);

    return tableRow;
  }
}

// перевод
function moneyTransfer(from, to, amount) {
  const token = sessionStorage.getItem('token');
  const spinner = el(
    'div.spinner-el',
    el('div.spinner-wrapper', el('div.spinner'))
  );
  mount(document.body, spinner);

  fetch('http://localhost:3000/transfer-funds/', {
    method: 'POST',
    body: JSON.stringify({
      from: from,
      to: to,
      amount: amount,
    }),
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
    },
  }).then(async (res) => {
    const data = await res.json();
    document.body.removeChild(spinner);
    if (data.error) {
      const errorEl = errorPopup(data.error, `/account/${from}`, 'Закрыть');
      mount(document.body, errorEl);
      throw new Error(data.error);
    } else {
      let storageCountList = [to];
      if (localStorage.getItem('counts')) {
        storageCountList = JSON.parse(localStorage.getItem('counts'));
        if (!storageCountList.includes(to)) storageCountList.unshift(to);
      }
      localStorage.setItem('counts', JSON.stringify(storageCountList));
      localStorage.setItem('defaultCount', to);

      const countPage = document.querySelector('.details');
      countPage.innerHTML = '';
      const transactions = data.payload.transactions;
      transactions.map((transaction) => {
        if (transaction.from === from)
          transaction.amount = transaction.amount * -1;
      });
      const detailsPage = countDetails(
        data.payload.account,
        data.payload.balance,
        data.payload.transactions
      );

      mount(countPage, detailsPage);
    }
  });

  return;
}

// создание элементов карточек счетов + сортировка
function publicCountData(data, sortBy = false) {
  const dataLength = data.payload.length;
  const countsList = el('ul.counts__list.list-reset');
  if (sortBy == 'number' && dataLength > 0) {
    data.payload.sort(function (a, b) {
      if (a.account < b.account) {
        return 1;
      }
      if (a.account > b.account) {
        return -1;
      }
      return 0;
    });
  }
  if (sortBy == 'balance' && dataLength > 0) {
    data.payload.sort(function (a, b) {
      if (a.balance < b.balance) {
        return 1;
      }
      if (a.balance > b.balance) {
        return -1;
      }
      return 0;
    });
  }
  if (sortBy == 'date' && dataLength > 0) {
    data.payload.sort(function (a, b) {
      const transLengthA = a.transactions.length;
      const transLengthB = b.transactions.length;

      if (transLengthA == 0 && transLengthB == 0) {
        return 0;
      }
      if (transLengthA == 0 && transLengthB > 0) {
        return 1;
      }
      if (transLengthB == 0 && transLengthA > 0) {
        return -1;
      }
      if (
        a.transactions[transLengthA - 1].date <
        b.transactions[transLengthB - 1].date
      ) {
        return 1;
      }
      if (
        a.transactions[transLengthA - 1].date >
        b.transactions[transLengthB - 1].date
      ) {
        return -1;
      }
      return 0;
    });
  }

  for (let i = 0; i < data.payload.length; i++) {
    const countNum = data.payload[i].account;
    const countSum = digits(data.payload[i].balance);
    let countDateDisplay = '-';
    if (data.payload[i].transactions.length > 0) {
      const countDateArr = data.payload[i].transactions[0].date.split('T');
      const countDate = countDateArr[0].split('-').reverse();
      switch (countDate[1]) {
        case '1':
          countDate[1] = 'января';
          break;
        case '2':
          countDate[1] = 'февраля';
          break;
        case '3':
          countDate[1] = 'марта';
          break;
        case '4':
          countDate[1] = 'апреля';
          break;
        case '5':
          countDate[1] = 'мая';
          break;
        case '6':
          countDate[1] = 'июня';
          break;
        case '7':
          countDate[1] = 'июля';
          break;
        case '8':
          countDate[1] = 'августа';
          break;
        case '9':
          countDate[1] = 'сентября';
          break;
        case '10':
          countDate[1] = 'октября';
          break;
        case '11':
          countDate[1] = 'ноября';
          break;
        case '12':
          countDate[1] = 'декабря';
          break;
      }
      countDateDisplay = countDate.join(' ');
    }
    // создание карточки счёта
    const countsElem = new CountsItemCreate(
      countNum,
      countSum,
      countDateDisplay
    );
    const countsElemItem = countsElem.createCountItem();
    mount(countsList, countsElemItem.countsItem);
  }

  return countsList;
}

// загрузка страницы со счетами (/account/)
function countsList() {
  const token = sessionStorage.getItem('token');
  const countsPageEl = countsPage();
  const countsSection = el('section.counts');
  const skeleton = el(
    'div.skeleton',
    el('div.container', [
      el('div.skeleton__account-top', [
        el('div.skeleton__account-top-left', [
          el('div.skeleton__title'),
          el('div.skeleton__select'),
        ]),
        el('div.skeleton__button'),
      ]),
      el('div.skeleton__account-bottom', [
        el('div.skeleton__account-card'),
        el('div.skeleton__account-card'),
        el('div.skeleton__account-card'),
        el('div.skeleton__account-card'),
        el('div.skeleton__account-card'),
        el('div.skeleton__account-card'),
      ]),
    ])
  );
  mount(document.body, skeleton);
  try {
    sessionStorage.getItem('token');
  } catch (err) {
    throw new Error('Ключ не найден');
  }

  fetch('http://localhost:3000/accounts/', {
    method: 'GET',
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
    },
  }).then(async (res) => {
    const data = await res.json();
    document.body.removeChild(skeleton);
    // проверка на наличие ошибки
    if (data.error) {
      const errorEl = errorPopup(data.error, `/`, 'Выйти');
      mount(document.body, errorEl);
      throw new Error(data.error);
    }
    // добавление видимости к кнопкам в хэдере
    const headerButtons = document.querySelector('.header__nav-list');
    const headerBurger = document.querySelector('.header__burger');
    headerButtons.classList.add('header__nav-list--visible');
    headerBurger.classList.add('header__burger--visible');
    // добавление карточек счетов
    let countsElements = publicCountData(data);
    mount(countsSection, countsPageEl.counts);
    mount(countsPageEl.counts, countsElements);

    // сортировка
    const sortListItems = document.querySelectorAll(
      '.counts__choice-dropdown-item'
    );
    sortListItems.forEach((sortItem) => {
      sortItem.addEventListener('click', (event) => {
        if (document.querySelector('.counts__choice-dropdown-img--active')) {
          document
            .querySelector('.counts__choice-dropdown-img--active')
            .classList.remove('counts__choice-dropdown-img--active');
        }
        event.currentTarget
          .querySelector('.counts__choice-dropdown-img')
          .classList.add('counts__choice-dropdown-img--active');
        const sortId = event.currentTarget.id.split('-')[1];
        countsElements.parentNode.removeChild(countsElements);
        countsElements = publicCountData(data, sortId);
        document
          .querySelector('.counts__choice-sort-icon')
          .classList.remove('counts__choice-sort-icon--open');
        document
          .querySelector('.counts__choice-dropdown')
          .classList.remove('counts__choice-dropdown--open');
        mount(countsPageEl.counts, countsElements);
      });
    });
  });

  // новый счёт
  countsPageEl.createCountBtn.addEventListener('click', () => {
    createAccount(token);
  });

  return countsSection;
}

// страница детального счёта (/account/id)
function countDetails(count, balance, story) {
  const sendMoneyCount = el('input.details__input.input', {
    id: 'count-num',
    placeholder: 'Введите номер счёта',
    autocomplete: 'off',
  });
  if (localStorage.getItem('defaultCount')) {
    const defaultCount = localStorage.getItem('defaultCount');
    if (defaultCount !== count) sendMoneyCount.value = defaultCount;
  }
  const sendMoneySum = el('input.details__input.input', {
    id: 'sum',
    placeholder: 'Введите сумму',
    autocomplete: 'off',
  });
  const sendMoneyBtn = el(
    'button.details__new-trans-btn.button.button_blue',
    {
      disabled: 'disabled',
      onclick(event) {
        event.preventDefault();
        if (
          count !== sendMoneyCount.value &&
          transferCountCheck(sendMoneyCount.value) &&
          transferSumCheck(sendMoneySum.value)
        ) {
          moneyTransfer(count, sendMoneyCount.value, sendMoneySum.value);
        } else if (!transferCountCheck(sendMoneyCount.value)) {
          sendMoneyCountErrorImgEl.src = errorIcon;
          sendMoneyCount.classList.add('input-error');
          sendMoneyCountErrorMessage.textContent = 'Неверный счёт получателя';
        } else if (!transferSumCheck(sendMoneySum.value)) {
          sendMoneySumErrorImgEl.src = errorIcon;
          sendMoneySum.classList.add('input-error');
          sendMoneySumErrorMessage.textContent = 'Неверная сумма';
        }
      },
    },
    [
      el('img.details__new-trans-btn-img', { src: sendIcon }),
      el('span.details__new-trans-btn-text', 'Отправить'),
    ]
  );
  const storyTable = el('tbody.details__table-body');
  const bars = [];
  const barMonths = [];
  const chartBarList = el('div.details__chart-bar-list');
  const chartMonthList = el('div.details__chart-month-list');
  const NUMBER_OF_MONTHS = 6;
  for (let i = 0; i < NUMBER_OF_MONTHS; i++) {
    bars.push(el('div.details__chart-bar-fill'));
    barMonths.push(el('div.details__chart-value'));
    mount(chartBarList, el('div.details__chart-bar', bars[i]));
    mount(chartMonthList, barMonths[i]);
  }
  const maxValueElem = el('span.details__chart-value-y-max');
  const minValueElem = el('span.details__chart-value-y-min', '0');
  const sendMoneyCountErrorImgEl = el('img.details__error-message-icon');
  const sendMoneySumErrorImgEl = el('img.details__error-message-icon');
  const sendMoneyCountErrorMessage = el('div.details__error-message');
  const sendMoneySumErrorMessage = el('div.details__error-message');
  const fulfilledCountsList = el('ul.details__autocomplete-list.list-reset');
  const inputArrowImg = el('img.details__input-arrow', { src: selectArrow });
  const paySystemImg = el('img.details__input-paysystem-img');

  const details = el('div.container.details__container', [
    el('div.details__top', [
      el('h2.details__title.title', 'Просмотр счёта'),
      el(
        'button.details__back-btn.button.button_blue',
        {
          onclick(event) {
            event.preventDefault();
            router.navigate('/account/');
          },
        },
        [
          el('img.details__back-btn-img', { src: backIcon }),
          el('span.details__back-btn-text', 'Вернуться назад'),
        ]
      ),
    ]),
    el('div.details__middle', [
      el('span.details__count-num', `№ ${count}`),
      el('div.details__balance', [
        el('span.details__balance-title', 'Баланс'),
        el('span.details__balance-value', `${digits(balance)} ₽`),
      ]),
    ]),
    el('div.details__bottom', [
      el('div.details__new-trans', [
        el('h3.details__title-small', 'Новый перевод'),
        el('div.details__input-wrapper', [
          el('label.details__input-label', {
            for: 'count-num',
            textContent: 'Номер счёта получателя',
          }),
          el('div.details__input-paysystem', paySystemImg),
          sendMoneyCount,
          sendMoneyCountErrorImgEl,
          sendMoneyCountErrorMessage,
          inputArrowImg,
          fulfilledCountsList,
        ]),
        el('div.details__input-wrapper', [
          el('label.details__input-label', {
            for: 'sum',
            textContent: 'Сумма перевода',
          }),
          sendMoneySum,
          sendMoneySumErrorImgEl,
          sendMoneySumErrorMessage,
        ]),
        el('div.details__new-trans-btn-wrapper', sendMoneyBtn),
      ]),
      el(
        'div.details__chart-wrapper',
        {
          onclick(event) {
            event.preventDefault();
            router.navigate(`/account/${count}/details`);
          },
        },
        [
          el('h3.details__title-small', 'Динамика баланса'),
          el('div.details__chart-graph', [
            el('div.details__chart', [chartBarList, chartMonthList]),
            el('div.details__chart-value-y', [maxValueElem, minValueElem]),
          ]),
        ]
      ),
      el(
        'dev.details__story',
        {
          onclick(event) {
            event.preventDefault();
            router.navigate(`/account/${count}/details`);
          },
        },
        [
          el('h3.details__title-small', 'История переводов'),
          el('table.details__table', [
            el('thead.details__table-header', [
              el('tr.details__table-header-row', [
                el('th.details__table-header-cell', 'Счёт отправителя'),
                el('th.details__table-header-cell', 'Счёт получателя'),
                el(
                  'th.details__table-header-cell-mob.details__table-header-cell-mob_left',
                  'Счёт'
                ),
                el(
                  'th.details__table-header-cell-mob.details__table-header-cell-mob_right',
                  'Дата и сумма'
                ),
                el('th.details__table-header-cell', 'Сумма'),
                el('th.details__table-header-cell', 'Дата'),
              ]),
            ]),
            storyTable,
          ]),
        ]
      ),
    ]),
  ]);

  // определение и логотип платёжной системы
  sendMoneyCount.addEventListener('blur', () => {
    if (
      transferCountCheck(sendMoneyCount.value) &&
      luhn.validate(sendMoneyCount.value)
    ) {
      paySystem(sendMoneyCount.value, paySystemImg);
    } else paySystemImg.src = '';
  });

  // вызов функции и заполнение списка 10 последних транзакций
  let transNum = story.length - 1;
  while (story[transNum]) {
    if (story.length - transNum > 10) break;
    const tableRow = new Transaction(
      story[transNum].from,
      story[transNum].to,
      story[transNum].amount,
      story[transNum].date,
      'details'
    );
    mount(storyTable, tableRow.createTableRow());
    transNum--;
  }

  // вызов функции и подтягивание данных в график баланса 6 мес.
  const chartData = balanceChart(story, balance);
  let chartDataLabels = [];
  let chartDataValues = [];
  for (let i = 0; i < chartData.length; i++) {
    chartDataLabels[i] = chartData[i].date;
    chartDataValues[i] = chartData[i].value;
  }
  const maxValue = Math.max(...chartDataValues);
  for (let i = 0; i < chartDataValues.length; i++) {
    const fillPercent = (chartDataValues[i] / maxValue) * 100;
    bars[i].style.height = `${fillPercent}%`;
    barMonths[i].textContent = chartDataLabels[i];
  }
  maxValueElem.textContent = digits(maxValue);

  // предотвращение ввода ненужных символов
  inputsTransferPrevent(
    sendMoneySum,
    sendMoneyCount,
    sendMoneySumErrorImgEl,
    sendMoneyCountErrorImgEl,
    sendMoneySumErrorMessage,
    sendMoneyCountErrorMessage
  );

  // автокомплит ввода счёта
  new AutocompleteCount(
    fulfilledCountsList,
    sendMoneyCount,
    inputArrowImg
  ).autocomplete();

  // кнопка "отправить" активна если поле "счёт" длиннее 1 символа и после "сумма" длиннее 1
  [sendMoneyCount, sendMoneySum].forEach((input) => {
    input.addEventListener('input', () => {
      if (
        sendMoneyCount.value.trim().length &&
        sendMoneySum.value.trim().length
      ) {
        sendMoneyBtn.removeAttribute('disabled');
      } else {
        sendMoneyBtn.setAttribute('disabled', 'disabled');
      }
    });
  });

  return details;
}

// открытие детального счёта
function detailCount(id) {
  const skeleton = el(
    'div.skeleton',
    el('div.container', [
      el('div.skeleton__details-top', [
        el('div.skeleton__title'),
        el('div.skeleton__button-back'),
      ]),
      el('div.skeleton__details-middle', [
        el('div.skeleton__count'),
        el('div.skeleton__balance'),
      ]),
      el('div.skeleton__details-bottom', [
        el('div.skeleton__details-bottom-item.skeleton__details-bottom-item_1'),
        el('div.skeleton__details-bottom-item.skeleton__details-bottom-item_2'),
        el('div.skeleton__details-bottom-item.skeleton__details-bottom-item_3'),
      ]),
    ])
  );
  mount(document.body, skeleton);
  try {
    sessionStorage.getItem('token');
  } catch (err) {
    throw new Error('Ключ не найден');
  }

  const countSection = el('section.details');
  const token = sessionStorage.getItem('token');
  fetch(`http://localhost:3000/account/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
    },
  }).then(async (res) => {
    const data = await res.json();
    document.body.removeChild(skeleton);
    if (data.error) {
      const errorEl = errorPopup(data.error, `/account`, 'Назад');
      mount(document.body, errorEl);
      throw new Error(data.error);
    }
    const transactions = data.payload.transactions;
    transactions.map((transaction) => {
      if (transaction.from === id) transaction.amount = transaction.amount * -1;
    });
    const detailsPage = countDetails(
      data.payload.account,
      data.payload.balance,
      data.payload.transactions
    );

    mount(countSection, detailsPage);
  });

  return countSection;
}

// страница детальных транзакций
function transactionsPage(count, balance, story) {
  const storyTable = el('tbody.details__table-body');
  let bars = [];
  let barsIn = [];
  let barsOut = [];
  let barMonths = [];
  let barMonthsInOut = [];
  let chartBarList = el('div.trans__chart-bar-list');
  let chartMonthList = el('div.trans__chart-month-list');
  let chartItOutBarList = el('div.trans__inout-bar-list');
  let chartItOutMonthList = el('div.trans__inout-month-list');
  for (let i = 0; i < 12; i++) {
    bars.push(el('div.trans__chart-bar-fill'));
    barsIn.push(el('div.trans__in-bar-fill'));
    barsOut.push(el('div.trans__out-bar-fill'));
    barMonths.push(el('div.trans__chart-value'));
    barMonthsInOut.push(el('div.trans__inout-value'));
    mount(chartBarList, el('div.trans__chart-bar', [bars[i]]));
    mount(chartMonthList, barMonths[i]);
    mount(
      chartItOutBarList,
      el('div.trans__inout-bar', [barsIn[i]], [barsOut[i]])
    );
    mount(chartItOutMonthList, barMonthsInOut[i]);
  }
  const maxValueElem = el('span.trans__chart-value-y-max');
  const minValueElem = el('span.trans__chart-value-y-min', '0 ₽');
  const maxValueElemInOut = el('span.trans__inout-value-y-max');
  const medValueElemInOut = el('span.trans__inout-value-y-med');
  const minValueElemInOut = el('span.trans__inout-value-y-min', '0 ₽');

  const transPage = el('div.container.trans__container', [
    el('div.trans__top', [
      el('h2.trans__title.title', 'История баланса'),
      el(
        'button.trans__back-btn.button.button_blue',
        {
          onclick(event) {
            event.preventDefault();
            router.navigate(`/account/${count}`);
          },
        },
        [
          el('img.trans__back-btn-img', { src: backIcon }),
          el('span.trans__back-btn-text', 'Вернуться назад'),
        ]
      ),
    ]),
    el('div.trans__middle', [
      el('span.trans__count-num', `№ ${count}`),
      el('div.trans__balance', [
        el('span.trans__balance-title', 'Баланс'),
        el('span.trans__balance-value', `${digits(balance)} ₽`),
      ]),
    ]),
    el('div.trans__bottom-balance', [
      el('h3.trans__title-small', 'Динамика баланса'),
      el('div.trans__chart-graph', [
        el('div.trans__chart', [chartBarList, chartMonthList]),
        el('div.trans__chart-value-y', [maxValueElem, minValueElem]),
      ]),
    ]),
    el('div.trans__bottom-inout', [
      el(
        'h3.trans__title-small',
        'Соотношение входящих / исходящих транзакций'
      ),
      el('div.trans__inout-graph', [
        el('div.trans__inout', [chartItOutBarList, chartItOutMonthList]),
        el('div.trans__inout-value-y', [
          maxValueElemInOut,
          medValueElemInOut,
          minValueElemInOut,
        ]),
      ]),
    ]),
    el('div.trans__bottom-story', [
      el('h3.trans__title-small', 'История переводов'),
      el('table.trans__table', [
        el('thead.trans__table-header', [
          el('tr.trans__table-header-row', [
            el('th.trans__table-header-cell', 'Счёт отправителя'),
            el('th.trans__table-header-cell', 'Счёт получателя'),
            el(
              'th.trans__table-header-cell-mob.trans__table-header-cell-mob_left',
              'Счёт'
            ),
            el(
              'th.trans__table-header-cell-mob.trans__table-header-cell-mob_right',
              'Дата и сумма'
            ),
            el('th.trans__table-header-cell', 'Сумма'),
            el('th.trans__table-header-cell', 'Дата'),
          ]),
        ]),
        storyTable,
      ]),
    ]),
  ]);

  // вызов функции и заполнение списка 10 последних транзакций
  let transNum = story.length - 1;
  while (story[transNum]) {
    if (story.length - transNum > 25) break;
    const tableRow = new Transaction(
      story[transNum].from,
      story[transNum].to,
      story[transNum].amount,
      story[transNum].date,
      'trans'
    );
    mount(storyTable, tableRow.createTableRow());
    transNum--;
  }

  // вызов функции и подтягивание данных в график баланса 12 мес.
  const chartData = balanceChartYear(story, balance);
  let chartDataLabels = [];
  let chartDataValues = [];
  let chartDataInOutValues = [];
  let chartDataOutValues = [];
  for (let i = 0; i < chartData.length; i++) {
    chartDataLabels[i] = chartData[i].date;
    chartDataValues[i] = chartData[i].value;
    chartDataInOutValues[i] = chartData[i].valueInOut;
    chartDataOutValues[i] = chartData[i].valueOut;
  }
  const maxValue = Math.max(...chartDataValues);
  const maxValueInOut = Math.max(...chartDataInOutValues);
  const maxValueOut = Math.max(...chartDataOutValues);
  for (let i = 0; i < chartDataValues.length; i++) {
    const fillPercent = (chartDataValues[i] / maxValue) * 100;
    const fillPercentIn = (chartData[i].valueIn / maxValueInOut) * 100;
    const fillPercentOut = (chartData[i].valueOut / maxValueInOut) * 100;
    bars[i].style.height = `${fillPercent}%`;
    barsIn[i].style.height = `${fillPercentIn}%`;
    barsOut[i].style.height = `${fillPercentOut}%`;
    barMonths[i].textContent = chartDataLabels[i];
    barMonthsInOut[i].textContent = chartDataLabels[i];
  }
  maxValueElem.textContent = `${digits(maxValue)} ₽`;
  maxValueElemInOut.textContent = `${digits(maxValueInOut)} ₽`;
  if (maxValueOut != 0) {
    medValueElemInOut.textContent = `${digits(maxValueOut)} ₽`;
    const medValuePosition = 100 - (maxValueOut / maxValueInOut) * 100;
    if (medValuePosition <= 20) {
      medValueElemInOut.style.top = '20%';
    } else if (medValuePosition >= 80) {
      medValueElemInOut.style.top = '80%';
    } else
      medValueElemInOut.style.top = `${
        100 - (maxValueOut / maxValueInOut) * 100
      }%`;
  }

  return transPage;
}

// открытие страницы детальных транзакций '/account/id/details'
function transactionsPageOpen(id) {
  const skeleton = el(
    'div.skeleton',
    el('div.container', [
      el('div.skeleton__trans-top', [
        el('div.skeleton__title'),
        el('div.skeleton__button-back'),
      ]),
      el('div.skeleton__trans-middle', [
        el('div.skeleton__count'),
        el('div.skeleton__balance'),
      ]),
      el('div.skeleton__trans-bottom', [
        el('div.skeleton__trans-bottom-item'),
        el('div.skeleton__trans-bottom-item'),
        el('div.skeleton__trans-bottom-item'),
      ]),
    ])
  );
  mount(document.body, skeleton);
  try {
    sessionStorage.getItem('token');
  } catch (err) {
    throw new Error('Ключ не найден');
  }

  const countSection = el('section.trans');
  const token = sessionStorage.getItem('token');
  fetch(`http://localhost:3000/account/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
    },
  }).then(async (res) => {
    const data = await res.json();
    document.body.removeChild(skeleton);
    if (data.error) {
      const errorEl = errorPopup(data.error, `/account`, 'Назад');
      mount(document.body, errorEl);
      throw new Error(data.error);
    }
    const transactions = data.payload.transactions;
    transactions.map((transaction) => {
      if (transaction.from === id) transaction.amount = transaction.amount * -1;
    });
    const detailsPage = transactionsPage(
      data.payload.account,
      data.payload.balance,
      data.payload.transactions
    );

    mount(countSection, detailsPage);
  });

  return countSection;
}

// функция создания списка моих валют
function myCurrencyList(data, parent) {
  data.forEach((myCurrency) => {
    if (myCurrency.amount != 0) {
      let amountToDisplay = myCurrency.amount;
      if (/[.]/.test(amountToDisplay)) {
        amountToDisplay = `${digits(String(myCurrency.amount).split('.')[0])}.${
          String(myCurrency.amount).split('.')[1]
        }`;
      } else {
        amountToDisplay = digits(String(myCurrency.amount));
      }
      const myCurrencyItem = el('li.currency__mycurrency-item', [
        el('span.currency__mycurrency-item-name', myCurrency.code),
        el('span.currency__mycurrency-item-dote'),
        el('span.currency__mycurrency-item-amount', amountToDisplay),
      ]);
      mount(parent, myCurrencyItem);
    }
  });
}

// функция обмена валюты
function currencyExchange(from, to, amount) {
  const spinner = el(
    'div.spinner-el',
    el('div.spinner-wrapper', el('div.spinner'))
  );
  mount(document.body, spinner);
  const token = sessionStorage.getItem('token');

  fetch('http://localhost:3000/currency-buy/', {
    method: 'POST',
    body: JSON.stringify({
      from: from,
      to: to,
      amount: amount,
    }),
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
    },
  }).then(async (res) => {
    const data = await res.json();
    document.body.removeChild(spinner);
    if (data.error) {
      const errorEl = errorPopup(data.error, `/currencies`, 'Закрыть');
      mount(document.body, errorEl);
      throw new Error(data.error);
    }
    const dataMyCurrencies = Object.values(data.payload);
    const currencyList = document.querySelector('.currency__mycurrency-list');
    currencyList.innerHTML = '';
    myCurrencyList(dataMyCurrencies, currencyList);
  });
}

// страница "Валютный обмен"
function currencyPage() {
  const myCurrencyList = el('ul.currency__mycurrency-list.list-reset');
  const rateList = el('ul.currency__rate-list.list-reset');
  const exchangeSelectFromValue = el('span');
  const exchangeSelectToValue = el('span');
  const exchangeSelectFromDropdown = el(
    'ul.currency__exchange-select-list.list-reset'
  );
  const exchangeSelectFrom = el(
    'button.currency__exchange-select.button.select',
    {
      id: 'exchange-from',
    },
    [
      exchangeSelectFromValue,
      el('img.currency__exchange-select-img', { src: selectArrow }),
    ]
  );
  const exchangeSelectToDropdown = el(
    'ul.currency__exchange-select-list.list-reset'
  );
  const exchangeSelectTo = el(
    'button.currency__exchange-select.button.select',
    {
      id: 'exchange-to',
    },
    [
      exchangeSelectToValue,
      el('img.currency__exchange-select-img', { src: selectArrow }),
    ]
  );
  const exchangeInput = el('input.currency__exchange-input.input', {
    autocomplete: 'off',
    id: 'exchange-sum',
    placeholder: 'Введите сумму для обмена',
  });
  const exchangeBtn = el('button.currency__exchange-btn.button.button_blue', {
    textContent: 'Обменять',
    disabled: 'disabled',
    onclick(event) {
      event.preventDefault();
      if (!transferSumCheck(exchangeInput.value)) {
        exchangeErrorEl.textContent = 'Неверная сумма';
        exchangeInput.classList.add('input-error');
      } else {
        currencyExchange(
          exchangeSelectFrom.textContent,
          exchangeSelectTo.textContent,
          exchangeInput.value
        );
        exchangeInput.value = '';
      }
    },
  });
  const exchangeErrorEl = el('div.currency__exchange-error');

  const curPage = el('div.container.currency__container', [
    el('h2.currency__title.title', 'Валютный обмен'),
    el('div.currency__data', [
      el('div.currency__mycurrency', [
        el('h3.currency__title-small', 'Ваши валюты'),
        myCurrencyList,
      ]),
      el('div.currency__rate', [
        el('h3.currency__title-small', 'Изменение курсов в реальном времени'),
        rateList,
      ]),
      el('div.currency__exchange', [
        el('h3.currency__title-small', 'Обмен валюты'),
        el('form.currency__exchange-form', [
          el('div.currency__exchange-inputs', [
            el('div.currency__exchange-select-wrapper', [
              el('label.currency__exchange-select-label', {
                for: 'exchange-from',
                textContent: 'Из',
              }),
              exchangeSelectFrom,
              exchangeSelectFromDropdown,
            ]),
            el('div.currency__exchange-select-wrapper', [
              el('label.currency__exchange-select-label', {
                for: 'exchange-to',
                textContent: 'в',
              }),
              exchangeSelectTo,
              exchangeSelectToDropdown,
            ]),
            el('div.currency__exchange-input-wrapper', [
              el('label.currency__exchange-input-label', {
                for: 'exchange-sum',
                textContent: 'Сумма',
              }),
              exchangeInput,
              exchangeErrorEl,
            ]),
          ]),
          exchangeBtn,
        ]),
      ]),
    ]),
  ]);

  // предотвращение ввода недопустимых символов и отрицательной суммы
  inputSumPrevent(exchangeInput, exchangeBtn, exchangeErrorEl);

  return {
    curPage,
    myCurrencyList,
    rateList,
    exchangeSelectFrom,
    exchangeSelectTo,
    exchangeSelectFromValue,
    exchangeSelectToValue,
    exchangeInput,
    exchangeSelectFromDropdown,
    exchangeSelectToDropdown,
  };
}

// загрузка страницы "Валютный обмен" '/currencies/'
function currencyPageLoad() {
  const skeleton = el(
    'div.skeleton',
    el('div.container', [
      el('div.skeleton__currency-top', el('div.skeleton__title')),
      el('div.skeleton__currency-bottom', [
        el(
          'div.skeleton__currency-bottom-item.skeleton__currency-bottom-item_1'
        ),
        el(
          'div.skeleton__currency-bottom-item.skeleton__currency-bottom-item_2'
        ),
        el(
          'div.skeleton__currency-bottom-item.skeleton__currency-bottom-item_3'
        ),
      ]),
    ])
  );
  mount(document.body, skeleton);
  try {
    sessionStorage.getItem('token');
  } catch (err) {
    throw new Error('Ключ не найден');
  }

  const token = sessionStorage.getItem('token');
  const currencyPageEl = currencyPage();
  const countSection = el('section.currency');

  // загрузка данных о доступных валютах и моих валютах
  Promise.all([
    fetch('http://localhost:3000/all-currencies/', {
      method: 'GET',
      headers: {
        Authorization: `Basic ${token}`,
        'Content-Type': 'application/json',
      },
    }).then((res) => {
      const dataCur = res.json();
      return dataCur;
    }),
    fetch('http://localhost:3000/currencies/', {
      method: 'GET',
      headers: {
        Authorization: `Basic ${token}`,
        'Content-Type': 'application/json',
      },
    }).then((res) => {
      const dataCurMy = res.json();
      return dataCurMy;
    }),
  ]).then((data) => {
    document.body.removeChild(skeleton);
    data.forEach((dataLoaded) => {
      // проверка на ошибку
      if (dataLoaded.error) {
        const errorEl = errorPopup(data.error, `/account`, 'К счетам');
        mount(document.body, errorEl);
        throw new Error(dataLoaded.error);
      }
    });
    const dataAllCurrencies = data[0].payload; // список доступных для обмена валют
    const dataMyCurrencies = Object.values(data[1].payload); // список моих валют
    currencyPageEl.exchangeSelectFromValue.textContent = dataAllCurrencies[0];
    currencyPageEl.exchangeSelectToValue.textContent = dataAllCurrencies[1];
    dataAllCurrencies.forEach((currency) => {
      const exchangeSelectFromItem = el('li.currency__exchange-select-option', {
        textContent: currency,
        value: currency,
      });
      const exchangeSelectToItem = el('li.currency__exchange-select-option', {
        textContent: currency,
        value: currency,
      });
      mount(currencyPageEl.exchangeSelectFromDropdown, exchangeSelectFromItem);
      mount(currencyPageEl.exchangeSelectToDropdown, exchangeSelectToItem);
    });
    myCurrencyList(dataMyCurrencies, currencyPageEl.myCurrencyList); // отображение списка моих валют

    // select валют для обмена
    const selectFromListener = new CreateSelectListener(
      currencyPageEl.exchangeSelectFrom,
      currencyPageEl.exchangeSelectFromDropdown,
      currencyPageEl.exchangeSelectFromValue
    );
    selectFromListener.select();
    const selectToListener = new CreateSelectListener(
      currencyPageEl.exchangeSelectTo,
      currencyPageEl.exchangeSelectToDropdown,
      currencyPageEl.exchangeSelectToValue
    );
    selectToListener.select();

    // получение курсов валют в реальном времени
    const socket = new WebSocket('ws://localhost:3000/currency-feed/');
    const maxListLength = dataMyCurrencies.length + 6;
    socket.onmessage = function (event) {
      const imgEl = el('img.currency__rate-item-img');
      const dataSocket = event.data.split(',');
      let dataType = dataSocket[0].split(':')[1].trim();
      let dataFrom = dataSocket[1].split(':')[1].trim();
      let dataTo = dataSocket[2].split(':')[1].trim();
      let dataRate = dataSocket[3].split(':')[1].trim();
      let dataChange = dataSocket[4].split(':')[1].trim();

      let dataFeed = {
        type: removeSymbols(dataType, /["\\'{}]/),
        from: removeSymbols(dataFrom, /["\\'{}]/),
        to: removeSymbols(dataTo, /["\\'{}]/),
        rate: removeSymbols(dataRate, /["\\'{}]/),
        change: removeSymbols(dataChange, /["\\'{}]/),
      };

      if (dataFeed.type === 'EXCHANGE_RATE_CHANGE') {
        const rateItem = el('li.currency__rate-item', [
          el(
            'span.currency__rate-item-currency',
            `${dataFeed.from} / ${dataFeed.to}`
          ),
          el('span.currency__rate-item-dote'),
          el('div.currency__rate-item-value', [
            el('span.currency__rate-item-value-num', dataFeed.rate),
            imgEl,
          ]),
        ]);
        switch (dataFeed.change) {
          case '-1':
            imgEl.src = rateDowm;
            break;
          case '1':
            imgEl.src = rateUp;
            break;
          default:
            imgEl.src = rateNoChange;
        }
        const rateListLength = currencyPageEl.rateList.querySelectorAll(
          '.currency__rate-item'
        ).length;
        if (rateListLength >= maxListLength) {
          currencyPageEl.rateList.removeChild(
            currencyPageEl.rateList.firstChild
          );
        }
        mount(currencyPageEl.rateList, rateItem);
      }
    };
    mount(countSection, currencyPageEl.curPage);
  });

  return countSection;
}

// страница "Карта банкоматов"
function atmPage() {
  const atmPage = el('div.container.atm__container', [
    el('h2.atm__title.title', 'Карта банкоматов'),
    el('div.atm__map#map'),
  ]);

  return atmPage;
}

// загрузка страницы "Карта банкоматов"
function atmPageLoad() {
  try {
    sessionStorage.getItem('token');
  } catch (err) {
    throw new Error('Ключ не найден');
  }

  const token = sessionStorage.getItem('token');
  const atmPageEl = atmPage();
  const atmSection = el('section.atm');

  fetch('http://localhost:3000/banks/', {
    method: 'GET',
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
    },
  }).then(async (res) => {
    const data = await res.json();
    const dataAddress = data.payload;
    // eslint-disable-next-line no-undef
    ymaps.ready(init);
    function init() {
      // eslint-disable-next-line no-undef
      var myMap = new ymaps.Map('map', {
        center: [55.76, 37.64],
        zoom: 10,
      });

      dataAddress.forEach((address) => {
        // eslint-disable-next-line no-undef
        var myPlacemark = new ymaps.Placemark([address.lat, address.lon], {
          content: 'COIN.',
          balloonContent: 'COIN.',
        });

        myMap.geoObjects.add(myPlacemark);
      });

      myMap.behaviors.disable('scrollZoom');
    }
  });

  mount(atmSection, atmPageEl);

  return atmSection;
}

// кнопка "Валюта"
headerEl.moneyBtn.addEventListener('click', (event) => {
  event.preventDefault();
  router.navigate('/currencies');
});

// кнопка "Счета"
headerEl.countsBtn.addEventListener('click', (event) => {
  event.preventDefault();
  router.navigate('/account');
});

// кнопка "Банкоматы"
headerEl.atmBtn.addEventListener('click', (event) => {
  event.preventDefault();
  router.navigate('/atm');
});

// кнопка "Выйти"
headerEl.exitBtn.addEventListener('click', (event) => {
  event.preventDefault();
  sessionStorage.removeItem('token');
  router.navigate('/');
});

router.on('/', () => {
  main.innerHTML = '';
  if (document.querySelector('.header__nav-list--visible')) {
    document
      .querySelector('.header__nav-list--visible')
      .classList.remove('header__nav-list--visible');
    document
      .querySelector('.header__burger--visible')
      .classList.remove('header__burger--visible');
  }
  mount(main, authPage());
});

router.on('/account/', () => {
  main.innerHTML = '';
  mount(main, countsList());
});

router.on('/account/:id', ({ data: { id } }) => {
  main.innerHTML = '';
  mount(main, detailCount(id));
});

router.on('/account/:id/details', ({ data: { id } }) => {
  main.innerHTML = '';
  mount(main, transactionsPageOpen(id));
});

router.on('/currencies/', () => {
  main.innerHTML = '';
  mount(main, currencyPageLoad());
});

router.on('/atm/', () => {
  main.innerHTML = '';
  mount(main, atmPageLoad());
});

router.resolve();
