import { editor } from 'monaco-editor-core'
import { AdapterBackedModuleModel } from '@/bsl/adapterModuleModel'
import { ModuleModel } from '@/bsl/moduleModel'
import { createChevrotainParserAdapter } from './parserAdapter'

export class ChevrotainModuleModel {
    static create(editorModel: editor.ITextModel): ModuleModel {
        return AdapterBackedModuleModel.create(editorModel, createChevrotainParserAdapter())
    }
}
