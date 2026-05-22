import { describe, test, expect } from 'vitest'
import { LezerCodeModelFactory } from '../../../src/bsl/lezer/codeModelFactory'
import { IModelContentChange } from '../../../src/bsl/chevrotain/parser'
import { createMockModel, generateLargeCode } from './testUtils'

describe('LezerCodeModelFactory - Incremental Update', () => {
    describe('Basic functionality', () => {
        test('should update model when adding text at end', () => {
            const factory = new LezerCodeModelFactory()
            const initialCode = 'a = 1'
            const model = createMockModel(initialCode)
            const codeModel = factory.buildModel(initialCode)
            
            const newCode = 'a = 1\nb = 2'
            model.setValue(newCode)
            
            const changes: IModelContentChange[] = [{
                rangeOffset: 5,
                rangeLength: 0,
                text: '\nb = 2'
            }]
            
            const result = factory.updateModel(codeModel, model, changes)
            expect(result).toBe(true)
            expect(codeModel.children.length).toBeGreaterThan(0)
        })

        test('should update model when deleting text', () => {
            const factory = new LezerCodeModelFactory()
            const initialCode = 'a = 1\nb = 2'
            const model = createMockModel(initialCode)
            const codeModel = factory.buildModel(initialCode)
            
            const newCode = 'a = 1'
            model.setValue(newCode)
            
            const changes: IModelContentChange[] = [{
                rangeOffset: 5,
                rangeLength: 6,
                text: ''
            }]
            
            const result = factory.updateModel(codeModel, model, changes)
            expect(result).toBe(true)
        })

        test('should update model when replacing text', () => {
            const factory = new LezerCodeModelFactory()
            const initialCode = 'a = 1'
            const model = createMockModel(initialCode)
            const codeModel = factory.buildModel(initialCode)
            
            const newCode = 'a = 10'
            model.setValue(newCode)
            
            const changes: IModelContentChange[] = [{
                rangeOffset: 4,
                rangeLength: 1,
                text: '10'
            }]
            
            const result = factory.updateModel(codeModel, model, changes)
            expect(result).toBe(true)
        })
    })

    describe('Edge cases', () => {
        test('should return false for empty model', () => {
            const factory = new LezerCodeModelFactory()
            const model = createMockModel('')
            const codeModel = factory.buildModel('')
            
            model.setValue('a = 1')
            
            const changes: IModelContentChange[] = [{
                rangeOffset: 0,
                rangeLength: 0,
                text: 'a = 1'
            }]
            
            const result = factory.updateModel(codeModel, model, changes)
            expect(result).toBe(false)
        })

        test('should return false when replacing entire code', () => {
            const factory = new LezerCodeModelFactory()
            const initialCode = 'a = 1'
            const model = createMockModel(initialCode)
            const codeModel = factory.buildModel(initialCode)
            
            const newCode = 'b = 2'
            model.setValue(newCode)
            
            const changes: IModelContentChange[] = [{
                rangeOffset: 0,
                rangeLength: initialCode.length,
                text: newCode
            }]
            
            const result = factory.updateModel(codeModel, model, changes)
            expect(result).toBe(false)
        })

        test('should handle multiple changes', () => {
            const factory = new LezerCodeModelFactory()
            const initialCode = 'a = 1\nb = 2'
            const model = createMockModel(initialCode)
            const codeModel = factory.buildModel(initialCode)
            
            const newCode = 'a = 10\nb = 20'
            model.setValue(newCode)
            
            const changes: IModelContentChange[] = [
                { rangeOffset: 4, rangeLength: 1, text: '10' },
                { rangeOffset: 11, rangeLength: 1, text: '20' }
            ]
            
            const result = factory.updateModel(codeModel, model, changes)
            expect(result).toBe(true)
        })
    })

    describe('Integration tests', () => {
        test('model should be correct after incremental update', () => {
            const factory = new LezerCodeModelFactory()
            const initialCode = 'a = 1'
            const model = createMockModel(initialCode)
            const codeModel = factory.buildModel(initialCode)
            
            const newCode = 'a = 100'
            model.setValue(newCode)
            
            const changes: IModelContentChange[] = [{
                rangeOffset: 4,
                rangeLength: 1,
                text: '100'
            }]
            
            factory.updateModel(codeModel, model, changes)
            
            // Сравниваем с полным парсингом
            const fullModel = factory.buildModel(newCode)
            
            expect(codeModel.children).toHaveLength(fullModel.children.length)
            expect(codeModel.children[0]).toMatchObject({
                variable: { name: 'a' },
                expression: { value: '100', type: 'Число' }
            })
        })

        test('should remove stale top-level methods after deleting a method', () => {
            const factory = new LezerCodeModelFactory()
            const deletedMethod = 'Процедура A()\nКонецПроцедуры\n\n'
            const initialCode = `${deletedMethod}Процедура B()\nКонецПроцедуры`
            const model = createMockModel(initialCode)
            const codeModel = factory.buildModel(initialCode)

            const newCode = initialCode.slice(deletedMethod.length)
            model.setValue(newCode)

            const changes: IModelContentChange[] = [{
                rangeOffset: 0,
                rangeLength: deletedMethod.length,
                text: ''
            }]

            const result = factory.updateModel(codeModel, model, changes)
            const fullModel = factory.buildModel(newCode)

            expect(result).toBe(true)
            expect(codeModel.children).toHaveLength(fullModel.children.length)
            expect(codeModel.methods.map(method => method.name)).toEqual(['B'])
        })

        test('should handle complex code changes', () => {
            const factory = new LezerCodeModelFactory()
            const initialCode = 'a = 1\nb = 2\nc = 3'
            
            const model = createMockModel(initialCode)
            const codeModel = factory.buildModel(initialCode)
            
            const newCode = 'a = 1\nb = 200\nc = 3'
            
            model.setValue(newCode)
            
            const changes: IModelContentChange[] = [{
                rangeOffset: 10,
                rangeLength: 1,
                text: '200'
            }]
            
            const result = factory.updateModel(codeModel, model, changes)
            expect(result).toBe(true)
            expect(codeModel.children.length).toBeGreaterThan(0)
        })
    })

    describe('Performance tests', () => {
        test('incremental update should complete successfully on large code', () => {
            const factory = new LezerCodeModelFactory()
            const lines = []
            for (let i = 0; i < 100; i++) {
                lines.push(`var${i} = ${i}`)
            }
            const largeCode = lines.join('\n')
            const model = createMockModel(largeCode)
            const codeModel = factory.buildModel(largeCode)
            
            const newCode = largeCode.replace('var0 = 0', 'var0 = 999')
            model.setValue(newCode)
            
            const changes: IModelContentChange[] = [{
                rangeOffset: largeCode.indexOf('= 0'),
                rangeLength: 3,
                text: '= 999'
            }]
            
            const result = factory.updateModel(codeModel, model, changes)
            expect(result).toBe(true)
        })
    })

    describe('convertChangesToLezer', () => {
        test('should convert IModelContentChange to ChangedRange', () => {
            const factory = new LezerCodeModelFactory()
            const changes: IModelContentChange[] = [{
                rangeOffset: 10,
                rangeLength: 5,
                text: 'abc'
            }]
            
            // @ts-ignore - accessing private method for testing
            const result = factory.convertChangesToLezer(changes)
            
            expect(result).toEqual([{
                fromA: 10,
                toA: 15,
                fromB: 10,
                toB: 13
            }])
        })

        test('should handle insertion (zero length)', () => {
            const factory = new LezerCodeModelFactory()
            const changes: IModelContentChange[] = [{
                rangeOffset: 10,
                rangeLength: 0,
                text: 'abc'
            }]
            
            // @ts-ignore
            const result = factory.convertChangesToLezer(changes)
            
            expect(result).toEqual([{
                fromA: 10,
                toA: 10,
                fromB: 10,
                toB: 13
            }])
        })

        test('should handle deletion (empty text)', () => {
            const factory = new LezerCodeModelFactory()
            const changes: IModelContentChange[] = [{
                rangeOffset: 10,
                rangeLength: 5,
                text: ''
            }]
            
            // @ts-ignore
            const result = factory.convertChangesToLezer(changes)
            
            expect(result).toEqual([{
                fromA: 10,
                toA: 15,
                fromB: 10,
                toB: 10
            }])
        })
    })
})
