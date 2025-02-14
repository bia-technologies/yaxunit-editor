import { BaseScope, Scope, SymbolType } from '@/scope'
import { editor, IDisposable } from "monaco-editor-core"
import { Method, Module } from "@/bsl/Symbols"
import { BslParser } from '@/tree-sitter/bslAst'
import { createMethodScope } from './methodScope'

export class LocalModuleScope extends BaseScope implements IDisposable {
    private readonly model: editor.ITextModel
    parser: BslParser

    modelVersionId: number = 0
    disposable: IDisposable[] = []
    private module: Module = {
        vars: [], methods: []
    }

    constructor(model: editor.ITextModel) {
        super([])
        this.model = model
        this.disposable.push(this.parser = new BslParser(model))
        this.disposable.push(this.model.onDidChangeContent(e => this.parser.onEditorContentChange(e)))
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
        return createMethodScope(method, this.parser)
    }

    updateMembers() {
        this.modelVersionId = this.model.getVersionId()
        this.module.methods = this.parser.methods()
        this.module.vars = this.parser.vars()
        this.members.length = 0

        for (let i = 0; i < this.module.methods.length; i++) {
            this.members.push({
                kind: SymbolType.function,
                name: this.module.methods[i].name
            })
        }
        for (let i = 0; i < this.module.vars.length; i++) {
            this.members.push({
                kind: SymbolType.property,
                name: this.module.vars[i].name
            })
        }
    }

    getMethods(): Method[] {
        return this.module.methods;
    }

    dispose(): void {
        this.disposable.forEach(d => d.dispose())
    }
}
