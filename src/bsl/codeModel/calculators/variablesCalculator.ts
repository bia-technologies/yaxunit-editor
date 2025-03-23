import { CaseInsensitiveMap } from "@/common/utils/caseInsensitiveMap";
import { BaseCodeModelVisitor, isAcceptable } from "../visitor";
import {
    AssignmentStatementSymbol,
    BslCodeModel,
    ForEachStatementSymbol,
    ForStatementSymbol,
    FunctionDefinitionSymbol,
    ModuleVariableDefinitionSymbol,
    ProcedureDefinitionSymbol,
    VariableDefinitionSymbol,
    VariableSymbol
} from "../model";
import { BslVariable } from "../model/variables";
import { ModelCalculator } from "./calculator";
import { VariablesScope } from "../model/interfaces";

export class VariablesCalculator extends BaseCodeModelVisitor implements ModelCalculator {
    variablesMap: CaseInsensitiveMap<BslVariable> = new CaseInsensitiveMap()
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
        symbol.member = this.variablesMap.get(symbol.name)
    }

    visitModuleVariableDefinition(symbol: ModuleVariableDefinitionSymbol): void {
        this.handleVar(symbol)
    }

    private setVarScope(varScope: VariablesScope) {
        this.varScope = varScope
        this.variablesMap.clear()
    }

    private clearOldVars(varScope: VariablesScope) {
        for (let index = varScope.vars.length - 1; index >= 0; index--) {
            const variable = varScope.vars[index];
            if (!this.variablesMap.has(variable.name)) {
                varScope.vars.splice(index, 1)
            }
        }
        this.variablesMap.clear()
    }

    private handleVar(symbol: VariableSymbol) {
        let variable = this.variablesMap.get(symbol.name)
        if (!variable && this.varScope) {
            variable = findInScope(this.varScope, symbol.name)
            if (variable) {
                this.variablesMap.set(variable.name, variable)
            }
        }
        if (!variable && this.varScope) {
            variable = new BslVariable(symbol.name)
            this.variablesMap.set(variable.name, variable)
            this.varScope.vars.push(variable)
        }
        symbol.member = variable
    }

}

function findInScope(varScope: VariablesScope, name: string) {
    return varScope.vars.find(v => name.localeCompare(v.name, undefined, { sensitivity: "accent" }) === 0)
}