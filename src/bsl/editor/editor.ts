import { editor } from 'monaco-editor-core'
import { EditorScope } from '@/bsl/scope/editorScope'
import { ChevrotainModuleModel } from '../chevrotain/moduleModel'
import { ModuleModel } from '../moduleModel'

let activeEditor: BslEditor | undefined

export class BslEditor {
    editor: editor.IStandaloneCodeEditor
    scope: EditorScope

    commands: {
        runTest?: string
    } = {}

    constructor() {
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
            fontLigatures: true,
            wordBasedSuggestions: false,
            model: this.createModel()
        });

        tuneEditor(this.editor)

        this.scope = EditorScope.createScope(this.editor)

        this.editor.getModel()?.onDidChangeContent(e => {
            this.scope.onDidChangeContent(e)
        })
    }

    set content(value: string) {
        this.editor.setValue(value)
    }

    get content() {
        return this.editor.getValue()
    }

    getText(): string {
        const model = this.editor.getModel()
        return model ? model.getValue() : ''
    }

    getModel(): ModuleModel {
        return this.editor.getModel() as ModuleModel
    }

    createModel() {

        const model = editor.createModel('', 'bsl');

        return ChevrotainModuleModel.create(model)
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