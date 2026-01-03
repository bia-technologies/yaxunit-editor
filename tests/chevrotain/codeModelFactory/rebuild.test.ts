import { BslCodeModel } from '../../../src/bsl/codeModel'
import { ChevrotainCodeModelFactory } from '../../../src/bsl/chevrotain'
import { describe, expect, test, beforeEach } from 'vitest'
import { expectProcedure, setupTestEnvironment } from './helpers'

describe('reBuildModel', () => {
    let codeModelFactory: ChevrotainCodeModelFactory

    beforeEach(() => {
        codeModelFactory = setupTestEnvironment()
    })

    test('должен перестроить существующую модель', () => {
        const codeModel = new BslCodeModel()
        const code = 'Процедура Тест() КонецПроцедуры'

        codeModelFactory.reBuildModel(codeModel, code)

        expectProcedure(codeModel, 'Тест')
    })

    test('должен очистить существующие дочерние элементы при перестроении', () => {
        const codeModel = new BslCodeModel()
        
        codeModelFactory.reBuildModel(codeModel, 'Процедура Тест1() КонецПроцедуры')
        expect(codeModel.children.length).toBe(1)

        codeModelFactory.reBuildModel(codeModel, 'Процедура Тест2() КонецПроцедуры')
        expectProcedure(codeModel, 'Тест2')
    })
})
