import { describe, expect, test } from 'vitest'
import { parseTrace } from '../../src/yaxunit/features/stackTrace'

describe('parse trace', () => {
    test('Без упоминания внешней обработки', () => {
        const message = 'Message\n{(1)}:Expression1()\n{YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль(228)}:Expression12;'
        expect(parseTrace(message)).toMatchObject([
            { line: 1, module: "", shortMessage: 'Expression1()' },
            { line: 228, module: "YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль", shortMessage: 'Expression12;' }
        ])
    })

    test('Две ошибки ошибка + стек', () => {
        const message = 'Message\n{(1)}:Expression1()\n{ВнешняяОбработка.ЗапускТестовогоМодуля.МодульОбъекта(32)}:Expression2();'
            + '\n{ВнешняяОбработка.ЗапускТестовогоМодуля.МодульОбъекта(132)}:Expression3();'
            + '\n{YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль(228)}:Выполнить(Выражение);'
        expect(parseTrace(message)).toMatchObject([
            { line: 1, module: "", shortMessage: 'Expression1()' },
            { line: 32, module: "ВнешняяОбработка.ЗапускТестовогоМодуля.МодульОбъекта", shortMessage: 'Expression2();' },
            { line: 132, module: "ВнешняяОбработка.ЗапускТестовогоМодуля.МодульОбъекта", shortMessage: 'Expression3();' },
            { line: 228, module: "YAXUNIT ОбщийМодуль.ЮТМетодыСлужебный.Модуль", shortMessage: 'Выполнить(Выражение);' }
        ])
    })
})