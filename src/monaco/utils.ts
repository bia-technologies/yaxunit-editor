import { IPosition, editor } from "monaco-editor-core";

export function isModel(value: any): value is editor.ITextModel {
    return (<editor.ITextModel>value).getValue !== undefined;
}

export function getTreeSitterPosition(model: editor.ITextModel, position: IPosition) {
    return model.getOffsetAt(position)
}