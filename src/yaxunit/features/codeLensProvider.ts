import { languages } from 'monaco-editor';

import { getActiveEditor } from '../editor'

const codeLensProvider: languages.CodeLensProvider = {

    provideCodeLenses: function () {
        const editor = getActiveEditor()
        const lenses = editor ? editor.module.module.methods.map(m => {
            return {
                range: {
                    startLineNumber: m.startLine + 1,
                    startColumn: 1,
                    endLineNumber: m.endLine + 1,
                    endColumn: 1,
                },
                id: "RunTest" + m.name,
                command: {
                    id: editor.commands.runTest ?? '',
                    title: "Run test",
                },
            }
        }) : []
        return {
            lenses: lenses,
            dispose: () => {
                console.log('dispose')
            },
        };
    },
    resolveCodeLens: function (model, codeLens, token) {
        return codeLens;
    },
}

languages.onLanguage('bsl', () => {
    languages.registerCodeLensProvider('bsl', codeLensProvider)
})

export {
    codeLensProvider
}