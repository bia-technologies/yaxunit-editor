import { registerSnippets } from '@/bsl/editor/snippets'
import { EMPTY_RANGE } from '@/monaco/utils'
import { languages } from 'monaco-editor-core'

registerSnippets(loadSnippets())

async function loadSnippets() {
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