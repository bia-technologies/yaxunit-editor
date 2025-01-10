import { editor, languages, Position, Range } from 'monaco-editor';
import { Symbol, SymbolType } from '../../scope';
import { scopeProvider } from '../scopeProvider';

const completionItemProvider: languages.CompletionItemProvider = {
    triggerCharacters: ['.', '"', ' ', '&'],

    provideCompletionItems(model: editor.ITextModel, position: Position): languages.ProviderResult<languages.CompletionList> {
        const scope = scopeProvider.resolveScope(model, position)

        console.debug('completion scope: ', scope)

        if (scope === undefined) {
            return undefined
        }

        const suggestions: languages.CompletionItem[] = []
        const word = model.getWordAtPosition(position)
        const range = new Range(position.lineNumber, word?.startColumn ?? position.column, position.lineNumber, word?.endColumn ?? position.column)

        scope.forEachMembers(m => suggestions.push(newCompletionItem(m, range)))
        console.debug('suggestions', suggestions)

        return {
            suggestions: suggestions
        }
    },
}

function newCompletionItem(symbol: Symbol, range: Range): languages.CompletionItem {
    let insertText = symbol.name
    if (symbol.kind === SymbolType.function || symbol.kind === SymbolType.procedure) {
        insertText += '('
    }
    return {
        label: symbol.name,
        kind: completionItemKind(symbol.kind),
        range: range,
        insertText: insertText,
        documentation: symbol.description
    }
}

function completionItemKind(type: SymbolType): languages.CompletionItemKind {
    switch (type) {
        case SymbolType.function:
            return languages.CompletionItemKind.Function
        case SymbolType.procedure:
            return languages.CompletionItemKind.Method
        case SymbolType.property:
            return languages.CompletionItemKind.Field
        default:
            return languages.CompletionItemKind.Class
    }
}

export {
    completionItemProvider
}
