import { editor, languages, IPosition, CancellationToken } from 'monaco-editor-core'
import { getEditedPositionOffset } from '@/monaco/utils'
import { ModuleModel } from '../../moduleModel'
import { getBslSignatureHelp } from '@/bsl/languageService'

const signatureHelpProvider: languages.SignatureHelpProvider = {
    signatureHelpTriggerCharacters: ['(', ','],
    signatureHelpRetriggerCharacters: [')'],

    async provideSignatureHelp(model: editor.ITextModel, position: IPosition, _: CancellationToken, context: languages.SignatureHelpContext): Promise<languages.SignatureHelpResult | undefined> {
        const positionOffset = getEditedPositionOffset(model, position)
        return getBslSignatureHelp(model as ModuleModel, positionOffset, context)
    },
}

export {
    signatureHelpProvider
}
