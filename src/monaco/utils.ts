import { IPosition, IRange, editor } from "monaco-editor-core";

export function isModel(value: any): value is editor.ITextModel {
    return (<editor.ITextModel>value).getValue !== undefined;
}

export const EMPTY_RANGE: IRange = { startColumn: 0, endColumn: 0, endLineNumber: 0, startLineNumber: 0 }

export function getPositionOffset(model: editor.ITextModel, position: IPosition) {
    return model.getOffsetAt(position)
}

export function getEditedPositionOffset(model: editor.ITextModel, position: IPosition) {
    const lastColumn = model.getLineLastNonWhitespaceColumn(position.lineNumber)
    if (position.column > lastColumn) {
        position = { lineNumber: position.lineNumber, column: lastColumn }
    }
    return model.getOffsetAt(position)
}