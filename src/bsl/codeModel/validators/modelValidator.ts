import { DiagnosticMessage } from "@/bsl/diagnostics"
import { BslCodeModel } from "../model"
import { BaseValidator } from "./baseValidator"
import { UndefinedSymbolsValidator } from "./undefinedSymbolsValidator"
import { UnusedSymbolsValidator } from "./unusedSymbolsValidator"

/**
 * Главный валидатор модели кода.
 * Координирует работу всех специализированных валидаторов.
 */
export class ModelValidator {
    private validators: BaseValidator[] = [
        new UndefinedSymbolsValidator(),
        new UnusedSymbolsValidator()
    ]

    /**
     * Выполняет валидацию модели кода
     * @param model - модель кода для валидации
     * @returns массив всех найденных диагностических сообщений
     */
    validate(model: BslCodeModel): DiagnosticMessage[] {
        return this.validators.flatMap(validator => validator.validate(model))
    }

    /**
     * Добавляет новый валидатор
     * @param validator - валидатор для добавления
     */
    addValidator(validator: BaseValidator): void {
        this.validators.push(validator)
    }

    /**
     * Удаляет валидатор
     * @param validator - валидатор для удаления
     */
    removeValidator(validator: BaseValidator): void {
        const index = this.validators.indexOf(validator)
        if (index !== -1) {
            this.validators.splice(index, 1)
        }
    }
}
