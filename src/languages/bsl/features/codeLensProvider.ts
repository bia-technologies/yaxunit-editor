import { editor, languages, Position, Range } from 'monaco-editor';

import { getModelScope, activeEditor } from '../../../scope/scopeStore';

const codeLensProvider: languages.CodeLensProvider = {

    provideCodeLenses: function (model, token) {
        const scope = getModelScope(model)
        scope.localScope.updateMembers()
        return {
            lenses: scope.localScope.module.methods.map(m => {
                return {
                    range: {
                        startLineNumber: m.startLine + 1,
                        startColumn: 1,
                        endLineNumber: m.endLine + 1,
                        endColumn: 1,
                    },
                    id: "RunTest" + m.name,
                    command: {
                        id: 'runTestMethod',
                        title: "Run test",
                    },
                }
            }),
            dispose: () => {
                console.log('dispose')
            },
        };
    },
    resolveCodeLens: function (model, codeLens, token) {
        return codeLens;
    },
}

export {
    codeLensProvider
}