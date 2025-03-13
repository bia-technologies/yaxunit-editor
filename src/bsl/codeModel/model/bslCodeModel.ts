import { BaseSymbol, CodeSymbol, descendantByOffset, Method } from "@/common/codeModel";
import { VariablesScope } from "../interfaces";
import { MethodsCalculator, VariablesCalculator } from "../calculators";
import { FunctionDefinitionSymbol, ProcedureDefinitionSymbol } from "./definitions";
import { ParentsCalculator } from "../calculators";
import { Emitter, IEvent } from "monaco-editor-core";
import { AutoDisposable } from "@/common/utils/autodisposable";

export class BslCodeModel extends AutoDisposable implements VariablesScope {
    children: BaseSymbol[] = []
    private onDidChangeModelEmitter: Emitter<BslCodeModel> = new Emitter()

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
        this.onDidChangeModelEmitter.fire(this)
    }

    onDidChangeModel: IEvent<BslCodeModel> = (listener) => {
        let event;
        this._disposables.push(event = this.onDidChangeModelEmitter.event(listener))
        return event
    }
}