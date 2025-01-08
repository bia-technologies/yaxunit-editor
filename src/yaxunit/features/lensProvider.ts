import { languages } from 'monaco-editor';

import { getActiveEditor } from '../editor'

const codeLensProvider: languages.CodeLensProvider = {

    provideCodeLenses: function () {
        const editor = getActiveEditor()
        const lenses = editor ? editor.module.module.methods.map(m => {
            return {
                range: {
                    startLineNumber: m.startLine,
                    startColumn: 1,
                    endLineNumber: m.endLine,
                    endColumn: 1,
                },
                id: "RunTest" + m.name,
                command: {
                    id: editor.commands.runTest ?? '',
                    title: "Run test",
                    arguments: [m.name]

                },
            }
        }) : []
        return {
            lenses: lenses,
            dispose: () => { },
        };
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