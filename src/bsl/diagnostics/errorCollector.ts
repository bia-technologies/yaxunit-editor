import { ILexingError, IRecognitionException, CstNode, IToken } from 'chevrotain'
import { DiagnosticMessage, DiagnosticSeverity, DiagnosticSource } from './types'

/**
 * Сборщик ошибок из разных источников.
 * Конвертирует ошибки парсера/лексера в унифицированный формат DiagnosticMessage.
 */
export class ErrorCollector {
    /**
     * Собирает ошибки лексического анализа
     */
    collectLexerErrors(errors: ILexingError[]): DiagnosticMessage[] {
        return errors.map(error => ({
            message: `Лексическая ошибка: ${error.message || 'Неизвестная ошибка'}`,
            startOffset: error.offset,
            endOffset: error.offset + error.length,
            severity: DiagnosticSeverity.Error,
            source: DiagnosticSource.Lexer,
            code: 'LEX001'
        }))
    }

    /**
     * Собирает ошибки синтаксического анализа
     */
    collectParserErrors(errors: IRecognitionException[]): DiagnosticMessage[] {
        return errors.map(error => {
            const startOffset = error.token.startOffset
            const endOffset = error.token.endOffset !== undefined 
                ? error.token.endOffset + 1 
                : startOffset + 1

            return {
                message: `Синтаксическая ошибка: ${error.message}`,
                startOffset,
                endOffset,
                severity: DiagnosticSeverity.Error,
                source: DiagnosticSource.Parser,
                code: 'PARSE001'
            }
        })
    }

    /**
     * Собирает ошибки из garbageToken узлов CST.
     * garbageToken появляются, когда парсер встречает неожиданные токены.
     */
    collectGarbageTokenErrors(cst: CstNode): DiagnosticMessage[] {
        const errors: DiagnosticMessage[] = []
        this.findGarbageTokens(cst, errors)
        return errors
    }

    /**
     * Рекурсивно находит все garbageToken узлы в CST
     */
    private findGarbageTokens(node: CstNode, errors: DiagnosticMessage[]): void {
        if (!node || !node.children) {
            return
        }

        // Проверяем, является ли текущий узел garbageToken
        if (node.name === 'garbageToken') {
            const token = this.getFirstToken(node)
            if (token) {
                const startOffset = token.startOffset
                const endOffset = token.endOffset !== undefined 
                    ? token.endOffset + 1 
                    : startOffset + 1

                errors.push({
                    message: `Неожиданный символ "${token.image}"`,
                    startOffset,
                    endOffset,
                    severity: DiagnosticSeverity.Error,
                    source: DiagnosticSource.Parser,
                    code: 'GARBAGE_TOKEN'
                })
            }
        }

        // Рекурсивно обходим все дочерние узлы
        for (const key in node.children) {
            const children = node.children[key]
            if (Array.isArray(children)) {
                for (const child of children) {
                    if (this.isCstNode(child)) {
                        this.findGarbageTokens(child, errors)
                    }
                }
            }
        }
    }

    /**
     * Получает первый токен из узла CST
     */
    private getFirstToken(node: CstNode): IToken | undefined {
        if (!node.children) {
            return undefined
        }

        for (const key in node.children) {
            const children = node.children[key]
            if (Array.isArray(children) && children.length > 0) {
                const first = children[0]
                if (this.isToken(first)) {
                    return first
                }
            }
        }

        return undefined
    }

    /**
     * Проверяет, является ли объект CST узлом
     */
    private isCstNode(obj: any): obj is CstNode {
        return obj && typeof obj === 'object' && 'name' in obj && 'children' in obj
    }

    /**
     * Проверяет, является ли объект токеном
     */
    private isToken(obj: any): obj is IToken {
        return obj && typeof obj === 'object' && 'tokenType' in obj && 'image' in obj
    }

    /**
     * Объединяет несколько наборов ошибок в один массив
     */
    combineErrors(...errorSets: DiagnosticMessage[][]): DiagnosticMessage[] {
        return errorSets.flat()
    }
}
