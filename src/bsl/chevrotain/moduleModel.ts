import { editor, IPosition } from "monaco-editor-core"
import { ExpressionProvider, ModuleModel } from "../moduleModel";
import { AutoDisposable } from "@/common/utils/autodisposable";
import { AccessProperty, AccessSequenceSymbol, BslCodeModel, ConstructorSymbol, isAccessProperty, MethodCallSymbol } from "@/bsl/codeModel";
import { ChevrotainSitterCodeModelFactory } from "./codeModelFactory";
import { BslModuleScope } from "@/bsl/scope/bslModuleScope";
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

    codeModel: BslCodeModel
    editorModel: ModuleModel
    scope: BslModuleScope

    constructor(model: editor.ITextModel) {
        super()
        this.editorModel = model as ModuleModel
        this.scope = new BslModuleScope(this.editorModel)

        this.codeModel = new BslCodeModel()
        this.updateCodeModel()
    }

    getScope() {
        return this.scope
    }

    getCodeModel() {
        return this.codeModel
    }

    updateCodeModel() {
        ChevrotainSitterCodeModelFactory.updateModel(this.codeModel, this.editorModel)
        this.codeModel.afterUpdate()
    }

    getCurrentExpression(position: IPosition | number): CodeSymbol | undefined {
        if (isPosition(position)) {
            position = this.editorModel.getOffsetAt(position)
        }
        const symbol = this.codeModel.descendantByOffset(position)

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
        const symbol = this.codeModel.descendantByOffset(position)

        if (symbol && isAccessProperty(symbol)) {
            const seq = currentAccessSequence(symbol)
            if (seq) {
                return seq
            }
        }
        return symbol
    }

    getEditingMethod(position: IPosition | number): MethodCallSymbol | ConstructorSymbol | AccessSequenceSymbol | undefined {
        if (isPosition(position)) {
            position = this.editorModel.getOffsetAt(position)
        }
        return this.codeModel.descendantByOffset(position)
    }
}

function currentAccessSequence(symbol: AccessProperty) {
    if (symbol.parent instanceof AccessSequenceSymbol) {
        const seq = new AccessSequenceSymbol(symbol.parent.position)
        seq.access = [...symbol.parent.access]
        for (let index = seq.access.length; index > 0; index--) {
            if (symbol === seq.access[index - 1]) {
                seq.access.length = index
                break
            }
        }
        return seq
    }
}

function isPosition(object: any): object is IPosition {
    return (object as IPosition).lineNumber !== undefined
}