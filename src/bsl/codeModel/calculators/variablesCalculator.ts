import { CaseInsensitiveMap } from "@/common/utils/caseInsensitiveMap";
import { BaseCodeModelVisitor, isAcceptable } from "../visitor";
import {
    AssignmentStatementSymbol,
    BslCodeModel,
    FunctionDefinitionSymbol,
    ModuleVariableDefinitionSymbol,
    ProcedureDefinitionSymbol,
    VariableSymbol
} from "../model";
import { BslVariable } from "../model/variables";
import { ModelCalculator } from "./calculator";
import { VariablesScope } from "../model/interfaces";

export class VariablesCalculator extends BaseCodeModelVisitor  implements ModelCalculator{
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

    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol) {
        this.setVarScope(symbol)
        super.visitProcedureDefinition(symbol)
    }

    visitFunctionDefinition(symbol: FunctionDefinitionSymbol) {
        this.setVarScope(symbol)
        super.visitFunctionDefinition(symbol)
    }

    visitAssignmentStatement(symbol: AssignmentStatementSymbol): void {
        if (symbol.variable instanceof VariableSymbol) {
            this.handleVar(symbol.variable)
        }
        super.visitAssignmentStatement(symbol)
    }

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
        if (!variable) {
            variable = new BslVariable(symbol.name)
            this.variablesMap.set(variable.name, variable)
            this.varScope.vars.push(variable)
        }
        symbol.member = variable
    }
}