import { describe, expect, test } from 'vitest'
import { IncrementalBslParser } from '../../src/bsl/chevrotain/parser'
import { IncrementLexer } from '../../src/bsl/chevrotain/parser/lexer'

describe('Increment lexer. Basic', () => {
    const lexer = new IncrementLexer()

    test('append to word left', () => {
        lexer.tokenize("0")
        lexer.updateTokens([{ rangeOffset: 0, rangeLength: 0, text: '1' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '10', startOffset: 0 },
        ])
    })

    test('append to word right', () => {
        lexer.tokenize("0")
        lexer.updateTokens([{ rangeOffset: 1, rangeLength: 0, text: '1' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '01', startOffset: 0 },
        ])
    })

    test('append word left', () => {
        lexer.tokenize(" 0 ")
        lexer.updateTokens([{ rangeOffset: 0, rangeLength: 0, text: '1' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '1', startOffset: 0 },
            { image: '0', startOffset: 2 },
        ])
    })

    test('append word right', () => {
        lexer.tokenize(" 0 ")
        lexer.updateTokens([{ rangeOffset: 3, rangeLength: 0, text: '1' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '0', startOffset: 1 },
            { image: '1', startOffset: 3 },
        ])
    })

    test('append word between', () => {
        lexer.tokenize("1  3")
        lexer.updateTokens([{ rangeOffset: 2, rangeLength: 0, text: '2' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '1', startOffset: 0 },
            { image: '2', startOffset: 2 },
            { image: '3', startOffset: 4 },
        ])
    })

    test('split word', () => {
        lexer.tokenize("1234")
        lexer.updateTokens([{ rangeOffset: 2, rangeLength: 0, text: ' ' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '12', startOffset: 0 },
            { image: '34', startOffset: 3 },
        ])
    })

    test('append whitespace in start', () => {
        lexer.tokenize("1 3")
        lexer.updateTokens([{ rangeOffset: 0, rangeLength: 0, text: ' ' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '1', startOffset: 1 },
            { image: '3', startOffset: 3 },
        ])
    })

    test('append whitespace in end', () => {
        lexer.tokenize("1 3")
        lexer.updateTokens([{ rangeOffset: 3, rangeLength: 0, text: ' ' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '1', startOffset: 0 },
            { image: '3', startOffset: 2 },
        ])
    })

    test('append whitespace in left', () => {
        lexer.tokenize("1 3")
        lexer.updateTokens([{ rangeOffset: 2, rangeLength: 0, text: ' ' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '1', startOffset: 0 },
            { image: '3', startOffset: 3 },
        ])
    })

    test('append whitespace in right', () => {
        lexer.tokenize("1 3")
        lexer.updateTokens([{ rangeOffset: 1, rangeLength: 0, text: ' ' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '1', startOffset: 0 },
            { image: '3', startOffset: 3 },
        ])
    })

    test('insert whitespace between', () => {
        lexer.tokenize("13")
        lexer.updateTokens([{ rangeOffset: 1, rangeLength: 0, text: ' ' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '1', startOffset: 0 },
            { image: '3', startOffset: 2 },
        ])
    })

    test('whitespace insert', () => {
        let text = "0        9"
        lexer.tokenize(text)
        lexer.updateTokens([{ rangeOffset: 9, rangeLength: 0, text: '          ' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '0', startOffset: 0 },
            { image: '9', startOffset: 19 },
        ])
    })

    test('whitespace insert char', () => {
        let text = "0        9"
        lexer.tokenize(text)
        lexer.updateTokens([{ rangeOffset: 4, rangeLength: 1, text: '4' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '0', startOffset: 0 },
            { image: '4', startOffset: 4 },
            { image: '9', startOffset: 9 },
        ])
    })

    test('whitespace remove', () => {
        let text = "0        9"
        lexer.tokenize(text)
        lexer.updateTokens([{ rangeOffset: 8, rangeLength: 1, text: '' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '0', startOffset: 0 },
            { image: '9', startOffset: 8 },
        ])
    })

    test('remove word left', () => {
        lexer.tokenize("1 3")
        lexer.updateTokens([{ rangeOffset: 0, rangeLength: 1, text: '' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '3', startOffset: 1 },
        ])
    })

    test('remove word right', () => {
        lexer.tokenize("1 3")
        lexer.updateTokens([{ rangeOffset: 2, rangeLength: 1, text: '' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '1', startOffset: 0 },
        ])
    })

    test('remove word with whitespace left', () => {
        lexer.tokenize("  1     3")
        lexer.updateTokens([{ rangeOffset: 1, rangeLength: 5, text: '' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '3', startOffset: 3 },
        ])
    })

    test('remove word with whitespace right', () => {
        lexer.tokenize("1     3")
        lexer.updateTokens([{ rangeOffset: 3, rangeLength: 5, text: '' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '1', startOffset: 0 },
        ])
    })
})

describe('Increment lexer. Cases', () => {
    const lexer = new IncrementLexer()

    test('insert end', () => {
        let text = "a = 1+2"
        lexer.tokenize(text)
        lexer.updateTokens([{ rangeOffset: 1, rangeLength: 0, text: '5' }])
        expect(lexer.moduleTokens.slice(0, 2)).toMatchObject([
            { image: 'a5', startOffset: 0 },
            { image: '=', startOffset: 3 },
        ])
    })

    test('append end', () => {
        let text = "a "

        lexer.tokenize(text)
        lexer.updateTokens([{ rangeOffset: 2, rangeLength: 0, text: '=' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: 'a', startOffset: 0 },
            { image: '=', startOffset: 2 },
        ])
    })
    test('replace uno', () => {
        let text = "a = 1 "

        lexer.tokenize(text)
        lexer.updateTokens([{ rangeOffset: 0, rangeLength: 1, text: 'b' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: 'b', startOffset: 0 },
            { image: '=', startOffset: 2 },
            { image: '1', startOffset: 4 },
        ])
    })

    test('replace less', () => {
        let text = "a = 1 "

        lexer.tokenize(text)
        lexer.updateTokens([{ rangeOffset: 4, rangeLength: 1, text: 'b + 1' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: 'a', startOffset: 0 },
            { image: '=', startOffset: 2 },
            { image: 'b', startOffset: 4 },
            { image: '+', startOffset: 6 },
            { image: '1', startOffset: 8 },
        ])
    })

    test('replace more', () => {
        let text = "a = 1+1 + 2"

        lexer.tokenize(text)
        lexer.updateTokens([{ rangeOffset: 2, rangeLength: 5, text: 'b' }])
        expect(lexer.moduleTokens).toMatchObject([
            { image: 'a', startOffset: 0 },
            { image: 'b', startOffset: 2 },
            { image: '+', startOffset: 4 },
            { image: '2', startOffset: 6 },
        ])
    })

    test('insert start', () => {
        let text = "a = 1+2"
        lexer.tokenize(text)
        lexer.updateTokens([{ rangeOffset: 0, rangeLength: 0, text: 'c' }])
        expect(lexer.moduleTokens.slice(0, 2)).toMatchObject([
            { image: 'ca', startOffset: 0 },
            { image: '=', startOffset: 3 },
        ])
    })

    test('insert inside', () => {
        let text = "aa = 1+2"
        lexer.tokenize(text)
        lexer.updateTokens([{ rangeOffset: 1, rangeLength: 0, text: 'c' }])
        expect(lexer.moduleTokens.slice(0, 2)).toMatchObject([
            { image: 'aca', startOffset: 0 },
            { image: '=', startOffset: 4 },
        ])
    })

    test('method edit 1', () => {
        let text = "Процедура Сложение() Экспорт\n  Документ  НовыйДокумент(ТекущаяДата());\nКонецПроцедуры"
        lexer.tokenize(text)
        lexer.updateTokens([{ rangeOffset: 40, rangeLength: 0, text: '=' }])
        expect(lexer.moduleTokens.slice(0, 7)).toMatchObject([
            { image: 'Процедура' },
            { image: 'Сложение' },
            { image: '(' },
            { image: ')' },
            { image: 'Экспорт' },
            { image: 'Документ' },
            { image: '=' },
        ])
    })

    test('Expression insert on start', () => {
        let text = "Документ=НовыйДокумент(ТекущаяДата());"
        lexer.tokenize(text)
        lexer.updateTokens([{ rangeOffset: 9, rangeLength: 0, text: 'Y' }])
        expect(lexer.moduleTokens.slice(0, 3)).toMatchObject([
            { image: 'Документ' },
            { image: '=' },
            { image: 'YНовыйДокумент' },
        ])
    })
})
