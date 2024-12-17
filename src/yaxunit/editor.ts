import { editor, Range } from 'monaco-editor'
import {createEditorScope} from '../scope/scopeStore'
import LocalScope from '../scope/localScope'
import {registerCommands} from './features/runner'

let activeEditor: YAxUnitEditor|undefined

export class YAxUnitEditor {
    editor: editor.IStandaloneCodeEditor
    module: LocalScope
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
        this.editor.createDecorationsCollection([
            {
                range: new Range(2, 1, 2, 1),
                options: {
                    isWholeLine: true,
                    glyphMarginClassName: "codicon-play success",
                    glyphMarginHoverMessage: {
                        value: 'Run test'
                    },

                },
            }
        ]);
        this.module = createEditorScope(this.editor).localScope
        this.module.updateMembers()
        this.commands.runTest = registerCommands(this)??undefined

        activeEditor = this
    }
}

export function getActiveEditor(){
    return activeEditor
}