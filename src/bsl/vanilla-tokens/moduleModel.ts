import { LocalModuleScope, Member, MemberType, MethodScope } from "@/common/scope"
import { editor, Position } from "monaco-editor-core"
import { Method } from "@/common/codeModel"
import { MethodDefinition, parse } from "./definitionsParser"
import { ModuleModel } from "../moduleModel";
import { ExpressionProvider } from "../expressions/expressionProvider";
import { Constructor, Expression, FieldAccess, MethodCall } from "../expressions/expressions";
import tokensProvider, { TokensSequence } from "./tokensProvider";

export class VanillaModuleModel extends LocalModuleScope implements ExpressionProvider {

    static create(editorModel: editor.ITextModel): ModuleModel {
        const moduleScope = new VanillaModuleModel(editorModel);

        (editorModel as ModuleModel).getScope = () => moduleScope;
        (editorModel as ModuleModel).getEditingExpression = moduleScope.getEditingExpression.bind(moduleScope);
        (editorModel as ModuleModel).getCurrentExpression = moduleScope.getCurrentExpression.bind(moduleScope);
        (editorModel as ModuleModel).getEditingMethod = moduleScope.getEditingMethod.bind(moduleScope);

        return editorModel as ModuleModel
    }

    constructor(model: editor.ITextModel) {
        super(model)
    }

    didUpdateMembers() {
        this.module = parse(this.model.getValue())
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
        const members: Member[] = [];

        (method as MethodDefinition).vars.forEach(v => members.push({
            name: v.name,
            kind: MemberType.variable,
            type: v.type
        }));

        (method as MethodDefinition).autoVars.forEach(v => members.push({
            name: v.name,
            kind: MemberType.variable,
            type: v.type
        }));

        method.params.forEach(v => members.push({
            name: v.name,
            kind: MemberType.variable,
        }));

        return new MethodScope(members)
    }

    getCurrentExpression(position: Position): Expression | undefined {
        const tokensSeq = tokensProvider.currentTokens(this.model, position)
        return createExpression(tokensSeq)
    }

    getEditingExpression(position: Position): Expression | undefined {
        const tokensSeq = tokensProvider.resolve(this.model, position)
        return createExpression(tokensSeq)
    }

    getEditingMethod(position: Position): Constructor | MethodCall | undefined {
        const tokensSeq = tokensProvider.currentMethod(this.model, position)
        return createExpression(tokensSeq) as Constructor | MethodCall
    }
}

function createExpression(tokensSeq: TokensSequence | undefined): Expression | undefined {
    if (!tokensSeq) {
        return undefined
    }
    const tokens = tokensSeq.tokens.reverse()
    if (tokensSeq.left.toLowerCase().endsWith('новый')) {
        return new Constructor(tokens.pop() ?? '', [])
    } else if (tokensSeq.right.trimStart().startsWith('(')) {
        return new MethodCall(tokens.pop() ?? '', tokens, [])
    } else {
        return new FieldAccess(tokens.pop() ?? '', tokens)
    }

}