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
        // При изменении комментария он превращается в код
        expect(lexer.moduleTokens).toHaveLength(0)
        expect(lexer.commentTokens).toMatchObject([
            image('// комментарXий', 0)
        ])
    })

    test('create comment', () => {
        lexer.tokenize("a b")
        lexer.updateTokens([insert(1, "//")])
        // После вставки // в позицию 1 получается "a// b", где "// b" становится комментарием
        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
        ])
        expect(lexer.commentTokens).toMatchObject([
            image('// b', 1)
        ])
    })

    test('remove comment marker', () => {
        lexer.tokenize("// комментарий")
        lexer.updateTokens([remove(0, 2)]) // Удаляем //
        // После удаления // остается " комментарий" (с пробелом), токен начинается с offset 1
        expect(lexer.commentTokens).toHaveLength(0)
        expect(lexer.moduleTokens).toMatchObject([
            image('комментарий', 1)
        ])
    })

    test('comment with code after', () => {
        lexer.tokenize("a // комментарий\nb")
        lexer.updateTokens([insert(2, "X")])
        // При вставке X в позицию 2 между "a " и "//", получается "a X// комментарий\nb"
        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
            image('X', 2),
            image('b', 18),
        ])
        expect(lexer.commentTokens).toMatchObject([
            image('// комментарий', 3)
        ])
    })

    test('insert comment marker in code line', () => {
        lexer.tokenize("a = 1 + 2")
        lexer.updateTokens([insert(5, " //")])
        // После вставки " //" в позицию 5 получается "a = 1 // + 2"
        // "a = 1" (5 символов) + " //" (3 символа) = комментарий начинается с позиции 6
        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
            image('=', 2),
            image('1', 4),
        ])
        expect(lexer.commentTokens).toMatchObject([
            image('// + 2', 6)
        ])
    })

    test('remove comment from middle of line', () => {
        lexer.tokenize("a = 1 // comment")
        lexer.updateTokens([remove(6, 2)]) // Удаляем //
        // После удаления // остается "a = 1  comment" (два пробела)
        // "a = 1 " (6 символов) + " comment", токен начинается с позиции 7
        expect(lexer.commentTokens).toHaveLength(0)
        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
            image('=', 2),
            image('1', 4),
            image('comment', 7),
        ])
    })

    test('edit text inside comment preserves comment', () => {
        lexer.tokenize("// старый текст")
        lexer.updateTokens([insert(9, "новый ")])
        // После вставки "новый " в комментарий он остается комментарием
        expect(lexer.moduleTokens).toHaveLength(0)
        expect(lexer.commentTokens).toMatchObject([
            image('// старыйновый  текст', 0)
        ])
    })

    test('multiple lines with comment change', () => {
        lexer.tokenize("a = 1\n// comment\nb = 2")
        lexer.updateTokens([remove(6, 2)]) // Удаляем // из второй строки
        // После удаления // (2 символа) все offset после изменения смещаются на -2
        // Было: "a = 1\n// comment\nb = 2"
        // Стало: "a = 1\n comment\nb = 2"
        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
            image('=', 2),
            image('1', 4),
            image('comment', 7),  // было 9, минус 2 = 7
            image('b', 15),       // было 17, минус 2 = 15
            image('=', 17),       // было 19, минус 2 = 17
            image('2', 19),       // было 21, минус 2 = 19
        ])
        expect(lexer.commentTokens).toHaveLength(0)
    })

    test('insert comment at line start', () => {
        lexer.tokenize("a = 1\nb = 2")
        lexer.updateTokens([insert(6, "//")])
        // После вставки // в начало второй строки она становится комментарием
        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
            image('=', 2),
            image('1', 4),
        ])
        expect(lexer.commentTokens).toMatchObject([
            image('//b = 2', 6)
        ])
    })

    test('comment on empty line', () => {
        lexer.tokenize("\n\n")
        lexer.updateTokens([insert(1, "//")])
        // Комментарий на пустой строке
        expect(lexer.moduleTokens).toHaveLength(0)
        expect(lexer.commentTokens).toMatchObject([
            image('//', 1)
        ])
    })
})

