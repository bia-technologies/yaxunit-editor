import { BslParser, useTreeSitterBsl } from '../src/tree-sitter/bslAst'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { ExpressionType, resolveSymbol } from '../src/tree-sitter/symbols'
import { Node } from 'web-tree-sitter'

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

        const node = parser.getCurrentNode(1)

        const symbol = resolveSymbol(node as Node)

        expect(symbol.type).toStrictEqual(ExpressionType.ctor)
    })
})


