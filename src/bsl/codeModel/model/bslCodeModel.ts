import { BaseSymbol, CodeSymbol, descendantByOffset, Method } from "@/common/codeModel";
import { VariablesScope } from "../interfaces";
import { MethodsCalculator, VariablesCalculator } from "../calculators";
import { FunctionDefinitionSymbol, ProcedureDefinitionSymbol } from "./definitions";
import { ParentsCalculator } from "../calculators";

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

    descendantByOffset(offset: number): CodeSymbol | undefined {
        return descendantByOffset(offset, ...this.children)
    }

    afterUpdate() {
        new ParentsCalculator().visitModel(this)
    }
}