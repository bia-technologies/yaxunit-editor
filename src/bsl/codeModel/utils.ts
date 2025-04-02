import { BaseSymbol } from '@/common/codeModel'
import { AccessProperty, AccessSequenceSymbol, isMethodDefinition, MethodCallSymbol } from './model'
import { editor, IRange } from 'monaco-editor'
import { getParentMethodDefinition } from '../chevrotain/utils'

export * from '@/common/codeModel/utils'

export function currentAccessSequence(symbol: AccessProperty | MethodCallSymbol) {
    if (symbol.parent instanceof AccessSequenceSymbol) {
        const seq = new AccessSequenceSymbol(symbol.parent.position)
        seq.parent = symbol.parent.parent

        seq.access = [...symbol.parent.access]
        for (let index = seq.access.length; index > 0; index--) {
            if (symbol === seq.access[index - 1]) {
                seq.access.length = index
                break
            }
        }
        seq.type = seq.last.type
        return seq
    }
}

export function symbolRange(symbol: BaseSymbol, model: editor.ITextModel): IRange {
    const method = isMethodDefinition(symbol) ? undefined : getParentMethodDefinition(symbol)
    const offset = method?.startOffset ?? 0
    const start = model.getPositionAt(offset + symbol.startOffset)
    const end = model.getPositionAt(offset + symbol.endOffset)

    return {
        startLineNumber: start.lineNumber,
        startColumn: start.column,
        endLineNumber: end.lineNumber,
        endColumn: end.column
    }
}