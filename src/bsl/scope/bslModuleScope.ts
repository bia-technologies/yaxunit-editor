import { LocalModuleScope } from "@/common/scope/localModuleScope";
import { BslParser } from "@/bsl/tree-sitter";
import { editor } from "monaco-editor-core";
import { Member, MemberType, MethodScope } from "@/common/scope";
import { Method, Variable } from "@/common/codeModel";

export class BslModuleScope extends LocalModuleScope {
    parser: BslParser

    constructor(model: editor.ITextModel) {
        super(model)
        this._disposables.push(this.parser = new BslParser(model))
    }

    didUpdateMembers() {
        this.module.methods = this.parser.methods()
        this.module.vars = this.parser.vars()
        this.members.length = 0

        for (let i = 0; i < this.module.methods.length; i++) {
            this.members.push({
                kind: MemberType.function,
                name: this.module.methods[i].name
            })
        }
        for (let i = 0; i < this.module.vars.length; i++) {
            this.members.push({
                kind: MemberType.property,
                name: this.module.vars[i].name
            })
        }
    }

    protected createMethodScope(method: Method): MethodScope {
        const members: Member[] = []

        if (!method.vars) {
            method.vars = []
            const iter = this.parser.getMethodVars(method)
            let variable: IteratorResult<Variable>
            while (!(variable = iter.next()).done) {
                method.vars.push(variable.value)
            }
        }

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