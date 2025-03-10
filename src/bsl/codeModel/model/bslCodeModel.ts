import { BaseSymbol, Method } from "@/common/codeModel";
import { VariablesScope } from "../interfaces";
import { MethodsCalculator, VariablesCalculator } from "../calculators";
import { FunctionDefinitionSymbol, ProcedureDefinitionSymbol } from "./definitions";

export class BslCodeModel implements VariablesScope {
    children: BaseSymbol[] = []

    get methods() {
        return (new MethodsCalculator()).calculate(this)
    }

    get vars() {
        return (new VariablesCalculator()).calculate(this)
    }

    getMethodDefinition(method: Method): FunctionDefinitionSymbol | ProcedureDefinitionSymbol | undefined {
        return this.methods.find(m => m.name === method.name)
    }
}