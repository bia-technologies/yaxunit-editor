
import {
    AccessSequenceSymbol,
    AddHandlerStatementSymbol,
    AssignmentStatementSymbol,
    AwaitStatementSymbol,
    BinaryExpressionSymbol,
    BreakStatementSymbol,
    BslCodeModel,
    ConstructorSymbol,
    ConstSymbol,
    ContinueStatementSymbol,
    ForEachStatementSymbol,
    ForStatementSymbol,
    FunctionDefinitionSymbol,
    GotoStatementSymbol,
    IfStatementSymbol,
    LabelStatementSymbol,
    MethodCallSymbol,
    ProcedureDefinitionSymbol,
    RemoveHandlerStatementSymbol,
    TernaryExpressionSymbol,
    TryStatementSymbol,
    UnaryExpressionSymbol,
    VariableDefinitionSymbol,
    WhileStatementSymbol
} from '../../src/bsl/codeModel'
import { ChevrotainSitterCodeModelFactory } from '../../src/bsl/chevrotain'
import { describe, expect, test } from 'vitest'


describe('Literals', () => {
    test('Number', () => {
        const exp = expression('1')
        expect(exp).toBeInstanceOf(ConstSymbol)
        expect(exp).toMatchObject({ value: '1', type: 'Число' })
    })

    test('String', () => {
        const exp = expression('"1"')
        expect(exp).toBeInstanceOf(ConstSymbol)
        expect(exp).toMatchObject({ value: '1', type: 'Строка' })
    })

    test('String with quote', () => {
        const exp = expression('"ru = \'Не удалось подключить внешнюю компоненту ""%1"" на сервере по причине:"')
        expect(exp).toBeInstanceOf(ConstSymbol)
        expect(exp).toMatchObject({ value: 'ru = \'Не удалось подключить внешнюю компоненту ""%1"" на сервере по причине:', type: 'Строка' })
    })

    test('Multiline string', () => {
        const exp = expression('"1\n|2"')
        expect(exp).toBeInstanceOf(ConstSymbol)
        expect(exp).toMatchObject({ value: '1\n2', type: 'Строка' })
    })

    test('Date ', () => {
        const exp = expression("'00010101'")
        expect(exp).toBeInstanceOf(ConstSymbol)
        expect(exp).toMatchObject({ value: '00010101', type: 'Дата' })
    })

    test('Date with separators', () => {
        const exp = expression("'0001-01-01'")
        expect(exp).toBeInstanceOf(ConstSymbol)
        expect(exp).toMatchObject({ value: '00010101', type: 'Дата' })
    })

    test('Null', () => {
        const exp = expression('null')
        expect(exp).toBeInstanceOf(ConstSymbol)
        expect(exp).toMatchObject({ value: 'null', type: 'Null' })
    })

    test('Undefined', () => {
        const exp = expression('неопределено')
        expect(exp).toBeInstanceOf(ConstSymbol)
        expect(exp).toMatchObject({ value: 'неопределено', type: 'Неопределено' })
    })
})

describe('AssignmentStatementSymbol', () => {
    test('constant', () => {
        const model = buildModel('a = 1')
        expect(model).not.toBeUndefined()

        expect(model.children[0]).toBeInstanceOf(AssignmentStatementSymbol)
        expect(model.children[0]).toMatchObject({
            variable: {
                name: 'a',
            },
            expression: { value: '1', type: 'Число' }
        })
    })

    test('multi statement', () => {
        const model = buildModel('a = 1; b = 2; c = a + b')
        expect(model).not.toBeUndefined()

        expect(model.children[0]).toBeInstanceOf(AssignmentStatementSymbol)
        expect(model.children[1]).toBeInstanceOf(AssignmentStatementSymbol)
        expect(model.children[2]).toBeInstanceOf(AssignmentStatementSymbol)
        expect(model.children).toMatchObject([
            { variable: { name: 'a', }, expression: { value: '1', type: 'Число' } },
            { variable: { name: 'b', }, expression: { value: '2', type: 'Число' } },
            { variable: { name: 'c', }, expression: { left: { name: 'a' }, right: { name: 'b' }, operator: '+' } }
        ])
    })

    test('binary expression', () => {
        const model = buildModel("Документ.Дата = '20250311' + 1")
        expect(model).not.toBeUndefined()

        expect(model.children[0]).toBeInstanceOf(AssignmentStatementSymbol)
        expect(model.children[0]).toMatchObject({
            variable: {
                access: [{ name: 'Документ' }, { name: 'Дата' }]
            },
            expression: {
                left: { value: '20250311', type: 'Дата' },
                right: { value: '1', type: 'Число' },
                operator: '+'
            }
        })
    })

    test('two binary expression', () => {
        const model = buildModel('Сообщение = Префикс + " от " + Дата')
        expect(model).not.toBeUndefined()

        expect(model.children[0]).toBeInstanceOf(AssignmentStatementSymbol)
        expect(model.children[0]).toMatchObject({
            variable: { name: 'Сообщение' },
            expression: {
                left: {
                    left: { name: 'Префикс' },
                    right: { value: ' от ', type: 'Строка' },
                    operator: '+'
                },
                right: { name: 'Дата' },
                operator: '+'
            }
        })
    })

    test('3 binary expression', () => {
        const model = buildModel('Сумма = СуммаТовары + СуммаУслуги + СуммаКомиссия * 0.1')
        expect(model).not.toBeUndefined()

        expect(model.children[0]).toBeInstanceOf(AssignmentStatementSymbol)
        expect(model.children[0]).toMatchObject({
            variable: { name: 'Сумма' },
            expression: {
                left: {
                    left: { name: 'СуммаТовары' },
                    right: { name: 'СуммаУслуги' },
                    operator: '+'
                },
                right: {
                    left: { name: 'СуммаКомиссия' },
                    right: { value: '0.1', type: 'Число' },
                    operator: '*'
                },
                operator: '+'
            }
        })
    })

    test('from method', () => {
        const model = buildModel('Документ = СоздатьДокумент();')

        expect(model.children[0]).toMatchObject({
            variable: { name: 'Документ' },
            expression: {
                name: 'СоздатьДокумент'
            }
        })
    })

    test('from subject method', () => {
        const model = buildModel('Документ = Документы.ПКО.СоздатьДокумент();')

        expect(model.children[0]).toMatchObject({
            variable: { name: 'Документ' },
            expression: {
                access: [{ name: 'Документы' }, { name: 'ПКО' }, { name: 'СоздатьДокумент' }]
            }
        })
    })

    test('from subject method 2', () => {
        const model = buildModel('Документ = Документы().ПКО.СоздатьДокумент();')

        expect(model.children[0]).toMatchObject({
            variable: { name: 'Документ' },
            expression: {
                access: [{ name: 'Документы' }, { name: 'ПКО' }, { name: 'СоздатьДокумент' }]
            }
        })
    })
})

describe('MethodCallSymbol', () => {
    test('Global method without arguments', () => {
        const model = buildModel('Сообщить();')
        expect(model).not.toBeUndefined()

        expect(model.children[0]).toBeInstanceOf(MethodCallSymbol)
        expect(model.children[0]).toMatchObject({
            name: 'Сообщить',
            arguments: []
        })
    })

    test('Global method with arguments', () => {
        const model = buildModel('Сообщить("123", Var1);')
        expect(model).not.toBeUndefined()

        expect(model.children[0]).toBeInstanceOf(MethodCallSymbol)
        expect(model.children[0]).toMatchObject({
            name: 'Сообщить', arguments: [{ value: '123' }, { name: 'Var1' }]
        })
    })

    test('Object method with arguments', () => {
        const model = buildModel('ОбщегоНазначения.Сообщить(1 + 2);')
        expect(model).not.toBeUndefined()

        expect(model.children[0]).toBeInstanceOf(AccessSequenceSymbol)
        expect(model.children[0]).toMatchObject({
            access: [
                { name: 'ОбщегоНазначения' },
                {
                    name: 'Сообщить',
                    arguments: [{ left: { value: '1', type: 'Число' }, right: { value: '2', type: 'Число' }, operator: '+' }]
                }]
        })
    })

    test('Nested method', () => {
        const model = buildModel('ОбщегоНазначения.Сообщить(ТекущаяДата());')
        expect(model).not.toBeUndefined()

        expect(model.children[0]).toBeInstanceOf(AccessSequenceSymbol)
        expect(model.children[0]).toMatchObject({
            access: [
                { name: 'ОбщегоНазначения' },
                { name: 'Сообщить', arguments: [{ name: 'ТекущаяДата', arguments: [] }] }]
        })
    })

    test('Skipped arguments', () => {
        const model = buildModel('Сообщить(, 1);')
        expect(model).not.toBeUndefined()

        expect(model.children[0]).toBeInstanceOf(MethodCallSymbol)
        expect(model.children[0]).toMatchObject(
            { name: 'Сообщить', arguments: [undefined, { value: '1' }] }
        )
    })
})

describe('Constructor', () => {
    test('Constructor', () => {
        const exp = statement('Новый Массив')
        expect(exp).toBeInstanceOf(ConstructorSymbol)
        expect(exp).toMatchObject(
            {
                name: 'Массив'
            }
        )
    })

    test('Constructor with arguments', () => {
        const exp = statement('Новый Массив(1)')
        expect(exp).toBeInstanceOf(ConstructorSymbol)
        expect(exp).toMatchObject(
            {
                name: 'Массив',
                arguments: [{ value: '1' }]
            }
        )
    })

    test('Constructor as method', () => {
        const exp = statement('Новый("Массив", Параметры)')
        expect(exp).toBeInstanceOf(ConstructorSymbol)
        expect(exp).toMatchObject(
            {
                name: 'Массив',
                arguments: { name: 'Параметры' }
            }
        )
    })

    test('Constructor as method variable', () => {
        const exp = statement('Новый(ТипЗначения, Параметры)')
        expect(exp).toBeInstanceOf(ConstructorSymbol)
        expect(exp).toMatchObject(
            {
                name: { name: 'ТипЗначения' },
                arguments: { name: 'Параметры' }
            }
        )
    })

    test('Constructor as method by type', () => {
        const exp = statement('Новый(Тип("Массив"), Параметры)')
        expect(exp).toBeInstanceOf(ConstructorSymbol)
        expect(exp).toMatchObject(
            {
                name: { name: 'Тип', arguments: [{ value: 'Массив' }] },
                arguments: { name: 'Параметры' }
            }
        )
    })

    test('Constructor as method without params', () => {
        const exp = statement('Новый("Массив")')
        expect(exp).toBeInstanceOf(ConstructorSymbol)
        expect(exp).toMatchObject(
            {
                name: 'Массив',
                arguments: undefined
            }
        )
    })

})

describe('Definitions', () => {
    test('Empty procedure', () => {
        const model = buildModel('Процедура Сложить() КонецПроцедуры')

        expect(model.children[0]).toBeInstanceOf(ProcedureDefinitionSymbol)
        expect(model.children[0]).toMatchObject({
            name: 'Сложить',
            params: [],
            isExport: false,
        })
    })
    test('Procedure with parameters', () => {
        const model = buildModel('Процедура Сложить(Знач Операнд1, Операнд2 = "123") КонецПроцедуры')

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

    test('FunctionDefinition with body', () => {
        const model = buildModel('Функция Сложить() Экспорт Сообщить(1); КонецФункции')

        expect(model.children[0]).toBeInstanceOf(FunctionDefinitionSymbol)
        expect(model.children[0]).toMatchObject({
            children: [
                { name: 'Сообщить', arguments: [{ value: '1' },] }
            ]
        })
    })
})

describe('Expression', () => {
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
                },
                operator: 'не'
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
                },
                operator: 'не'
            }
        )
    })

    test('BinaryExpression. method call', () => {
        const exp = expression('ТекущаяДата() + 1')
        expect(exp).toBeInstanceOf(BinaryExpressionSymbol)
        expect(exp).toMatchObject(
            {
                left: { name: 'ТекущаяДата' },
                right: { value: '1' },
                operator: '+'
            }
        )
    })

    test('BinaryExpression. index access', () => {
        const exp = expression('Строки[0].Сумма + Строки[Последняя].Сумма')
        expect(exp).toBeInstanceOf(BinaryExpressionSymbol)
        expect(exp).toMatchObject(
            {
                left: { access: [{ name: 'Строки' }, { index: { value: '0' } }, { name: 'Сумма' }] },
                right: { access: [{ name: 'Строки' }, { index: { name: 'Последняя' } }, { name: 'Сумма' }] },
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

    test('BinaryExpression. multi addition', () => {
        let exp = expression('1 + 2 + 33')
        expect(exp).toBeInstanceOf(BinaryExpressionSymbol)
        expect(exp).toMatchObject(
            {
                left: {
                    left: { value: '1' },
                    right: { value: '2' },
                    operator: '+'
                },
                right: { value: '33' },
                operator: '+'
            })
        expect(exp.startOffset).toEqual(2) // + assign offset
        expect(exp.endOffset).toEqual(12)
        exp = exp.left
        expect(exp.startOffset).toEqual(2) // + assign offset
        expect(exp.endOffset).toEqual(7)
    })

    test('BinaryExpression. addition & multiplication', () => {
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

    test('BinaryExpression. addition & unary', () => {
        const exp = expression('1 + -2')
        expect(exp).toBeInstanceOf(BinaryExpressionSymbol)
        expect(exp).toMatchObject(
            {
                left: { value: '1' },
                right: { operand: { value: '2' }, operator: '-' },
                operator: '+'
            })
    })

    test('BinaryExpression. compare', () => {
        const exp = expression('a > 2')
        expect(exp).toBeInstanceOf(BinaryExpressionSymbol)
        expect(exp).toMatchObject(
            {
                left: { name: 'a' },
                right: { value: '2' },
                operator: '>'
            })
    })

    test('BinaryExpression. or compare', () => {
        const exp = expression('a > 2 Или b < 0')
        expect(exp).toBeInstanceOf(BinaryExpressionSymbol)
        expect(exp).toMatchObject(
            {
                left: {
                    left: { name: 'a' },
                    right: { value: '2' },
                    operator: '>'
                },
                right: {
                    left: { name: 'b' },
                    right: { value: '0' },
                    operator: '<'
                },
                operator: 'Или'
            })
    })

    test('Parenthesis expression', () => {
        const exp = expression('Not(a)')
        expect(exp).toBeInstanceOf(UnaryExpressionSymbol)
        expect(exp).toMatchObject(
            {
                operand: { name: 'a' },
                operator: 'Not'
            })
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
    test('unclosed', () => {
        const exp = expression('Выборка.')
        expect(exp).not.toBeUndefined()

        expect(exp).toBeInstanceOf(AccessSequenceSymbol)
        expect(exp).toMatchObject({
            access: [{ name: 'Выборка' }],
            unclosed: true
        })
    })

})

describe('If statement', () => {
    test('single', () => {
        const exp = statement('if true then сообщить(1);endif')
        expect(exp).toBeInstanceOf(IfStatementSymbol)
        expect(exp).toMatchObject({
            branches: [
                { condition: { value: 'true' }, body: [{ name: 'сообщить' }] }
            ]
        })
    })
    test('with elsif', () => {
        const exp = statement('if true then a(1);b(1);elsif false then c(2);d(2);endif')
        expect(exp).toBeInstanceOf(IfStatementSymbol)
        expect(exp).toMatchObject({
            branches: [
                { condition: { value: 'true' }, body: [{ name: 'a' }, { name: 'b' }] },
                { condition: { value: 'false' }, body: [{ name: 'c' }, { name: 'd' }] }
            ]
        })
    })
    test('with else', () => {
        const exp = statement('if true then a(1);b(1);else c(2);d(2);endif')
        expect(exp).toBeInstanceOf(IfStatementSymbol)
        expect(exp).toMatchObject({
            branches: [
                { condition: { value: 'true' }, body: [{ name: 'a' }, { name: 'b' }] }
            ],
            elseBranch: { body: [{ name: 'c' }, { name: 'd' }] }
        })
    })
})

describe('Try statement', () => {
    test('base', () => {
        const exp = statement('Попытка a(1);b(1); Исключение c(2);d(2);КонецПопытки')
        expect(exp).toBeInstanceOf(TryStatementSymbol)
        expect(exp).toMatchObject({
            body: [{ name: 'a' }, { name: 'b' }],
            handler: [{ name: 'c' }, { name: 'd' }]
        })
    })
})

describe('While statement', () => {
    test('base', () => {
        const exp = statement('Пока а < 10 Цикл a(); b = а%100;КонецЦикла')
        expect(exp).toBeInstanceOf(WhileStatementSymbol)
        expect(exp).toMatchObject({
            condition: { left: { name: 'а' }, right: { value: '10' }, operator: '<' },
            body: [{ name: 'a' }, { variable: { name: 'b' } }],
        })
    })
})

describe('For statement', () => {
    test('base', () => {
        const exp = statement('Для a = 0 По 10 Цикл a();b();КонецЦикла')
        expect(exp).toBeInstanceOf(ForStatementSymbol)
        expect(exp).toMatchObject({
            variable: { name: 'a' },
            start: { value: '0' },
            end: { value: '10' },
            body: [{ name: 'a' }, { name: 'b' }],
        })
    })
})

describe('For each statement', () => {
    test('base', () => {
        const exp = statement('Для каждого строка из список Цикл a(); b();КонецЦикла')
        expect(exp).toBeInstanceOf(ForEachStatementSymbol)
        expect(exp).toMatchObject({
            variable: { name: 'строка' },
            collection: { name: 'список' },
            body: [{ name: 'a' }, { name: 'b' }],
        })
    })
})

describe('Continue statement', () => {
    test('base', () => {
        const exp = statement('Продолжить;')
        expect(exp).toBeInstanceOf(ContinueStatementSymbol)
    })
})

describe('Break statement', () => {
    test('base', () => {
        const exp = statement('Прервать;')
        expect(exp).toBeInstanceOf(BreakStatementSymbol)
    })
})

describe('Gogo statement', () => {
    test('base', () => {
        const exp = statement('Перейти ~ВыходИзДвойногоЦикла;')
        expect(exp).toBeInstanceOf(GotoStatementSymbol)
        expect(exp).toMatchObject({ label: 'ВыходИзДвойногоЦикла' })
    })
})

describe('Label statement', () => {
    test('base', () => {
        const exp = statement('~ВыходИзДвойногоЦикла:')
        expect(exp).toBeInstanceOf(LabelStatementSymbol)
        expect(exp).toMatchObject({ label: 'ВыходИзДвойногоЦикла' })
    })
})

describe('Add handler statement', () => {
    test('base', () => {
        const exp = statement('ДобавитьОбработчик Накладная.ПриЗаписи, Обработка.ПриЗаписиДокумента')
        expect(exp).toBeInstanceOf(AddHandlerStatementSymbol)
        expect(exp).toMatchObject({
            event: { access: [{ name: 'Накладная' }, { name: 'ПриЗаписи' }] },
            handler: { access: [{ name: 'Обработка' }, { name: 'ПриЗаписиДокумента' }] }
        })
    })
})

describe('Remote handler statement', () => {
    test('base', () => {
        const exp = statement('УдалитьОбработчик Накладная.ПриЗаписи, Обработка.ПриЗаписиДокумента')
        expect(exp).toBeInstanceOf(RemoveHandlerStatementSymbol)
        expect(exp).toMatchObject({
            event: { access: [{ name: 'Накладная' }, { name: 'ПриЗаписи' }] },
            handler: { access: [{ name: 'Обработка' }, { name: 'ПриЗаписиДокумента' }] }
        })
    })
})

describe('Await statement', () => {
    test('base', () => {
        const exp = statement('Ждать ВопросАсинх()')
        expect(exp).toBeInstanceOf(AwaitStatementSymbol)
        expect(exp).toMatchObject({
            expression: { name: 'ВопросАсинх' }
        })
    })
})

describe('Var statement', () => {
    test('one', () => {
        const exp = statement('Перем П1')
        expect(exp).toBeInstanceOf(VariableDefinitionSymbol)
        expect(exp).toMatchObject({
            vars: [{ name: 'П1' }]
        })
    })
    test('many', () => {
        const exp = statement('Перем П1, П2')
        expect(exp).toBeInstanceOf(VariableDefinitionSymbol)
        expect(exp).toMatchObject({
            vars: [{ name: 'П1' }, { name: 'П2' }]
        })
    })
})


function buildModel(content: string) {
    return ChevrotainSitterCodeModelFactory.buildModel(content) as BslCodeModel
}

function statement(content: string) {
    const model = ChevrotainSitterCodeModelFactory.buildModel(content) as BslCodeModel
    return model.children[0]
}

function expression(content: string) {
    const model = ChevrotainSitterCodeModelFactory.buildModel('a=' + content) as BslCodeModel
    return model.children[0].expression
}