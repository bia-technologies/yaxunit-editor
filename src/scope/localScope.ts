import { BaseScope, Scope, Symbol, SymbolType, TypeDefinition } from "./Scope";
import { editor } from "monaco-editor";
import { parse } from "../bsl/parser";
import { Method, Module } from "../bsl/Symbols";


class LocalScope extends BaseScope implements TypeDefinition {
    model: editor.ITextModel | null
    module: Module = {
        vars: [], methods: []
    }

    id: string = 'local-module'

    constructor(model: editor.ITextModel | null) {
        super([])
        this.model = model
    }

    getMembers() {
        if (this.needUpdateMembers()) {
            this.updateMembers()
        }
        return this.members
    }

    getMethodAtLine(line: number): Method | undefined {
        return this.module.methods.find(m => m.startLine <= line && m.endLine >= line)
    }

    getMethodScope(line: number): Scope | undefined {
        const method = this.getMethodAtLine(line)
        if (method === undefined) {
            return undefined
        }

        const members: Symbol[] = []
        method.autoVars.forEach(v => members.push({
            name: v.name,
            kind: SymbolType.property,
        }))
        method.vars.forEach(v => members.push({
            name: v.name,
            kind: SymbolType.property,
        }))
        method.params.forEach(v => members.push({
            name: v.name,
            kind: SymbolType.property,
        }))

        return new BaseScope(members)
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
}

export default LocalScope