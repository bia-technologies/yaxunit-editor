import { editor, IRange } from "monaco-editor-core";
import { BaseSymbol, CodeSymbol, CompositeSymbol } from "./base";

export function descendantByOffset(offset: number, compositeSymbol: CompositeSymbol): CodeSymbol | undefined {
    const children = compositeSymbol.getChildrenSymbols()
    const symbol = children.find(s => hitOffset(s, offset))
    if (symbol && isCompositeSymbol(symbol)) {
        const descendant = descendantByOffset(offset, symbol)
        if (descendant) {
            return descendant
        }
    }
    return symbol
}

export function hitOffset(symbol: BaseSymbol | undefined, offset: number) {
    if (!symbol || !symbol.position) {
        return false
    }
    return symbol.position.startOffset <= offset && symbol.position.endOffset >= offset
}

export function isCompositeSymbol(symbol: any): symbol is CompositeSymbol {
    return (symbol as CompositeSymbol).getChildrenSymbols !== undefined
}

export function symbolRange(symbol: CodeSymbol, model: editor.ITextModel): IRange {
    const start = model.getPositionAt(symbol.startOffset)
    const end = model.getPositionAt(symbol.endOffset)
    return {
        startLineNumber: start.lineNumber,
        startColumn: start.column,
        endLineNumber: end.lineNumber,
        endColumn: end.column
    }
}