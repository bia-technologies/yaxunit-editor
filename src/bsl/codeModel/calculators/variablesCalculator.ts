import { CaseInsensitiveMap } from "@/common/utils/caseInsensitiveMap";
import { BaseCodeModelVisitor, isAcceptable } from "../visitor";
import {
    AssignmentStatementSymbol,
    BslCodeModel,
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
        if (model instanceof BslCodeModel) {
            this.visitModel(model)
        } else if (isAcceptable(model)) {
            model.accept(this)
        }
    }

    visitModel(model: BslCodeModel) {
        this.setVarScope(model)
        super.visitModel(model)
    }

    // #region definitions
    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol) {
        this.setVarScope(symbol)
        super.visitProcedureDefinition(symbol)
    }

    visitFunctionDefinition(symbol: FunctionDefinitionSymbol) {
        this.setVarScope(symbol)
        super.visitFunctionDefinition(symbol)
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

    handleVar(symbol: VariableSymbol) {
        let variable = this.variablesMap.get(symbol.name)
        if (!variable && this.varScope) {
            variable = new BslVariable(symbol.name)
            this.variablesMap.set(variable.name, variable)
            this.varScope.vars.push(variable)
        }
        symbol.member = variable
    }
}