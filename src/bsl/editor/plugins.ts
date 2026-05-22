import { IDisposable } from 'monaco-editor-core'
import { BslEditorContext } from './context'
import type { BslEditor } from './editor'

export interface BslEditorPlugin {
    readonly id: string
    contribute(context: BslEditorContext): void
    onEditorCreated?(editor: BslEditor): void
}

export interface BslEditorPluginRegistration extends IDisposable {
    readonly id: string
}
