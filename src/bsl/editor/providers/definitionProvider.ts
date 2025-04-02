import { BslVariable, isMemberRef } from "@/bsl/codeModel";
import { symbolRange } from "@/bsl/codeModel/utils";
import { ModuleModel } from "@/bsl/moduleModel";
import { BaseSymbol } from "@/common/codeModel";
import { editor, languages, IPosition, } from "monaco-editor";

export const definitionProvider: languages.DefinitionProvider = {
    provideDefinition(model: editor.ITextModel, position: IPosition): languages.ProviderResult<languages.Definition> {
        const moduleModel = model as ModuleModel
        const symbol = moduleModel.getCurrentSymbol(position)

        if (symbol && isMemberRef(symbol)) {
            if (symbol.member instanceof BslVariable) {
                return symbol.member.definitions.map(s => ({
                    uri: model.uri,
                    range: symbolRange(s, model)
                }))
            } else if (symbol.member instanceof BaseSymbol) {
                return {
                    uri: model.uri,
                    range: symbolRange(symbol.member, model)
                }
            }
        }

        return undefined
    }
}