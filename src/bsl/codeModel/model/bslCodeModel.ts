import { BaseSymbol } from "@/common/codeModel";
import { VariablesScope } from "../interfaces";
import { MethodsCalculator, VariablesCalculator } from "../calculators";

export class BslCodeModel implements VariablesScope {
    children: BaseSymbol[] = []

    get methods() {
        return (new MethodsCalculator()).calculate(this)
    }

    get vars() {
        return (new VariablesCalculator()).calculate(this)
    }
}