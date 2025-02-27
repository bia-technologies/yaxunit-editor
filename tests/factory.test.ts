import { BslParser, useTreeSitterBsl, ExpressionType, resolveSymbol } from '../src/bsl/tree-sitter'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

beforeAll(async () => {
    await useTreeSitterBsl()
})

var parser: BslParser | undefined

afterAll(() => {
    parser?.dispose()
})

describe('createSymbol', () => {

    test('constructor', () => {
        parser = new BslParser('А = Новый Запрос;')

        const node = parser.getCurrentNode(5)
        const symbol = resolveSymbol(node as Node)

        expect(symbol.type).toStrictEqual(ExpressionType.ctor)
    })

    test('method', () => {
        parser = new BslParser('А = СоздатьЗапрос();')

        const node = parser.getCurrentNode(5)
        const symbol = resolveSymbol(node as Node)

        expect(symbol.type).toStrictEqual(ExpressionType.methodCall)
    })
})


