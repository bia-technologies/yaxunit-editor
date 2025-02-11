import { BslParser } from '../src/tree-sitter/bslAst'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

beforeAll(async () => {
    const parser = new BslParser()
    await parser.init()
    parser.dispose()
})

describe('expressionTokens', () => {
    const parser = new BslParser()

    beforeAll(async () => {
        await parser.init()
    })

    afterAll(() => {
        parser.dispose()
    })

    test('primitive', () => {
        parser.setContent('А = 1 + 1;')
        const expression = getExpression(parser)
        
        expect(parser.expressionTokens(expression)).toStrictEqual(['1', '1'])
    })
})

function getExpression(parser:BslParser){
    const q = parser.createQuery('')
    return q.matches(parser.getRootNode())[0]
}
