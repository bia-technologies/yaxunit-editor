import { IToken } from "chevrotain"

/**
 * Вспомогательная функция для безопасного получения endOffset токена.
 * Гарантирует, что endOffset всегда является числом.
 * 
 * @param token - Токен для получения endOffset
 * @returns Числовое значение endOffset (или startOffset, если endOffset не определен)
 */
export function getEndOffset(token: IToken): number {
    return (token.endOffset ?? token.startOffset) as number
}
