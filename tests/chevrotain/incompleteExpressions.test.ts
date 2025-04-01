import { describe, expect, test } from "vitest"
import { ChevrotainSitterCodeModelFactory } from "../../src/bsl/chevrotain"
import { BslCodeModel, MethodCallSymbol } from "../../src/bsl/codeModel"

const codeModelFactory = new ChevrotainSitterCodeModelFactory()

describe('MethodCall', () => {
    test('without right paren', () => {
        const exp = expression('СтрНайти("123", Подстрока')
        expect(exp).toBeInstanceOf(MethodCallSymbol)
        expect(exp).toMatchObject({
            name: 'СтрНайти',
            arguments: [
                { value: '123' },
                { name: 'Подстрока' }
            ]
        })
    })
    test('without argument', () => {
        const exp = expression('СтрНайти("123", ')
        expect(exp).toBeInstanceOf(MethodCallSymbol)
        expect(exp).toMatchObject({
            name: 'СтрНайти',
            arguments: [
                { value: '123' },
                {}
            ],
            position: {
                startOffset: 2,
                endOffset: 17
            }
        })
    })
})

function buildModel(content: string) {
    return codeModelFactory.buildModel(content) as BslCodeModel
}

function statement(content: string) {
    const model = buildModel(content)
    return model.children[0]
}

function expression(content: string) {
    const model = buildModel('a=' + content)
    return model.children[0].expression
}