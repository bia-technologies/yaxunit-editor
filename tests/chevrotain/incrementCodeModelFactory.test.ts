
import {
    BslCodeModel,
} from '../../src/bsl/codeModel'
import { ChevrotainSitterCodeModelFactory } from '../../src/bsl/chevrotain'
import { describe, expect, test } from 'vitest'

const codeModelFactory = new ChevrotainSitterCodeModelFactory()

describe('increment code model', () => {

    test('edit 1', () => {
        let text = 'Процедура Сложение() Экспорт\n  Документ  НовыйДокумент(ТекущаяДата());\nКонецПроцедуры'
        const model = buildModel(text)
        codeModelFactory.updateModel(model, [{ rangeOffset: 40, rangeLength: 0, text: '=' }])

        expect(model.children).toMatchObject([
            { name: 'Сложение', children: [{ variable: { name: 'Документ' } }] }
        ])
    })
})

function buildModel(content: string) {
    return codeModelFactory.buildModel(content) as BslCodeModel
}

function statement(content: string) {
    const model = codeModelFactory.buildModel(content) as BslCodeModel
    return model.children[0]
}

function expression(content: string) {
    const model = codeModelFactory.buildModel('a=' + content) as BslCodeModel
    return model.children[0].expression
}