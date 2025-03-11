import { editor } from "monaco-editor-core";
import { ExpressionProvider } from "./expressions/expressionProvider";
import { BslCodeModel } from "./codeModel";
import { BslModuleScope } from "./scope/bslModuleScope";

export interface ModuleModel extends editor.ITextModel, ExpressionProvider {
    getScope(): BslModuleScope,
    getCodeModel(): BslCodeModel | undefined
    updateCodeModel(): void
}
