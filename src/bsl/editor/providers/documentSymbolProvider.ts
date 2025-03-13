import { editor, languages, CancellationToken } from "monaco-editor-core";
import { ModuleModel } from "@/bsl/moduleModel";
import { symbolRange } from "@/common/codeModel";

export const documentSymbolProvider: languages.DocumentSymbolProvider = {
    provideDocumentSymbols(model: editor.ITextModel, _: CancellationToken): languages.ProviderResult<languages.DocumentSymbol[]> {
        const moduleModel = model as ModuleModel
        
        const methods = moduleModel.getCodeModel().methods

        return methods.map(m => {
            const range = symbolRange(m, model)
            return {
                kind: languages.SymbolKind.Method,
                name: m.name,
                range: range,
                detail: 'Нет деталей',
                selectionRange: range,
                tags: []
            }
        })
    }
}