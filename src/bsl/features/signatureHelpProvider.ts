import { editor, languages, Position } from 'monaco-editor';
import { scopeProvider } from '../scopeProvider';

const signatureHelpProvider: languages.SignatureHelpProvider = {
    signatureHelpRetriggerCharacters: ['(', ','],
    signatureHelpTriggerCharacters: [')'],

    provideSignatureHelp(model: editor.ITextModel, position: Position): languages.ProviderResult<languages.SignatureHelpResult> {
        const symbol = scopeProvider.currentSymbol(model, position)
        if (symbol) {
            return {
                value: {
                    signatures: [{
                        label: symbol.name,
                        parameters: [],
                        documentation: {
                            value: symbol.description??''
                        }
                    }],
                    activeParameter: 0,
                    activeSignature: 0
                }, dispose: () => { }
            }
        } else {
            return undefined
        }

    },
}

export {
    signatureHelpProvider
}