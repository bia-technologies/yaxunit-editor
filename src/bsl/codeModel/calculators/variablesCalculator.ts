import { CaseInsensitiveMap } from "@/common/utils/caseInsensitiveMap";
import { BaseCodeModelVisitor, isAcceptable } from "../visitor";
import {
    AssignmentStatementSymbol,
    BslCodeModel,
    ForEachStatementSymbol,
    ForStatementSymbol,
    FunctionDefinitionSymbol,
    ModuleVariableDefinitionSymbol,
    ParameterDefinitionSymbol,
    ProcedureDefinitionSymbol,
    VariableDefinitionSymbol,
    VariableSymbol
} from "../model";
import { BslVariable } from "../model/members";
import { ModelCalculator } from "./calculator";
import { VariablesScope } from "../model/interfaces";

export class VariablesCalculator extends BaseCodeModelVisitor implements ModelCalculator {
    calculatorVariables: CaseInsensitiveMap<BslVariable> = new CaseInsensitiveMap()
    varScope: VariablesScope | undefined

    calculate(model: VariablesScope) {
        const start = performance.now()
        if (model instanceof BslCodeModel) {
            this.visitModel(model)
        } else if (isAcceptable(model)) {
            model.accept(this)
        }
        console.log('Calculate variables', performance.now() - start, 'ms')
    }

    visitModel(model: BslCodeModel) {
        this.setVarScope(model)
        super.visitModel(model)
        this.clearOldVars(model)
    }

    // #region definitions
    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol) {
        this.setVarScope(symbol)
        super.visitProcedureDefinition(symbol)
        this.clearOldVars(symbol)

    }

    visitFunctionDefinition(symbol: FunctionDefinitionSymbol) {
        this.setVarScope(symbol)
        super.visitFunctionDefinition(symbol)
        this.clearOldVars(symbol)
    }

    visitParameterDefinition(symbol: ParameterDefinitionSymbol) {
        this.handleVar(symbol)
    }
    // #endregion

    // #region statements
    visitVariableDefinition(symbol: VariableDefinitionSymbol) {
        symbol.vars.forEach(this.handleVar.bind(this))
        super.visitVariableDefinition(symbol)
    }

    visitAssignmentStatement(symbol: AssignmentStatementSymbol): void {
        if (symbol.variable instanceof VariableSymbol) {
            this.handleVar(symbol.variable)
        }
        super.visitAssignmentStatement(symbol)
    }

    visitForStatement(symbol: ForStatementSymbol): void {
        if (symbol.variable) {
            this.handleVar(symbol.variable)
        }
        super.visitForStatement(symbol)
    }

    visitForEachStatement(symbol: ForEachStatementSymbol): void {
        if (symbol.variable) {
            this.handleVar(symbol.variable)
        }
        super.visitForEachStatement(symbol)
    }
    // #endregion

    visitVariableSymbol(symbol: VariableSymbol) {
        symbol.member = this.calculatorVariables.get(symbol.name)
    }

    visitModuleVariableDefinition(symbol: ModuleVariableDefinitionSymbol): void {
        this.handleVar(symbol)
    }

    private setVarScope(varScope: VariablesScope) {
        this.varScope = varScope
        this.calculatorVariables.clear()
    }

    private clearOldVars(varScope: VariablesScope) {
        for (let index = varScope.vars.length - 1; index >= 0; index--) {
            const variable = varScope.vars[index];
            if (!this.calculatorVariables.has(variable.name)) {
                varScope.vars.splice(index, 1)
            }
        }
        this.calculatorVariables.clear()
    }

    private handleVar(symbol: VariableSymbol | ParameterDefinitionSymbol) {
        let variable = this.calculatorVariables.get(symbol.name)

        if (!variable && this.varScope && (variable = findInScope(this.varScope, symbol.name))) {
            this.calculatorVariables.set(variable.name, variable)
            variable.definitions.length = 0 // Clear definitions
        }
        if (!variable && this.varScope) {
            variable = this.createVariable(symbol)
            
            this.varScope.vars.push(variable)
            this.calculatorVariables.set(variable.name, variable)
        }
        if (variable) {
            variable.definitions.push(symbol)
        }
        symbol.member = variable
    }

    private createVariable(symbol: VariableSymbol | ParameterDefinitionSymbol) {
        const variable = new BslVariable(symbol.name)

        if (symbol instanceof VariableSymbol) {
            variable.description = `Локальная переменная \`${symbol.name}\``
        } else {
            variable.description = `Параметр \`${symbol.name}\``
            variable.value = symbol.default
        }

        return variable
    }
}

function findInScope(varScope: VariablesScope, name: string) {
    return varScope.vars.find(v => name.localeCompare(v.name, undefined, { sensitivity: "accent" }) === 0)
}