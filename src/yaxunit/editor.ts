import { editor } from 'monaco-editor-core'
import { registerCommands } from './features/runner'
import { TestsModel } from './test-model'
import { TestStatusDecorator } from './features/decorator'
import { TestMessageMarkersProvider } from './features/markers'
import { TestModelRender } from './features/interfaces'
import { EditorScope } from '@/scope'
import { TestsResolver } from './test-resolver/resolver'

let activeEditor: YAxUnitEditor | undefined

export class YAxUnitEditor {
    editor: editor.IStandaloneCodeEditor
    scope: EditorScope
    testsModel: TestsModel = new TestsModel()
    renders: TestModelRender[] = []
    testsResolver: TestsResolver

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
        this.testsModel.onDidChangeContent(_ => this.renders.forEach(r => r.update(this.testsModel)))

        this.testsResolver = new TestsResolver(this, this.testsModel)

        this.editor.getModel()?.onDidChangeContent(e => {
            this.scope.onDidChangeContent(e)
            this.testsResolver.onDidChangeContent(e)
        })

        this.editor.setValue(content)
    }

    getText(): string {
        const model = this.editor.getModel()
        return model ? model.getValue() : ''
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
