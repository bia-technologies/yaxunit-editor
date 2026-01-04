import { describe, expect, test } from 'vitest'
import { IncrementLexer } from '../../../src/bsl/chevrotain/parser/lexer'
import { insert, remove, image } from '../../rangeHelpers'

describe('Increment lexer. Comments', () => {
    const lexer = new IncrementLexer()

    test('comment is skipped', () => {
        lexer.tokenize("// комментарий")
        expect(lexer.moduleTokens).toHaveLength(0)
        expect(lexer.commentTokens).toMatchObject([
            image('// комментарий', 0)
        ])
    })

    test('insert in comment', () => {
        lexer.tokenize("// комментарий")
        lexer.updateTokens([insert(12, "X")])
        expect(lexer.moduleTokens).toMatchObject([
            image('// комментарXий', 0)
        ])
    })

    test('create comment', () => {
        lexer.tokenize("a b")
        lexer.updateTokens([insert(1, "//")])
        // После вставки // комментарий пропускается, но код должен остаться
        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
            image('//', 1),
            image('b', 4),
        ])
    })

    test('remove comment marker', () => {
        lexer.tokenize("// комментарий")
        lexer.updateTokens([remove(0, 2)]) // Удаляем //
        // После удаления // комментарий должен превратиться в код
        expect(lexer.moduleTokens).toMatchObject([
            image('комментарий', 1)
        ])
    })

    test('comment with code after', () => {
        lexer.tokenize("a // комментарий\nb")
        lexer.updateTokens([insert(2, "X")])
        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
            image('X', 2),
            image('// комментарий', 3),
            image('b', 18),
        ])
    })
})

