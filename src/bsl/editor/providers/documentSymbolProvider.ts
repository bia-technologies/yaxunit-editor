import { editor, languages, CancellationToken } from 'monaco-editor-core';
import { ModuleModel } from "@/bsl/moduleModel";
import { getBslDocumentSymbols } from '@/bsl/languageService';

export const documentSymbolProvider: languages.DocumentSymbolProvider = {
    provideDocumentSymbols(model: editor.ITextModel, _: CancellationToken): languages.ProviderResult<languages.DocumentSymbol[]> {
        const moduleModel = model as ModuleModel

        return getBslDocumentSymbols(moduleModel)
    }
}
