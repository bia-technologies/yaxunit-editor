import { IPosition, editor } from "monaco-editor-core";

export function isModel(value: any): value is editor.ITextModel {
    return (<editor.ITextModel>value).getValue !== undefined;
}

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