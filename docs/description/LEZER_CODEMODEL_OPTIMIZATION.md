# Оптимизация работы с кодовой моделью (Lezer)

## Цель
Собрать ключевую информацию и ориентиры для ускорения и повышения корректности работы кодовой модели BSL при использовании Lezer.

## Текущее состояние (точки входа)
1. Инкрементальный парсинг и обновление
`src/bsl/lezer/factory/codeModelFactory.ts`
- `TreeFragment.applyChanges` + `parser.parse(text, fragments)`
- `updateChangedMethods` обновляет затронутые методы

2. Быстрое построение деклараций
`src/bsl/lezer/factory/fastVisitor.ts`
- собирает только верхний уровень (процедуры, функции, параметры, VarDecl)
- тела методов не строятся

3. Полная модель тела метода (ленивая)
`src/bsl/lezer/factory/codeModelFactory.ts`
- `ensureMethodBody` подгружает тело по необходимости
- `LezerCodeModelFactoryVisitor` строит полную модель

4. Связь с Monaco
`src/bsl/lezer/moduleModel.ts`
- `onDidChangeContent` вызывает `updateModel`, при сбое — `reBuildModel`

5. Пересчет модели
`src/bsl/codeModel/model/bslCodeModel.ts`
- `afterUpdate` запускает калькуляторы: parents, variables, types

## Важные зависимости
- `lezer-bsl`: грамматика и термы для BSL
- `@lezer/common`: `Tree`, `TreeFragment`, `SyntaxNode`
- `updateUtils`: корректировка смещений и замены узлов

## Потенциальные узкие места
1. Инкрементальная ветка не вызывает `codeModel.afterUpdate`
`src/bsl/lezer/factory/codeModelFactory.ts`
- сейчас `codeModel.afterUpdate` закомментирован
- возможен рассинхрон типов и parent‑связей

2. Сопоставление методов по offset
`updateChangedMethods` ищет методы по `startOffset`/`endOffset`
- риск ошибок при вставках/удалениях между методами

3. Ленивая загрузка тела
`ensureMethodBody` зависит от корректности `startOffset` и `endOffset`
- любые ошибки в offset приводят к неверным телам

4. Частые `reBuildModel`
- при нестандартных изменениях может быть откат на полный парс
- требуется метрика частоты и причины

## Что измерять
1. Время парсинга
- `reBuildModel`: parse + fast visitor
- `updateModel`: parse + fast visitor + replace

2. Частота и причины fallback
- случаи, когда `updateModel` возвращает `false`

3. Корректность результатов
- количество ошибочных подсказок/типов после инкремента

## Набор тест‑сценариев редактирования
1. Правка внутри метода
2. Добавление нового метода в конец
3. Вставка метода в середину
4. Удаление метода
5. Массовая замена текста (Ctrl+A + paste)
6. Вставка между методами с изменением отступов/комментариев

## Гипотезы улучшений
1. Частичный пересчет `afterUpdate`
- пересчитывать только затронутый метод и его scope

2. Стабильные идентификаторы методов
- привязка к имени + диапазону, а не только offsets

3. Улучшенный matching измененных методов
- использовать `TreeFragment` + соответствие по `SyntaxNode.type` и имени

4. Больше метрик
- добавить счетчики `reBuildModel`/`updateModel` и среднее время

## Связанные документы
- Семантическая модель: `docs/codemodel.md`
- Контексты подсказок: `docs/scopes.md`
