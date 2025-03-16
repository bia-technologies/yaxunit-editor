import { BaseScope, Scope, MethodScope, Member, MemberType } from '@/common/scope'
import { BaseSymbol, Method } from "@/common/codeModel"
import { ModuleModel } from '@/bsl/moduleModel'
import { IPosition } from 'monaco-editor-core'
import { FunctionDefinitionSymbol, ProcedureDefinitionSymbol } from '../codeModel'
import { VariablesCalculator } from '../codeModel/calculators'

export class BslModuleScope extends BaseScope {
    protected readonly model: ModuleModel

    private modelVersionId: number = 0

    constructor(model: ModuleModel) {
        super([])
        this.model = model
    }

    beforeGetMembers() {
        if (this.model.getVersionId() != this.modelVersionId) {
            this.updateMembers()
        }
    }

    collectScopeAtPosition(position: IPosition): Scope | undefined {
        let symbol = this.model.getCurrentExpression(position) as BaseSymbol
        let method: ProcedureDefinitionSymbol | FunctionDefinitionSymbol | undefined
        while (symbol && symbol.parent) {
            symbol = symbol.parent
            if (symbol instanceof ProcedureDefinitionSymbol || symbol instanceof FunctionDefinitionSymbol) {
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
        this.modelVersionId = this.model.getVersionId()
        // this.didUpdateMembers()
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

    protected didUpdateMembers(): void {
        this.model.updateCodeModel()
    }
}
