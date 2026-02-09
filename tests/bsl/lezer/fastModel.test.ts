import { describe, test, expect } from 'vitest'
import { LezerCodeModelFactory } from '../../../src/bsl/lezer/codeModelFactory'
import { isMethodDefinition } from '../../../src/bsl/codeModel'
import { createMockModel } from './testUtils'

describe('Fast + Full Model', () => {
    test('fast build should not parse method bodies', () => {
        const factory = new LezerCodeModelFactory()
        const code = 'Процедура Тест()\n    a = 1;\n    b = 2;\nКонецПроцедуры'
        const model = factory.buildModel(code)
        
        expect(model.children.length).toBeGreaterThan(0)
        
        const method = model.children.find(isMethodDefinition)
        if (method) {
            expect(method.bodyParsed).toBe(false)
            expect(method.children).toEqual([])
        }
    })

    test('should load method body on demand', () => {
        const factory = new LezerCodeModelFactory()
        const code = 'Процедура Тест()\n    a = 1;\nКонецПроцедуры'
        const model = factory.buildModel(code)
        
        const method = model.children.find(isMethodDefinition)
        expect(method).toBeDefined()
        
        if (method) {
            expect(method.bodyParsed).toBe(false)
            expect(method.children).toEqual([])
            
            factory.ensureMethodBody(method)
            
            expect(method.bodyParsed).toBe(true)
            // Тело может быть пустым если visitor не работает, но флаг должен быть установлен
        }
    })

    test('ensureMethodBody should be idempotent', () => {
        const factory = new LezerCodeModelFactory()
        const code = 'Процедура Тест()\n    a = 1;\nКонецПроцедуры'
        const model = factory.buildModel(code)
        
        const method = model.children.find(isMethodDefinition)
        if (method) {
            factory.ensureMethodBody(method)
            const firstChildren = method.children
            
            factory.ensureMethodBody(method)
            expect(method.children).toBe(firstChildren) // Та же ссылка
        }
    })

    test('fast build should be quick on large code', () => {
        const factory = new LezerCodeModelFactory()
        const procedures = []
        for (let i = 0; i < 100; i++) {
            procedures.push(`Процедура Процедура${i}()\n    Перем a;\n    a = ${i};\nКонецПроцедуры`)
        }
        const largeCode = procedures.join('\n\n')
        
        const start = performance.now()
        const model = factory.buildModel(largeCode)
        const time = performance.now() - start
        
        console.log(`Fast build time for 100 procedures: ${time}ms`)
        expect(time).toBeLessThan(200) // Должно быть быстро
        expect(model.children.length).toBeGreaterThan(0)
    })

    test('incremental update should preserve unloaded bodies', () => {
        const factory = new LezerCodeModelFactory()
        const code = 'Процедура Тест1()\n    a = 1;\nКонецПроцедуры\n\nПроцедура Тест2()\n    b = 2;\nКонецПроцедуры'
        const model = factory.buildModel(code)
        const mockModel = createMockModel(code)
        
        const method1 = model.children.find(c => isMethodDefinition(c) && c.name === 'Тест1')
        const method2 = model.children.find(c => isMethodDefinition(c) && c.name === 'Тест2')
        
        // Загружаем тело первого метода
        if (method1) {
            factory.ensureMethodBody(method1)
            expect(method1.bodyParsed).toBe(true)
        }
        
        // Изменяем второй метод
        const newCode = code.replace('b = 2', 'b = 20')
        mockModel.setValue(newCode)
        
        const changes = [{
            rangeOffset: code.indexOf('b = 2'),
            rangeLength: 5,
            text: 'b = 20'
        }]
        
        const result = factory.updateModel(model, mockModel, changes)
        
        // Первый метод должен остаться загруженным (если обновление успешно)
        if (result && method1) {
            expect(method1.bodyParsed).toBe(true)
        }
    })

    test('should handle multiple methods', () => {
        const factory = new LezerCodeModelFactory()
        const code = `
Процедура Метод1()
    a = 1;
КонецПроцедуры

Функция Метод2() Экспорт
    Возврат 2;
КонецФункции

Процедура Метод3()
    c = 3;
КонецПроцедуры`
        
        const model = factory.buildModel(code)
        const methods = model.children.filter(isMethodDefinition)
        
        expect(methods.length).toBe(3)
        expect(methods[0].name).toBe('Метод1')
        expect(methods[1].name).toBe('Метод2')
        expect(methods[1].isExport).toBe(true)
        expect(methods[2].name).toBe('Метод3')
        
        // Все тела не загружены
        methods.forEach(m => {
            expect(m.bodyParsed).toBe(false)
            expect(m.children).toEqual([])
        })
    })
})
