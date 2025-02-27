import { getActiveEditor } from '@/bsl/editor'
import { languages } from 'monaco-editor-core'
import { YAxUnitEditor } from '../editor'

const codeLensProvider: languages.CodeLensProvider = {

    provideCodeLenses: function () {
        const editor = getActiveEditor()
        if (editor instanceof YAxUnitEditor) {
            const lenses = editor ? editor.testsModel.getTests().map(m => {
                return {
                    range: {
                        startLineNumber: m.lineNumber,
                        startColumn: 1,
                        endLineNumber: m.lineNumber,
                        endColumn: 1,
                    },
                    id: "RunTest" + m.method,
                    command: {
                        id: editor.commands.runTest ?? '',
                        title: "Run test",
                        arguments: [m.method]

                    },
                }
            }) : []
            return {
                lenses: lenses,
                dispose: () => { },
            };
        }
    },
    resolveCodeLens: function (_, codeLens) {
        return codeLens;
    },
}

languages.onLanguage('bsl', () => {
    languages.registerCodeLensProvider('bsl', codeLensProvider)
})

export {
    codeLensProvider
}