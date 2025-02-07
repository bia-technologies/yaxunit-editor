import { editor, languages, CancellationToken } from "monaco-editor-core";
import { scopeProvider } from "../scopeProvider";

export const documentSymbolProvider: languages.DocumentSymbolProvider = {
    provideDocumentSymbols(model: editor.ITextModel, _: CancellationToken): languages.ProviderResult<languages.DocumentSymbol[]> {
        const methods = scopeProvider.getModelMethods(model);
        if (methods) {
            return methods.map(m => {
                return {
                    kind: languages.SymbolKind.Method,
                    name: m.name,
                    range: { startLineNumber: m.startLine, startColumn: m.startColumn, endLineNumber: m.endLine, endColumn: m.endColumn },
                    detail: 'Нет деталей',
                    selectionRange: { startLineNumber: m.startLine, startColumn: m.startColumn, endLineNumber: m.endLine, endColumn: m.endColumn },
                    tags: []
                }
            })
        } else {
            return undefined
        }
    }
}