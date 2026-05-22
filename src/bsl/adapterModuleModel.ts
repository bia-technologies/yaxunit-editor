import { editor, IPosition } from 'monaco-editor-core'
import {
    AccessSequenceSymbol,
    BaseExpressionSymbol,
    BslCodeModel,
    ConstructorSymbol,
    EmptySymbol,
    isAccessProperty,
    MethodCallSymbol
} from '@/bsl/codeModel'
import { currentAccessSequence, descendantByOffset } from './codeModel/utils'
import { BslModuleScope } from './scope/bslModuleScope'
import { BaseSymbol, CodeSymbol } from '@/common/codeModel'
import { AutoDisposable } from '@/common/utils/autodisposable'
import { ExpressionProvider, ModuleModel } from './moduleModel'
import { ParserAdapter } from './parserAdapter'

export class AdapterBackedModuleModel extends AutoDisposable implements ExpressionProvider {
    readonly adapter: ParserAdapter
    readonly codeModel: BslCodeModel
    readonly editorModel: ModuleModel
    readonly scope: BslModuleScope

    static create(editorModel: editor.ITextModel, adapter: ParserAdapter): ModuleModel {
        const moduleModelImpl = new AdapterBackedModuleModel(editorModel, adapter)

        ;(editorModel as ModuleModel).getScope = moduleModelImpl.getScope.bind(moduleModelImpl)
        ;(editorModel as ModuleModel).getCurrentSymbol = moduleModelImpl.getCurrentSymbol.bind(moduleModelImpl)
        ;(editorModel as ModuleModel).getEditingExpression = moduleModelImpl.getEditingExpression.bind(moduleModelImpl)
        ;(editorModel as ModuleModel).getCurrentExpression = moduleModelImpl.getCurrentExpression.bind(moduleModelImpl)
        ;(editorModel as ModuleModel).getEditingMethod = moduleModelImpl.getEditingMethod.bind(moduleModelImpl)
        ;(editorModel as ModuleModel).getCodeModel = moduleModelImpl.getCodeModel.bind(moduleModelImpl)

        const baseDispose = editorModel.dispose.bind(editorModel)
        editorModel.dispose = () => {
            baseDispose()
            moduleModelImpl.dispose()
        }

        return editorModel as ModuleModel
    }

    constructor(model: editor.ITextModel, adapter: ParserAdapter) {
        super()

        this.adapter = adapter
        this._disposables.push(adapter)

        this.editorModel = model as ModuleModel
        this.scope = new BslModuleScope(this.editorModel)
        this.codeModel = adapter.buildModel(this.editorModel)

        this._disposables.push(model.onDidChangeContent(e => {
            if (!adapter.updateModel(this.codeModel, this.editorModel, e.changes)) {
                adapter.rebuildModel(this.codeModel, this.editorModel)
            }
        }))
    }

    getScope() {
        return this.scope
    }

    getCodeModel() {
        return this.codeModel
    }

    getCurrentSymbol(position: IPosition | number): CodeSymbol | undefined {
        if (isPosition(position)) {
            position = this.editorModel.getOffsetAt(position)
        }
        return this.currentSymbol(position)
    }

    getCurrentExpression(position: IPosition | number): CodeSymbol | undefined {
        if (isPosition(position)) {
            position = this.editorModel.getOffsetAt(position)
        }

        return this.currentExpression(position)
    }

    getEditingExpression(position: IPosition | number): CodeSymbol | undefined {
        if (isPosition(position)) {
            position = this.editorModel.getOffsetAt(position)
        }

        const current = this.currentExpression(position)
        const left = position > 0 ? this.currentExpression(position - 1) : undefined
        const currentValid = current instanceof BaseExpressionSymbol || current instanceof EmptySymbol

        if (!currentValid || (left && current && isParent(left, current))) {
            if (left instanceof AccessSequenceSymbol) {
                left.unclosed = true
            }
            return left
        }

        return current
    }

    getEditingMethod(position: IPosition | number): MethodCallSymbol | ConstructorSymbol | undefined {
        if (isPosition(position)) {
            position = this.editorModel.getOffsetAt(position)
        }
        let symbol: BaseSymbol | undefined = this.currentSymbol(position)

        while (symbol) {
            if (symbol instanceof MethodCallSymbol || symbol instanceof ConstructorSymbol) {
                return symbol
            }
            symbol = symbol.parent
        }
        return undefined
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
    let currentSymbol: BaseSymbol | undefined = symbol
    while (currentSymbol) {
        if (currentSymbol.parent === intendedParent) {
            return true
        }
        currentSymbol = currentSymbol.parent
    }
    return false
}

function isPosition(object: unknown): object is IPosition {
    return (object as IPosition).lineNumber !== undefined
}
