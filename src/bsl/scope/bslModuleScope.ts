import { BaseScope, Scope, MethodScope, Member, MemberType } from '@/common/scope'
import { BaseSymbol, Method } from "@/common/codeModel"
import { ModuleModel } from '@/bsl/moduleModel'
import { IPosition } from 'monaco-editor-core'
import { FunctionDefinitionSymbol, isMethodDefinition, ProcedureDefinitionSymbol } from '../codeModel'
import { VariablesCalculator } from '../codeModel/calculators'

export class BslModuleScope extends BaseScope {
    protected readonly model: ModuleModel

    constructor(model: ModuleModel) {
        super([])
        this.model = model
    }

    collectScopeAtPosition(position: IPosition): Scope | undefined {
        let symbol = this.model.getCurrentExpression(position) as BaseSymbol
        let method: ProcedureDefinitionSymbol | FunctionDefinitionSymbol | undefined
        while (symbol && symbol.parent) {
            symbol = symbol.parent
            if (isMethodDefinition(symbol)) {
                method = symbol
                break
            }
        }

        if (!method) {
            return undefined
        }
        return this.createMethodScope(method)
    }

    updateMembers(): void {
        // this.model.updateCodeModel()
    }

    getMethods(): Method[] {
        return this.model.getCodeModel()?.methods ?? []
    }

    protected createMethodScope(method: ProcedureDefinitionSymbol | FunctionDefinitionSymbol): MethodScope {
        const members: Member[] = []

        new VariablesCalculator().calculate(method)

        method.vars.forEach(v => members.push({
            name: v.name,
            kind: MemberType.variable,
            type: v.type
        }))

        method.params.forEach(v => members.push({
            name: v.name,
            kind: MemberType.variable,
        }))

        return new MethodScope(members)
    }
}
