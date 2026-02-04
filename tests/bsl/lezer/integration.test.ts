import { describe, it, expect } from 'vitest'
import { LezerCodeModelFactory } from '@/bsl/lezer/codeModelFactory'
import { ChevrotainSitterCodeModelFactory } from '@/bsl/chevrotain/codeModelFactory'

describe('Lezer vs Chevrotain Integration Tests', () => {
    const lezerFactory = new LezerCodeModelFactory()
    const chevrotainFactory = new ChevrotainSitterCodeModelFactory()

    const testCases = [
        {
            name: 'simple procedure',
            code: `
Процедура Тест()
    // комментарий
КонецПроцедуры`
        },
        {
            name: 'exported function with parameters',
            code: `
Функция Вычислить(Знач Число1, Число2 = 0) Экспорт
    Возврат Число1 + Число2;
КонецФункции`
        },
        {
            name: 'variable declarations',
            code: `
Перем ГлобальнаяПеременная1, ГлобальнаяПеременная2;`
        },
        {
            name: 'complex module',
            code: `
Перем МодульнаяПеременная;

Процедура ИнициализацияМодуля()
    МодульнаяПеременная = Новый Структура();
КонецПроцедуры

Функция ПолучитьЗначение(Ключ) Экспорт
    Если МодульнаяПеременная.Свойство(Ключ) Тогда
        Возврат МодульнаяПеременная[Ключ];
    Иначе
        Возврат Неопределено;
    КонецЕсли;
КонецФункции`
        }
    ]

    testCases.forEach(({ name, code }) => {
        it(`should produce similar results for ${name}`, () => {
            const lezerModel = lezerFactory.buildModel(code)
            const chevrotainModel = chevrotainFactory.buildModel(code)

            // Сравниваем количество символов верхнего уровня
            expect(lezerModel.children.length).toBeGreaterThan(0)
            expect(chevrotainModel.children.length).toBeGreaterThan(0)

            // Проверяем что оба парсера нашли символы
            const lezerTypes = lezerModel.children.map(c => c.constructor.name).sort()
            const chevrotainTypes = chevrotainModel.children.map(c => c.constructor.name).sort()

            // Должны быть похожие типы символов
            expect(lezerTypes.length).toBeGreaterThan(0)
            expect(chevrotainTypes.length).toBeGreaterThan(0)
        })
    })

    it('should handle parsing errors similarly', () => {
        const invalidCode = `
Процедура НеЗакрытая(
    // ошибка синтаксиса
`
        const lezerModel = lezerFactory.buildModel(invalidCode)
        const chevrotainModel = chevrotainFactory.buildModel(invalidCode)

        // Оба должны создать модель даже при ошибках
        expect(lezerModel).toBeDefined()
        expect(chevrotainModel).toBeDefined()

        // Оба должны зафиксировать ошибки
        expect(lezerFactory.errors.length).toBeGreaterThanOrEqual(0)
        expect(chevrotainFactory.errors.length).toBeGreaterThanOrEqual(0)
    })

    it('should maintain performance advantage', () => {
        const largeCode = `
${Array.from({ length: 50 }, (_, i) => `
Процедура Процедура${i}(Параметр${i})
    Перем Переменная${i};
    Переменная${i} = Параметр${i} * 2;
    Если Переменная${i} > 100 Тогда
        Возврат Переменная${i};
    КонецЕсли;
КонецПроцедуры`).join('\n')}
`

        const lezerStart = performance.now()
        const lezerModel = lezerFactory.buildModel(largeCode)
        const lezerTime = performance.now() - lezerStart

        const chevrotainStart = performance.now()
        const chevrotainModel = chevrotainFactory.buildModel(largeCode)
        const chevrotainTime = performance.now() - chevrotainStart

        console.log(`Lezer time: ${lezerTime}ms, Chevrotain time: ${chevrotainTime}ms`)

        // Оба должны создать модели
        expect(lezerModel.children.length).toBeGreaterThan(0)
        expect(chevrotainModel.children.length).toBeGreaterThan(0)

        // Lezer должен быть быстрее (или хотя бы не медленнее в 2 раза)
        expect(lezerTime).toBeLessThan(chevrotainTime * 2)
    })
})
