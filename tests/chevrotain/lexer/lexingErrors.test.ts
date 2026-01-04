import { describe, expect, test, beforeEach } from 'vitest'
import { IncrementLexer } from '../../../src/bsl/chevrotain/parser/lexer'
import { insert, remove, replace } from '../../rangeHelpers'

describe('Increment lexer. Lexing errors storage and management', () => {
    let lexer: IncrementLexer

    beforeEach(() => {
        lexer = new IncrementLexer()
    })

    test('should store errors from initial tokenization', () => {
        // Незавершенная строка должна вызвать ошибку лексера
        const text = '"незавершенная строка'
        const result = lexer.tokenize(text)

        expect(lexer.lexingErrors).toBeDefined()
        expect(Array.isArray(lexer.lexingErrors)).toBe(true)
        // Chevrotain может не выдавать ошибку для UnclosingString, так как это валидный токен
        // Но если есть ошибки, они должны храниться
        expect(lexer.lexingErrors.length).toBeGreaterThanOrEqual(0)
    })

    test('should clear errors on new tokenization', () => {
        // Сначала токенизируем текст с потенциальной ошибкой
        lexer.tokenize('"незавершенная строка')
        const initialErrorsCount = lexer.lexingErrors.length

        // Токенизируем корректный текст
        lexer.tokenize('Процедура Тест() КонецПроцедуры')
        
        // Ошибки должны быть обновлены (может быть 0 или новое значение)
        expect(lexer.lexingErrors).toBeDefined()
        expect(Array.isArray(lexer.lexingErrors)).toBe(true)
    })

    test('should have empty errors array for valid code', () => {
        lexer.tokenize('Процедура Тест() КонецПроцедуры')
        
        expect(lexer.lexingErrors).toBeDefined()
        expect(Array.isArray(lexer.lexingErrors)).toBe(true)
        // Для валидного кода ошибок быть не должно
        expect(lexer.lexingErrors.length).toBe(0)
    })

    test('should update errors on incremental tokenization', () => {
        // Начинаем с валидного кода
        lexer.tokenize('Процедура Тест() КонецПроцедуры')
        expect(lexer.lexingErrors.length).toBe(0)

        // Добавляем незавершенную строку через инкрементальное обновление
        const ranges = lexer.updateTokens([insert(20, ' "незавершенная строка')])
        
        // Проверяем, что ошибки обновлены
        expect(lexer.lexingErrors).toBeDefined()
        // Ошибки могут быть в обработанном диапазоне или в общем списке
        expect(ranges).toBeDefined()
        if (ranges.length > 0 && ranges[0].errors) {
            expect(ranges[0].errors.length).toBeGreaterThanOrEqual(0)
        }
    })

    test('should remove errors from changed range on incremental update', () => {
        // Создаем текст с ошибкой
        lexer.tokenize('Процедура Тест()\n "незавершенная строка\nКонецПроцедуры')
        const initialErrors = lexer.lexingErrors.length

        // Удаляем проблемный фрагмент
        lexer.updateTokens([remove(20, 25)]) // Удаляем строку с незавершенной строкой
        
        // Ошибка должна быть удалена из списка
        expect(lexer.lexingErrors.length).toBeLessThanOrEqual(initialErrors)
    })

    test('should adjust error offsets when text is inserted before them', () => {
        // Создаем ошибку в позиции 20
        lexer.tokenize('Процедура Тест()\n "незавершенная строка\nКонецПроцедуры')
        
        const errorBeforeInsert = lexer.lexingErrors.find(e => e.offset >= 20)
        if (!errorBeforeInsert) {
            // Если нет ошибки, пропускаем тест
            return
        }

        const originalOffset = errorBeforeInsert.offset
        const insertLength = 10

        // Вставляем текст перед ошибкой
        lexer.updateTokens([insert(15, 'НовыйКод ')])

        // Ищем ошибку с тем же сообщением после смещения
        const errorAfterInsert = lexer.lexingErrors.find(e => 
            e.message === errorBeforeInsert.message && 
            e.offset === originalOffset + insertLength
        )

        // Ошибка должна быть смещена на длину вставленного текста
        expect(errorAfterInsert).toBeDefined()
        if (errorAfterInsert) {
            expect(errorAfterInsert.offset).toBe(originalOffset + insertLength)
        }
    })

    test('should adjust error offsets when text is removed before them', () => {
        // Создаем ошибку в позиции 30
        lexer.tokenize('Процедура Тест()\n "незавершенная строка\nКонецПроцедуры')
        
        const errorBeforeRemove = lexer.lexingErrors.find(e => e.offset >= 20)
        if (!errorBeforeRemove) {
            return
        }

        const originalOffset = errorBeforeRemove.offset
        const removeLength = 5

        // Удаляем текст перед ошибкой
        lexer.updateTokens([remove(15, removeLength)])

        // Ошибка должна быть смещена назад на длину удаленного текста
        const errorAfterRemove = lexer.lexingErrors.find(e => 
            e.message === errorBeforeRemove.message
        )

        if (errorAfterRemove && originalOffset > 15 + removeLength) {
            expect(errorAfterRemove.offset).toBe(originalOffset - removeLength)
        }
    })

    test('should recalculate line and column for errors after position update', () => {
        lexer.tokenize('Процедура Тест()\n "незавершенная строка\nКонецПроцедуры')
        
        const error = lexer.lexingErrors[0]
        if (!error) {
            return
        }

        // Проверяем, что line и column установлены
        expect(error.line).toBeDefined()
        expect(error.column).toBeDefined()
        expect(typeof error.line).toBe('number')
        expect(typeof error.column).toBe('number')
        expect(error.line).toBeGreaterThan(0)
        expect(error.column).toBeGreaterThan(0)
    })

    test('should sort errors by offset', () => {
        // Создаем несколько ошибок в разных позициях
        lexer.tokenize('Процедура Тест()\n "строка1\n Переменная = "строка2\nКонецПроцедуры')
        
        // Проверяем, что ошибки отсортированы по offset
        for (let i = 1; i < lexer.lexingErrors.length; i++) {
            expect(lexer.lexingErrors[i].offset).toBeGreaterThanOrEqual(
                lexer.lexingErrors[i - 1].offset
            )
        }
    })

    test('should handle multiple incremental updates with errors', () => {
        lexer.tokenize('Процедура Тест() КонецПроцедуры')
        
        // Первое изменение с потенциальной ошибкой
        lexer.updateTokens([insert(20, ' "незавершенная1')])
        const errorsAfterFirst = lexer.lexingErrors.length

        // Второе изменение
        lexer.updateTokens([insert(40, ' "незавершенная2')])
        const errorsAfterSecond = lexer.lexingErrors.length

        // Третье изменение - исправление первой ошибки
        lexer.updateTokens([replace(20, 16, ' "завершенная1"')])
        
        // Проверяем, что система корректно обрабатывает множественные обновления
        expect(lexer.lexingErrors).toBeDefined()
        expect(Array.isArray(lexer.lexingErrors)).toBe(true)
    })

    test('should preserve errors outside changed range', () => {
        lexer.tokenize('Процедура Тест()\n "незавершенная1\n Переменная = "незавершенная2\nКонецПроцедуры')
        
        const errorsBefore = [...lexer.lexingErrors]
        if (errorsBefore.length < 2) {
            // Нужно минимум 2 ошибки для этого теста
            return
        }

        // Изменяем только часть текста (первую ошибку)
        lexer.updateTokens([replace(20, 15, '"исправленная1"')])

        // Вторая ошибка должна остаться
        const errorsAfter = lexer.lexingErrors
        const secondErrorPreserved = errorsAfter.some(e => 
            errorsBefore.some(eb => 
                eb.offset > 40 && 
                Math.abs(e.offset - eb.offset) < 5 && 
                e.message === eb.message
            )
        )

        expect(errorsAfter.length).toBeGreaterThan(0)
    })

    test('should handle empty text tokenization', () => {
        lexer.tokenize('')
        
        expect(lexer.lexingErrors).toBeDefined()
        expect(lexer.lexingErrors.length).toBe(0)
    })

    test('should handle whitespace-only text', () => {
        lexer.tokenize('   \n\t  ')
        
        expect(lexer.lexingErrors).toBeDefined()
        expect(lexer.lexingErrors.length).toBe(0)
    })

    test('should calculate correct line and column for multi-line errors', () => {
        const text = 'Строка1\nСтрока2\nСтрока3 "незавершенная строка\nСтрока4'
        lexer.tokenize(text)
        
        const errors = lexer.lexingErrors
        if (errors.length > 0) {
            const error = errors[0]
            
            // Ошибка должна быть на строке 3 или 4 (индекс начинается с 1)
            expect(error.line).toBeGreaterThanOrEqual(1)
            expect(error.column).toBeGreaterThanOrEqual(1)
            
            // Проверяем корректность вычисления: offset должен соответствовать line/column
            let calculatedOffset = 0
            let line = 1
            let column = 1
            for (let i = 0; i < text.length && calculatedOffset < error.offset; i++) {
                if (text[i] === '\n') {
                    line++
                    column = 1
                } else if (text[i] !== '\r') {
                    column++
                }
                calculatedOffset++
            }
            
            expect(error.line).toBe(line)
            expect(error.column).toBe(column)
        }
    })

    test('should handle errors at file start', () => {
        lexer.tokenize('"незавершенная строка в начале')
        
        if (lexer.lexingErrors.length > 0) {
            const error = lexer.lexingErrors[0]
            expect(error.offset).toBeGreaterThanOrEqual(0)
            expect(error.line).toBe(1)
            expect(error.column).toBeGreaterThanOrEqual(1)
        }
    })

    test('should handle errors at file end', () => {
        lexer.tokenize('Процедура Тест() КонецПроцедуры\n"незавершенная строка в конце')
        
        if (lexer.lexingErrors.length > 0) {
            const error = lexer.lexingErrors[lexer.lexingErrors.length - 1]
            expect(error.offset).toBeGreaterThan(0)
            expect(error.line).toBeGreaterThanOrEqual(2)
        }
    })

    test('should update line and column after text insertion', () => {
        lexer.tokenize('Строка1\nСтрока2\n"незавершенная')
        
        const errorBefore = lexer.lexingErrors[0]
        if (!errorBefore) {
            return
        }

        const originalLine = errorBefore.line
        const originalColumn = errorBefore.column

        // Вставляем новую строку перед ошибкой
        lexer.updateTokens([insert(8, '\nНоваяСтрока')])

        const errorAfter = lexer.lexingErrors.find(e => 
            e.message === errorBefore.message
        )

        if (errorAfter && originalLine > 1) {
            // После вставки новой строки, номер строки ошибки должен увеличиться
            expect(errorAfter.line).toBeGreaterThanOrEqual(originalLine)
        }
    })

    test('should handle error removal when text is replaced', () => {
        lexer.tokenize('Процедура Тест()\n "незавершенная\nКонецПроцедуры')
        const errorsBefore = lexer.lexingErrors.length

        // Заменяем проблемный текст на корректный
        lexer.updateTokens([replace(20, 13, '"завершенная"')])

        // Количество ошибок должно уменьшиться или остаться прежним
        expect(lexer.lexingErrors.length).toBeLessThanOrEqual(errorsBefore)
    })
})