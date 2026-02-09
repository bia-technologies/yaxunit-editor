import { editor, KeyCode, KeyMod, Uri } from 'monaco-editor-core'
import { EditorScope } from '@/bsl/scope/editorScope'
import { ModuleModel } from '../moduleModel'
import { LezerModuleModel } from '../lezer/moduleModel'

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
            useShadowDOM: false,
            contextmenu: false,
            wordBasedSuggestions: false,

            multiCursorModifier: 'ctrlCmd',

            detectIndentation: false,
            insertSpaces: false,
            trimAutoWhitespace: false,
            autoIndent: 'full',
            scrollBeyondLastLine: false,

            autoClosingQuotes: 'languageDefined',
            autoClosingBrackets: 'languageDefined',
            autoSurround: 'languageDefined',
            autoClosingDelete: 'auto',
            autoClosingOvertype: 'auto',

            acceptSuggestionOnCommitCharacter: true,

            renderLineHighlight: 'all',
            renderWhitespace: 'none', // ломает работу шрифтов

            parameterHints: { cycle: true },
            bracketPairColorization: {
                enabled: true
            },
            unicodeHighlight: {
                ambiguousCharacters: false
            },
            suggest: {
                preview: true,
                insertMode: 'replace',
                localityBonus: true
            },
            model: this.createModel()
        });

        tuneEditor(this.editor)

        this.scope = EditorScope.createScope(this.editor)

        this.getModel().onDidChangeContent(e => {
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

        const model = editor.createModel('', 'bsl', Uri.parse('Тестовый модуль'));

        return LezerModuleModel.create(model)
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

editor.addKeybindingRules([
    { keybinding: KeyMod.CtrlCmd | KeyCode.KeyP, command: 'editor.action.quickCommand' },
    { keybinding: KeyMod.CtrlCmd | KeyCode.NumpadDivide, command: 'editor.action.commentLine' },

    { keybinding: KeyCode.F3, command: 'editor.action.nextMatchFindAction' },
    { keybinding: KeyMod.Shift | KeyCode.F3, command: 'editor.action.previousMatchFindAction' },

    { keybinding: KeyMod.CtrlCmd|KeyMod.Shift | KeyCode.NumpadSubtract, command: 'editor.foldAll' },
    { keybinding: KeyMod.CtrlCmd|KeyMod.Shift | KeyCode.NumpadAdd, command: 'editor.unfoldAll' },

    { keybinding: KeyMod.CtrlCmd | KeyCode.NumpadSubtract, command: 'editor.fold' },
    { keybinding: KeyMod.CtrlCmd | KeyCode.NumpadAdd, command: 'editor.unfold' },
])
