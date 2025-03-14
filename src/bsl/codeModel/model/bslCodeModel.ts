import { BaseSymbol, CodeSymbol, descendantByOffset, Method } from "@/common/codeModel";
import { VariablesScope } from "./interfaces";
import { MethodsCalculator, ModelCalculator, TypesCalculator, VariablesCalculator } from "../calculators";
import { FunctionDefinitionSymbol, ProcedureDefinitionSymbol } from "./definitions";
import { ParentsCalculator } from "../calculators";
import { Emitter, IEvent } from "monaco-editor-core";
import { AutoDisposable } from "@/common/utils/autodisposable";
import { BslVariable } from "./variables";

export class BslCodeModel extends AutoDisposable implements VariablesScope {
    calculators: ModelCalculator[] = [new ParentsCalculator(), new VariablesCalculator(), TypesCalculator.instance]
    children: BaseSymbol[] = []
    vars: BslVariable[] = []

    private onDidChangeModelEmitter: Emitter<BslCodeModel> = new Emitter()

    get methods() {
        return (new MethodsCalculator()).calculate(this)
    }

    getMethodDefinition(method: Method): FunctionDefinitionSymbol | ProcedureDefinitionSymbol | undefined {
        return this.methods.find(m => m.name === method.name)
    }

    descendantByOffset(offset: number): CodeSymbol | undefined {
        return descendantByOffset(offset, ...this.children)
    }

    afterUpdate() {
        this.calculators.forEach(c => c.calculate(this))
        this.onDidChangeModelEmitter.fire(this)
    }

    onDidChangeModel: IEvent<BslCodeModel> = (listener) => {
        return this.onDidChangeModelEmitter.event(listener)
    }
}