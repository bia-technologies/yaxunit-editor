import { BaseSymbol, CompositeSymbol, Method } from "@/common/codeModel";
import { VariablesScope } from "./interfaces";
import { MethodsCalculator, TypesCalculator, VariablesCalculator } from "../calculators";
import { FunctionDefinitionSymbol, ProcedureDefinitionSymbol } from "./definitions";
import { ParentsCalculator } from "../calculators";
import { Emitter, IEvent } from "monaco-editor-core";
import { AutoDisposable } from "@/common/utils/autodisposable";
import { BslVariable } from "./variables";

export class BslCodeModel extends AutoDisposable implements VariablesScope, CompositeSymbol {
    calculators = {
        parents: new ParentsCalculator(),
        variables: new VariablesCalculator(),
        types: TypesCalculator.instance
    }
    children: BaseSymbol[] = []
    vars: BslVariable[] = []

    private onDidChangeModelEmitter: Emitter<BslCodeModel> = new Emitter()

    get methods() {
        return (new MethodsCalculator()).calculate(this)
    }

    getMethodDefinition(method: Method): FunctionDefinitionSymbol | ProcedureDefinitionSymbol | undefined {
        return this.methods.find(m => m.name === method.name)
    }

    getChildrenSymbols() {
        return this.children
    }

    async afterUpdate(symbol: BaseSymbol | BslCodeModel) {
        if (symbol instanceof BslCodeModel) {
            this.calculators.parents.calculate(this)
            this.calculators.variables.calculate(this)
            await this.calculators.types.calculate(this)
        }else{
            this.calculators.parents.calculate(this)
            // this.calculators.variables.calculate(this)
            // await this.calculators.types.calculate(this)
        }
        this.onDidChangeModelEmitter.fire(this)
    }

    onDidChangeModel: IEvent<BslCodeModel> = (listener) => {
        return this.onDidChangeModelEmitter.event(listener)
    }
}