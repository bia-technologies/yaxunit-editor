import { LocalModuleScope } from "@/common/scope/localModuleScope";
import { BslParser } from "@/bsl/tree-sitter";
import { editor } from "monaco-editor-core";
import { Member, MemberType, MethodScope } from "@/common/scope";
import { Method, Variable } from "@/common/codeModel";
import { BslCodeModel } from "../codeModel/model/bslCodeModel";
import serviceRegistry from "../serviceRegistry";

export class BslModuleScope extends LocalModuleScope {
    parser: BslParser
    codeModel: BslCodeModel

    constructor(model: editor.ITextModel) {
        super(model)
        this._disposables.push(this.parser = new BslParser(model))
        this.codeModel = serviceRegistry.codeModelProvider.buildModel(this.parser)
    }
    getMethods(): Method[] {
        return this.codeModel.methods;
    }

    didUpdateMembers() {
        this.codeModel = serviceRegistry.codeModelProvider.buildModel(this.parser)
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
