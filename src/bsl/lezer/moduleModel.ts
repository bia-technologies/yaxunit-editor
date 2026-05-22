import { editor } from 'monaco-editor-core'
import { AdapterBackedModuleModel } from '@/bsl/adapterModuleModel'
import { ModuleModel } from '@/bsl/moduleModel'
import { createLezerParserAdapter } from './parserAdapter'

export class LezerModuleModel {
    static create(editorModel: editor.ITextModel): ModuleModel {
        return AdapterBackedModuleModel.create(editorModel, createLezerParserAdapter())
    }
}
