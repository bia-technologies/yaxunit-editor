# Редактор тестов YAxUnit

> [!WARNING]  
> В процессе разработки. Релиза еще нет.

![Screen](/docs/images/screencast.gif)

![Run test](/docs/images/run-tests.gif)

Планируемые возможности:

* [x] Запуск тестов.
* [x] Отображение состояния тестов.
* [x] Контекстная подсказка по YAxUnit, с поддержкой fluent.
* [ ] Подсказка по методам платформы.
  * [x] Глобальный контекст (свойства, методы, перечисления)
  * [ ] Конструкторы
  * [x] Свойства/методы платформенных типов
* [ ] Подсказка по методам конфигурации.
* [x] Интеграция с 1с(встраивание в приложение 1с).
* [ ] Подключение к отладчику 1с.

Также планируется реализовать в виде расширений monaco для возможности быстрого и простого подключения к своим проектам.

1. Пакет с BSL
2. Пакет интеграции с 1c
3. Пакет с контекстами (scope)
4. Пакет с контекстом и командами yaxunit

## Благодарность

В проекте используются идеи и наработки следующих проектов

* [bsl_console](https://github.com/salexdv/bsl_console)
* [VAEditor](https://github.com/Pr-Mex/VAEditor)
* [vsc-language-1c-bsl](https://github.com/1c-syntax/vsc-language-1c-bsl)
* [onec-syntaxparser](https://github.com/xDrivenDevelopment/onec-syntaxparser)
* [react-1cv8-web-app](https://github.com/IngvarConsulting/react-1cv8-web-app)

Хочу выразить благодарность авторам этих продуктов

* [@lintest](https://github.com/lintest)
* [@nixel2007](https://github.com/nixel2007)
* [@salexdv](https://github.com/salexdv)
* [@zeegin](https://github.com/zeegin)
