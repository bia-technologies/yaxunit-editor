import { editor, IPosition } from "monaco-editor-core"
import { ModuleModel } from "../moduleModel";
import { ExpressionProvider } from "../expressions/expressionProvider";
import { Constructor, Expression, FieldAccess, MethodCall } from "../expressions/expressions";
import tokensProvider, { TokensSequence } from "../vanilla-tokens/tokensProvider";
import { AutoDisposable } from "@/common/utils/autodisposable";
import { BslCodeModel } from "../codeModel";
import { ChevrotainSitterCodeModelFactory } from "./codeModelFactory";
import { BslModuleScope } from "../scope/bslModuleScope";
import { CodeSymbol } from "@/common/codeModel";

export class ChevrotainModuleModel extends AutoDisposable implements ExpressionProvider {

    static create(editorModel: editor.ITextModel): ModuleModel {
        const moduleModelImpl = new ChevrotainModuleModel(editorModel);

        (editorModel as ModuleModel).getScope = moduleModelImpl.getScope.bind(moduleModelImpl);
        (editorModel as ModuleModel).getEditingExpression = moduleModelImpl.getEditingExpression.bind(moduleModelImpl);
        (editorModel as ModuleModel).getCurrentExpression = moduleModelImpl.getCurrentExpression.bind(moduleModelImpl);
        (editorModel as ModuleModel).getEditingMethod = moduleModelImpl.getEditingMethod.bind(moduleModelImpl);
        (editorModel as ModuleModel).getCodeModel = moduleModelImpl.getCodeModel.bind(moduleModelImpl);
        (editorModel as ModuleModel).updateCodeModel = moduleModelImpl.updateCodeModel.bind(moduleModelImpl);

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
        this.codeModel?.afterUpdate()
    }

    getScope() {
        return this.scope
    }

    getCodeModel() {
        return this.codeModel
    }

    updateCodeModel() {
        this.codeModel = ChevrotainSitterCodeModelFactory.buildModel(this.editorModel)
        this.codeModel?.afterUpdate()
    }

    getCurrentExpression(position: IPosition | number): CodeSymbol | undefined {
        if (isPosition(position)) {
            position = this.editorModel.getOffsetAt(position)
        }
        return this.codeModel?.descendantByOffset(position)
    }

    getEditingExpression(position: IPosition): Expression | undefined {
        const tokensSeq = tokensProvider.resolve(this.editorModel, position)
        return createExpression(tokensSeq)
    }

    getEditingMethod(position: IPosition): Constructor | MethodCall | undefined {
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

function isPosition(object: any): object is IPosition {
    return (object as IPosition).lineNumber !== undefined
}