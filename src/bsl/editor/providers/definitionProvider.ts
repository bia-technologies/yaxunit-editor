import { ModuleModel } from "@/bsl/moduleModel";
import { editor, languages, IPosition, } from 'monaco-editor-core';
import { getBslDefinition } from '@/bsl/languageService';

export const definitionProvider: languages.DefinitionProvider = {
    provideDefinition(model: editor.ITextModel, position: IPosition): languages.ProviderResult<languages.Definition> {
        return getBslDefinition(model as ModuleModel, position)
    }
}
