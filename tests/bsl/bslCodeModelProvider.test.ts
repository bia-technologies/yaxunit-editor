
import { AccessSequenceSymbol, AssignmentStatementSymbol, BinaryExpressionSymbol, ConstructorSymbol, FunctionDefinitionSymbol, MethodCallSymbol, ModuleVariableDefinitionSymbol, ProcedureDefinitionSymbol, TernaryExpressionSymbol, UnaryExpressionSymbol } from '../../src/bsl/codeModel'
import { useTreeSitterBsl } from '../../src/bsl/tree-sitter'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import utils from './utils'

beforeAll(async () => {
    await useTreeSitterBsl()
})

afterAll(() => {
    utils.cleanAfterAll()
})

describe('buildModel', () => {
    test('MethodCall', () => {
        const model = utils.buildModel('Сообщить(1)')
        expect(model.children[0]).toBeInstanceOf(MethodCallSymbol)
        expect(model.children[0]).toMatchObject({
            name: 'Сообщить',
            arguments: [
                {
                    value: '1',
                    type: 'Число'
                }
            ]
        })
    })

    test('FunctionDefinition', () => {
        const model = utils.buildModel('Функция Сложить(Операнд1, Знач Операнд2 = 1) Экспорт КонецФункции')

        expect(model.children[0]).toBeInstanceOf(FunctionDefinitionSymbol)
        expect(model.children[0]).toMatchObject({
            name: 'Сложить',
            params: [
                { name: 'Операнд1', byVal: false },
                {
                    name: 'Операнд2',
                    byVal: true,
                    defaultValue: {
                        value: '1',
                        type: 'Число'
                    }
                }
            ],
            isExport: true,
        })
    })

    test('FunctionDefinition with body', () => {
        const model = utils.buildModel('Функция Сложить(Операнд1, Знач Операнд2 = 1) Экспорт Сообщить(Операнд1 + Операнд2);Возврат Операнд1 + Операнд2 КонецФункции')

        expect(model.children[0]).toBeInstanceOf(FunctionDefinitionSymbol)
        expect(model.children[0]).toMatchObject({
            children: [
                {
                    name: 'Сообщить', arguments: [{
                        left: { name: 'Операнд1' },
                        right: { name: 'Операнд2' },
                        operator: '+'
                    }]
                },
                {
                    expression: {
                        left: { name: 'Операнд1' },
                        right: { name: 'Операнд2' },
                        operator: '+'
                    }
                }
            ]
        })
    })

    test('ProcedureDefinition', () => {
        const model = utils.buildModel('Процедура Сложить(Знач Операнд1, Операнд2 = "123") КонецПроцедуры')

        expect(model.children[0]).toBeInstanceOf(ProcedureDefinitionSymbol)
        expect(model.children[0]).toMatchObject({
            name: 'Сложить',
            params: [
                { name: 'Операнд1', byVal: true },
                {
                    name: 'Операнд2',
                    byVal: false,
                    defaultValue: {
                        value: '123',
                        type: 'Строка'
                    },
                }
            ],
            isExport: false,
        })
    })

    test('ModuleVariableDefinition', () => {
        const model = utils.buildModel('Перем П1, П2 Экспорт; Перем П3;')

        expect(model.children).length(3)
        expect(model.children).toMatchObject([
            { name: 'П1', isExport: true },
            { name: 'П2', isExport: true },
            { name: 'П3', isExport: false }
        ])
    })

    test('Assignment local variable', () => {
        const model = utils.buildModel('Документ = Документы.ПКО.СоздатьДокумент();')

        expect(model.children[0]).toMatchObject({
            variable: { name: 'Документ' }
        })
    })

    test('Assignment property', () => {
        const model = utils.buildModel('Документ.Дата = ТекущаяДата();')

        expect(model.children[0]).toMatchObject({
            variable: { access: [{ name: 'Документ' }, { name: 'Дата' }] }
        })
    })

    test('Assignment index', () => {
        const model = utils.buildModel('Даты[0] = ТекущаяДата();')

        expect(model.children[0]).toMatchObject({
            variable: { access: [{ name: 'Даты' }, { name: '0' }] }
        })
    })

    test('Assignment method result', () => {
        const model = utils.buildModel('Даты().Текущая = ТекущаяДата();')

        expect(model.children[0]).toMatchObject({
            variable: { access: [{ name: 'Даты' }, { name: 'Текущая' }] }
        })
    })
})


describe('expressions', () => {
    function expression(content: string) {
        const model = utils.buildModel(`м = ${content};`)
        return (model.children[0] as AssignmentStatementSymbol).expression
    }

    test('UnaryExpression. constants', () => {
        const exp = expression('-1')
        expect(exp).toBeInstanceOf(UnaryExpressionSymbol)
        expect(exp).toMatchObject(
            {
                operand: {
                    value: '1',
                    type: 'Число'
                },
                operator: '-'
            }
        )
    })

    test('UnaryExpression. variable', () => {
        const exp = expression('не Документ.Проведен')
        expect(exp).toBeInstanceOf(UnaryExpressionSymbol)
        expect(exp).toMatchObject(
            {
                operand: {
                    access: [{ name: 'Документ' }, { name: 'Проведен' }],
                    operator: 'не'
                }
            }
        )
    })

    test('BinaryExpression. constants', () => {
        const exp = expression('1 + "1"')
        expect(exp).toBeInstanceOf(BinaryExpressionSymbol)
        expect(exp).toMatchObject(
            {
                left: {
                    value: '1',
                    type: 'Число'
                },
                right: { value: '1', type: 'Строка' },
                operator: '+'
            }
        )
    })

    test('BinaryExpression. variables', () => {
        const exp = expression('Документ.Дата + Смещение')
        expect(exp).toBeInstanceOf(BinaryExpressionSymbol)
        expect(exp).toMatchObject(
            {
                left: { access: [{ name: 'Документ' }, { name: 'Дата' }] },
                right: { name: 'Смещение' },
                operator: '+'
            }
        )
    })

    test('BinaryExpression. many', () => {
        const exp = expression('Документ.Дата * 1 + СмещениеМинут/60')
        expect(exp).toBeInstanceOf(BinaryExpressionSymbol)
        expect(exp).toMatchObject(
            {
                left: {
                    left: { access: [{ name: 'Документ' }, { name: 'Дата' }] },
                    right: { value: '1' },
                    operator: '*'
                },
                right: {
                    left: { name: 'СмещениеМинут' },
                    right: { value: '60' },
                    operator: '/'
                },
                operator: '+'
            }
        )
    })

    test('Ternary expression', () => {
        const exp = expression('?(a >= 3, a, 2)')
        expect(exp).toBeInstanceOf(TernaryExpressionSymbol)
        expect(exp).toMatchObject(
            {
                condition: {
                    left: { name: 'a' },
                    right: { value: '3' },
                    operator: '>='
                },
                consequence: { name: 'a' },
                alternative: { value: '2' }
            }
        )
    })

    test('Constructor', () => {
        const exp = expression('Новый Массив')
        expect(exp).toBeInstanceOf(ConstructorSymbol)
        expect(exp).toMatchObject(
            {
                name: 'Массив'
            }
        )
    })

    test('Constructor with arguments', () => {
        const exp = expression('Новый Массив(1)')
        expect(exp).toBeInstanceOf(ConstructorSymbol)
        expect(exp).toMatchObject(
            {
                name: 'Массив',
                arguments: [{ value: '1' }]
            }
        )
    })

    test('Constructor as method', () => {
        const exp = expression('Новый("Массив", Параметры)')
        expect(exp).toBeInstanceOf(ConstructorSymbol)
        expect(exp).toMatchObject(
            {
                name: 'Массив',
                arguments: { name: 'Параметры' }
            }
        )
    })

    test('Constructor as method variable', () => {
        const exp = expression('Новый(ТипЗначения, Параметры)')
        expect(exp).toBeInstanceOf(ConstructorSymbol)
        expect(exp).toMatchObject(
            {
                name: { name: 'ТипЗначения' },
                arguments: { name: 'Параметры' }
            }
        )
    })

    test('Constructor as method by type', () => {
        const exp = expression('Новый(Тип("Массив"), Параметры)')
        expect(exp).toBeInstanceOf(ConstructorSymbol)
        expect(exp).toMatchObject(
            {
                name: { name: 'Тип', arguments: [{ value: 'Массив' }] },
                arguments: { name: 'Параметры' }
            }
        )
    })

    test('Method call. Global', () => {
        const exp = expression('Сообщить(1)')
        expect(exp).toBeInstanceOf(MethodCallSymbol)
        expect(exp).toMatchObject(
            {
                name: 'Сообщить',
                arguments: [{ value: '1' }]
            }
        )
    })
    test('Method call. Global', () => {
        const exp = expression('Объект.Сообщить(1)')
        expect(exp).toBeInstanceOf(AccessSequenceSymbol)
        expect(exp).toMatchObject(
            {
                access: [
                    { name: 'Объект' },
                    {
                        name: 'Сообщить',
                        arguments: [{ value: '1' }]
                    }]
            }
        )
    })
})

describe('complex', () => {
    test('FunctionDefinition with body', () => {
        const model = utils.buildModel('Функция Сложить(Операнд1, Знач Операнд2 = 1) Экспорт Результат = Операнд1 + Операнд2;Сообщить(СтрШаблон("%1 + %2 = %3", Операнд1, Операнд2, Результат));Возврат Результат КонецФункции')

        expect(model.children[0]).toBeInstanceOf(FunctionDefinitionSymbol)
        expect(model.children[0]).toMatchObject({
            children: [
                {
                    variable: { name: 'Результат' }, expression: {
                        left: { name: 'Операнд1' },
                        right: { name: 'Операнд2' },
                        operator: '+'
                    }
                },
                {
                    name: 'Сообщить', arguments: [{
                        name: 'СтрШаблон', arguments: [{ value: '%1 + %2 = %3' }, { name: 'Операнд1' }, { name: 'Операнд2' }, { name: 'Результат' }]
                    }]
                },
                {
                    expression: { name: 'Результат' }
                }
            ]
        })
    })
    test('case 1', () => {
        const model = utils.buildModel(`Перем Операнд1, Операнд2;
            Функция Сложить() Возврат Операнд1 + Операнд2;КонецФункции;
            Процедура Вывести(Значение) Сообщить(Значение);КонецПроцедуры;
            Операнд1 = "Сложение 1 И ";
            Операнд2 = "2";
            Вывести(Сложить());
            `)
        expect(model.children).length(7)
        expect(model.children[0]).toBeInstanceOf(ModuleVariableDefinitionSymbol)
        expect(model.children[1]).toBeInstanceOf(ModuleVariableDefinitionSymbol)
        expect(model.children[2]).toBeInstanceOf(FunctionDefinitionSymbol)
        expect(model.children[3]).toBeInstanceOf(ProcedureDefinitionSymbol)
        expect(model.children[4]).toBeInstanceOf(AssignmentStatementSymbol)
        expect(model.children[5]).toBeInstanceOf(AssignmentStatementSymbol)
        expect(model.children[6]).toBeInstanceOf(MethodCallSymbol)
    })
})

