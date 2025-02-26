import { editor, languages, Position, Range } from 'monaco-editor-core';
import { EditorScope, GlobalScope, isMethod, isPlatformMethod, Scope, Symbol, SymbolType } from '@/scope';
import { scopeProvider } from '../scopeProvider';
import { Expression, ExpressionType, isAccessible, resolveSymbol } from '@/tree-sitter/symbols';
import { getEditedPositionOffset } from '@/monaco/utils';

const completionItemProvider: languages.CompletionItemProvider = {
    triggerCharacters: ['.', '"', ' ', '&'],

    async provideCompletionItems(model: editor.ITextModel, position: Position): Promise<languages.CompletionList | undefined> {
        const symbol = currentSymbol(model, position)
        console.debug('symbol: ', symbol)

        let scope: Scope | undefined

        const word = model.getWordAtPosition(position)
        const range = new Range(position.lineNumber, word?.startColumn ?? position.column, position.lineNumber, word?.endColumn ?? position.column)

        if (!symbol || symbol.type === ExpressionType.none) {
            scope = EditorScope.getScope(model)
        } else if (isAccessible(symbol)) {
            scope = symbol.path.length ? await scopeProvider.resolveExpressionType(model, symbol.path) : EditorScope.getScope(model)
            if (symbol.name && scope) {
                const member = scope.findMember(symbol.name)
                scope = member ? await GlobalScope.resolveType(await member.type) : undefined
            }
        } else if (symbol.type === ExpressionType.ctor) {
            return {
                suggestions: GlobalScope.getConstructors().map(c => {
                    return {
                        kind: languages.CompletionItemKind.Constructor,
                        label: c.name,
                        insertText: c.name,
                        range
                    }
                })
            }
        }

        console.debug('completion scope: ', scope)

        if (scope === undefined) {
            return undefined
        }

        const suggestions: languages.CompletionItem[] = []

        scope.forEachMembers(m => suggestions.push(newCompletionItem(m, range)))
        console.debug('suggestions', suggestions)

        return {
            suggestions: suggestions
        }
    },
}

function currentSymbol(model: editor.ITextModel, position: Position): Expression | undefined {
    const positionOffset = getEditedPositionOffset(model, position)

    const scope = EditorScope.getScope(model)
    const node = scope.getAst().getCurrentEditingNode(positionOffset)
    if (node) {
        return resolveSymbol(node)
    }
}

function newCompletionItem(symbol: Symbol, range: Range): languages.CompletionItem {
    let insertText: string

    if (symbol.kind === SymbolType.function || symbol.kind === SymbolType.procedure) {
        insertText = methodInsertText(symbol)
    } else {
        insertText = symbol.name
    }
    return {
        label: {
            label: symbol.name,
            description: symbol.description
        },
        kind: completionItemKind(symbol.kind),
        range: range,
        insertText: insertText,
        documentation: symbol.description ? {
            value: symbol.description
        } : undefined
    }
}

function methodInsertText(symbol: Symbol): string {
    let close = false

    if (isPlatformMethod(symbol)) {
        if (symbol.signatures.length && symbol.signatures[0].params.length === 0) {
            close = true
        }
    } if (isMethod(symbol)) {
        close = symbol.params.length === 0
    }

    return symbol.name + (close ? "()" : "(");
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
