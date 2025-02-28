import { provider } from '../../src/bsl/codeModel/bslCodeModelProvider'
import { FunctionDefinition, ProcedureDefinition } from '../../src/bsl/codeModel/definitions'
import { BslParser, useTreeSitterBsl } from '../../src/bsl/tree-sitter'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

beforeAll(async () => {
    await useTreeSitterBsl()
})

var parser: BslParser | undefined

afterAll(() => {
    parser?.dispose()
})

describe('buildModel', () => {
    function buildModel(content: string) {
        return provider.buildModel(parser = new BslParser(content))
    }

    test('expression', () => {
        const model = buildModel('А = 1 + 1')
        expect(model).toStrictEqual(1)
    })

    test('method', () => {
        const model = buildModel('Сообщить(1 + 1)')
        expect(model).toBeDefined()
    })

    test('FunctionDefinition', () => {
        const model = buildModel('Функция Сложить(Операнд1, Знач Операнд2 = 1) Экспорт КонецФункции')
        
        expect(model.children[0]).toBeInstanceOf(FunctionDefinition)
        expect(model.children[0]).toMatchObject({
            name: 'Сложить',
           params: [
                { name: 'Операнд1', byVal: false },
                { name: 'Операнд2', byVal: true, default: '1' }
            ],
            isExport: true,
        })
    })

    test('ProcedureDefinition', () => {
        const model = buildModel('Процедура Сложить(Знач Операнд1, Операнд2 = "123") КонецПроцедуры')

        expect(model.children[0]).toBeInstanceOf(ProcedureDefinition)
        expect(model.children[0]).toMatchObject({
            name: 'Сложить',
            params: [
                { name: 'Операнд1', byVal: true },
                { name: 'Операнд2', byVal: false, default: '"123"' }
            ],
            isExport: false,
        })
    })
    test('ModuleVariableDefinition', () => {
        const model = buildModel('Перем П1, П2 Экспорт; Перем П3;')

        expect(model.children[0]).toBeInstanceOf(ProcedureDefinition)
        expect(model.children[0]).toMatchObject({
            name: 'Сложить',
            params: [
                { name: 'Операнд1', byVal: true },
                { name: 'Операнд2', byVal: false, default: '"123"' }
            ],
            isExport: false,
        })
    })
})


