import { editor } from 'monaco-editor'
import { createEditorScope } from '../scope/scopeStore'
import LocalScope from '../scope/localScope'
import { registerCommands } from './features/runner'
import { TestsModel } from './TestDefinition'
import { TestStatusDecorator } from './features/decorator'
import { TestMessageMarkersProvider } from './features/markers'
import { TestModelRender } from './features/interfaces'

let activeEditor: YAxUnitEditor | undefined

export class YAxUnitEditor {
    editor: editor.IStandaloneCodeEditor
    module: LocalScope
    tests: TestsModel = new TestsModel()
    renders: TestModelRender[] = []

    commands: {
        runTest?: string
    } = {}
    constructor(
        content: string) {
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
            contextmenu: false
        });
        this.module = createEditorScope(this.editor).localScope
        this.commands.runTest = registerCommands(this) ?? undefined

        this.renders.push(new TestStatusDecorator(this.editor), new TestMessageMarkersProvider(this.editor))
        this.tests.onDidChangeContent(_ => this.renders.forEach(r => r.update(this.tests)))

        this.updateTestsModel()

        this.editor.getModel()?.onDidChangeContent(() => {
            this.module.updateMembers()
            this.tests.updateTests(this.module.module.methods)
        })
    }

    getText(): string {
        const model = this.editor.getModel()
        return model ? model.getValue() : ''
    }

    updateTestsModel() {
        this.module.updateMembers()
        this.tests.updateTests(this.module.module.methods)
    }

}

export function getActiveEditor() {
    return activeEditor
}
