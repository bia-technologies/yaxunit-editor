import { BaseScope, Scope, MethodScope, Member, MemberType } from '@/common/scope'
import { Method } from "@/common/codeModel"
import { ModuleModel } from '@/bsl/moduleModel'
import { editor } from 'monaco-editor-core'

export class BslModuleScope extends BaseScope {
    protected readonly model: editor.ITextModel

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

    getMethodAtLine(line: number): Method | undefined {
        return this.getMethods().find(m => m.startLine <= line && m.endLine >= line)
    }

    getMethodScope(line: number): Scope | undefined {
        const method = this.getMethodAtLine(line)
        if (method === undefined) {
            return undefined
        }
        return this.createMethodScope(method)
    }

    updateMembers(): void {
        this.modelVersionId = this.model.getVersionId()
        this.didUpdateMembers()
    }

    getMethods(): Method[] {
        return this.model.getCodeModel()?.methods ?? []
    }

    protected createMethodScope(method: Method): MethodScope {
        const members: Member[] = []
        const methodDefinition = this.model.getCodeModel()?.getMethodDefinition(method)
        if (!methodDefinition) {
            return new MethodScope(members)
        }

        methodDefinition.vars?.forEach(v => members.push({
            name: v.name,
            kind: MemberType.variable,
            // type: v.type
        }))

        methodDefinition.params.forEach(v => members.push({
            name: v.name,
            kind: MemberType.variable,
        }))

        return new MethodScope(members)
    }

    protected didUpdateMembers(): void { }
}
