import { editor, languages, IPosition } from 'monaco-editor-core'
import { ModuleModel } from '@/bsl/moduleModel'
import { getBslCompletions } from '@/bsl/languageService'

const completionItemProvider: languages.CompletionItemProvider = {
    triggerCharacters: ['.'],

    async provideCompletionItems(model: editor.ITextModel, position: IPosition): Promise<languages.CompletionList | undefined> {
        return getBslCompletions(model as ModuleModel, position)
    },
}

export {
    completionItemProvider
}
