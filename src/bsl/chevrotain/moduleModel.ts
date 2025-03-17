import { editor, IPosition } from "monaco-editor-core"
import { ExpressionProvider, ModuleModel } from "../moduleModel";
import { AutoDisposable } from "@/common/utils/autodisposable";
import {
    BaseExpressionSymbol,
    BslCodeModel,
    ConstructorSymbol,
    isAccessProperty,
    MethodCallSymbol
} from "@/bsl/codeModel";
import { ChevrotainSitterCodeModelFactory } from "./codeModelFactory";
import { BslModuleScope } from "@/bsl/scope/bslModuleScope";
import { BaseSymbol, CodeSymbol } from "@/common/codeModel";
import { currentAccessSequence } from "../codeModel/utils";
import { descendantByOffset } from "./utils";

export class ChevrotainModuleModel extends AutoDisposable implements ExpressionProvider {

    static create(editorModel: editor.ITextModel): ModuleModel {
        const moduleModelImpl = new ChevrotainModuleModel(editorModel);

        (editorModel as ModuleModel).getScope = moduleModelImpl.getScope.bind(moduleModelImpl);
        (editorModel as ModuleModel).getEditingExpression = moduleModelImpl.getEditingExpression.bind(moduleModelImpl);
        (editorModel as ModuleModel).getCurrentExpression = moduleModelImpl.getCurrentExpression.bind(moduleModelImpl);
        (editorModel as ModuleModel).getEditingMethod = moduleModelImpl.getEditingMethod.bind(moduleModelImpl);
        (editorModel as ModuleModel).getCodeModel = moduleModelImpl.getCodeModel.bind(moduleModelImpl);
        (editorModel as ModuleModel).updateCodeModel = moduleModelImpl.updateCodeModel.bind(moduleModelImpl);
        const baseDispose = editorModel.dispose
        editorModel.dispose = () => {
            baseDispose()
            moduleModelImpl.dispose()
        }
        return editorModel as ModuleModel
    }

    codeModel: BslCodeModel
    editorModel: ModuleModel
    scope: BslModuleScope
    codeModelFactory = new ChevrotainSitterCodeModelFactory()

    constructor(model: editor.ITextModel) {
        super()

        this._disposables.push(this.codeModelFactory)

        this.editorModel = model as ModuleModel
        this.scope = new BslModuleScope(this.editorModel)

        this.codeModel = this.codeModelFactory.buildModel(this.editorModel)
        model.onDidChangeContent(e => {
            if (!this.codeModelFactory.updateModel(this.codeModel, e.changes)) {
                this.codeModelFactory.reBuildModel(this.codeModel, this.editorModel)
            }
        })
    }

    getScope() {
        return this.scope
    }

    getCodeModel() {
        return this.codeModel
    }

    updateCodeModel() {
        // this.codeModelFactory.reBuildModel(this.codeModel, this.editorModel)
        // this.codeModel.afterUpdate()
    }

    getCurrentExpression(position: IPosition | number): CodeSymbol | undefined {
        if (isPosition(position)) {
            position = this.editorModel.getOffsetAt(position)
        }
        const symbol = descendantByOffset(position, this.codeModel)

        if (symbol && isAccessProperty(symbol)) {
            const seq = currentAccessSequence(symbol)
            if (seq) {
                return seq
            }
        }
        return symbol
    }

    getEditingExpression(position: IPosition | number): CodeSymbol | undefined {
        if (isPosition(position)) {
            position = this.editorModel.getOffsetAt(position)
        }
        const current = this.getCurrentExpression(position)
        if (current instanceof BaseExpressionSymbol) {
            return current
        } else if (position > 0) {
            return this.getCurrentExpression(position - 1)
        }
    }

    getEditingMethod(position: IPosition | number): MethodCallSymbol | ConstructorSymbol | undefined {
        if (isPosition(position)) {
            position = this.editorModel.getOffsetAt(position)
        }
        let symbol: BaseSymbol | undefined = descendantByOffset(position, this.codeModel) as BaseSymbol

        while (symbol) {
            if (symbol instanceof MethodCallSymbol || symbol instanceof ConstructorSymbol) {
                return symbol
            } else {
                symbol = symbol.parent
            }
        }
        return symbol
    }
}

function isPosition(object: any): object is IPosition {
    return (object as IPosition).lineNumber !== undefined
}