import { editor } from "monaco-editor-core";
import { BslCodeModel } from "./codeModel";
import { BslModuleScope } from "./scope/bslModuleScope";
import { IPosition } from "monaco-editor-core";
import { CodeSymbol } from "@/common/codeModel";
import { ConstructorSymbol, MethodCallSymbol } from "@/bsl/codeModel";

export interface ExpressionProvider {
    getEditingExpression(position: IPosition): CodeSymbol | undefined,
    getEditingMethod(position: IPosition): MethodCallSymbol | ConstructorSymbol  | undefined,
    getCurrentExpression(position: IPosition): CodeSymbol | undefined
    getCurrentSymbol(position: IPosition | number): CodeSymbol | undefined
}

export interface ModuleModel extends editor.ITextModel, ExpressionProvider {
    getScope(): BslModuleScope,
    getCodeModel(): BslCodeModel
    updateCodeModel(): void
}
