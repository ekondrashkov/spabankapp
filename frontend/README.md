# Фронтэнд к итоговой работе «Банк»


## Установка и запуск проекта
1. Запустите сервер из папки бэкэнд (выполните `npm i` для установки и `npm start` для запуска сервера).
2. Для сборки фронтэнд выполните `npm i` для установки и `npm run dev` для запуска проекта в dev-режиме. Для сборки в prod-режиме выполните `npm run build`.

## Страница авторизации
Проверка на странице ввода `/`:
* Первичная проверка на стороне фронтэнда на длину и пробелы
* Если проверка на длину и сомволы пройдена, ждём ответа от бэкэнда, если ответ содержит ошибки - отображаем подписью к полям, если успешно, то:
  * полученный токен записывается в sessionStorage
  * загружается страница счета (`/account`)

## Страница "Ваши счета"
Во время ожидания загрузки счетов по API отображается header и spinner
После загружки отображаются поля в соответствии с макетом
Функциональные элементы:
* Сортировка счетов
* Создание нового счёта
* Переход на страницу счёта `/account/{id}` по кнопке 'Открыть'

## Страница "Просмотр счета"
Во время ожидания загрузки счетов по API отображается header и spinner
После загружки отображаются поля в соответствии с макетом
Функциональные элементы:
* Кнопка 'Вернуться назад'
* Форма перевода:
  * Используется автокомплит из счетов, на которые успешно были совершены переводы. При переводе на карту - определяется платёжная система
  * Первичная проверка на стороне фронтэнда на символы и длину. Если ошибка - подсвечивается под соответствующим полем
  * Если первичная проверка прошла - проверка на сервере. Во время ожидания ответа от сервера отображается spinner
  * Если сервер вернул ошибку - она выведется отдельным окном. Если всё успешно - данные страницы обновятся, счёт будет добавлен в localStorage для автокомплита
* Блоки "Динамика банаса" и "История перевода" активны. При нажатии - переход на подробную страницу `/account/{id}/details`
Графики выполнены без использования библиотек

## Страница "История баланса"
Во время ожидания загрузки счетов по API отображается header и spinner
После загружки отображаются поля в соответствии с макетом
Функциональные элементы:
* Кнопка 'Вернуться назад'
Графики выполнены без использования библиотек

## Страница "Карта банкоматов"
Отображается карта из API Яндекс.карт

## Страница "Валюьный обмен"
Во время ожидания загрузки счетов по API отображается header и spinner
После загружки отображаются поля в соответствии с макетом
Функциональные элементы:
* Форма обмена валюты:
  * Доступные валюты подгружаются из API
  * Первичная проверка суммы на символы на стороне фронтэнда. Если ошибка - подсвечивается под соответствующим полем
  * Если первичная проверка прошла - проверка на сервере. Во время ожидания ответа от сервера отображается spinner
  * Если сервер вернул ошибку - она выведется отдельным окном. Если всё успешно - данные страницы обновятся.
* Данные в блок "Изменение курсов в реальном времени" подтягиваются из websocket по мере поступления обновлений


## Тесты

### UNIT-тесты
Для запуска необходимо выполнить команду `npm test`
Проверка всех форм валидации на фронтэнде

### e2e-тесты
1. Для запуска необходимо выполнить команду `npx run cy`
2. Путь к файлу с тестом: `/cypress/e2e/coin.cy.js`
Проверяет путь пользователя по авторизации, переходу по страницам, отправке перевода и обмена, созданию счёта



* Примечание: реализована адаптивная вёрстка до ширины экрана 320px, подтягивается значок платёжной системы при валидации карты методом Luhn
