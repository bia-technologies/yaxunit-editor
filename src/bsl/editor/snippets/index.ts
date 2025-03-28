import { IRange, languages } from "monaco-editor-core";
import { keywords_ru } from "../language/keywords";
import { default as snippets } from './snippets.json'
import { default as yaxunitSnippets } from './yaxunit-snippets.json'

export function appendKeywords(suggestions: languages.CompletionItem[], range: IRange) {
    keywords_ru.forEach(keyword => {
        suggestions.push({
            label: keyword,
            kind: languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range
        })
    })
}

export function appendSnippets(suggestions: languages.CompletionItem[], range: IRange) {
    // Использован набор шаблонов из https://github.com/1c-syntax/vsc-language-1c-bsl/blob/develop/snippets/snippets.json
    for (const sn of snippets) {
        suggestions.push({
            label: sn.prefix,
            kind: languages.CompletionItemKind.Snippet,
            insertText: directives(sn.body),
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: sn.description,
            range
        })
    }
    for (const sn of yaxunitSnippets) {
        suggestions.push({
            label: sn.prefix,
            kind: languages.CompletionItemKind.Snippet,
            insertText: sn.body,
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: sn.description,
            range
        })
    }
}

function directives(snippet: string) {
    return snippet
        .replace(':ВыберитеДирективуКомпиляции', '|НаКлиенте,НаСервере,НаСервереБезКонтекста,НаКлиентеНаСервереБезКонтекста,НаКлиентеНаСервере|')
        .replace(':ChooseACompilationDirective', '|AtClient,AtServer,AtServerNoContext,AtClientAtServerNoContext,AtClientAtServer|')
}