import { BslEditor } from '@/bsl/editor'
import { languages } from 'monaco-editor-core'
import { TestsModel } from '../test-model'

export function createYAxUnitCodeLensProvider(
    editor: BslEditor,
    testsModel: TestsModel,
    getRunTestCommand: () => string | undefined
): languages.CodeLensProvider {
    return {
        provideCodeLenses(model) {
            if (model !== editor.getModel()) {
                return {
                    lenses: [],
                    dispose: () => {}
                }
            }

            const commandId = getRunTestCommand() ?? ''
            return {
                lenses: testsModel.getTests().map(test => ({
                    range: {
                        startLineNumber: test.lineNumber,
                        startColumn: 1,
                        endLineNumber: test.lineNumber,
                        endColumn: 1
                    },
                    id: `RunTest${test.method}`,
                    command: {
                        id: commandId,
                        title: 'Run test',
                        arguments: [test.method]
                    }
                })),
                dispose: () => {}
            }
        },
        resolveCodeLens(_, codeLens) {
            return codeLens
        }
    }
}

export function registerYAxUnitCodeLensProvider(
    editor: BslEditor,
    testsModel: TestsModel,
    getRunTestCommand: () => string | undefined
) {
    const provider = createYAxUnitCodeLensProvider(editor, testsModel, getRunTestCommand)
    return languages.registerCodeLensProvider('bsl', provider)
}
