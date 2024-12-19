import { editor } from 'monaco-editor'
import { createEditorScope } from '../scope/scopeStore'
import LocalScope from '../scope/localScope'
import { registerCommands } from './features/runner'
import { TestsModel } from './TestDefinition'
import { TestStatusDecorator } from './features/TestStatusDecorator'

let activeEditor: YAxUnitEditor | undefined

export class YAxUnitEditor {
    editor: editor.IStandaloneCodeEditor
    module: LocalScope
    tests: TestsModel = new TestsModel()
    decorator: TestStatusDecorator
    
    commands: {
        runTest?: string
    } = {}
    constructor(
        content: string) {
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
        activeEditor = this
        this.decorator = new TestStatusDecorator(this.editor)
        this.tests.onDidChangeContent(_=>{
            this.decorator.updateDecorations(this.tests)
        })
        this.updateTestsModel()

        this.editor.getModel()?.onDidChangeContent((e) => {
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
