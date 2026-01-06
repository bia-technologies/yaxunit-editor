import { CstNode, createTokenInstance, EOF, IToken } from "chevrotain";
import { IncrementLexer, findTokens } from "./lexer";
import { BSLParser } from "./parser";
import { getEndOffset } from "./tokenUtils";

/**
 * Инкрементальный парсер для BSL, поддерживающий обновление только изменённых частей кода.
 * 
 * Расширяет базовый BSLParser, добавляя функциональность инкрементального парсинга
 * через обновление токенов без полной перетокенизации файла.
 */
export class IncrementalBslParser extends BSLParser {
    lexer: IncrementLexer = new IncrementLexer()
    private lastParseResult?: ParseResult

    private withEOF(tokens: IToken[]): IToken[] {
        const last = tokens.length ? tokens[tokens.length - 1] : undefined
        const eofOffset = last ? getEndOffset(last) + 1 : 0
        const eofLine = (last?.endLine ?? last?.startLine ?? 1) as number
        const eofColumnBase = (last?.endColumn ?? last?.startColumn ?? 1) as number
        const eofColumn = eofColumnBase + 1

        const eof = createTokenInstance(
            EOF,
            "",
            eofOffset,
            eofOffset,
            eofLine,
            eofLine,
            eofColumn,
            eofColumn
        )

        return tokens.concat(eof)
    }

    /**
     * Выполняет полный парсинг модуля.
     * 
     * @param text - Исходный текст модуля для парсинга
     * @returns Результат парсинга, содержащий CST, ошибки лексического анализа и ошибки парсинга
     */
    public parseModule(text: string) {
        const start = performance.now()

        const lexResult = this.lexer.tokenize(text)
        this.input = this.withEOF(this.lexer.moduleTokens)
        const cst = this.module();

        const end = performance.now()
        console.log('Parse time: ', end - start, 'ms')

        this.lastParseResult = {
            cst: cst,
            lexErrors: lexResult.errors,
            parseErrors: this.errors,
        };

        return this.lastParseResult;
    }

    /**
     * Обновляет токены при изменении текста.
     * 
     * Делегирует обновление токенов инкрементальному лексеру,
     * который эффективно обновляет только изменённые части.
     * 
     * @param changes - Массив изменений текста
     * @returns Массив объектов с информацией об обработанных диапазонах
     */
    public updateTokens(changes: IModelContentChange[]) {
        const result = this.lexer.updateTokens(changes)
        
        // Обновляем информацию о последних ошибках
        // Собираем все ошибки из ranges
        const lexErrors = result.flatMap(r => r.errors || [])
        
        // При инкрементальном обновлении сохраняем предыдущий CST
        // так как у нас нет полного нового CST, только фрагменты
        // Ошибки парсера при инкрементальном обновлении не собираем,
        // так как они уже обработаны в parseChanges
        if (this.lastParseResult) {
            this.lastParseResult = {
                cst: this.lastParseResult.cst,
                lexErrors,
                parseErrors: this.lastParseResult.parseErrors
            }
        }
        
        return result
    }

    /**
     * Парсит только изменённый фрагмент кода, используя указанное правило.
     * 
     * Находит границы токенов для указанного диапазона и выполняет парсинг
     * только этой части через указанное правило парсера.
     * 
     * @param rule - Имя правила парсера для выполнения (например, 'expression', 'statement')
     * @param startOffset - Начальное смещение изменённого фрагмента
     * @param endOffset - Конечное смещение изменённого фрагмента
     * @returns Результат парсинга фрагмента, содержащий CST и ошибки парсинга
     */
    public parseChanges(rule: string, startOffset: number, endOffset: number) {
        // Очищаем ошибки перед парсингом, чтобы не накапливались ошибки от предыдущих вызовов
        this.errors = []
        
        const { startIndex, endIndex } = findTokens(this.lexer.moduleTokens, startOffset, endOffset)
        this.input = this.withEOF(this.lexer.moduleTokens.slice(startIndex, endIndex + 1))
        
        // Динамический доступ к методу правила парсера
        // Используем 'as any', так как Chevrotain создаёт методы динамически через RULE()
        const ruleMethod = (this as any)[rule] as (() => CstNode) | undefined
        
        if (!ruleMethod) {
            throw new Error(`Правило парсера '${rule}' не найдено`)
        }
        
        const result = ruleMethod.bind(this)()
        return {
            cst: result,
            parseErrors: this.errors,
        };
    }

    /**
     * Получает результат последнего парсинга
     * @returns последний результат парсинга или undefined
     */
    public getLastParseResult(): ParseResult | undefined {
        return this.lastParseResult
    }
}

/**
 * Результат парсинга модуля
 */
export interface ParseResult {
    cst: CstNode
    lexErrors: any[]
    parseErrors: any[]
}

/**
 * Описание изменения содержимого в текстовой модели.
 * Используется для инкрементального обновления токенов и парсинга.
 */
export interface IModelContentChange {
    /**
     * Смещение диапазона, который был заменён.
     */
    readonly rangeOffset: number;
    
    /**
     * Длина диапазона, который был заменён.
     */
    readonly rangeLength: number;
    
    /**
     * Новый текст для диапазона.
     */
    readonly text: string;
}
