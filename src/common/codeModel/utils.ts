import { editor, IRange } from "monaco-editor-core";
import { BaseSymbol, CodeSymbol, CompositeSymbol } from "./base";

export function descendantByOffset(offset: number, ...symbols: (BaseSymbol | undefined)[]): CodeSymbol | undefined {
    const symbol = symbols.find(s => s?.hitOffset(offset))
    if (symbol && isCompositeSymbol(symbol)) {
        const descendant = symbol.descendantByOffset(offset)
        if (descendant) {
            return descendant
        }
    }
    return symbol
}

export function isCompositeSymbol(symbol: CodeSymbol): symbol is CompositeSymbol {
    return (symbol as CompositeSymbol).descendantByOffset !== undefined
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