import { editor } from 'monaco-editor-core'
import { registerCommands } from './features/runner'
import { TestsModel } from './TestDefinition'
import { TestStatusDecorator } from './features/decorator'
import { TestMessageMarkersProvider } from './features/markers'
import { TestModelRender } from './features/interfaces'
import { EditorScope } from '../scope'

let activeEditor: YAxUnitEditor | undefined

export class YAxUnitEditor {
    editor: editor.IStandaloneCodeEditor
    scope: EditorScope
    tests: TestsModel = new TestsModel()
    renders: TestModelRender[] = []

    commands: {
        runTest?: string
    } = {}
    constructor(content: string) {
        activeEditor = this
        const container = document.getElementById('container')
        if (container === null) {
            throw 'Error!';
        }
        this.editor = editor.create(container, {
            value: content,
            language: 'bsl',
            automaticLayout: true,
            glyphMargin: true,
            detectIndentation: false,
            insertSpaces: false,
            useShadowDOM: false,
            contextmenu: false,
            unicodeHighlight: {
                ambiguousCharacters: false
            },
            autoClosingQuotes: 'beforeWhitespace',
            autoClosingBrackets: 'never',
            autoClosingDelete: 'auto',
            autoClosingOvertype: 'auto',
            autoSurround: 'quotes',
            acceptSuggestionOnCommitCharacter: true,
            // fontFamily: 'Courier New',
            // fontSize: 12,
            fontLigatures: true
        });

        tuneEditor(this.editor)

        this.scope = EditorScope.createScope(this.editor)
        this.commands.runTest = registerCommands(this) ?? undefined

        this.renders.push(new TestStatusDecorator(this.editor), new TestMessageMarkersProvider(this.editor))
        this.tests.onDidChangeContent(_ => this.renders.forEach(r => r.update(this.tests)))

        this.updateTestsModel()

        this.editor.getModel()?.onDidChangeContent(() => {
            this.scope.update()
            this.tests.updateTests(this.scope.getMethods())
        })
    }

    getText(): string {
        const model = this.editor.getModel()
        return model ? model.getValue() : ''
    }

    updateTestsModel() {
        this.scope.update()
        this.tests.updateTests(this.scope.getMethods())
    }

}

function tuneEditor(editor: editor.IStandaloneCodeEditor) {
    const controller = editor.getContribution('editor.contrib.suggestController');
    if (controller) {
        (controller as any).widget.value._setDetailsVisible(true);
    }
}

export function getActiveEditor() {
    return activeEditor
}
