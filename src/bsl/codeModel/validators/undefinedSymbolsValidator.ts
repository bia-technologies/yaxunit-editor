import { BaseValidator } from "./baseValidator"
import { DiagnosticMessage } from "@/bsl/diagnostics"
import { BaseSymbol } from "@/common/codeModel"
import { BslCodeModel } from "../model"

/**
 * Валидатор для проверки неопределенных символов.
 * Проверяет использование переменных, методов и свойств, которые не были определены.
 */
export class UndefinedSymbolsValidator extends BaseValidator {
    validate(model: BslCodeModel | BaseSymbol): DiagnosticMessage[] {
        this.clearErrors()
        
        if (model instanceof BslCodeModel) {
            this.visitModel(model)
        } else {
            this.accept(model)
        }
        
        return this.errors
    }

    // Валидация неопределенных символов временно отключена
    // так как пользователь закомментировал логику проверки
}
