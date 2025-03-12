import { BslParser } from "./bslParser"
import { editor, IPosition } from "monaco-editor-core"
import { ModuleModel } from "../moduleModel"
import { ExpressionProvider } from "../expressions/expressionProvider"
import { Constructor, Expression, MethodCall } from "../expressions/expressions"
import { getEditedPositionOffset, getPositionOffset } from "@/monaco/utils"
import { resolveMethodSymbol, resolveSymbol } from "./expressionsFactory"
import { TreeSitterCodeModelFactory } from "."
import { AutoDisposable } from "@/common/utils/autodisposable"
import { BslCodeModel } from "../codeModel"
import { BslModuleScope } from "../scope/bslModuleScope"

export class TreeSitterModuleModel extends AutoDisposable implements ExpressionProvider {

    static create(editorModel: editor.ITextModel): ModuleModel {
        const moduleModelImpl = new TreeSitterModuleModel(editorModel);

        (editorModel as ModuleModel).getScope = moduleModelImpl.getScope.bind(moduleModelImpl);
        (editorModel as ModuleModel).getEditingExpression = moduleModelImpl.getEditingExpression.bind(moduleModelImpl);
        (editorModel as ModuleModel).getCurrentExpression = moduleModelImpl.getCurrentExpression.bind(moduleModelImpl);
        (editorModel as ModuleModel).getEditingMethod = moduleModelImpl.getEditingMethod.bind(moduleModelImpl);
        (editorModel as ModuleModel).getCodeModel = moduleModelImpl.getCodeModel.bind(moduleModelImpl);
        (editorModel as ModuleModel).updateCodeModel = moduleModelImpl.updateCodeModel.bind(moduleModelImpl);

        return editorModel as ModuleModel
    }

    parser: BslParser
    codeModel: BslCodeModel | undefined
    editorModel: ModuleModel
    scope: BslModuleScope

    constructor(model: editor.ITextModel) {
        super()
        this.editorModel = model as ModuleModel
        this.scope = new BslModuleScope(this.editorModel)
        
        this._disposables.push(this.parser = new BslParser(model))
        
        this.codeModel = TreeSitterCodeModelFactory.buildModel(this.parser)
    }

    getScope() {
        return this.scope
    }

    getCodeModel() {
        return this.codeModel
    }

    updateCodeModel(){
        this.codeModel = TreeSitterCodeModelFactory.buildModel(this.parser)
    }

    getEditingExpression(position: IPosition): Expression | undefined {
        const positionOffset = getEditedPositionOffset(this.editorModel, position)

        const node = this.parser.getCurrentEditingNode(positionOffset)
        if (node) {
            return resolveSymbol(node, positionOffset)
        }
    }

    getCurrentExpression(position: IPosition): Expression | undefined {
        const node = this.parser.getCurrentNode(getPositionOffset(this.editorModel, position))
        if (node) {
            return resolveSymbol(node)
        }
    }

    getEditingMethod(position: IPosition): Constructor | MethodCall | undefined {
        const positionOffset = getEditedPositionOffset(this.editorModel, position)
        const node = this.parser.getCurrentEditingNode(positionOffset)
        if (node) {
            return resolveMethodSymbol(node)
        }
    }
}