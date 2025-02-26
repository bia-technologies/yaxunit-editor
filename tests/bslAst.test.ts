import { BslParser, useTreeSitterBsl } from '../src/bsl-tree-sitter/bslAst'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { Queries } from '../src/bsl-tree-sitter/queries'

beforeAll(async () => {
    await useTreeSitterBsl()
})

describe('expressionTokens', () => {
    const parser = new BslParser('')
    const queries = new Queries()

    afterAll(() => {
        parser.dispose()
        queries.dispose()
    })

    test('primitive', () => {
        parser.setContent('А = 1 + 1;')
        const expression = getExpression(parser)

        expect(parser.expressionTokens(expression)).toStrictEqual(['1', '1'])
    })
    function getExpression(parser: BslParser) {
        const q = queries.createQuery('(expression) @expression')
        return q.matches(parser.getRootNode())[0]
    }
})


