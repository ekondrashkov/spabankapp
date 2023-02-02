import { el, mount } from 'redom';
import errorIcon from './assets/images/error.png';
import { loginPassCheck } from './validation.js';

// функция listener инпутов логина и пароля
export function authInputCheck(
  firstInput,
  secondInput,
  errorImgEl,
  errorTextEl,
  errorText,
  btn
) {
  firstInput.addEventListener('blur', () => {
    const loginInp = firstInput.value.trim();
    firstInput.value = loginInp;
    if (!loginPassCheck(loginInp)) {
      errorImgEl.src = errorIcon;
      firstInput.classList.add('input-error');
      errorTextEl.textContent = errorText;
      btn.setAttribute('disabled', 'disabled');
    } else if (loginPassCheck(secondInput.value.trim()))
      btn.removeAttribute('disabled');
  });
  firstInput.addEventListener('input', () => {
    if (
      secondInput.value.trim().length &&
      !/\s/.test(secondInput.value.trim()) &&
      firstInput.value.trim().length &&
      !/\s/.test(firstInput.value.trim())
    ) {
      btn.removeAttribute('disabled');
    } else btn.setAttribute('disabled', 'disabled');
    firstInput.classList.remove('input-error');
    errorImgEl.src = '';
    errorTextEl.textContent = '';
  });
}

// добавление разделителей разряда
export function digits(num) {
  if (Math.round(num).length <= 3) return Math.round(num);

  const number = String(Math.round(num));
  const spaces = Math.floor(Number(number.length) / 3);
  const countSumArr = number.split('');
  const countFirst = countSumArr.length % 3;
  const countSumFirst = [];
  const countSumDisplay = [];
  if (countFirst != 0) {
    for (let i = 0; i < countFirst; i++) {
      countSumFirst.push(countSumArr[i]);
    }
    countSumDisplay.push(countSumFirst.join(''));
  }

  for (let i = 0; i < spaces; i++) {
    let numbers =
      `${String(countSumArr[countFirst + i * 3])}` +
      `${String(countSumArr[countFirst + i * 3 + 1])}` +
      `${String(countSumArr[countFirst + i * 3 + 2])}`;
    countSumDisplay.push(numbers);
  }

  return countSumDisplay.join(' ');
}

// подготовка массива для графика баланса
export function balanceChart(data, lastBalance) {
  const currentDate = new Date();
  const currentMonth = Number(currentDate.getMonth()) + 1;
  const currentYear = Number(currentDate.getFullYear());
  let monthSum = [
    { date: `${currentMonth - 5}`, value: 0 },
    { date: `${currentMonth - 4}`, value: 0 },
    { date: `${currentMonth - 3}`, value: 0 },
    { date: `${currentMonth - 2}`, value: 0 },
    { date: `${currentMonth - 1}`, value: 0 },
    { date: `${currentMonth}`, value: 0 },
  ];
  let newData = [];
  let balance = [
    { date: `${currentMonth - 5}`, value: 0 },
    { date: `${currentMonth - 4}`, value: 0 },
    { date: `${currentMonth - 3}`, value: 0 },
    { date: `${currentMonth - 2}`, value: 0 },
    { date: `${currentMonth - 1}`, value: 0 },
    { date: `${currentMonth}`, value: lastBalance },
  ];

  if (data.length) {
    data.map((transaction) => {
      const newDate = transaction.date.split('T')[0].split('-');
      transaction.date = {
        year: Number(newDate[0]),
        month: Number(newDate[1]),
        date: Number(newDate[2]),
      };
    });

    let i = 0;
    if (currentMonth >= 6) {
      while (data[i]) {
        if (
          data[i].date.year === currentYear &&
          data[i].date.month >= currentMonth - 5
        )
          newData.push(data[i]);
        i++;
      }
    } else {
      while (data[i]) {
        if (
          (data[i].date.year === currentYear &&
            data[i].date.month <= currentMonth) ||
          (data[i].date.year === currentYear - 1 &&
            data[i].date.month > 6 + currentMonth)
        ) {
          newData.push(data[i]);
        }
        i++;
      }
    }

    // распределение баланса по месяцам
    let monthNum = 0;
    if (newData.length > 2) {
      for (let n = 1; n < newData.length - 1; n++) {
        if (
          newData[n].date.month === newData[n + 1].date.month ||
          (newData[n].date.month !== newData[n + 1].date.month &&
            newData[n].date.month === newData[n - 1].date.month)
        ) {
          switch (newData[n].date.month) {
            case currentMonth - 5:
              monthNum = 0;
              break;
            case currentMonth - 4:
              monthNum = 1;
              break;
            case currentMonth - 3:
              monthNum = 2;
              break;
            case currentMonth - 2:
              monthNum = 3;
              break;
            case currentMonth - 1:
              monthNum = 4;
              break;
            case currentMonth:
              monthNum = 5;
              break;
          }
          monthSum[monthNum].value += newData[n].amount;
        }
      }
    }

    // распределение первой транзакции
    switch (newData[0].date.month) {
      case currentMonth - 5:
        monthNum = 0;
        break;
      case currentMonth - 4:
        monthNum = 1;
        break;
      case currentMonth - 3:
        monthNum = 2;
        break;
      case currentMonth - 2:
        monthNum = 3;
        break;
      case currentMonth - 1:
        monthNum = 4;
        break;
      case currentMonth:
        monthNum = 5;
        break;
    }
    monthSum[monthNum].value += newData[0].amount;

    // распределение последней транзакции
    switch (newData[newData.length - 1].date.month) {
      case currentMonth - 5:
        monthNum = 0;
        break;
      case currentMonth - 4:
        monthNum = 1;
        break;
      case currentMonth - 3:
        monthNum = 2;
        break;
      case currentMonth - 2:
        monthNum = 3;
        break;
      case currentMonth - 1:
        monthNum = 4;
        break;
      case currentMonth:
        monthNum = 5;
        break;
    }
    monthSum[monthNum].value += newData[newData.length - 1].amount;
  }

  for (let i = balance.length - 1; i > 0; i--) {
    balance[i - 1].value = balance[i].value - monthSum[i].value;
  }
  balance.map((month) => {
    month.value = Math.round(month.value);
    switch (month.date) {
      case '-4':
        month.date = 'авг';
        break;
      case '-3':
        month.date = 'сен';
        break;
      case '-2':
        month.date = 'окт';
        break;
      case '-1':
        month.date = 'ноя';
        break;
      case '0':
        month.date = 'дек';
        break;
      case '1':
        month.date = 'янв';
        break;
      case '2':
        month.date = 'фев';
        break;
      case '3':
        month.date = 'мар';
        break;
      case '4':
        month.date = 'апр';
        break;
      case '5':
        month.date = 'май';
        break;
      case '6':
        month.date = 'июн';
        break;
      case '7':
        month.date = 'июл';
        break;
      case '8':
        month.date = 'авг';
        break;
      case '9':
        month.date = 'сен';
        break;
      case '10':
        month.date = 'окт';
        break;
      case '11':
        month.date = 'ноя';
        break;
      case '12':
        month.date = 'дек';
        break;
    }
  });

  return balance;
}

// добавление транзакции в месяц графика
function createArrayItem(data, monthSum, currentMonth) {
  let monthNum = 0;
  switch (data.date.month) {
    case currentMonth - 11:
      monthNum = 0;
      break;
    case currentMonth - 10:
      monthNum = 1;
      break;
    case currentMonth - 9:
      monthNum = 2;
      break;
    case currentMonth - 8:
      monthNum = 3;
      break;
    case currentMonth - 7:
      monthNum = 4;
      break;
    case currentMonth - 6:
      monthNum = 5;
      break;
    case currentMonth - 5:
      monthNum = 6;
      break;
    case currentMonth - 4:
      monthNum = 7;
      break;
    case currentMonth - 3:
      monthNum = 8;
      break;
    case currentMonth - 2:
      monthNum = 9;
      break;
    case currentMonth - 1:
      monthNum = 10;
      break;
    case currentMonth:
      monthNum = 11;
      break;
  }
  monthSum[monthNum].value += data.amount;
  if (data.amount > 0) monthSum[monthNum].valueIn += data.amount;
  if (data.amount < 0) monthSum[monthNum].valueOut += data.amount * -1;

  return monthSum;
}

// подготовка массива для графика баланса 12 мес
export function balanceChartYear(data, lastBalance) {
  const currentDate = new Date();
  const currentMonth = Number(currentDate.getMonth()) + 1;
  const currentYear = Number(currentDate.getFullYear());
  let monthSum = [];
  let balance = [];
  const NUMBER_OF_MONTHS = 12;
  for (let i = NUMBER_OF_MONTHS - 1; i >= 0; i--) {
    monthSum.push({
      date: `${currentMonth - i}`,
      value: 0,
      valueIn: 0,
      valueOut: 0,
    });
    if (i > 0) {
      balance.push({
        date: `${currentMonth - i}`,
        value: 0,
        valueIn: 0,
        valueOut: 0,
        valueInOut: 0,
      });
    }
  }
  balance.push({ date: `${currentMonth}`, value: lastBalance });
  let newData = [];

  if (data.length) {
    data.map((transaction) => {
      const newDate = transaction.date.split('T')[0].split('-');
      transaction.date = {
        year: Number(newDate[0]),
        month: Number(newDate[1]),
        date: Number(newDate[2]),
      };
    });

    // создание массива транзакций за последние 12 месяцев
    let i = 0;
    while (data[i]) {
      if (
        data[i].date.year === currentYear ||
        (data[i].date.year === currentYear - 1 &&
          data[i].date.month > currentMonth)
      )
        newData.push(data[i]);
      i++;
    }

    // создание массива с объемом транзакций по месяцам
    if (newData.length > 2) {
      for (let n = 1; n < newData.length - 1; n++) {
        if (
          newData[n].date.month === newData[n + 1].date.month ||
          (newData[n].date.month !== newData[n + 1].date.month &&
            newData[n].date.month === newData[n - 1].date.month)
        ) {
          createArrayItem(newData[n], monthSum, currentMonth);
        }
      }
    }
    createArrayItem(newData[0], monthSum, currentMonth);
    createArrayItem(newData[newData.length - 1], monthSum, currentMonth);
  }

  // создание массива с балансом по месяцам
  for (let i = balance.length - 1; i > 0; i--) {
    balance[i - 1].value = balance[i].value - monthSum[i].value;
  }
  for (let i = 0; i < balance.length; i++) {
    balance[i].valueIn = monthSum[i].valueIn;
    balance[i].valueOut = monthSum[i].valueOut;
    balance[i].valueInOut = balance[i].valueIn + balance[i].valueOut;
  }
  balance.map((month) => {
    month.value = Math.round(month.value);
    switch (month.date) {
      case '-10':
        month.date = 'фев';
        break;
      case '-9':
        month.date = 'мар';
        break;
      case '-8':
        month.date = 'апр';
        break;
      case '-7':
        month.date = 'май';
        break;
      case '-6':
        month.date = 'июн';
        break;
      case '-5':
        month.date = 'июл';
        break;
      case '-4':
        month.date = 'авг';
        break;
      case '-3':
        month.date = 'сен';
        break;
      case '-2':
        month.date = 'окт';
        break;
      case '-1':
        month.date = 'ноя';
        break;
      case '0':
        month.date = 'дек';
        break;
      case '1':
        month.date = 'янв';
        break;
      case '2':
        month.date = 'фев';
        break;
      case '3':
        month.date = 'мар';
        break;
      case '4':
        month.date = 'апр';
        break;
      case '5':
        month.date = 'май';
        break;
      case '6':
        month.date = 'июн';
        break;
      case '7':
        month.date = 'июл';
        break;
      case '8':
        month.date = 'авг';
        break;
      case '9':
        month.date = 'сен';
        break;
      case '10':
        month.date = 'окт';
        break;
      case '11':
        month.date = 'ноя';
        break;
      case '12':
        month.date = 'дек';
        break;
    }
  });
  return balance;
}

// удаление ненужных символов
export function removeSymbols(value, deletedSymbols) {
  const reg = deletedSymbols;

  let newValue = value.split('');
  for (let i = 0; i < newValue.length; i++) {
    if (newValue[i].match(reg)) {
      newValue.splice(i, 1);
      i--;
    }
  }
  value = newValue.join('');

  return value;
}

// кастомный селект для выбора валюты
export class CreateSelectListener {
  constructor(elemBtn, elemDropdown, elemValue) {
    this.elemBtn = elemBtn;
    this.elemDropdown = elemDropdown;
    this.elemValue = elemValue;
  }

  select() {
    // select валют для обмена
    this.elemBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event._onClick = true;
      this.elemDropdown.classList.toggle(
        'currency__exchange-select-list--open'
      );
      this.elemBtn
        .querySelector('.currency__exchange-select-img')
        .classList.toggle('currency__exchange-select-img--open');
    });
    const currencyFromValues = this.elemDropdown.querySelectorAll(
      '.currency__exchange-select-option'
    );
    currencyFromValues.forEach((currency) => {
      currency.addEventListener('click', (event) => {
        this.elemValue.textContent = event.target.textContent;
        this.elemDropdown.classList.remove(
          'currency__exchange-select-list--open'
        );
        this.elemBtn
          .querySelector('.currency__exchange-select-img')
          .classList.toggle('currency__exchange-select-img--open');
      });
    });
    document.body.addEventListener('click', (event) => {
      if (!event._onClick) {
        const dropdowns = document.querySelectorAll(
          '.currency__exchange-select-list'
        );
        const arrows = document.querySelectorAll(
          '.currency__exchange-select-img'
        );
        dropdowns.forEach((dropdown) => {
          if (
            dropdown.classList.contains('currency__exchange-select-list--open')
          )
            dropdown.classList.remove('currency__exchange-select-list--open');
        });
        arrows.forEach((arrow) => {
          if (arrow.classList.contains('currency__exchange-select-list--open'))
            arrow.classList.remove('currency__exchange-select-list--open');
        });
      }
    });
  }
}

// автокомплит инпута счёта
export class AutocompleteCount {
  constructor(list, input, arrowImg) {
    (this.list = list), (this.input = input), (this.arrowImg = arrowImg);
  }

  // загрузка из LocalStorage последних счетов
  autocompleteAppend() {
    const storageCountList = JSON.parse(localStorage.getItem('counts'));
    this.list.innerHTML = '';
    for (let i = 0; i < storageCountList.length; i++) {
      if (
        String(storageCountList[i]).startsWith(String(this.input.value)) ||
        !this.input.value.length
      )
        mount(
          this.list,
          el(
            'li.details__autocomplete-item',
            {
              onclick(event) {
                document.getElementById('count-num').value =
                  storageCountList[i];
                document
                  .querySelector('.details__autocomplete-list')
                  .classList.remove('details__autocomplete-list--open');
                document
                  .querySelector('.details__input-arrow')
                  .classList.remove('details__input-arrow--open');
                event.target.parentNode.innerHTML = '';
              },
            },
            `${storageCountList[i]}`
          )
        );
      if (this.list.children.length === 5) break; // выводится 5 последних счетов
    }
  }

  autocomplete() {
    this.list.addEventListener('click', (event) => {
      event._dropdownClick = true;
    });
    this.input.addEventListener('click', (event) => {
      event._inputClick = true;
    });
    this.input.addEventListener('focus', () => {
      if (localStorage.getItem('counts')) {
        if (!this.input.value.length) {
          this.list.classList.add('details__autocomplete-list--open');
          this.arrowImg.classList.add('details__input-arrow--open');
        }
        this.autocompleteAppend();
      }
    });
    this.input.addEventListener('input', () => {
      if (localStorage.getItem('counts')) {
        this.autocompleteAppend();
        if (!this.list.children.length) {
          this.list.classList.remove('details__autocomplete-list--open');
          this.arrowImg.classList.remove('details__input-arrow--open');
        } else {
          this.list.classList.add('details__autocomplete-list--open');
          this.arrowImg.classList.add('details__input-arrow--open');
        }
      }
    });
    this.input.addEventListener('paste', () => {
      if (localStorage.getItem('counts')) {
        this.autocompleteAppend();
        if (!this.list.children.length) {
          this.list.classList.remove('details__autocomplete-list--open');
          this.arrowImg.classList.remove('details__input-arrow--open');
        } else {
          this.list.classList.add('details__autocomplete-list--open');
          this.arrowImg.classList.add('details__input-arrow--open');
        }
      }
    });
    document.body.addEventListener('click', (event) => {
      if (event._dropdownClick || event._inputClick) return;
      if (this.list.classList.contains('details__autocomplete-list--open')) {
        this.list.classList.remove('details__autocomplete-list--open');
        this.arrowImg.classList.remove('details__input-arrow--open');
      }
      this.list.innerHTML = '';
    });
  }
}

// предотвращение ввода недопустимых символов и отрицательной суммы обмена
export function inputSumPrevent(input, btn, errorEl) {
  input.addEventListener('keypress', (event) => {
    if (!event.key.match(/[0-9.]/)) event.preventDefault();
  });
  input.addEventListener('input', () => {
    errorEl.textContent = '';
    if (input.value.length > 0 && Number(input.value) > 0) {
      btn.removeAttribute('disabled');
    } else {
      btn.setAttribute('disabled', 'disabled');
    }
    if (input.classList.contains('input-error'))
      input.classList.remove('input-error');
  });
  input.addEventListener('paste', (event) => {
    event.preventDefault();
    let pasteData = event.clipboardData.getData('text').trim();
    if (!pasteData.length) pasteData = '';
    const pasteDataArr = pasteData.split('');
    pasteDataArr.forEach((dataSymbol) => {
      if (!dataSymbol.match(/[0-9. ]/)) {
        pasteData = '';
        return;
      }
    });
    if (pasteData.startsWith('.')) pasteData = '0'.concat(pasteData);
    if (pasteData.endsWith('.')) pasteData = pasteData.slice(0, -1);
    input.value = removeSymbols(pasteData, /\s/);
  });
}

// предотвращение ввода ненужных символов при переводе
export function inputsTransferPrevent(
  inpuSum,
  inputCount,
  sumErrorImg,
  countErrorImg,
  sumErrorMsg,
  CountErrorMsg
) {
  inpuSum.addEventListener('keypress', (event) => {
    if (!event.key.match(/[0-9.]/)) event.preventDefault();
  });
  inpuSum.addEventListener('paste', (event) => {
    event.preventDefault();
    let pasteData = event.clipboardData.getData('text').trim();
    if (!pasteData.length) pasteData = '';
    const pasteDataArr = pasteData.split('');
    pasteDataArr.forEach((dataSymbol) => {
      if (!dataSymbol.match(/[0-9. ]/)) {
        pasteData = '';
        return;
      }
    });
    if (pasteData.startsWith('.')) pasteData = '0'.concat(pasteData);
    if (pasteData.endsWith('.')) pasteData = pasteData.slice(0, -1);
    inpuSum.value = removeSymbols(pasteData, /\s/);
  });
  inpuSum.addEventListener('input', () => {
    sumErrorImg.src = '';
    if (inpuSum.classList.contains('input-error'))
      inpuSum.classList.remove('input-error');
    sumErrorMsg.textContent = '';
  });
  inputCount.addEventListener('keypress', (event) => {
    if (!event.key.match(/[0-9]/)) event.preventDefault();
  });
  inputCount.addEventListener('paste', (event) => {
    event.preventDefault();
    let pasteData = event.clipboardData.getData('text').trim();
    if (!pasteData.length) pasteData = '';
    const pasteDataArr = pasteData.split('');
    pasteDataArr.forEach((dataSymbol) => {
      if (!dataSymbol.match(/[0-9 ]/)) {
        pasteData = '';
        return;
      }
    });
    inputCount.value = removeSymbols(pasteData, /\s/);
  });
  inputCount.addEventListener('input', () => {
    countErrorImg.src = '';
    if (inputCount.classList.contains('input-error'))
      inputCount.classList.remove('input-error');
    CountErrorMsg.textContent = '';
  });
}
