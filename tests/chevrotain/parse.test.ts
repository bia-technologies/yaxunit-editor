import { describe, expect, test } from 'vitest'
import { BSLParser } from '../../src/bsl/chevrotain/parser'

describe('Increment lexer', () => {
    const parser = new BSLParser()
    test('insert end', () => {
        let text = "a = 1+2"
        parser.parseModule(text)
        parser.updateTokens([{ rangeOffset: 1, rangeLength: 0, text: '5' }])
        expect(parser.moduleTokens.slice(0, 2)).toMatchObject([
            { image: 'a5', startOffset: 0 },
            { image: '=', startOffset: 3 },
        ])
    })
    test('append end', () => {
        let text = "a "

        parser.parseModule(text)
        parser.updateTokens([{ rangeOffset: 2, rangeLength: 0, text: '=' }])
        expect(parser.moduleTokens).toMatchObject([
            { image: 'a', startOffset: 0 },
            { image: '=', startOffset: 2 },
        ])
    })
    test('replace uno', () => {
        let text = "a = 1 "

        parser.parseModule(text)
        parser.updateTokens([{ rangeOffset: 0, rangeLength: 1, text: 'b' }])
        expect(parser.moduleTokens).toMatchObject([
            { image: 'b', startOffset: 0 },
            { image: '=', startOffset: 2 },
            { image: '1', startOffset: 4 },
        ])
    })
    test('replace less', () => {
        let text = "a = 1 "

        parser.parseModule(text)
        parser.updateTokens([{ rangeOffset: 4, rangeLength: 1, text: 'b + 1' }])
        expect(parser.moduleTokens).toMatchObject([
            { image: 'a', startOffset: 0 },
            { image: '=', startOffset: 2 },
            { image: 'b', startOffset: 4 },
            { image: '+', startOffset: 6 },
            { image: '1', startOffset: 8 },
        ])
    })
    test('replace more', () => {
        let text = "a = 1+1 + 2"

        parser.parseModule(text)
        parser.updateTokens([{ rangeOffset: 2, rangeLength: 5, text: 'b' }])
        expect(parser.moduleTokens).toMatchObject([
            { image: 'a', startOffset: 0 },
            { image: 'b', startOffset: 2 },
            { image: '+', startOffset: 4 },
            { image: '2', startOffset: 6 },
        ])
    })
    test('insert start', () => {
        let text = "a = 1+2"
        parser.parseModule(text)
        parser.updateTokens([{ rangeOffset: 0, rangeLength: 0, text: 'c' }])
        expect(parser.moduleTokens.slice(0, 2)).toMatchObject([
            { image: 'ca', startOffset: 0 },
            { image: '=', startOffset: 3 },
        ])
    })
    test('insert inside', () => {
        let text = "aa = 1+2"
        parser.parseModule(text)
        parser.updateTokens([{ rangeOffset: 1, rangeLength: 0, text: 'c' }])
        expect(parser.moduleTokens.slice(0, 2)).toMatchObject([
            { image: 'aca', startOffset: 0 },
            { image: '=', startOffset: 4 },
        ])
    })
    test('whitespace insert', () => {
        let text = "0        9"
        parser.parseModule(text)
        parser.updateTokens([{ rangeOffset: 9, rangeLength: 0, text: '          ' }])
        expect(parser.moduleTokens).toMatchObject([
            { image: '0', startOffset: 0 },
            { image: '9', startOffset: 19 },
        ])
    })
    test('whitespace insert char', () => {
        let text = "0        9"
        parser.parseModule(text)
        parser.updateTokens([{ rangeOffset: 4, rangeLength: 1, text: '4' }])
        expect(parser.moduleTokens).toMatchObject([
            { image: '0', startOffset: 0 },
            { image: '4', startOffset: 4 },
            { image: '9', startOffset: 9 },
        ])
    })
    test('whitespace remove', () => {
        let text = "0        9"
        parser.parseModule(text)
        parser.updateTokens([{ rangeOffset: 8, rangeLength: 1, text: '' }])
        expect(parser.moduleTokens).toMatchObject([
            { image: '0', startOffset: 0 },
            { image: '9', startOffset: 8 },
        ])
    })
})
