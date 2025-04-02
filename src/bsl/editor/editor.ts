import { editor } from 'monaco-editor'
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
                enabled: true // don't work on monaco 0.33 
            },
            unicodeHighlight: {
                ambiguousCharacters: false
            },
            suggest: {
                preview: true,
                insertMode: 'replace',
                localityBonus: true
            },
            fontLigatures: true,
            fontSize: 14,
            fontFamily: 'JetBrains Mono',
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

window.addEventListener('keydown', function (event) {
    // Since 0.34.1, monaco.editor.addKeybindingRule(s) can be used to tweak default keybindings.
    if (event.keyCode === 80 && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
        } else {
            event.stopPropagation();
        }

        activeEditor?.editor.trigger('ctrl-shift-p', 'editor.action.quickCommand', null)
        return;
    }
}, true);