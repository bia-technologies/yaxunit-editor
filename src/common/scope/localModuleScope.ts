import { BaseScope, Scope, MethodScope } from '@/common/scope'
import { editor } from "monaco-editor-core"
import { Method, Module } from "@/common/codeModel"

export abstract class LocalModuleScope extends BaseScope {
    protected readonly model: editor.ITextModel
    private modelVersionId: number = 0

    protected module: Module = {
        vars: [], methods: []
    }

    constructor(model: editor.ITextModel) {
        super([])
        this.model = model
    }

    beforeGetMembers() {
        if (this.model.getVersionId() != this.modelVersionId) {
            this.updateMembers()
        }
    }

    getMethodAtLine(line: number): Method | undefined {
        return this.module.methods.find(m => m.startLine <= line && m.endLine >= line)
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
        return this.module.methods;
    }

    protected abstract createMethodScope(method: Method): MethodScope;
    protected abstract didUpdateMembers(): void;
}
