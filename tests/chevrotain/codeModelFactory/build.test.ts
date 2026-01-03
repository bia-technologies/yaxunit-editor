import { BslCodeModel } from '../../../src/bsl/codeModel'
import { ChevrotainCodeModelFactory } from '../../../src/bsl/chevrotain'
import { describe, expect, test, beforeEach } from 'vitest'
import { expectProcedure, setupTestEnvironment, createMockModuleModel } from './helpers'
import { editor } from 'monaco-editor-core'

describe('buildModel', () => {
    let codeModelFactory: ChevrotainCodeModelFactory

    beforeEach(() => {
        codeModelFactory = setupTestEnvironment()
    })

    test('должен создать модель из строки', () => {
        const code = 'Процедура Тест() КонецПроцедуры'
        const model = codeModelFactory.buildModel(code)

        expect(model).toBeInstanceOf(BslCodeModel)
        expectProcedure(model, 'Тест')
    })

    test('должен создать модель с пустым содержимым', () => {
        const model = codeModelFactory.buildModel('')

        expect(model).toBeInstanceOf(BslCodeModel)
        expect(model.children.length).toBe(0)
    })

    test('должен обрабатывать синтаксические ошибки', () => {
        const codeWithError = 'Процедура Тест( КонецПроцедуры' // Отсутствует закрывающая скобка
        const model = codeModelFactory.buildModel(codeWithError)

        expect(model).toBeInstanceOf(BslCodeModel)
        expect(codeModelFactory.errors.length).toBeGreaterThan(0)
    })

    test('должен создать модель из ModuleModel', () => {
        const code = 'Процедура Тест() КонецПроцедуры'
        const moduleModel = createMockModuleModel(code)
        const model = codeModelFactory.buildModel(moduleModel)

        expect(model).toBeInstanceOf(BslCodeModel)
        expectProcedure(model, 'Тест')
        expect(editor.setModelMarkers).toHaveBeenCalled()
    })
})

