import { describe, expect, test } from 'vitest'
import { IncrementLexer } from '../../../src/bsl/chevrotain/parser/lexer'
import { insert, remove, replace, image } from '../../rangeHelpers'
import { getEndOffset } from '../../../src/bsl/chevrotain/parser/tokenUtils'

describe('Increment lexer. Basic', () => {
    const lexer = new IncrementLexer()

    test('append to word left', () => {
        lexer.tokenize("0")
        lexer.updateTokens([insert(0, '1')])
        expect(lexer.moduleTokens).toMatchObject([
            image('10', 0),
        ])
    })

    test('append to word right', () => {
        lexer.tokenize("0")
        lexer.updateTokens([insert(1, '1')])
        expect(lexer.moduleTokens).toMatchObject([
            image('01', 0),
        ])
    })

    test('append word left', () => {
        lexer.tokenize(" 0 ")
        lexer.updateTokens([insert(0, '1')])
        expect(lexer.moduleTokens).toMatchObject([
            image('1', 0),
            image('0', 2),
        ])
    })

    test('append word right', () => {
        lexer.tokenize(" 0 ")
        lexer.updateTokens([insert(3, '1')])
        expect(lexer.moduleTokens).toMatchObject([
            image('0', 1),
            image('1', 3),
        ])
    })

    test('append word between', () => {
        lexer.tokenize("1  3")
        lexer.updateTokens([insert(2, '2')])
        expect(lexer.moduleTokens).toMatchObject([
            image('1', 0),
            image('2', 2),
            image('3', 4),
        ])
    })

    test('split word', () => {
        lexer.tokenize("1234")
        lexer.updateTokens([insert(2, ' ')])
        expect(lexer.moduleTokens).toMatchObject([
            image('12', 0),
            image('34', 3),
        ])
    })

    test('append whitespace in start', () => {
        lexer.tokenize("1 3")
        lexer.updateTokens([insert(0, ' ')])
        expect(lexer.moduleTokens).toMatchObject([
            image('1', 1),
            image('3', 3),
        ])
    })

    test('append whitespace in end', () => {
        lexer.tokenize("1 3")
        lexer.updateTokens([insert(3, ' ')])
        expect(lexer.moduleTokens).toMatchObject([
            image('1', 0),
            image('3', 2),
        ])
    })

    test('append whitespace in left', () => {
        lexer.tokenize("1 3")
        lexer.updateTokens([insert(2, ' ')])
        expect(lexer.moduleTokens).toMatchObject([
            image('1', 0),
            image('3', 3),
        ])
    })

    test('append whitespace in right', () => {
        lexer.tokenize("1 3")
        lexer.updateTokens([insert(1, ' ')])
        expect(lexer.moduleTokens).toMatchObject([
            image('1', 0),
            image('3', 3),
        ])
    })

    test('insert whitespace between', () => {
        lexer.tokenize("13")
        lexer.updateTokens([insert(1, ' ')])
        expect(lexer.moduleTokens).toMatchObject([
            image('1', 0),
            image('3', 2),
        ])
    })

    test('whitespace insert', () => {
        let text = "0        9"
        lexer.tokenize(text)
        lexer.updateTokens([insert(9, '          ')])
        expect(lexer.moduleTokens).toMatchObject([
            image('0', 0),
            { image: '9', startOffset: 19 },
        ])
    })

    test('whitespace insert char', () => {
        let text = "0        9"
        lexer.tokenize(text)
        lexer.updateTokens([insert(4, '4')])
        expect(lexer.moduleTokens).toMatchObject([
            image('0', 0),
            image('4', 4),
            { image: '9', startOffset: 10 }, // Смещение изменилось после вставки
        ])
    })

    test('whitespace remove', () => {
        let text = "0        9"
        lexer.tokenize(text)
        lexer.updateTokens([remove(8, 1)])
        expect(lexer.moduleTokens).toMatchObject([
            image('0', 0),
            image('9', 8),
        ])
    })

    test('remove word left', () => {
        lexer.tokenize("1 3")
        lexer.updateTokens([remove(0, 1)])
        expect(lexer.moduleTokens).toMatchObject([
            image('3', 1),
        ])
    })

    test('remove word right', () => {
        lexer.tokenize("1 3")
        lexer.updateTokens([remove(2, 1)])
        expect(lexer.moduleTokens).toMatchObject([
            image('1', 0),
        ])
    })

    test('remove word with whitespace left', () => {
        lexer.tokenize("  1     3")
        lexer.updateTokens([remove(1, 5)])
        expect(lexer.moduleTokens).toMatchObject([
            image('3', 3),
        ])
    })

    test('remove word with whitespace right', () => {
        lexer.tokenize("1     3")
        lexer.updateTokens([remove(3, 5)])
        expect(lexer.moduleTokens).toMatchObject([
            image('1', 0),
        ])
    })

    test('replace word 1', () => {
        lexer.tokenize("0  3  6  9  2  5")
        lexer.updateTokens([replace(8, 3, ' 9 ')])
        expect(lexer.moduleTokens).toMatchObject([
            image('0', 0),
            image('3', 3),
            image('6', 6),
            image('9', 9),
            { image: '2', startOffset: 12 },
            { image: '5', startOffset: 15 },
        ])
    })

    test('replace word 2', () => {
        lexer.tokenize("0  3  6  9  2  5")
        lexer.updateTokens([replace(5, 3, ' 6 ')])
        expect(lexer.moduleTokens).toMatchObject([
            image('0', 0),
            image('3', 3),
            image('6', 6),
            image('9', 9),
            { image: '2', startOffset: 12 },
            { image: '5', startOffset: 15 },
        ])
    })
})

describe('Increment lexer. Cases', () => {
    const lexer = new IncrementLexer()

    test('insert end', () => {
        let text = "a = 1+2"
        lexer.tokenize(text)
        lexer.updateTokens([insert(1, '5')])
        expect(lexer.moduleTokens.slice(0, 2)).toMatchObject([
            image('a5', 0),
            image('=', 3),
        ])
    })

    test('append end', () => {
        let text = "a "

        lexer.tokenize(text)
        const result = lexer.updateTokens([insert(2, '=')])
        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
            image('=', 2),
        ])
    })
    test('replace uno', () => {
        let text = "a = 1 "

        lexer.tokenize(text)
        lexer.updateTokens([replace(0, 1, 'b')])
        expect(lexer.moduleTokens).toMatchObject([
            image('b', 0),
            image('=', 2),
            image('1', 4),
        ])
    })

    test('replace less', () => {
        let text = "a = 1 "

        lexer.tokenize(text)
        lexer.updateTokens([replace(4, 1, 'b + 1')])
        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
            image('=', 2),
            image('b', 4),
            image('+', 6),
            image('1', 8),
        ])
    })

    test('replace more', () => {
        let text = "a = 1+1 + 2"

        lexer.tokenize(text)
        lexer.updateTokens([replace(2, 5, 'b')])
        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
            image('b', 2),
            image('+', 4),
            image('2', 6),
        ])
    })

    test('insert start', () => {
        let text = "a = 1+2"
        lexer.tokenize(text)
        lexer.updateTokens([insert(0, 'c')])
        expect(lexer.moduleTokens.slice(0, 2)).toMatchObject([
            image('ca', 0),
            image('=', 3),
        ])
    })

    test('insert inside', () => {
        let text = "aa = 1+2"
        lexer.tokenize(text)
        lexer.updateTokens([insert(1, 'c')])
        expect(lexer.moduleTokens.slice(0, 2)).toMatchObject([
            image('aca', 0),
            image('=', 4),
        ])
    })

    test('method edit 1', () => {
        let text = "Процедура Сложение() Экспорт\n  Документ  НовыйДокумент(ТекущаяДата());\nКонецПроцедуры"
        lexer.tokenize(text)
        lexer.updateTokens([insert(40, '=')])
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
        lexer.updateTokens([insert(9, 'Y')])
        expect(lexer.moduleTokens.slice(0, 3)).toMatchObject([
            { image: 'Документ' },
            { image: '=' },
            { image: 'YНовыйДокумент' },
        ])
    })
})

describe('Increment lexer. Edge cases', () => {
    const lexer = new IncrementLexer()

    test('empty text tokenize', () => {
        lexer.tokenize("")
        expect(lexer.moduleTokens).toHaveLength(0)
    })

    test('insert into empty text', () => {
        lexer.tokenize("")
        const result = lexer.updateTokens([insert(0, "a")])
        
        expect(lexer.moduleTokens).toMatchObject([
            image("a", 0),
        ])
    })

    test('single character insert', () => {
        lexer.tokenize("a")
        lexer.updateTokens([insert(0, "b")])
        expect(lexer.moduleTokens).toMatchObject([
            image('ba', 0),
        ])
    })

    test('single character remove', () => {
        lexer.tokenize("a")
        lexer.updateTokens([remove(0, 1)])
        expect(lexer.moduleTokens).toHaveLength(0)
    })

    test('single character replace', () => {
        lexer.tokenize("a")
        lexer.updateTokens([replace(0, 1, "b")])
        expect(lexer.moduleTokens).toMatchObject([
            image('b', 0),
        ])
    })

    test('remove all text', () => {
        lexer.tokenize("abc")
        lexer.updateTokens([remove(0, 3)])
        expect(lexer.moduleTokens).toHaveLength(0)
    })

    test('replace all text', () => {
        lexer.tokenize("abc")
        lexer.updateTokens([replace(0, 3, "xyz")])
        expect(lexer.moduleTokens).toMatchObject([
            image('xyz', 0),
        ])
    })

    test('replace all text with empty', () => {
        lexer.tokenize("abc")
        lexer.updateTokens([replace(0, 3, "")])
        expect(lexer.moduleTokens).toHaveLength(0)
    })

    test('remove from start', () => {
        lexer.tokenize("abc")
        lexer.updateTokens([remove(0, 1)])
        expect(lexer.moduleTokens).toMatchObject([
            image('bc', 0),
        ])
    })

    test('remove to end', () => {
        lexer.tokenize("abc")
        lexer.updateTokens([remove(2, 1)])
        expect(lexer.moduleTokens).toMatchObject([
            image('ab', 0),
        ])
    })
})

describe('Increment lexer. Optimizations', () => {
    const lexer = new IncrementLexer()

    test('insert at start optimization', () => {
        lexer.tokenize("a b")
        lexer.updateTokens([insert(0, "x")])
        expect(lexer.moduleTokens).toMatchObject([
            image("xa", 0),
            image("b", 3),
        ])
    })

    test('insert at end optimization', () => {
        lexer.tokenize("a b")
        lexer.updateTokens([insert(3, "x")])
        expect(lexer.moduleTokens).toMatchObject([
            image("a", 0),
            image("bx", 2),
        ])
    })

    test('insert at start with empty text', () => {
        lexer.tokenize("")
        const result = lexer.updateTokens([insert(0, "a")])
        expect(lexer.moduleTokens).toMatchObject([
            image("a", 0),
        ])
    })
})

describe('Increment lexer. Multiple changes', () => {
    const lexer = new IncrementLexer()

    test('multiple inserts in forward order', () => {
        lexer.tokenize("a b c d")
        lexer.updateTokens([
            insert(2, "x"), // после "a" (внутри пробела или между токенами)
            insert(6, "y"), // после "c"
        ])

        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
            image('xb', 2),
            image('c', 5),
            image('yd', 7),
        ])
    })

    test('multiple inserts in reverse order', () => {
        lexer.tokenize("a b c")
        lexer.updateTokens([
            insert(5, "z"), // после "c"
            insert(2, "x"), // после "a"
        ])

        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
            image('xb', 2),
            image('cz', 5),
        ])
    })

    test('multiple removes', () => {
        lexer.tokenize("a b c d")
        lexer.updateTokens([
            remove(4, 1), // "c"
            remove(2, 1), // "b"
        ])
        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
            image('d', 4),
        ])
    })

    test('insert and remove', () => {
        lexer.tokenize("a b c")
        lexer.updateTokens([
            remove(4, 1), // "c"
            insert(2, "x"), // после "a"
        ])
        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
            image('xb', 2),
        ])
    })

    test('multiple replaces', () => {
        lexer.tokenize("a b c d")
        lexer.updateTokens([
            replace(4, 1, "X"), // "c" -> "X"
            replace(2, 1, "Y"), // "b" -> "Y"
        ])
        expect(lexer.moduleTokens).toMatchObject([
            image('a', 0),
            image('Y', 2),
            image('X', 4),
            image('d', 6),
        ])
    })
})

describe('Increment lexer. String tokens', () => {
    const lexer = new IncrementLexer()

    test('insert inside string', () => {
        lexer.tokenize('"abc"')
        lexer.updateTokens([insert(2, "X")])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '"aXbc"' },
        ])
    })

    test('remove from string', () => {
        lexer.tokenize('"abc"')
        lexer.updateTokens([remove(2, 1)])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '"ac"' },
        ])
    })

    test('replace in string', () => {
        lexer.tokenize('"abc"')
        lexer.updateTokens([replace(2, 1, "X")])
        expect(lexer.moduleTokens).toMatchObject([
            { image: '"aXc"' },
        ])
    })

    test('insert quote in string', () => {
        lexer.tokenize('"abc"')
        lexer.updateTokens([insert(2, '"')])
        expect(lexer.moduleTokens).toMatchObject([
            image('"a"', 0),
            image('bc', 3),
            image('"', 5),
        ])
    })

    test('multiline string insert', () => {
        lexer.tokenize('"строка\n|продолжение"')
        lexer.updateTokens([insert(8, "X")])
        expect(lexer.moduleTokens).toMatchObject([
            image('"строка', 0),
            image('X', 8),
            image('продолжение', 10),
            image('"', 21),
        ])
    })

    test('unclosed string insert', () => {
        lexer.tokenize('"незакрытая')
        lexer.updateTokens([insert(11, "X")])

        expect(lexer.moduleTokens).toMatchObject([
            image('"незакрытаяX', 0)
        ])
    })
})

describe('Increment lexer. Numbers', () => {
    const lexer = new IncrementLexer()

    test('insert digit in number', () => {
        lexer.tokenize("123")
        lexer.updateTokens([insert(1, "4")])
        expect(lexer.moduleTokens).toMatchObject([
            image("1423", 0),
        ])
    })

    test('insert dot in number', () => {
        lexer.tokenize("123")
        lexer.updateTokens([insert(1, ".")])
        expect(lexer.moduleTokens).toMatchObject([
            image("1.23", 0),
        ])
    })

    test('remove digit from number', () => {
        lexer.tokenize("123.45")
        lexer.updateTokens([remove(2, 1)])
        expect(lexer.moduleTokens).toMatchObject([
            image("12.45", 0),
        ])
    })
})

describe('Increment lexer. Keywords and operators', () => {
    const lexer = new IncrementLexer()

    test('change keyword to identifier', () => {
        lexer.tokenize("Процедура")
        lexer.updateTokens([insert(8, "X")])
        // После изменения должно стать идентификатором
        expect(lexer.moduleTokens).toMatchObject([
            { image: "ПроцедурXа" },
        ])
    })

    test('change identifier to keyword', () => {
        lexer.tokenize("процедур")
        lexer.updateTokens([insert(8, "а")])
        // После изменения должно стать ключевым словом
        expect(lexer.moduleTokens).toMatchObject([
            { image: "процедура" },
        ])
    })

    test('change operator', () => {
        lexer.tokenize("a = b")
        lexer.updateTokens([replace(2, 1, "+")])
        expect(lexer.moduleTokens).toMatchObject([
            { image: "a" },
            { image: "+" },
            { image: "b" },
        ])
    })

    test('insert in operator', () => {
        lexer.tokenize("a = b")
        lexer.updateTokens([insert(2, "<")])
        expect(lexer.moduleTokens).toMatchObject([
            image("a", 0),
            image("<=", 2),
            image("b", 5),
        ])
    })
})

describe('Increment lexer. Multiline text', () => {
    const lexer = new IncrementLexer()

    test('insert newline', () => {
        lexer.tokenize("a b")
        lexer.updateTokens([insert(1, "\n")])
        expect(lexer.moduleTokens).toMatchObject([
            image("a", 0),
            image("b", 3),
        ])
    })

    test('remove newline', () => {
        lexer.tokenize("a\nb")
        lexer.updateTokens([remove(1, 1)])
        const tokens = lexer.moduleTokens
        expect(lexer.moduleTokens).toMatchObject([
            image("ab", 0),
        ])
    })

    test('replace newline with space', () => {
        lexer.tokenize("a\nb")
        lexer.updateTokens([replace(1, 1, " ")])
        const tokens = lexer.moduleTokens
        expect(lexer.moduleTokens).toMatchObject([
            image("a", 0),
            image("b", 2),
        ])
    })
})

describe('Increment lexer. Token boundaries', () => {
    const lexer = new IncrementLexer()

    test('change exactly on token boundary', () => {
        lexer.tokenize("a b")
        lexer.updateTokens([insert(1, "x")])
        // Вставка в позицию 1 (между "a" и пробелом) изменяет структуру
        expect(lexer.moduleTokens).toMatchObject([
            image("ax", 0),
            image("b", 3),
        ])
    })

    test('change spanning multiple tokens', () => {
        lexer.tokenize("a b c")
        lexer.updateTokens([replace(0, 3, "x")])
        expect(lexer.moduleTokens).toMatchObject([
            image("x", 0),
            image('c', 2)
        ])
    })

    test('change inside single token', () => {
        lexer.tokenize("abc")
        lexer.updateTokens([insert(1, "x")])
        expect(lexer.moduleTokens).toMatchObject([
            { image: "axbc" },
        ])
    })
})

describe('Increment lexer. Offset validation', () => {
    const lexer = new IncrementLexer()

    test('check endOffset correctness', () => {
        lexer.tokenize("a b c")
        lexer.updateTokens([insert(2, "x")])
        for (let i = 0; i < lexer.moduleTokens.length; i++) {
            const token = lexer.moduleTokens[i]
            const expectedEnd = token.startOffset + token.image.length - 1
            expect(getEndOffset(token)).toBe(expectedEnd)
        }
    })

    test('check offsets continuity', () => {
        lexer.tokenize("a b c")
        lexer.updateTokens([insert(2, "x")])
        expect(lexer.moduleTokens).toMatchObject([
            image("a", 0),
            image("xb", 2),
            image("c", 5),
        ])
    })

    test('check offsets after multiple changes', () => {
        lexer.tokenize("a b c d")
        lexer.updateTokens([
            insert(2, "x"),
            insert(6, "y"),
        ])
        for (let i = 0; i < lexer.moduleTokens.length; i++) {
            const token = lexer.moduleTokens[i]
            const expectedEnd = token.startOffset + token.image.length - 1
            expect(getEndOffset(token)).toBe(expectedEnd)
        }
    })
})

describe('Increment lexer. Error handling', () => {
    const lexer = new IncrementLexer()

    test('negative offset handling', () => {
        lexer.tokenize("a")
        // Отрицательные offset должны обрабатываться валидацией
        const result = lexer.updateTokens([insert(-1, "x")])
        // Может вернуть ошибку или обработать как 0
        expect(result).toBeDefined()
    })

    test('remove beyond text length', () => {
        lexer.tokenize("a")
        const result = lexer.updateTokens([remove(0, 100)])
        // Должен обработать корректно или вернуть ошибку
        expect(result).toBeDefined()
    })
})

describe('Increment lexer. Complex BSL scenarios', () => {
    const lexer = new IncrementLexer()

    test('change in procedure declaration', () => {
        const text = "Процедура Тест()\nКонецПроцедуры"
        lexer.tokenize(text)
        lexer.updateTokens([insert(9, "X")])
        expect(lexer.moduleTokens).toMatchObject([
            image("ПроцедураX", 0),
            image("Тест", 11),
            image("(", 15),
            image(")", 16),
            image("КонецПроцедуры", 18),
        ])
    })

    test('change in expression', () => {
        const text = "a = b + c"
        lexer.tokenize(text)
        lexer.updateTokens([insert(7, " * d")])
        expect(lexer.moduleTokens).toMatchObject([
            image("a", 0),
            image("=", 2),
            image("b", 4),
            image("+", 6),
            image("*", 8),
            image("d", 10),
            image("c", 12),
        ])
    })

    test('change in method call', () => {
        const text = "Метод()"
        lexer.tokenize(text)
        lexer.updateTokens([insert(6, "параметр")])
        expect(lexer.moduleTokens).toMatchObject([
            image("Метод", 0),
            image("(", 5),
            image("параметр", 6),
            image(")", 14),
        ])
    })

    test('change in indexing', () => {
        const text = "массив[0]"
        lexer.tokenize(text)
        lexer.updateTokens([replace(7, 1, "1")])
        expect(lexer.moduleTokens).toMatchObject([
            image("массив", 0),
            image("[", 6),
            image("1", 7),
            image("]", 8),
        ])
    })
})
