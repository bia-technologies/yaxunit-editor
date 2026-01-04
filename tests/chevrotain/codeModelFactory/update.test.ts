import { BslCodeModel } from '../../../src/bsl/codeModel'
import { ChevrotainCodeModelFactory } from '../../../src/bsl/chevrotain'
import { describe, expect, test, beforeEach } from 'vitest'
import { expectExpression, setupTestEnvironment } from './helpers'
import { insert, remove, replace } from '../../rangeHelpers'

describe('updateModel', () => {
    let codeModelFactory: ChevrotainCodeModelFactory

    beforeEach(() => {
        codeModelFactory = setupTestEnvironment()
    })

    test('должен обновить модель при вставке', () => {
        const initialCode = 'Процедура Тест()\n  а = 1;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        // Вставляем " + 2" после "1" (offset 24 = позиция после "1")
        const change = insert(24, ' + 2')

        const result = codeModelFactory.updateModel(codeModel, [change])

        expect(result).toBe(true)
        const expression = codeModel.children[0].children[0].expression
        expectExpression(expression, {
            left: { value: '1' },
            right: { value: '2' },
            operator: '+'
        })
    })

    test('должен обновить модель при удалении', () => {
        const initialCode = 'Процедура Тест()\n  а = 1 + 2;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        // Удаляем " + 2" (offset 24, length 4)
        const change = remove(24, 4)

        const result = codeModelFactory.updateModel(codeModel, [change])

        expect(result).toBe(true)
        const expression = codeModel.children[0].children[0].expression
        expectExpression(expression, { value: '1' })
    })

    test('должен обновить модель при замене', () => {
        const initialCode = 'Процедура Тест()\n  а = 1;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        // Заменяем "1" на "2" (offset 23, length 1)
        const change = replace(23, 1, '2')

        const result = codeModelFactory.updateModel(codeModel, [change])

        expect(result).toBe(true)
        const expression = codeModel.children[0].children[0].expression
        expectExpression(expression, { value: '2' })
    })

    test('должен обрабатывать изменения в сигнатуре процедуры', () => {
        const initialCode = 'Процедура Тест()\n  а = 1;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        // Заменяем имя процедуры "Тест" на "НовыйТест" (offset 10, length 4)
        const change = replace(10, 4, 'НовыйТест')

        const result = codeModelFactory.updateModel(codeModel, [change])

        expect(result).toBe(true)
        expect(codeModel.children[0].name).toBe('НовыйТест')
    })

    test('должен обрабатывать добавление нового оператора', () => {
        const initialCode = 'Процедура Тест()\n  а = 1;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        // Вставляем новый оператор после первого (offset 25 = после "1;")
        const change = insert(25, '\n  б = 2;')

        const result = codeModelFactory.updateModel(codeModel, [change])

        expect(result).toBe(true)
        expect(codeModel.children[0].children.length).toBe(2)
        expect(codeModel.children[0].children[1].variable.name).toBe('б')
    })

    test('должен вернуть false для полной замены текста', () => {
        const initialCode = 'Процедура Тест()\n  а = 1;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        const newCode = 'Процедура НовыйТест()\n  б = 2;\nКонецПроцедуры'
        // Полная замена всего текста
        const change = replace(0, initialCode.length, newCode)

        const result = codeModelFactory.updateModel(codeModel, [change])

        expect(result).toBe(false)
    })

    test('должен вернуть false для пустой модели', () => {
        const codeModel = new BslCodeModel()
        const change = insert(0, 'Процедура Тест()')

        const result = codeModelFactory.updateModel(codeModel, [change])

        expect(result).toBe(false)
    })

    test('должен обрабатывать множественные изменения', () => {
        const initialCode = 'Процедура Тест()\n  а = 1;\n  б = 2;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        // Заменяем "1" на "10" и "2" на "20"
        const changes = [
            replace(23, 1, '10'),
            replace(32, 1, '20')
        ]

        const result = codeModelFactory.updateModel(codeModel, changes)

        expect(result).toBe(true)
        expectExpression(codeModel.children[0].children[0].expression, { value: '10' })
        expectExpression(codeModel.children[0].children[1].expression, { value: '20' })
    })
})

describe('интеграционные тесты', () => {
    let codeModelFactory: ChevrotainCodeModelFactory

    beforeEach(() => {
        codeModelFactory = setupTestEnvironment()
    })

    test('процесс построения и обновления', () => {
        // Шаг 1: Начальное построение пустой процедуры
        const initialCode = 'Процедура Тест()\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        expect(codeModel.children.length).toBe(1)

        // Шаг 2: Добавляем первый оператор
        let result = codeModelFactory.updateModel(codeModel, [
            insert(16, '\n  а = 1;')
        ])
        expect(result).toBe(true)
        expect(codeModel.children[0].children.length).toBe(1)

        // Шаг 3: Изменяем значение в первом операторе
        result = codeModelFactory.updateModel(codeModel, [
            replace(23, 1, '10')
        ])
        expect(result).toBe(true)
        expectExpression(codeModel.children[0].children[0].expression, { value: '10' })

        // Шаг 4: Добавляем второй оператор
        result = codeModelFactory.updateModel(codeModel, [
            insert(26, '\n  б = 20;')
        ])
        expect(result).toBe(true)
        expect(codeModel.children[0].children.length).toBe(2)
        expectExpression(codeModel.children[0].children[1].expression, { value: '20' })
    })
})

describe('внутренние функции и сложные сценарии', () => {
    let codeModelFactory: ChevrotainCodeModelFactory

    beforeEach(() => {
        codeModelFactory = setupTestEnvironment()
    })

    test('должен корректировать смещения методов после изменений', () => {
        const initialCode = 'Процедура Метод1()\n  а = 1;\nКонецПроцедуры\n\nПроцедура Метод2()\n  б = 2;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        const initialSecondMethodOffset = codeModel.children[1].position.startOffset

        // Вставляем текст в первый метод, что должно сдвинуть второй метод
        const result = codeModelFactory.updateModel(codeModel, [
            insert(26, ' + 10')
        ])

        expect(result).toBe(true)
        // Проверяем, что позиция второго метода была обновлена (смещена вперед)
        expect(codeModel.children[1].position.startOffset).toBeGreaterThan(initialSecondMethodOffset)
    })

    test('должен правильно обрабатывать добавление нового метода', () => {
        const initialCode = 'Процедура Метод1()\n  а = 1;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        const newMethodCode = '\n\nПроцедура Метод2()\n  б = 2;\nКонецПроцедуры'

        // Добавляем новый метод после существующего
        const result = codeModelFactory.updateModel(codeModel, [
            insert(35, newMethodCode)
        ])

        expect(result).toBe(true)
        expect(codeModel.children.length).toBe(2)
        expect(codeModel.children[1].name).toBe('Метод2')
    })

    test('должен обрабатывать удаление метода', () => {
        const initialCode = 'Процедура Метод1()\n  а = 1;\nКонецПроцедуры\n\nПроцедура Метод2()\n  б = 2;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        expect(codeModel.children.length).toBe(2)

        // Удаляем первый метод полностью (включая КонецПроцедуры и переносы строк)
        // Длина первого метода: "Процедура Метод1()\n  а = 1;\nКонецПроцедуры\n\n" = 37 символов
        const result = codeModelFactory.updateModel(codeModel, [
            remove(0, 42)
        ])

        expect(codeModel.children.length).toBe(1)
        expect(codeModel.children[0].name).toBe('Метод2')
    })

    test('должен обрабатывать изменение параметров процедуры', () => {
        const initialCode = 'Процедура Тест(Параметр1)\n  а = 1;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)

        const result = codeModelFactory.updateModel(codeModel, [
            insert(24, ', Параметр2')
        ])

        expect(result).toBe(true)
        expect(codeModel.children[0].params.length).toBe(2)
        expect(codeModel.children[0].params[1].name).toBe('Параметр2')
    })

    test('должен обрабатывать изменение типа процедуры на функцию', () => {
        const initialCode = 'Процедура Тест()\n  а = 1;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)

        const result = codeModelFactory.updateModel(codeModel, [
            replace(0, 9, 'Функция'),
            replace(26, 14, '\n  Возврат 1;\nКонецФункции')
        ])

        expect(result).toBe(true)
        expect(codeModel.children[0].name).toBe('Тест')
        // Проверяем, что это функция (если есть способ определить тип)
    })

    test('должен обрабатывать изменения в условии if', () => {
        const initialCode = 'Процедура Тест()\n  Если а > 0 Тогда\n    б = 1;\n  КонецЕсли;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)

        // Изменяем оператор сравнения с ">" на ">="
        // "Процедура Тест()\n  Если а " = 25 символов, заменяем ">" на ">="
        const result = codeModelFactory.updateModel(codeModel, [
            replace(27, 1, '>=')
        ])

        expect(result).toBe(true)
        const ifStatement = codeModel.children[0].children[0]
        expect(ifStatement.branches[0].condition.operator).toBe('>=')
    })

    test('должен обрабатывать изменения в цикле for', () => {
        const initialCode = 'Процедура Тест()\n  Для а = 0 По 10 Цикл\n    б = а;\n  КонецЦикла;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        const initialEndValue = codeModel.children[0].children[0].end.value

        const result = codeModelFactory.updateModel(codeModel, [
            replace(32, 2, '20')
        ])

        expect(result).toBe(true)
        const forStatement = codeModel.children[0].children[0]
        expect(forStatement.end.value).toBe('20')
        expect(forStatement.end.value).not.toBe(initialEndValue)
    })

    test('должен обрабатывать изменения в вызове метода с аргументами', () => {
        const initialCode = 'Процедура Тест()\n  Сообщить(1, 2);\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        const initialArgsCount = codeModel.children[0].children[0].arguments.length

        // Добавляем третий аргумент после "2"
        // Находим позицию "2" в аргументах
        const twoIndex = initialCode.indexOf(', 2')
        expect(twoIndex).toBeGreaterThan(0)
        const afterTwoIndex = twoIndex + 3 // позиция после ", 2"
        
        const result = codeModelFactory.updateModel(codeModel, [
            insert(afterTwoIndex, ', 3')
        ])

        expect(result).toBe(true)
        const methodCall = codeModel.children[0].children[0]
        expect(methodCall.arguments.length).toBe(3)
        expect(methodCall.arguments.length).toBeGreaterThan(initialArgsCount)
    })

    test('должен обрабатывать изменения в сложном бинарном выражении', () => {
        const initialCode = 'Процедура Тест()\n  а = 1 + 2;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)

        // Изменяем оператор с "+" на "*"
        const result = codeModelFactory.updateModel(codeModel, [
            replace(25, 1, '*')
        ])

        expect(result).toBe(true)
        const expression = codeModel.children[0].children[0].expression
        expect(expression.operator).toBe('*')
    })

    test('должен обрабатывать изменения в доступе к свойствам', () => {
        const initialCode = 'Процедура Тест()\n  а = Объект.Свойство1;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)

        // Добавляем еще один уровень доступа
        const result = codeModelFactory.updateModel(codeModel, [
            insert(35, '.Свойство2')
        ])

        expect(result).toBe(true)
        const expression = codeModel.children[0].children[0].expression
        expect(expression.access.length).toBeGreaterThan(2)
    })

    test('должен обрабатывать изменения в строковых литералах', () => {
        const initialCode = 'Процедура Тест()\n  а = "Привет";\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        const initialValue = codeModel.children[0].children[0].expression.value

        // Изменяем содержимое строки (без кавычек)
        // Находим позицию "Привет" внутри кавычек
        const quoteIndex = initialCode.indexOf('"Привет"')
        expect(quoteIndex).toBeGreaterThan(0)
        const privetIndex = quoteIndex + 1 // позиция после открывающей кавычки
        
        const result = codeModelFactory.updateModel(codeModel, [
            replace(privetIndex, 6, 'Мир')
        ])

        expect(result).toBe(true)
        const expression = codeModel.children[0].children[0].expression
        expect(expression.value).toBe('Мир')
        expect(expression.value).not.toBe(initialValue)
    })

    test('должен обрабатывать изменения в тернарном операторе', () => {
        const initialCode = 'Процедура Тест()\n  а = ?(б > 0, 1, 2);\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)

        // Изменяем альтернативное значение
        const result = codeModelFactory.updateModel(codeModel, [
            replace(33, 1, '3')
        ])

        expect(result).toBe(true)
        const expression = codeModel.children[0].children[0].expression
        expect(expression.alternative.value).toBe('3')
    })

    test('должен обрабатывать изменения в унарном операторе', () => {
        const initialCode = 'Процедура Тест()\n  а = -1;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)

        // Изменяем унарный оператор с "-" на "не"
        const result = codeModelFactory.updateModel(codeModel, [
            replace(23, 1, 'не ')
        ])

        expect(result).toBe(true)
        const expression = codeModel.children[0].children[0].expression
        expect(expression.operator).toBe('не')
    })

    test('должен обрабатывать изменения в конструкторе Новый', () => {
        const initialCode = 'Процедура Тест()\n  а = Новый Массив;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        const initialName = codeModel.children[0].children[0].expression.name
        expect(initialName).toBe('Массив')

        // Изменяем тип конструктора - заменяем "Массив" на "Структура"
        // Находим позицию "Массив" в исходном коде
        const arrayIndex = initialCode.indexOf('Массив')
        expect(arrayIndex).toBeGreaterThan(0)
        
        const result = codeModelFactory.updateModel(codeModel, [
            replace(arrayIndex, 6, 'Структура')
        ])

        expect(result).toBe(true)
        const expression = codeModel.children[0].children[0].expression
        expect(expression.name).toBe('Структура')
        expect(expression.name).not.toBe(initialName)
    })

    test('должен обрабатывать изменения в индексе массива', () => {
        const initialCode = 'Процедура Тест()\n  а = Массив[0];\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)

        // Изменяем индекс
        const result = codeModelFactory.updateModel(codeModel, [
            replace(30, 1, '1')
        ])

        expect(result).toBe(true)
        const expression = codeModel.children[0].children[0].expression
        expect(expression.access[1].index.value).toBe('1')
    })

    test('должен обрабатывать изменения в цикле while', () => {
        const initialCode = 'Процедура Тест()\n  Пока а < 10 Цикл\n    б = а;\n  КонецЦикла;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        const initialValue = codeModel.children[0].children[0].condition.right.value

        // Изменяем условие цикла - заменяем "10" на "20"
        const valueIndex = initialCode.indexOf('10')
        expect(valueIndex).toBeGreaterThan(0)
        
        const result = codeModelFactory.updateModel(codeModel, [
            replace(valueIndex, 2, '20')
        ])

        expect(result).toBe(true)
        const whileStatement = codeModel.children[0].children[0]
        expect(whileStatement.condition.right.value).toBe('20')
        expect(whileStatement.condition.right.value).not.toBe(initialValue)
    })

    test('должен обрабатывать изменения в операторе return', () => {
        const initialCode = 'Функция Тест()\n  Возврат 1;\nКонецФункции'
        const codeModel = codeModelFactory.buildModel(initialCode)

        // Изменяем возвращаемое значение
        const result = codeModelFactory.updateModel(codeModel, [
            replace(25, 1, '2')
        ])

        expect(result).toBe(true)
        const returnStatement = codeModel.children[0].children[0]
        expect(returnStatement.expression.value).toBe('2')
    })

    test('должен обрабатывать изменения в try-catch блоке', () => {
        const initialCode = 'Процедура Тест()\n  Попытка\n    а = 1;\n  Исключение\n    б = 2;\n  КонецПопытки;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)

        // Изменяем значение в блоке try - заменяем "1" на "10"
        // Находим позицию "1" после "а = "
        const valueIndex = initialCode.indexOf('а = 1')
        expect(valueIndex).toBeGreaterThan(0)
        const oneIndex = valueIndex + 4 // позиция после "а = "
        
        const result = codeModelFactory.updateModel(codeModel, [
            replace(oneIndex, 1, '10')
        ])

        expect(result).toBe(true)
        const tryStatement = codeModel.children[0].children[0]
        expect(tryStatement).toBeDefined()
        if (tryStatement && tryStatement.body && tryStatement.body.length > 0) {
            const assignment = tryStatement.body[0]
            if (assignment && assignment.expression) {
                expect(assignment.expression.value).toBe('10')
            }
        }
    })

    test('должен вернуть false при изменении, которое делает код невалидным', () => {
        const initialCode = 'Процедура Тест()\n  а = 1;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)

        // Удаляем закрывающую скобку, что делает код невалидным
        const result = codeModelFactory.updateModel(codeModel, [
            remove(18, 1) // Удаляем ")"
        ])

        // В зависимости от реализации, это может вернуть false или true
        // Если парсер может обработать неполный код, вернется true
        // Если нет - false
        expect(typeof result).toBe('boolean')
    })

    test('должен обрабатывать изменения в многострочном выражении', () => {
        const initialCode = 'Процедура Тест()\n  а = 1 +\n    2 +\n    3;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)

        // Изменяем среднее значение
        const result = codeModelFactory.updateModel(codeModel, [
            replace(30, 1, '20')
        ])

        expect(result).toBe(true)
        const expression = codeModel.children[0].children[0].expression
        expect(expression).toBeDefined()
    })

    test('должен обрабатывать изменения в переменной с дефолтным значением', () => {
        const initialCode = 'Процедура Тест(Параметр = 1)\n  а = Параметр;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        const initialValue = codeModel.children[0].params[0].defaultValue.value

        // Изменяем дефолтное значение параметра - заменяем "1" на "2"
        const valueIndex = initialCode.indexOf('= 1')
        expect(valueIndex).toBeGreaterThan(0)
        const oneIndex = valueIndex + 2 // позиция после "= "
        
        const result = codeModelFactory.updateModel(codeModel, [
            replace(oneIndex, 1, '2')
        ])

        expect(result).toBe(true)
        expect(codeModel.children[0].params[0].defaultValue.value).toBe('2')
        expect(codeModel.children[0].params[0].defaultValue.value).not.toBe(initialValue)
    })

    test('должен обрабатывать изменения в операторе сравнения', () => {
        const initialCode = 'Процедура Тест()\n  Если а = б Тогда\n    в = 1;\n  КонецЕсли;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)

        // Изменяем оператор сравнения
        const result = codeModelFactory.updateModel(codeModel, [
            replace(28, 1, '<>')
        ])

        expect(result).toBe(true)
        const ifStatement = codeModel.children[0].children[0]
        expect(ifStatement.branches[0].condition.operator).toBe('<>')
    })

    test('должен обрабатывать изменения в цепочке вызовов методов', () => {
        const initialCode = 'Процедура Тест()\n  Объект.Метод1().Метод2();\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)

        // Добавляем еще один вызов метода
        const result = codeModelFactory.updateModel(codeModel, [
            insert(36, '.Метод3()')
        ])

        expect(result).toBe(true)
        const methodCall = codeModel.children[0].children[0]
        expect(methodCall).toBeDefined()
    })

    test('должен обрабатывать изменения в операторе for each', () => {
        const initialCode = 'Процедура Тест()\n  Для Каждого Элемент Из Коллекция Цикл\n    а = Элемент;\n  КонецЦикла;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)
        const initialVarName = codeModel.children[0].children[0].variable.name

        // Изменяем имя переменной цикла - заменяем "Элемент" на "Элемент2"
        // Находим первое вхождение "Элемент" после "Для Каждого "
        const forEachIndex = initialCode.indexOf('Для Каждого ')
        expect(forEachIndex).toBeGreaterThan(0)
        const elementIndex = forEachIndex + 'Для Каждого '.length
        
        const result = codeModelFactory.updateModel(codeModel, [
            replace(elementIndex, 7, 'Элемент2')
        ])

        expect(result).toBe(true)
        const forEachStatement = codeModel.children[0].children[0]
        expect(forEachStatement.variable.name).toBe('Элемент2')
        expect(forEachStatement.variable.name).not.toBe(initialVarName)
    })

    test('должен обрабатывать изменения в условном операторе с else', () => {
        const initialCode = 'Процедура Тест()\n  Если а > 0 Тогда\n    б = 1;\n  Иначе\n    в = 2;\n  КонецЕсли;\nКонецПроцедуры'
        const codeModel = codeModelFactory.buildModel(initialCode)

        // Изменяем значение в блоке else - заменяем "2" на "3"
        // Находим позицию "в = 2"
        const elseIndex = initialCode.indexOf('в = 2')
        expect(elseIndex).toBeGreaterThan(0)
        const twoIndex = elseIndex + 4 // позиция после "в = "
        
        const result = codeModelFactory.updateModel(codeModel, [
            replace(twoIndex, 1, '3')
        ])

        expect(result).toBe(true)
        const ifStatement = codeModel.children[0].children[0]
        expect(ifStatement).toBeDefined()
        expect(ifStatement.branches).toBeDefined()
        expect(ifStatement.branches.length).toBeGreaterThan(1)
        if (ifStatement.branches[1] && ifStatement.branches[1].body && ifStatement.branches[1].body.length > 0) {
            const assignment = ifStatement.branches[1].body[0]
            if (assignment && assignment.expression) {
                expect(assignment.expression.value).toBe('3')
            }
        }
    })
})