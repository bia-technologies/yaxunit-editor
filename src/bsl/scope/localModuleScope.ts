import { BaseScope, Scope, SymbolType } from '@/scope'
import { editor } from "monaco-editor-core"
import { parse } from "../parser"
import { Method, Module } from "../Symbols"
import { createMethodScope } from './methodScope'

export class LocalModuleScope extends BaseScope {
    private readonly model: editor.ITextModel
    private module: Module = {
        vars: [], methods: []
    }

    constructor(model: editor.ITextModel) {
        super([])
        this.model = model
    }

    beforeGetMembers() {
        if (this.needUpdateMembers()) {
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
        return createMethodScope(method)
    }

    private needUpdateMembers(): boolean {
        return this.members.length === 0
    }

    updateMembers() {
        const source = this.model?.getValue()
        if (source !== undefined) {
            this.members.length = 0

            this.module = parse(source)
            for (let i = 0; i < this.module.methods.length; i++) {
                this.members.push({
                    kind: SymbolType.function,
                    name: this.module.methods[i].name
                })
            }
            for (let i = 0; i < this.module.vars.length; i++) {
                this.members.push({
                    kind: SymbolType.function,
                    name: this.module.vars[i].name
                })
            }
        }
    }

    getMethods(): Method[] {
        return this.module.methods;
    }
}
