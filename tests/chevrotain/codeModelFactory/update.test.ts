import { BslCodeModel } from '../../../src/bsl/codeModel'
import { ChevrotainCodeModelFactory } from '../../../src/bsl/chevrotain'
import { describe, expect, test, beforeEach } from 'vitest'
import { expectProcedure, expectExpression, insert, remove, replace, setupTestEnvironment } from './helpers'

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
            replace(33, 1, '20')
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
})