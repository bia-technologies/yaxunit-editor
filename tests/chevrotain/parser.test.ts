import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { parseModule, parseExpression } from '../../src/bsl/chevrotain/parser/parser'

describe('chevrotain', () => {
    test('simple expression', () => {
        const result = parseExpression('а + 1')
        expect(result.lexErrors).toStrictEqual([])
        expect(result.parseErrors).toStrictEqual([])
        expect(result.cst).toMatchObject({
            name: 'expression',
            children: {
                operand: [{ children: { qualifiedName: [{}] } }, { children: { literal: [{}] } }],
                operator: [{ children: { PLUS: [{}] } }]
            }
        })
    })
    test('const expression', () => {
        const result = parseExpression('1')
        expect(result.lexErrors).toStrictEqual([])
        expect(result.parseErrors).toStrictEqual([])
        expect(result.cst).toMatchObject({
            name: 'expression',
            children: {
                operand: [{ children: { literal: [{}] } }]
            }
        })
    })
    test('string expression', () => {
        const result = parseExpression('"Привет " + Наименование')
        expect(result.lexErrors).toStrictEqual([])
        expect(result.parseErrors).toStrictEqual([])
        expect(result.cst).toMatchObject({
            name: 'expression',
            children: {
                operand: [{ children: { literal: [{ children: { string_literal: [{}] } }], } }, { children: { qualifiedName: [{}] } }]
            }
        })
    })
    test('multi_string expression', () => {
        const result = parseExpression(`"Привет!
        | 
        |товарищ " + Наименование`)
        console.log(result)
        expect(result.lexErrors).toStrictEqual([])
        expect(result.parseErrors).toStrictEqual([])
        expect(result.cst).toMatchObject({
            name: 'expression',
            children: {
                operand: [{ children: { literal: [{ children: { string_literal: [{ children: { multilineString: [{}] } }] } }], } }, { children: { qualifiedName: [{}] } }]
            }
        })
    })
    test('triple expression', () => {
        const result = parseExpression('1 + 2 - 3')
        expect(result.lexErrors).toStrictEqual([])
        expect(result.parseErrors).toStrictEqual([])
        expect(result.cst).toMatchObject({
            name: 'expression',
            children: {
                operand: [{ children: { literal: [{}] } }, { children: { literal: [{}] } }, { children: { literal: [{}] } }],
                operator: [{ children: { PLUS: [{}] } }, { children: { MINUS: [{}] } }]
            }
        })
    })
    test('method call expression', () => {
        const result = parseExpression('ТекущаяДата() - 3')
        expect(result.lexErrors).toStrictEqual([])
        expect(result.parseErrors).toStrictEqual([])
        expect(result.cst).toMatchObject({
            name: 'expression',
            children: {
                operand: [{ children: { methodCall: [{}] } }, { children: { literal: [{}] } }],
                operator: [{ children: { MINUS: [{}] } }]
            }
        })
    })
    test('method call expression 2', () => {
        const result = parseExpression('Метод1(Метод2(), Метод3(123)) + Метод4()')
        expect(result.lexErrors).toStrictEqual([])
        expect(result.parseErrors).toStrictEqual([])
        expect(result.cst).toMatchObject({
            name: 'expression',
            children: {
                operand: [{ children: { methodCall: [{}] } }, { children: { methodCall: [{}] } }],
                operator: [{ children: { PLUS: [{}] } }]
            }
        })
    })
    test('method call', () => {
        const result = parseExpression('СтрШаблон(1, 3)')
        expect(result.lexErrors).toStrictEqual([])
        expect(result.parseErrors).toStrictEqual([])
        expect(result.cst.children.operand[0]).toMatchObject({
            children: {
                methodCall: [{
                    children: {
                        identifier: [{}],
                        expression: [{}, {}]
                    }
                }]
            }
        })
    })
})

