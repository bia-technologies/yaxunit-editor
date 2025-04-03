import { editor, languages, IPosition, Range } from 'monaco-editor-core'
import { GlobalScope, isMethod, isPlatformMethod, Scope, Member, MemberType } from '@/common/scope'
import { scopeProvider } from '@/bsl/scopeProvider'
import { ModuleModel } from '@/bsl/moduleModel'
import { EditorScope } from '@/bsl/scope/editorScope'
import { AccessSequenceSymbol, ConstructorSymbol, ConstSymbol } from '@/bsl/codeModel'
import { appendKeywords, appendSnippets } from '../snippets'

const completionItemProvider: languages.CompletionItemProvider = {
    triggerCharacters: ['.'],

    async provideCompletionItems(model: editor.ITextModel, position: IPosition): Promise<languages.CompletionList | undefined> {
        const moduleModel = model as ModuleModel
        const symbol = moduleModel.getEditingExpression(position)
        console.debug('symbol: ', symbol)

        let scope: Scope | undefined

        const word = model.getWordAtPosition(position)
        const range = new Range(position.lineNumber, word?.startColumn ?? position.column, position.lineNumber, word?.endColumn ?? position.column)
        const editorScope = EditorScope.getActiveScope(model, position)

        if (symbol instanceof ConstSymbol) {
            return {
                suggestions: [], incomplete: true
            }
        }
        if (symbol instanceof ConstructorSymbol) {
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

        if (symbol instanceof AccessSequenceSymbol) {
            scope = await scopeProvider.resolveSymbolParentScope(editorScope, symbol)
        } else {
            scope = editorScope
        }

        console.debug('completion scope: ', scope)

        if (scope === undefined) {
            return undefined
        }

        const suggestions: languages.CompletionItem[] = []

        if (scope == editorScope) {
            appendKeywords(suggestions, range)
            appendSnippets(suggestions, range)
        }

        scope.forEachMembers(m => suggestions.push(newCompletionItem(m, range)))
        console.debug('suggestions', suggestions)

        return {
            suggestions: suggestions
        }
    },
}

function newCompletionItem(symbol: Member, range: Range): languages.CompletionItem {
    let insertText: string

    if (symbol.kind === MemberType.function || symbol.kind === MemberType.procedure) {
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

function methodInsertText(symbol: Member): string {
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

function completionItemKind(type: MemberType): languages.CompletionItemKind {
    switch (type) {
        case MemberType.function:
            return languages.CompletionItemKind.Function
        case MemberType.procedure:
            return languages.CompletionItemKind.Method
        case MemberType.property:
            return languages.CompletionItemKind.Field
        case MemberType.variable:
            return languages.CompletionItemKind.Variable
        default:
            return languages.CompletionItemKind.Class
    }
}

export {
    completionItemProvider
}
