import { BaseValidator } from "./baseValidator"
import { DiagnosticMessage, DiagnosticSeverity } from "@/bsl/diagnostics"
import { BaseSymbol } from "@/common/codeModel"
import { BslCodeModel, FunctionDefinitionSymbol, ProcedureDefinitionSymbol, VariableSymbol } from "../model"
import { BslVariable, BslVariableType } from "../model/members"
import { VariablesScope } from "../model/interfaces"

/**
 * Валидатор для проверки неиспользуемых символов.
 * Проверяет переменные и параметры, которые определены, но не используются.
 */
export class UnusedSymbolsValidator extends BaseValidator {
    private variableUsages = new Map<BslVariable, VariableSymbol[]>()

    validate(model: BslCodeModel | BaseSymbol): DiagnosticMessage[] {
        this.clearErrors()
        this.variableUsages.clear()
        
        if (model instanceof BslCodeModel) {
            // Первый проход: собираем все использования переменных
            this.collectVariableUsages(model)
            
            // Второй проход: проверяем неиспользуемые переменные на уровне модуля
            this.checkUnusedVariables(model)
            
            // Третий проход: проверяем параметры методов
            this.visitModel(model)
        }
        
        return this.errors
    }

    /**
     * Проверка функций - проверяем неиспользуемые параметры
     */
    visitFunctionDefinition(symbol: FunctionDefinitionSymbol): void {
        this.checkUnusedParameters(symbol)
        super.visitFunctionDefinition(symbol)
        this.checkUnusedVariables(symbol)
    }

    /**
     * Проверка процедур - проверяем неиспользуемые параметры
     */
    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol): void {
        this.checkUnusedParameters(symbol)
        super.visitProcedureDefinition(symbol)
        this.checkUnusedVariables(symbol)
    }

    /**
     * Собирает информацию об использовании всех переменных
     */
    private collectVariableUsages(scope: VariablesScope): void {
        const collector = new VariableUsageCollector()
        
        if (scope instanceof BslCodeModel) {
            collector.visitModel(scope)
        } else if ('accept' in scope) {
            (scope as any).accept(collector)
        }
        
        this.variableUsages = collector.usages
    }

    /**
     * Проверяет неиспользуемые переменные в заданной области видимости
     */
    private checkUnusedVariables(scope: VariablesScope): void {
        for (const variable of scope.vars) {
            // Пропускаем параметры - они проверяются отдельно в методах
            if (variable.variableType === BslVariableType.Parameter) {
                continue
            }

            // Получаем все использования переменной
            const usages = this.variableUsages.get(variable) || []
            
            // Исключаем определения из использований
            const nonDefinitionUsages = usages.filter(
                usage => !variable.definitions.includes(usage)
            )

            // Если переменная определена, но не используется
            if (variable.definitions.length > 0 && nonDefinitionUsages.length === 0) {
                // Берем первое определение для позиции ошибки
                const firstDefinition = variable.definitions[0]
                this.addError(
                    `Переменная "${variable.name}" объявлена, но не используется`,
                    firstDefinition,
                    DiagnosticSeverity.Warning,
                    'UNUSED_VAR'
                )
            }
        }
    }

    /**
     * Проверяет неиспользуемые параметры метода
     */
    private checkUnusedParameters(
        method: FunctionDefinitionSymbol | ProcedureDefinitionSymbol
    ): void {
        for (const variable of method.vars) {
            if (variable.variableType !== BslVariableType.Parameter) {
                continue
            }

            const usages = this.variableUsages.get(variable) || []
            
            // Параметры всегда имеют одно определение (само объявление параметра)
            // Если использований нет (кроме определения), параметр не используется
            if (usages.length === 0 || 
                (usages.length === 1 && variable.definitions.includes(usages[0]))) {
                
                const definition = variable.definitions[0]
                if (definition) {
                    this.addError(
                        `Параметр "${variable.name}" не используется`,
                        definition,
                        DiagnosticSeverity.Warning,
                        'UNUSED_PARAM'
                    )
                }
            }
        }
    }
}

/**
 * Вспомогательный visitor для сбора использований переменных
 */
class VariableUsageCollector extends BaseValidator {
    usages = new Map<BslVariable, VariableSymbol[]>()

    validate(_: BslCodeModel | BaseSymbol): DiagnosticMessage[] {
        // Не используется, но требуется абстрактным классом
        return []
    }

    visitVariableSymbol(symbol: VariableSymbol): void {
        if (symbol.member && symbol.member instanceof BslVariable) {
            const existing = this.usages.get(symbol.member) || []
            existing.push(symbol)
            this.usages.set(symbol.member, existing)
        }
        
        super.visitVariableSymbol(symbol)
    }
}
