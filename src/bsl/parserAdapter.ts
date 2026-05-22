import { editor, IDisposable } from 'monaco-editor-core'
import { BslCodeModel } from './codeModel'
import { ModuleModel } from './moduleModel'

export interface ParserDiagnostic {
    message: string
    startOffset?: number
    endOffset?: number
    startLine?: number
    startColumn?: number
    endLine?: number
    endColumn?: number
    source?: string
}

export interface ParserAdapter extends IDisposable {
    readonly id: string
    buildModel(model: ModuleModel | string): BslCodeModel
    rebuildModel(codeModel: BslCodeModel, model: ModuleModel | string): void
    updateModel(codeModel: BslCodeModel, model: ModuleModel, changes: editor.IModelContentChange[]): boolean
    getDiagnostics(): ParserDiagnostic[]
}

export type ParserAdapterFactory = () => ParserAdapter
