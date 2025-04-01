# Семантическая модель модуля

Модель хранит информацию о структуре кода модуля в виде дерева символов (`BaseSymbol`).

**Символ** представляет отдельный элемент, объявленный в исходном коде, платформе или конфигурации. В качестве символов могут выступать: типы, методы, свойства, поля, выражения, параметры, локальные переменные и другие элементы.

Модель позволяет:

* обнаруживать символы, на которые ссылается код в определённом месте;
* вычислять результирующий тип выражения на основе [контекстов](scopes.md);
* реализовывать диагностики;

## Формирование и обновление модели

### Схема обновления модели

```mermaid title="Обновление CodeModel"
sequenceDiagram
    actor User
    participant Editor as Monaco Editor
    participant Factory as ChevrotainSitterCodeModelFactory
    participant Parser as BSLParser
    participant Visitor as CodeModelFactoryVisitor
    participant CodeModel as BslCodeModel
    participant ErrorHandler

    User->>Editor: Редактирует код
    Editor->>Factory: Вызывает updateModel(changes)
    
    alt Полная пересборка модели
        Factory->>Parser: parseModule(text)
        Parser->>Factory: CST + ошибки
        Factory->>ErrorHandler: handleErrors()
        ErrorHandler->>Editor: convertErrorsToMarkers()
        Editor-->>User: Отображение ошибок
        Factory->>Visitor: visit(CST)
        Visitor->>Factory: Символы кода
        Factory->>CodeModel: Инициализация структуры
        loop Для каждого метода
            Factory->>CodeModel: Нормализация смещений
        end
    else Инкрементальное обновление
        Factory->>Parser: updateTokens(changes)
        Parser->>Factory: Изменённые диапазоны
        loop Для каждого диапазона
            Factory->>CodeModel: Поиск символа
            Factory->>Parser: parseChanges(правило)
            Parser->>Factory: Новый узел CST
            Factory->>Visitor: visit(newNode)
            Visitor->>Factory: Новый BaseSymbol
            Factory->>CodeModel: Замена символа
            Factory->>CodeModel: Корректировка позиций
        end
    end

    Factory->>CodeModel: afterUpdate(symbol)
    
    CodeModel->>Editor: onDidChangeModel
    Editor-->>User: Обновление интерфейса
```

### Схема пересчёта после обновления

```mermaid title="Пересчёт после обновления CodeModel"
sequenceDiagram
    participant CodeModel
    participant ParentsCalc
    participant VariablesCalc
    participant TypesCalc

    CodeModel->>ParentsCalc: calculate()
    activate ParentsCalc
    ParentsCalc->>CodeModel: Установка родительских связей
    deactivate ParentsCalc
    
    CodeModel->>VariablesCalc: calculate()
    activate VariablesCalc
    VariablesCalc->>CodeModel: Обнаружение переменных
    deactivate VariablesCalc
    
    CodeModel->>TypesCalc: calculate()
    activate TypesCalc
    TypesCalc->>CodeModel: Расчёт типов для переменных, выражений и возвращаемых значений
    deactivate TypesCalc
```

### Ключевые моменты

1. **Сценарии обновления модели**:
   * Полная пересборка при значительных изменениях.
   * Инкрементальное обновление для мелких правок.

2. **Основные компоненты**:
   * `BSLParser` — парсер языка.
   * `CodeModelFactoryVisitor` — преобразует CST в семантическую модель.
   * `BslCodeModel` — хранилище структуры кода.
   * Механизм обработки ошибок и формирования маркеров Monaco Editor.

3. **Особенности инкрементального обновления**:
   * Локализация изменённых символов.
   * Перепарсинг только затронутых областей.
   * Автоматическая корректировка позиций зависимых символов.
   * Сохранение целостности родительско-дочерних связей.

4. **Этапы постобработки**:
   * Пересчёт родительских связей.
   * Поиск переменных.
   * Определение типов для:
     * переменных и полей,
     * выражений,
     * возвращаемых значений методов.

---

**Оптимизации**

* Минимизация перестроения дерева при инкрементальных изменениях.
* Кэширование результатов расчёта типов.
*  Фоновая обработка ресурсоёмких операций. `В плане`
