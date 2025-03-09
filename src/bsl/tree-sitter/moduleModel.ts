import { LocalModuleScope, Member, MemberType, MethodScope } from "@/common/scope"
import { BslParser } from "./bslParser"
import { editor, Position } from "monaco-editor-core"
import { Method, Variable } from "@/common/codeModel"
import { ModuleModel } from "../moduleModel"
import { ExpressionProvider } from "../expressions/expressionProvider"
import { Constructor, Expression, MethodCall } from "../expressions/expressions"
import { resolveMethodSymbol, resolveSymbol } from "./symbols"
import { getEditedPositionOffset, getPositionOffset } from "@/monaco/utils"

export class TreeSitterModuleModel extends LocalModuleScope implements ExpressionProvider {

    static create(editorModel: editor.ITextModel): ModuleModel {
        const moduleScope = new TreeSitterModuleModel(editorModel);

        (editorModel as ModuleModel).getScope = () => moduleScope;
        (editorModel as ModuleModel).getEditingExpression = moduleScope.getEditingExpression.bind(moduleScope);
        (editorModel as ModuleModel).getCurrentExpression = moduleScope.getCurrentExpression.bind(moduleScope);
        (editorModel as ModuleModel).getEditingMethod = moduleScope.getEditingMethod.bind(moduleScope);

        return editorModel as ModuleModel
    }

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

    getEditingExpression(position: Position): Expression | undefined {
        const positionOffset = getEditedPositionOffset(this.model, position)

        const node = this.parser.getCurrentEditingNode(positionOffset)
        if (node) {
            return resolveSymbol(node, positionOffset)
        }
    }

    getCurrentExpression(position: Position): Expression | undefined {
        const node = this.parser.getCurrentNode(getPositionOffset(this.model, position))
        if (node) {
            return resolveSymbol(node)
        }
    }

    getEditingMethod(position: Position): Constructor | MethodCall | undefined {
        const positionOffset = getEditedPositionOffset(this.model, position)
        const node = this.parser.getCurrentEditingNode(positionOffset)
        if (node) {
            return resolveMethodSymbol(node)
        }
    }
}