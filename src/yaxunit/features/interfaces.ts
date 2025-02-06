import { TestsModel } from "../test-model";
import { editor } from 'monaco-editor-core'

export interface TestModelRender{
    update(model: TestsModel): void
}

export interface ModelChangeHandler {
    onDidChangeContent(e: editor.IModelContentChangedEvent): void
}