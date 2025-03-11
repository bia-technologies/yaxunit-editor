import { BslParser } from "./bslParser"
import { editor, Position } from "monaco-editor-core"
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
        const moduleScope = new TreeSitterModuleModel(editorModel);

        (editorModel as ModuleModel).getScope = moduleScope.getScope.bind(moduleScope);
        (editorModel as ModuleModel).getEditingExpression = moduleScope.getEditingExpression.bind(moduleScope);
        (editorModel as ModuleModel).getCurrentExpression = moduleScope.getCurrentExpression.bind(moduleScope);
        (editorModel as ModuleModel).getEditingMethod = moduleScope.getEditingMethod.bind(moduleScope);
        (editorModel as ModuleModel).getCodeModel = moduleScope.getCodeModel.bind(moduleScope);
        (editorModel as ModuleModel).updateCodeModel = moduleScope.updateCodeModel.bind(moduleScope);

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

    getEditingExpression(position: Position): Expression | undefined {
        const positionOffset = getEditedPositionOffset(this.editorModel, position)

        const node = this.parser.getCurrentEditingNode(positionOffset)
        if (node) {
            return resolveSymbol(node, positionOffset)
        }
    }

    getCurrentExpression(position: Position): Expression | undefined {
        const node = this.parser.getCurrentNode(getPositionOffset(this.editorModel, position))
        if (node) {
            return resolveSymbol(node)
        }
    }

    getEditingMethod(position: Position): Constructor | MethodCall | undefined {
        const positionOffset = getEditedPositionOffset(this.editorModel, position)
        const node = this.parser.getCurrentEditingNode(positionOffset)
        if (node) {
            return resolveMethodSymbol(node)
        }
    }
}