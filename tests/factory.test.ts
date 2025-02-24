import { BslParser, useTreeSitterBsl } from '../src/tree-sitter/bslAst'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { ExpressionType, createSymbol } from '../src/tree-sitter/symbols'

beforeAll(async () => {
    await useTreeSitterBsl()
})

describe('createSymbol', () => {
    var parser:BslParser|undefined

    afterAll(() => {
        parser?.dispose()
    })

    test('constructor', () => {
        parser = new BslParser('А = Новый Запрос;')

        const symbol = createSymbol(parser.getCurrentNode(1))

        expect(symbol.type).toStrictEqual(ExpressionType.constructor)
    })
})


