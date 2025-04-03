import { IRange, languages } from "monaco-editor-core";
import { EMPTY_RANGE } from "@/monaco/utils";

const all_snippets: languages.CompletionItem[] = []
const keywords_snippets: languages.CompletionItem[] = [
    'Процедура ',
    'КонецПроцедуры',
    'Функция ',
    'КонецФункции',
    'Прервать;',
    'Продолжить;',
    'Возврат',
    'Если ',
    'Тогда',
    'Иначе',
    'ИначеЕсли ',
    'КонецЕсли;',
    'Попытка',
    'Исключение',
    'КонецПопытки;',
    'ВызватьИсключение',
    'Пока ',
    'Для ',
    'Каждого ',
    'Из ',
    'По ',
    'Цикл',
    'КонецЦикла;',
    'НЕ ',
    'И ',
    'ИЛИ ',
    'Новый ',
    'Перем ',
    'Экспорт',
    'Знач ',
    'Истина',
    'Ложь',
    'Неопределено',
    'Перейти ',
    'ДобавитьОбработчик ',
    'УдалитьОбработчик ',
    'Ждать ',
    'Асинх '
].map(keyword =>
({
    label: keyword,
    kind: languages.CompletionItemKind.Keyword,
    insertText: keyword,
    range: EMPTY_RANGE
}))

/**
 * Registers code snippet suggestions.
 *
 * Waits for the provided promise to resolve to an array of completion items and appends them to the global snippet registry.
 *
 * @param suggestions - A promise that resolves to an array of code completion items.
 */
export function registerSnippets(suggestions: Promise<languages.CompletionItem[]>) {
    suggestions.then(data => all_snippets.push(...data))
}

export function appendSnippets(suggestions: languages.CompletionItem[], range: IRange) {
    all_snippets.forEach(s => s.range = range)
    suggestions.push(...all_snippets)
}

export function appendKeywords(suggestions: languages.CompletionItem[], range: IRange) {
    keywords_snippets.forEach(s => s.range = range)
    suggestions.push(...keywords_snippets)
}

registerSnippets(loadSnippets())

async function loadSnippets() {
    // Использован набор шаблонов из https://github.com/1c-syntax/vsc-language-1c-bsl/blob/develop/snippets/snippets.json
    const snippets = await import('./snippets_ru.json')
    return snippets.default.map(sn => ({
        label: sn.prefix,
        kind: languages.CompletionItemKind.Snippet,
        insertText: directives(sn.body),
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: sn.description,
        range: EMPTY_RANGE
    }))
}

function directives(snippet: string) {
    return snippet
        .replace(':ВыберитеДирективуКомпиляции', '|НаКлиенте,НаСервере,НаСервереБезКонтекста,НаКлиентеНаСервереБезКонтекста,НаКлиентеНаСервере|')
        .replace(':ChooseACompilationDirective', '|AtClient,AtServer,AtServerNoContext,AtClientAtServerNoContext,AtClientAtServer|')
}