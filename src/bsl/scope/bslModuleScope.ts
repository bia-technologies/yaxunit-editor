import { BaseScope, Scope, MethodScope, Member, MemberType } from '@/common/scope'
import { BaseSymbol } from "@/common/codeModel"
import { ModuleModel } from '@/bsl/moduleModel'
import { IPosition } from 'monaco-editor-core'
import { FunctionDefinitionSymbol, ProcedureDefinitionSymbol } from '../codeModel'
import { VariablesCalculator } from '../codeModel/calculators'
import { getParentMethodDefinition } from '../chevrotain/utils'

export class BslModuleScope extends BaseScope {
    protected readonly model: ModuleModel

    constructor(model: ModuleModel) {
        super([])
        this.model = model
    }

    collectScopeAtPosition(position: IPosition): Scope | undefined {
        let symbol = this.model.getCurrentExpression(position) as BaseSymbol
        let method = symbol ? getParentMethodDefinition(symbol) : undefined

        if (!method) {
            return undefined
        }
        return this.createMethodScope(method)
    }

    updateMembers(): void {
        this.members = this.getMethods()
    }

    getMethods() {
        return this.model.getCodeModel()?.methods ?? []
    }

    protected createMethodScope(method: ProcedureDefinitionSymbol | FunctionDefinitionSymbol): MethodScope {
        const members: Member[] = []

        if (!method.vars) {
            new VariablesCalculator().calculate(method)
        }

        method.vars.forEach(v => members.push({
            name: v.name,
            kind: MemberType.variable,
            type: v.type,
            description: v.description
        }))

        return new MethodScope(members)
    }
}
