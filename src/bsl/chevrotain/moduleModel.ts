import { editor, Position } from "monaco-editor-core"
import { ModuleModel } from "../moduleModel";
import { ExpressionProvider } from "../expressions/expressionProvider";
import { Constructor, Expression, FieldAccess, MethodCall } from "../expressions/expressions";
import tokensProvider, { TokensSequence } from "../vanilla-tokens/tokensProvider";
import { AutoDisposable } from "@/common/utils/autodisposable";
import { BslCodeModel } from "../codeModel";
import { ChevrotainSitterCodeModelFactory } from "./codeModelFactory";
import { BslModuleScope } from "../scope/bslModuleScope";

export class ChevrotainModuleModel extends AutoDisposable implements ExpressionProvider {

    static create(editorModel: editor.ITextModel): ModuleModel {
        const moduleScope = new ChevrotainModuleModel(editorModel);

        (editorModel as ModuleModel).getScope = moduleScope.getScope.bind(moduleScope);
        (editorModel as ModuleModel).getEditingExpression = moduleScope.getEditingExpression.bind(moduleScope);
        (editorModel as ModuleModel).getCurrentExpression = moduleScope.getCurrentExpression.bind(moduleScope);
        (editorModel as ModuleModel).getEditingMethod = moduleScope.getEditingMethod.bind(moduleScope);
        (editorModel as ModuleModel).getCodeModel = () => moduleScope.codeModel;

        return editorModel as ModuleModel
    }

    codeModel: BslCodeModel | undefined
    editorModel: ModuleModel
    scope: BslModuleScope

    constructor(model: editor.ITextModel) {
        super()
        this.editorModel = model as ModuleModel
        this.scope = new BslModuleScope(this.editorModel)

        this.codeModel = ChevrotainSitterCodeModelFactory.buildModel(this.editorModel)
    }

    getScope() {
        return this.scope
    }

    getCurrentExpression(position: Position): Expression | undefined {
        const tokensSeq = tokensProvider.currentTokens(this.editorModel, position)
        return createExpression(tokensSeq)
    }

    getEditingExpression(position: Position): Expression | undefined {
        const tokensSeq = tokensProvider.resolve(this.editorModel, position)
        return createExpression(tokensSeq)
    }

    getEditingMethod(position: Position): Constructor | MethodCall | undefined {
        const tokensSeq = tokensProvider.currentMethod(this.editorModel, position)
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