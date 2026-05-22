import { editor, KeyCode, KeyMod, Uri } from 'monaco-editor-core'
import { EditorScope } from '@/bsl/scope/editorScope'
import { ModuleModel } from '../moduleModel'
import { LezerModuleModel } from '../lezer/moduleModel'
import { ParserAdapterFactory } from '../parserAdapter'
import { AdapterBackedModuleModel } from '../adapterModuleModel'
import { createLezerParserAdapter } from '../lezer/parserAdapter'
import { BslEditorContext } from './context'
import { BslEditorPlugin } from './plugins'

let activeEditor: BslEditor | undefined

export class BslEditor {
    editor: editor.IStandaloneCodeEditor
    scope: EditorScope
    context: BslEditorContext

    commands: {
        runTest?: string
    } = {}

    constructor(options: BslEditorOptions = {}) {
        activeEditor = this
        this.context = new BslEditorContext()

        for (const plugin of options.plugins ?? []) {
            void plugin.contribute(this.context)
        }

        const container = options.container ?? document.getElementById(options.containerId ?? 'container')
        if (container === null) {
            throw 'Error!';
        }

        this.editor = editor.create(container, {
            ...options.editorOptions,
            language: 'bsl',
            automaticLayout: true,
            glyphMargin: true,
            useShadowDOM: false,
            contextmenu: false,
            wordBasedSuggestions: 'off',

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
            model: options.model ? this.createModel(options) : this.createModel(options)
        });

        tuneEditor(this.editor)

        this.scope = EditorScope.createScope(this.editor, this.context)
        const model = this.getModel()

        this.context.addDisposable({ dispose: () => EditorScope.disposeScope(model) })
        this.context.addDisposable(this.editor.onDidDispose(() => {
            if (activeEditor === this) {
                activeEditor = undefined
            }
            this.context.dispose()
        }))

        this.context.addDisposable(model.onDidChangeContent(e => {
            this.scope.onDidChangeContent(e)
        }))

        for (const plugin of options.plugins ?? []) {
            void plugin.onEditorCreated?.(this)
        }
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

    createModel(options: BslEditorOptions = {}) {

        const model = options.model ?? editor.createModel(options.initialText ?? '', 'bsl', options.uri ?? Uri.parse('Тестовый модуль'));

        if (options.parserAdapter) {
            return AdapterBackedModuleModel.create(model, options.parserAdapter())
        }

        return LezerModuleModel.create(model)
    }
}

export interface BslEditorOptions {
    container?: HTMLElement
    containerId?: string
    model?: editor.ITextModel
    uri?: Uri
    initialText?: string
    editorOptions?: editor.IStandaloneEditorConstructionOptions
    parserAdapter?: ParserAdapterFactory
    plugins?: BslEditorPlugin[]
}

export function defaultBslEditorOptions(): Required<Pick<BslEditorOptions, 'parserAdapter'>> {
    return {
        parserAdapter: createLezerParserAdapter
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
