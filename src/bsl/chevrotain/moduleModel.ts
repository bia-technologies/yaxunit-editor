import { editor, IPosition } from 'monaco-editor-core'
import { ExpressionProvider, ModuleModel } from "../moduleModel";
import { AutoDisposable } from "@/common/utils/autodisposable";
import {
    AccessSequenceSymbol,
    BaseExpressionSymbol,
    BslCodeModel,
    ConstructorSymbol,
    EmptySymbol,
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
        (editorModel as ModuleModel).getCurrentSymbol = moduleModelImpl.getCurrentSymbol.bind(moduleModelImpl);
        (editorModel as ModuleModel).getEditingExpression = moduleModelImpl.getEditingExpression.bind(moduleModelImpl);
        (editorModel as ModuleModel).getCurrentExpression = moduleModelImpl.getCurrentExpression.bind(moduleModelImpl);
        (editorModel as ModuleModel).getEditingMethod = moduleModelImpl.getEditingMethod.bind(moduleModelImpl);
        (editorModel as ModuleModel).getCodeModel = moduleModelImpl.getCodeModel.bind(moduleModelImpl);
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

    getCurrentSymbol(position: IPosition | number): CodeSymbol | undefined {
        if (isPosition(position)) {
            position = this.editorModel.getOffsetAt(position);
        }
        return this.currentSymbol(position);
    }

    getCurrentExpression(position: IPosition | number): CodeSymbol | undefined {
        if (isPosition(position)) {
            position = this.editorModel.getOffsetAt(position);
        }

        return this.currentExpression(position);
    }

    getEditingExpression(position: IPosition | number): CodeSymbol | undefined {
        if (isPosition(position)) {
            position = this.editorModel.getOffsetAt(position);
        }
        
        const current = this.currentExpression(position);
        const left = position > 0 ? this.currentExpression(position - 1) : undefined;

        // Проверяем, является ли текущий символ допустимым
        const currentValid = current instanceof BaseExpressionSymbol || current instanceof EmptySymbol;
        
        // Если текущий символ недопустим или левый символ является родителем текущего
        if (!currentValid || (left && isParent(left, current))) {
            if (left instanceof AccessSequenceSymbol) {
                left.unclosed = true; // Устанавливаем флаг для незакрытой последовательности
            }
            return left; // Возвращаем левый символ
        }

        return current; // Возвращаем текущий символ
    }

    getEditingMethod(position: IPosition | number): MethodCallSymbol | ConstructorSymbol | undefined {
        if (isPosition(position)) {
            position = this.editorModel.getOffsetAt(position);
        }
        let symbol: BaseSymbol | undefined = this.currentSymbol(position)

        while (symbol) {
            if (symbol instanceof MethodCallSymbol || symbol instanceof ConstructorSymbol) {
                return symbol;
            } else {
                symbol = symbol.parent;
            }
        }
        return symbol;
    }

    private currentSymbol(position: number) {
        return descendantByOffset(position, this.codeModel) as BaseSymbol
    }

    private currentExpression(position: number) {
        const symbol = this.currentSymbol(position)

        if (symbol && isAccessProperty(symbol)) {
            const seq = currentAccessSequence(symbol)
            if (seq) {
                return seq
            }
        }
        return symbol
    }
}

function isParent(symbol: BaseSymbol, intendedParent: BaseSymbol) {
    if (!intendedParent) {
        return false
    }

    let currentSymbol: BaseSymbol | undefined = symbol
    while (currentSymbol) {
        if (currentSymbol.parent === intendedParent) {
            return true
        }
        currentSymbol = currentSymbol.parent
    }
    return false
}


function isPosition(object: any): object is IPosition {
    return (object as IPosition).lineNumber !== undefined
}

