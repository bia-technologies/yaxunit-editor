import { BaseSymbol, CompositeSymbol, Method } from "@/common/codeModel";
import { VariablesScope } from "./interfaces";
import { MethodsCalculator, TypesCalculator, VariablesCalculator } from "../calculators";
import { FunctionDefinitionSymbol, MethodDefinition, ProcedureDefinitionSymbol } from "./definitions";
import { ParentsCalculator } from "../calculators";
import { Emitter, IEvent } from "monaco-editor-core";
import { AutoDisposable } from "@/common/utils/autodisposable";
import { BslVariable } from "./members";
import { getParentMethodDefinition } from "@/bsl/chevrotain/utils";
import { GlobalScope } from "@/common/scope";

export class BslCodeModel extends AutoDisposable implements VariablesScope, CompositeSymbol {
    calculators = {
        parents: new ParentsCalculator(),
        variables: new VariablesCalculator(),
        types: new TypesCalculator(this)
    }

    children: BaseSymbol[] = []
    vars: BslVariable[] = []

    constructor() {
        super()
        GlobalScope.onLoaded(() => this.calculators.types.calculate(this))
    }
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

    async afterUpdate(symbol: BaseSymbol[] | BslCodeModel) {
        if (symbol instanceof BslCodeModel) {
            this.calculators.parents.calculate(this)
            this.calculators.variables.calculate(this)
            await this.calculators.types.calculate(this)
        } else {
            symbol.forEach(this.calculators.parents.calculate.bind(this.calculators.parents))
            const methods = [...new Set(symbol.map(getParentMethodDefinition).filter(s => s))] as (ProcedureDefinitionSymbol | FunctionDefinitionSymbol)[]
            methods.forEach(this.calculators.variables.calculate.bind(this.calculators.variables))
            this.updateTypes(methods)

        }
        this.onDidChangeModelEmitter.fire(this)
    }

    onDidChangeModel: IEvent<BslCodeModel> = (listener) => {
        return this.onDidChangeModelEmitter.event(listener)
    }

    private async updateTypes(methods: MethodDefinition[]) {
        for (const method of methods) {
            await this.calculators.types.calculate(method)
        }
    }
}
