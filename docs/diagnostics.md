# Система диагностики

## Обзор

Система диагностики предоставляет комплексный анализ кода BSL с подсветкой ошибок в Monaco редакторе. Она состоит из трех основных компонентов:

1. **Модуль диагностики** - сбор и обработка ошибок
2. **Модуль валидации** - семантический анализ кода
3. **Модуль Monaco** - отображение ошибок в редакторе

## Архитектура

```
Парсер → Ошибки лексера/парсера
    ↓
CodeModel → Калькуляторы → Валидаторы → Семантические ошибки
    ↓
ErrorCollector → Объединение всех ошибок
    ↓
MarkersManager → Маркеры Monaco → Подсветка в редакторе
```

## Типы диагностических сообщений

### DiagnosticSeverity

- `Error` - критическая ошибка, код не будет работать
- `Warning` - предупреждение, потенциальная проблема
- `Info` - информационное сообщение
- `Hint` - подсказка для улучшения кода

### DiagnosticSource

- `Lexer` - ошибки лексического анализа
- `Parser` - ошибки синтаксического анализа (включая garbageToken)
- `Semantic` - семантические ошибки
- `Validation` - ошибки валидации

## Валидаторы

### UndefinedSymbolsValidator

Проверяет использование неопределенных символов:

- **Переменные** (UNDEF_VAR) - переменная используется без объявления
- **Методы** (UNDEF_METHOD) - вызов несуществующего метода
- **Свойства** (UNDEF_PROP) - обращение к несуществующему свойству

### UnusedSymbolsValidator

Проверяет неиспользуемые символы:

- **Переменные** (UNUSED_VAR) - переменная объявлена, но не используется
- **Параметры** (UNUSED_PARAM) - параметр функции не используется в теле

## Использование

### Автоматическая валидация

Валидация выполняется автоматически при каждом изменении кода:

```typescript
// Изменение кода → updateModel → afterUpdate → validate → updateMarkers
```

### Инкрементальное обновление

Система поддерживает инкрементальное обновление:
- Маркеры обновляются только для измененных частей кода
- Производительность оптимизирована для больших файлов

### Добавление нового валидатора

1. Создайте класс, наследующий `BaseValidator`:

```typescript
import { BaseValidator } from './baseValidator'
import { DiagnosticMessage } from '@/bsl/diagnostics'

export class MyValidator extends BaseValidator {
    validate(model: BslCodeModel): DiagnosticMessage[] {
        this.clearErrors()
        this.visitModel(model)
        return this.errors
    }

    visitVariableSymbol(symbol: VariableSymbol): void {
        // Ваша логика проверки
        if (/* условие */) {
            this.addError('Сообщение об ошибке', symbol)
        }
        super.visitVariableSymbol(symbol)
    }
}
```

2. Добавьте валидатор в `ModelValidator`:

```typescript
export class ModelValidator {
    private validators: BaseValidator[] = [
        new UndefinedSymbolsValidator(),
        new UnusedSymbolsValidator(),
        new MyValidator() // Новый валидатор
    ]
}
```

## API

### ErrorCollector

```typescript
const collector = new ErrorCollector()

// Сбор ошибок лексера
const lexDiagnostics = collector.collectLexerErrors(lexErrors)

// Сбор ошибок парсера
const parseDiagnostics = collector.collectParserErrors(parseErrors)

// Сбор ошибок из garbageToken (неожиданные символы)
const garbageDiagnostics = collector.collectGarbageTokenErrors(cst)

// Объединение ошибок
const all = collector.combineErrors(lexDiagnostics, parseDiagnostics, garbageDiagnostics)
```

### MarkersManager

```typescript
const manager = new MarkersManager(editorModel)

// Установка маркеров
manager.updateMarkers(diagnostics)

// Очистка маркеров
manager.clearMarkers()
```

### ModelValidator

```typescript
const validator = new ModelValidator()

// Валидация модели
const diagnostics = validator.validate(codeModel)

// Добавление кастомного валидатора
validator.addValidator(new MyValidator())
```

## Производительность

- Инкрементальный парсинг минимизирует работу при изменениях
- Валидация запускается только после завершения всех калькуляторов
- Маркеры обновляются батчами для оптимизации

## Расширяемость

Система спроектирована для легкого расширения:

1. **Новые типы ошибок** - добавьте в `DiagnosticSource`
2. **Новые валидаторы** - наследуйте `BaseValidator`
3. **Кастомные severity** - используйте существующие или добавьте новые

## Примеры

### Пример 1: Неопределенная переменная

```bsl
Процедура Тест()
    Сообщить(X); // Error: Переменная "X" не определена (UNDEF_VAR)
КонецПроцедуры
```

### Пример 2: Неиспользуемый параметр

```bsl
Процедура Тест(Параметр) // Warning: Параметр "Параметр" не используется (UNUSED_PARAM)
    Сообщить("Привет");
КонецПроцедуры
```

### Пример 3: Неожиданный символ

```bsl
Процедура Тест()
    /X = 1; // Error: Неожиданный символ "/" (GARBAGE_TOKEN)
КонецПроцедуры
```

### Пример 4: Лексическая ошибка

```bsl
Процедура Тест()
    X = "незакрытая строка // Error: Лексическая ошибка (LEX001)
КонецПроцедуры
```
