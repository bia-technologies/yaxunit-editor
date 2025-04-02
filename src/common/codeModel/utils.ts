import { editor, IRange } from "monaco-editor";
import { CodeSymbol, CompositeSymbol } from "./base";

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