import { BaseCodeModelVisitor } from "../visitor"
import { DiagnosticMessage, DiagnosticSeverity, DiagnosticSource } from "@/bsl/diagnostics"
import { BaseSymbol } from "@/common/codeModel"
import { BslCodeModel, isMethodDefinition } from "../model"
import { getParentMethodDefinition } from "@/bsl/chevrotain/utils"

/**
 * Базовый класс для валидаторов модели кода.
 * Предоставляет общую функциональность для сбора диагностических сообщений.
 */
export abstract class BaseValidator extends BaseCodeModelVisitor {
    protected errors: DiagnosticMessage[] = []

    /**
     * Выполняет валидацию модели или символа
     * @param model - модель кода или символ для валидации
     * @returns массив диагностических сообщений
     */
    abstract validate(model: BslCodeModel | BaseSymbol): DiagnosticMessage[]

    /**
     * Добавляет диагностическое сообщение об ошибке
     * @param message - текст сообщения
     * @param symbol - символ, в котором обнаружена ошибка
     * @param severity - уровень серьезности
     * @param code - код ошибки (опционально)
     */
    protected addError(
        message: string, 
        symbol: BaseSymbol, 
        severity: DiagnosticSeverity = DiagnosticSeverity.Error,
        code?: string
    ): void {
        const method = isMethodDefinition(symbol) ? undefined : getParentMethodDefinition(symbol)
        const offset = method?.startOffset ?? 0

        this.errors.push({
            message,
            startOffset: offset + symbol.startOffset,
            endOffset: offset + symbol.endOffset,
            severity,
            source: DiagnosticSource.Semantic,
            code
        })
    }

    /**
     * Очищает накопленные ошибки
     */
    protected clearErrors(): void {
        this.errors = []
    }
}
