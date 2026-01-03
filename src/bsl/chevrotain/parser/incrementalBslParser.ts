import { CstNode } from "chevrotain";
import { IncrementLexer, findTokens } from "./lexer";
import { BSLParser } from "./parser";

/**
 * Инкрементальный парсер для BSL, поддерживающий обновление только изменённых частей кода.
 * 
 * Расширяет базовый BSLParser, добавляя функциональность инкрементального парсинга
 * через обновление токенов без полной перетокенизации файла.
 */
export class IncrementalBslParser extends BSLParser {
    lexer: IncrementLexer = new IncrementLexer()

    /**
     * Выполняет полный парсинг модуля.
     * 
     * @param text - Исходный текст модуля для парсинга
     * @returns Результат парсинга, содержащий CST, ошибки лексического анализа и ошибки парсинга
     */
    public parseModule(text: string) {
        const start = performance.now()

        const lexResult = this.lexer.tokenize(text)
        this.input = this.lexer.moduleTokens
        const cst = this.module();

        const end = performance.now()
        console.log('Parse time: ', end - start, 'ms')

        return {
            cst: cst,
            lexErrors: lexResult.errors,
            parseErrors: this.errors,
        };
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
        return this.lexer.updateTokens(changes)
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
        this.input = this.lexer.moduleTokens.slice(startIndex, endIndex + 1)
        
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
