import { BslCodeModel, FunctionDefinitionSymbol, ProcedureDefinitionSymbol } from ".."
import { BaseCodeModelVisitor } from "../visitor"


export class MethodsCalculator extends BaseCodeModelVisitor {
    methods: (FunctionDefinitionSymbol | ProcedureDefinitionSymbol)[] = []

    calculate(model: BslCodeModel) {
        this.visitModel(model)
        return this.methods
    }

    visitFunctionDefinition(symbol: FunctionDefinitionSymbol): void {
        this.methods.push(symbol)
    }

    visitProcedureDefinition(symbol: ProcedureDefinitionSymbol): void {
        this.methods.push(symbol)
    }
}