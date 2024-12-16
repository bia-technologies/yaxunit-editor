import { editor, languages, Position, Range } from 'monaco-editor';
import resolver from './resolver'
import globalScope from './GlobalScope'
import { Symbol, SymbolType } from '../../scope/Scope';

const provider: languages.CompletionItemProvider = {
    triggerCharacters: ['.', '"', ' ', '&'],
    /**
     * Provide completion items for the given position and document.
     */
    provideCompletionItems(model: editor.ITextModel, position: Position): languages.ProviderResult<languages.CompletionList> {
        // const word = model.getWordUntilPosition(position);
        // const prevWord = getPrevWord(model, position);
        // console.log(word);
        // console.log(prevWord);

        const tokens = resolver.resolve(model, position)

        if (tokens === undefined) {
            return undefined
        }

        let symbols: Symbol[] | undefined

        if (tokens.length === 0) {
            symbols = globalScope.members
        } else {
            symbols = objectScopeCompletion(tokens)
        }

        if (symbols === undefined) {
            return undefined
        } else {
            const word = model.getWordAtPosition(position)
            const range = new Range(position.lineNumber, word?.startColumn ?? position.column, position.lineNumber, word?.endColumn ?? position.column)
            return {
                suggestions: scopeCompletion(symbols, range)
            }
        }



        // var last_chars = model.getValueInRange({ startLineNumber: position.lineNumber, startColumn: 0, endLineNumber: position.lineNumber, endColumn: position.column });
        // var words = last_chars.replace("\t", "").split(" ");
        // var active_typing = words[words.length - 1]; // What the user is currently typing (everything after the last space)
        // console.log(last_chars);
        // console.log(words);
        // console.log(active_typing);

        const wordInfo = model.getWordUntilPosition(position);
        const wordRange = new Range(
            position.lineNumber,
            wordInfo.startColumn,
            position.lineNumber,
            wordInfo.endColumn
        );
        if (model.isDisposed()) {
            return;
        }

        return {
            suggestions: createDependencyProposals(wordRange),
        };
    },
    // /**
    //  * Given a completion item fill in more data, like {@link CompletionItem.documentation doc-comment}
    //  * or {@link CompletionItem.detail details}.
    //  *
    //  * The editor will only resolve a completion item once.
    //  */
    // resolveCompletionItem(item: languages.CompletionItem, token: CancellationToken): languages.ProviderResult<languages.CompletionItem>{
    //     return undefined;
    // }
}

function scopeCompletion(scope: Symbol[], range: Range): languages.CompletionItem[] {
    return scope.map(m => {
        let insertText = m.name
        if(m.kind===SymbolType.function||m.kind===SymbolType.procedure){
            insertText += '('
        }
        return {
            label: m.name,
            kind: completionItemKind(m.kind),
            range: range,
            insertText: insertText
        }
    })
}

function completionItemKind(type: SymbolType): languages.CompletionItemKind {
    switch (type) {
        case SymbolType.function:
            return languages.CompletionItemKind.Function
        case SymbolType.procedure:
            return languages.CompletionItemKind.Method
        case SymbolType.property:
            return languages.CompletionItemKind.Property
        default:
            return languages.CompletionItemKind.Class
    }
}
function objectScopeCompletion(tokens: string[]): Symbol[] | undefined {
    let scope: Symbol[] | undefined = globalScope.members

    for (let index = tokens.length - 1; index > 0; index--) {
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
        const member = scope.find(s => s.name.localeCompare(token, undefined, { sensitivity: 'accent' }) === 0)
        if (member !== undefined && member.type !== undefined) {
            const tokenScope = globalScope.resolveType(member.type)
            if (tokenScope !== undefined) {
                scope = tokenScope.members
            } else {
                scope = undefined
                break
            }
        } else {
            scope = undefined
            break
        }
    }
    return scope
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

function createDependencyProposals(range: Range) {
    // returning a static list of proposals, not even looking at the prefix (filtering is done by the Monaco editor),
    // here you could do a server side lookup
    return [
        {
            label: 'ЮТест',
            kind: languages.CompletionItemKind.Class,
            documentation: "The Lodash library exported as Node.js modules.",
            insertText: 'ЮТест.',
            range: range,
        },
        {
            label: '"express"',
            kind: languages.CompletionItemKind.Unit,
            documentation: "Fast, unopinionated, minimalist web framework",
            insertText: '"express": "*"',
            range: range,
        },
        {
            label: '"mkdirp"',
            kind: languages.CompletionItemKind.Constructor,
            documentation: "Recursively mkdir, like <code>mkdir -p</code>",
            insertText: '"mkdirp": "*"',
            range: range,
        },
        {
            label: '"my-third-party-library"',
            kind: languages.CompletionItemKind.Variable,
            documentation: "Describe your library here",
            insertText: '"${1:my-third-party-library}": "${2:1.2.3}"',
            insertTextRules:
                languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
        },
    ];
}