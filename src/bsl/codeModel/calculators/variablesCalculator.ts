import { CaseInsensitiveMap } from "@/common/utils/caseInsensitiveMap";
import { BaseCodeModelVisitor } from "../visitor";
import { AssignmentStatementSymbol, BslCodeModel, ModuleVariableDefinitionSymbol, VariableSymbol } from "..";

export class VariablesCalculator extends BaseCodeModelVisitor {
    variables: VariableSymbol[] = []
    variablesMap: CaseInsensitiveMap<VariableSymbol> = new CaseInsensitiveMap()

    calculate(model: BslCodeModel) {
        this.visitModel(model)
        return this.variables
    }

    visitAssignmentStatement(symbol: AssignmentStatementSymbol): void {
        if (symbol.variable instanceof VariableSymbol) {
            this.handleVar(symbol.variable)
        }
        super.visitAssignmentStatement(symbol)
    }

    visitModuleVariableDefinition(symbol: ModuleVariableDefinitionSymbol): void {
        this.handleVar(symbol)
    }

    handleVar(variable: VariableSymbol) {
        if (!this.variablesMap.has(variable.name)) {
            this.variablesMap.set(variable.name, variable)
            this.variables.push(variable)
        }
    }
}