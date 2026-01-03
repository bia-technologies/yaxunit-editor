import { ILexingError, ILexingResult, IToken, Lexer } from "chevrotain"
import { allTokens } from "./tokens"
import { IModelContentChange } from "./incrementalBslParser"
import { getEndOffset } from "./tokenUtils"

/**
 * Информация о диапазоне обработанных токенов при инкрементальном обновлении.
 */
export interface IProcessedRange {
    /** Начальная позиция измененного диапазона */
    start: number
    /** Конечная позиция измененного диапазона */
    end: number
    /** Разница в длине текста (положительная для вставки, отрицательная для удаления) */
    diff: number
    /** Ошибки лексического анализа для измененного фрагмента (если есть) */
    errors?: ILexingError[]
}

/**
 * Результат поиска границ токенов для заданного диапазона.
 */
interface ITokenBoundaries {
    /** Индекс токена в начале диапазона */
    startIndex: number
    /** Индекс токена в конце диапазона */
    endIndex: number
    /** Нужно ли включать начальный токен полностью */
    includeStart: boolean
    /** Нужно ли включать конечный токен полностью */
    includeEnd: boolean
}

/**
 * Инкрементальный лексер для токенизации BSL кода с поддержкой обновления токенов при изменениях в тексте.
 * 
 * Расширяет базовый лексер Chevrotain, добавляя возможность инкрементального обновления токенов
 * при частичных изменениях текста, что повышает производительность при редактировании больших файлов.
 */
export class IncrementLexer extends Lexer {
    moduleTokens: IToken[] = []

    /**
     * Создает новый экземпляр инкрементального лексера.
     * 
     * Инициализирует лексер с полным набором токенов и настройками оптимизации,
     * включая полное отслеживание позиций для поддержки инкрементальных обновлений.
     */
    constructor() {
        super(allTokens, { ensureOptimizations: true, positionTracking: "full" })
    }

    /**
     * Токенизирует переданный текст и сохраняет результат в moduleTokens.
     * 
     * @param text - Текст для токенизации
     * @param initialMode - Начальный режим лексера (опционально)
     * @returns Результат токенизации, содержащий массив токенов и возможные ошибки
     */
    public tokenize(text: string, initialMode?: string | undefined): ILexingResult {
        const result = super.tokenize(text, initialMode)
        this.moduleTokens = result.tokens
        return result
    }

    /**
     * Инкрементально обновляет токены на основе изменений в тексте.
     * 
     * Обрабатывает массив изменений текста и обновляет только те части токенов,
     * которые были затронуты изменениями, вместо полной перетокенизации всего текста.
     * Это значительно повышает производительность при редактировании больших файлов.
     * 
     * @param changes - Массив изменений текста, каждое изменение содержит диапазон и новый текст
     * @returns Массив объектов с информацией об обработанных диапазонах
     */
    public updateTokens(changes: IModelContentChange[]): IProcessedRange[] {
        const ranges: IProcessedRange[] = []
        const sortedChanges = this.sortChanges(changes)
        
        for (const change of sortedChanges) {
            const processedRange = this.processChange(change)
            ranges.push(processedRange)
        }
        
        return ranges
    }

    /**
     * Сортирует изменения по offset (от меньшего к большему) для корректной обработки.
     * 
     * @param changes - Массив изменений текста
     * @returns Отсортированный массив изменений
     */
    private sortChanges(changes: IModelContentChange[]): IModelContentChange[] {
        return [...changes].sort((a, b) => a.rangeOffset - b.rangeOffset)
    }

    /**
     * Обрабатывает одно изменение текста, обновляя соответствующие токены.
     * 
     * @param change - Изменение текста для обработки
     * @returns Информация об обработанном диапазоне
     */
    private processChange(change: IModelContentChange): IProcessedRange {
        let start = change.rangeOffset
        let end = change.rangeLength + start
        const offsetDiff = change.text.length - change.rangeLength
        const boundaries = findTokens(this.moduleTokens, start, end)

        // Валидация индексов перед обращением к массиву
        if (!this.validateBoundaries(boundaries)) {
            return this.createErrorRange(start, end, offsetDiff)
        }

        const { text: expandedText, start: adjustedStart, end: adjustedEnd } = 
            this.expandTextToTokenBoundaries(change.text, start, end, boundaries)
        
        const textTokens = this.tokenizeText(expandedText, adjustedStart)
        this.replaceTokens(boundaries, textTokens, offsetDiff, adjustedStart)

        return {
            start: adjustedStart,
            end: adjustedEnd,
            errors: textTokens.errors,
            diff: offsetDiff
        }
    }

    /**
     * Проверяет корректность границ токенов.
     * 
     * @param boundaries - Границы токенов для проверки
     * @returns true, если границы корректны, false в противном случае
     */
    private validateBoundaries(boundaries: ITokenBoundaries): boolean {
        const { startIndex, endIndex } = boundaries
        const isValid = startIndex >= 0 && startIndex < this.moduleTokens.length &&
                       endIndex >= 0 && endIndex < this.moduleTokens.length

        if (!isValid) {
            console.warn(
                `Invalid token indices: startIndex=${startIndex}, endIndex=${endIndex}, ` +
                `tokens.length=${this.moduleTokens.length}`
            )
        }

        return isValid
    }

    /**
     * Создает диапазон с ошибкой при некорректных границах токенов.
     * 
     * @param start - Начальная позиция
     * @param end - Конечная позиция
     * @param diff - Разница в длине текста
     * @returns Диапазон с ошибкой
     */
    private createErrorRange(start: number, end: number, diff: number): IProcessedRange {
        const errorLength = Math.max(1, end - start)
        const error: ILexingError = {
            message: 'Invalid token indices',
            offset: start,
            line: 0,
            column: 0,
            length: errorLength
        }

        return { start, end, diff, errors: [error] }
    }

    /**
     * Расширяет текст изменения до границ токенов, если изменение частично затрагивает токены.
     * 
     * @param changeText - Исходный текст изменения
     * @param start - Начальная позиция изменения
     * @param end - Конечная позиция изменения
     * @param boundaries - Границы токенов
     * @returns Расширенный текст и скорректированные границы
     */
    private expandTextToTokenBoundaries(
        changeText: string,
        start: number,
        end: number,
        boundaries: ITokenBoundaries
    ): { text: string, start: number, end: number } {
        const { startIndex, endIndex, includeStart, includeEnd } = boundaries

        if (!includeStart && !includeEnd) {
            return { text: changeText, start, end }
        }

        const startToken = this.moduleTokens[startIndex]
        const endToken = this.moduleTokens[endIndex]

        const leftText = includeStart 
            ? startToken.image.substring(0, start - startToken.startOffset) 
            : ''
        const endTokenEndOffset = getEndOffset(endToken)
        const rightText = includeEnd 
            ? endToken.image.substring(end - endToken.startOffset) 
            : ''

        const expandedText = leftText + changeText + rightText
        const adjustedStart = includeStart ? startToken.startOffset : start
        const adjustedEnd = includeEnd ? endTokenEndOffset : end

        return { text: expandedText, start: adjustedStart, end: adjustedEnd }
    }

    /**
     * Токенизирует текст и корректирует смещения токенов.
     * 
     * @param text - Текст для токенизации
     * @param startOffset - Смещение начала текста в исходном документе
     * @returns Объект с токенами и ошибками
     */
    private tokenizeText(text: string, startOffset: number): { tokens: IToken[], errors?: ILexingError[] } {
        if (!text || text.trim() === '') {
            return { tokens: [] }
        }

        const lexingResult = super.tokenize(text)
        
        // Корректируем смещения для новых токенов
        for (const token of lexingResult.tokens) {
            token.startOffset += startOffset
            token.endOffset = (getEndOffset(token) + startOffset) as typeof token.endOffset
        }

        return {
            tokens: lexingResult.tokens,
            errors: lexingResult.errors
        }
    }

    /**
     * Заменяет токены в массиве на основе границ и новых токенов.
     * 
     * @param boundaries - Границы заменяемых токенов
     * @param newTokens - Новые токены для вставки
     * @param offsetDiff - Разница в смещении
     * @param adjustedStart - Скорректированная начальная позиция
     */
    private replaceTokens(
        boundaries: ITokenBoundaries,
        newTokens: { tokens: IToken[], errors?: ILexingError[] },
        offsetDiff: number,
        adjustedStart: number
    ): void {
        const { startIndex, endIndex, includeStart } = boundaries
        const textTokens = newTokens.tokens

        // Оптимизация: вставка в начало файла
        if (this.isInsertAtStart(boundaries, adjustedStart)) {
            if (offsetDiff !== 0) {
                moveTokens(this.moduleTokens, 0, offsetDiff)
            }
            this.moduleTokens = textTokens.concat(this.moduleTokens)
            return
        }

        // Оптимизация: вставка в конец файла
        if (this.isInsertAtEnd(boundaries)) {
            this.moduleTokens = this.moduleTokens.concat(textTokens)
            return
        }

        // Общий случай: замена в середине
        const removeStart = startIndex + (!includeStart ? 1 : 0)
        const removeCount = endIndex - startIndex + (includeStart ? 1 : 0)
        this.moduleTokens.splice(removeStart, removeCount, ...textTokens)

        if (offsetDiff !== 0) {
            const startMove = startIndex + textTokens.length + (!includeStart ? 1 : 0)
            moveTokens(this.moduleTokens, startMove, offsetDiff)
        }
    }

    /**
     * Проверяет, является ли изменение вставкой в начало файла.
     * 
     * @param boundaries - Границы токенов
     * @param adjustedStart - Скорректированная начальная позиция
     * @returns true, если это вставка в начало
     */
    private isInsertAtStart(boundaries: ITokenBoundaries, adjustedStart: number): boolean {
        const { startIndex, endIndex, includeStart, includeEnd } = boundaries
        return adjustedStart === 0 && !includeStart && !includeEnd && startIndex === 0 && endIndex === 0
    }

    /**
     * Проверяет, является ли изменение вставкой в конец файла.
     * 
     * @param boundaries - Границы токенов
     * @returns true, если это вставка в конец
     */
    private isInsertAtEnd(boundaries: ITokenBoundaries): boolean {
        const { startIndex, includeStart } = boundaries
        return !includeStart && startIndex === this.moduleTokens.length - 1
    }
}

/**
 * Сдвигает смещения токенов начиная с указанного индекса.
 * 
 * Обновляет startOffset и endOffset для всех токенов начиная с указанного индекса,
 * добавляя к ним указанную разницу. Используется при инкрементальном обновлении
 * для корректировки позиций токенов после вставки или удаления текста.
 * 
 * @param tokens - Массив токенов для обновления
 * @param start - Индекс первого токена, с которого начинается сдвиг
 * @param diff - Величина сдвига (положительная для вставки, отрицательная для удаления)
 */
function moveTokens(tokens: IToken[], start: number, diff: number) {
    if (diff === 0 || start >= tokens.length) {
        return
    }
    
    for (let index = start; index < tokens.length; index++) {
        const token = tokens[index]
        token.startOffset += diff
        ;(token.endOffset as number) += diff
    }
}

/**
 * Находит границы токенов, пересекающихся с указанным диапазоном.
 * 
 * Выполняет поиск в отсортированном массиве токенов для определения индексов токенов,
 * которые пересекаются или находятся рядом с указанными начальным и конечным смещениями.
 * Также определяет, нужно ли включать токены на этих границах.
 * 
 * @param tokens - Отсортированный массив токенов, каждый с числовыми startOffset и endOffset
 * @param startOffset - Начальное смещение целевого диапазона
 * @param endOffset - Конечное смещение целевого диапазона
 * @returns Объект, содержащий:
 *   - startIndex: Индекс токена на или рядом с начальным смещением
 *   - endIndex: Индекс токена на или рядом с конечным смещением
 *   - includeStart: true, если токен на startIndex должен быть включен
 *   - includeEnd: true, если токен на endIndex должен быть включен
 */
export function findTokens(tokens: IToken[], startOffset: number, endOffset: number): ITokenBoundaries {
    const lastTokenIndex = tokens.length - 1

    // Граничные случаи: пустой массив или диапазон вне всех токенов
    if (tokens.length === 0 || tokens[0].startOffset > endOffset) {
        return { startIndex: 0, endIndex: 0, includeStart: false, includeEnd: false }
    }
    
    const lastTokenEndOffset = getEndOffset(tokens[lastTokenIndex])
    if (lastTokenEndOffset + 1 < startOffset) {
        return { startIndex: lastTokenIndex, endIndex: lastTokenIndex, includeStart: false, includeEnd: true }
    }

    const startResult = findTokenIndex(tokens, startOffset, true)
    const endResult = findTokenIndex(tokens, endOffset, false)
    let startIndex = startResult.index
    let includeStart = startResult.include
    let endIndex = endResult.index
    let includeEnd = endResult.include

    // Специальный случай: изменение полностью внутри одного токена
    if (startIndex === endIndex && !includeStart && !includeEnd) {
        const token = tokens[endIndex]
        const tokenEndOffset = getEndOffset(token)
        includeStart = token.startOffset > startOffset && tokenEndOffset + 1 < endOffset
    }

    return { startIndex, endIndex, includeStart, includeEnd }
}

/**
 * Находит индекс токена, который пересекается с указанным смещением.
 * 
 * Использует бинарный поиск для эффективного определения токена, который содержит
 * или находится рядом с указанным смещением. Определяет, нужно ли включать
 * найденный токен в результат на основе того, пересекается ли он с указанным смещением.
 * 
 * @param tokens - Отсортированный массив токенов
 * @param offset - Смещение для поиска
 * @param isStartOffset - true для поиска начального токена, false для конечного
 * @returns Объект, содержащий индекс токена и флаг включения
 */
function findTokenIndex(
    tokens: IToken[],
    offset: number,
    isStartOffset: boolean
): { index: number, include: boolean } {
    let foundIndex = -1
    let include = false

    const lastTokenIndex = tokens.length - 1
    let lo = 0
    let hi = lastTokenIndex
    let mid = 0

    // Бинарный поиск токена, содержащего или прилегающего к offset
    while (lo <= hi) {
        mid = Math.floor((lo + hi) / 2)
        const token = tokens[mid]
        const tokenEndOffset = getEndOffset(token)
        
        if (token.startOffset > offset) {
            hi = mid - 1
        } else if (isTokenAfterOffset(tokenEndOffset, offset, isStartOffset)) {
            lo = mid + 1
        } else {
            foundIndex = mid
            break
        }
    }

    // Если точное совпадение не найдено, используем ближайший токен
    if (foundIndex === -1) {
        foundIndex = Math.max(0, Math.min(mid, lastTokenIndex))
    }

    const token = tokens[foundIndex]
    const tokenEndOffset = getEndOffset(token)
    
    // Корректировка индекса и определение, нужно ли включать токен
    if (token.startOffset > offset) {
        if (foundIndex > 0) {
            foundIndex--
            include = tokenEncompassesOffset(tokens[foundIndex], offset)
        }
    } else if (isTokenAfterOffset(tokenEndOffset, offset, isStartOffset)) {
        if (foundIndex < lastTokenIndex) {
            foundIndex++
            include = tokenEncompassesOffset(tokens[foundIndex], offset)
            if (!include) {
                foundIndex--
            }
        }
    } else {
        include = true
    }

    return { index: foundIndex, include }
}

/**
 * Проверяет, находится ли токен после указанного смещения.
 * 
 * @param tokenEndOffset - Конечное смещение токена
 * @param offset - Смещение для сравнения
 * @param isStartOffset - true для проверки начала, false для конца (используется разная логика сравнения)
 * @returns true, если токен находится после смещения
 */
function isTokenAfterOffset(tokenEndOffset: number, offset: number, isStartOffset: boolean): boolean {
    // Для начального смещения используем строгое неравенство (<)
    // Для конечного смещения используем нестрогое (<=)
    return isStartOffset ? tokenEndOffset + 1 < offset : tokenEndOffset + 1 <= offset
}

/**
 * Проверяет, охватывает ли указанный токен указанное смещение.
 * 
 * Токен считается охватывающим смещение, если начальное смещение токена меньше или равно
 * указанному смещению, а конечное смещение токена (плюс один) больше или равно указанному смещению.
 * 
 * @param token - Токен с определенными startOffset и endOffset
 * @param offset - Смещение для проверки относительно границ токена
 * @returns true, если токен полностью охватывает смещение, иначе false
 */
function tokenEncompassesOffset(token: IToken, offset: number): boolean {
    const tokenEndOffset = getEndOffset(token)
    return token.startOffset <= offset && tokenEndOffset + 1 >= offset
}