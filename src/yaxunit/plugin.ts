import { languages } from 'monaco-editor-core'
import { BslEditor, BslEditorContext, BslEditorPlugin } from '@/bsl/editor'
import { EMPTY_RANGE } from '@/monaco/utils'
import { loadYAxUnitScope, YAXUNIT_SCOPE_ID } from './scope'
import { registerCommands } from './features/runner'
import { TestStatusDecorator } from './features/testStatusDecorator'
import { TestMessageMarkersProvider } from './features/testMessageMarkers'
import { TestsResolver } from './test-resolver/resolver'
import { TestsModel } from './test-model'
import { TestModelRender } from './interfaces'
import { registerYAxUnitCodeLensProvider } from './features/lensProvider'

export const YAXUNIT_PLUGIN_ID = 'yaxunit'

export interface YAxUnitPlugin extends BslEditorPlugin {
    readonly testsModel: TestsModel
    readonly renders: TestModelRender[]
    testsResolver?: TestsResolver
    runTestCommand?: string
}

export function createYAxUnitPlugin(): YAxUnitPlugin {
    const testsModel = new TestsModel()
    const renders: TestModelRender[] = []

    return {
        id: YAXUNIT_PLUGIN_ID,
        testsModel,
        renders,
        contribute(context: BslEditorContext): void {
            context.registerScope(YAXUNIT_SCOPE_ID, loadYAxUnitScope())
            context.registerSnippets(YAXUNIT_PLUGIN_ID, loadYAxUnitSnippets())
        },
        onEditorCreated(editor: BslEditor): void {
            this.runTestCommand = registerCommands(editor, testsModel) ?? undefined
            editor.context.addDisposable(registerYAxUnitCodeLensProvider(editor, testsModel, () => this.runTestCommand))

            renders.push(new TestStatusDecorator(editor.editor), new TestMessageMarkersProvider(editor.editor))
            testsModel.onDidChangeContent(_ => renders.forEach(render => render.update(testsModel)))

            this.testsResolver = new TestsResolver(editor, testsModel)

            editor.getModel().getCodeModel().onDidChangeModel(e => {
                this.testsResolver?.onDidChangeContent(e)
            })
            this.testsResolver.onDidChangeContent(editor.getModel().getCodeModel())
        }
    }
}

async function loadYAxUnitSnippets() {
    const snippets = await import('./snippets.json')
    return snippets.default.map(sn => ({
        label: sn.prefix,
        kind: languages.CompletionItemKind.Snippet,
        insertText: sn.body,
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: sn.description,
        range: EMPTY_RANGE
    }))
}
