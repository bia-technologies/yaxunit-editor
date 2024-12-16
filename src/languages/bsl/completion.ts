import { editor, languages, Position, Range } from 'monaco-editor';
import resolver from './resolver'
import globalScope from '../../scope/globalScope'
import { Symbol, SymbolType } from '../../scope/Scope';
import { getModelScope, UnionScope } from '../../scope/scopeStore';

const provider: languages.CompletionItemProvider = {
    triggerCharacters: ['.', '"', ' ', '&'],
    /**
     * Provide completion items for the given position and document.
     */
    provideCompletionItems(model: editor.ITextModel, position: Position): languages.ProviderResult<languages.CompletionList> {
        return new Promise(async (resolve) => {
            const tokens = resolver.resolve(model, position)

            if (tokens === undefined) {
                return resolve(undefined)
            }

            const scope = getModelScope(model)

            const suggestions: languages.CompletionItem[] = []
            const word = model.getWordAtPosition(position)
            const range = new Range(position.lineNumber, word?.startColumn ?? position.column, position.lineNumber, word?.endColumn ?? position.column)

            if (tokens.length === 0) {
                scope.getScopes(position.lineNumber).forEach(s => {
                    s.members.forEach(m => suggestions.push(newCompletionItem(m, range)))
                })
            } else {
                const members = objectScopeCompletion(tokens, scope, position.lineNumber)
                if (members !== undefined) {
                    members.forEach(m => suggestions.push(newCompletionItem(m, range)))
                } else {
                    resolve(undefined)
                }
            }

            return resolve({
                suggestions: suggestions
            })
        })

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
        insertText: insertText
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

function resolveInUnionScope(token: string, unionScope: UnionScope, lineNumber: number): Symbol[] | undefined {
    const scopes = unionScope.getScopes(lineNumber);

    for (let index = scopes.length - 1; index >= 0; index--) {
        const scope = scopes[index]
        const member = scope.members.find(s => s.name.localeCompare(token, undefined, { sensitivity: 'accent' }) === 0)
        if (member !== undefined) {
            if (member.type !== undefined) {
                const tokenScope = globalScope.resolveType(member.type)
                if (tokenScope !== undefined) {
                    return tokenScope.members
                }
            }
            return undefined
        }
    }
    return undefined
}

function objectScopeCompletion(tokens: string[], unionScope: UnionScope, lineNumber: number): Symbol[] | undefined {

    const lastToken = tokens[tokens.length - 1];
    let scopeMembers = resolveInUnionScope(lastToken, unionScope, lineNumber)

    if (scopeMembers === undefined) {
        return undefined
    }
    for (let index = tokens.length - 2; index > 0; index--) {
        let token = tokens[index];

        const pos1 = token.indexOf('(')
        const pos2 = token.indexOf('[')

        if (pos1 > 0 && pos2 > 0) {
            token = token.substring(0, Math.min(pos1, pos2))
        } else if (pos1 > 0) {
            token = token.substring(0, pos1)
        } else if (pos2 > 0) {
            token = token.substring(0, pos2)
        }
        const member = scopeMembers.find(s => s.name.localeCompare(token, undefined, { sensitivity: 'accent' }) === 0)
        if (member !== undefined && member.type !== undefined) {
            const tokenScope = globalScope.resolveType(member.type)
            if (tokenScope !== undefined) {
                scopeMembers = tokenScope.members
            } else {
                scopeMembers = undefined
                break
            }
        } else {
            scopeMembers = undefined
            break
        }
    }
    return scopeMembers
}

export default provider;

// function getPrevWord(model: editor.ITextModel,
//     position: Position): editor.IWordAtPosition | null {
//     return model.getWordAtPosition({ lineNumber: position.lineNumber, column: position.column - 2 });
// }

// function getDotComplection(
//     model: editor.ITextModel,
//     position: Position
// ): languages.CompletionItem[] {
//     let result = new Array<languages.CompletionItem>();
//     const basePosition = new Position(position.lineNumber, position.column - 2);
//     const wordRange = model.getWordAtPosition(basePosition);
//     if (wordRange) {
//         let wordAtPosition = document.getText(document.getWordRangeAtPosition(basePosition));
//         wordAtPosition = this._global.fullNameRecursor(
//             wordAtPosition,
//             document,
//             document.getWordRangeAtPosition(basePosition),
//             true
//         );
//         if (this._global.toreplaced[wordAtPosition.split(".")[0]]) {
//             const arrayName = wordAtPosition.split(".");
//             arrayName.splice(0, 1, this._global.toreplaced[arrayName[0]]);
//             wordAtPosition = arrayName.join(".");
//         }
//         let queryResult: any[] = this._global.querydef(wordAtPosition + "\\.");
//         this.customDotComplection(queryResult, wordAtPosition, result);
//         this.checkSystemEnums(wordAtPosition, result);
//         this.checkOscriptClasses(wordAtPosition, result);
//         queryResult = this._global.querydef(
//             wordAtPosition,
//             undefined,
//             undefined,
//             this._global.dbvars
//         );
//         this.customDotComplection(queryResult, wordAtPosition, result, false);
//         // Получим все общие модули, у которых не заканчивается на точку.
//         queryResult = this._global.querydef(wordAtPosition, false, false);
//         for (const element of queryResult) {
//             if (!element._method.IsExport) {
//                 continue;
//             }
//             if (!element.oscriptLib && !this.isModuleAccessable(element.filename)) {
//                 continue;
//             }
//             const item: vscode.CompletionItem = new vscode.CompletionItem(element.name);
//             item.kind = vscode.CompletionItemKind.Function;
//             item.documentation = element.description;
//             item.insertText =
//                 element._method.Params.length > 0 ? element.name + "(" : element.name + "()";
//             result.push(item);
//         }
//     }
//     return result;
// }

