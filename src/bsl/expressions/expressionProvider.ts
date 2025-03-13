import { IPosition } from "monaco-editor-core";
import { CodeSymbol } from "@/common/codeModel";
import { AccessSequenceSymbol, ConstructorSymbol, MethodCallSymbol } from "@/bsl/codeModel";

export interface ExpressionProvider {
    getEditingExpression(position: IPosition): CodeSymbol | undefined,
    getEditingMethod(position: IPosition): MethodCallSymbol | ConstructorSymbol | AccessSequenceSymbol | undefined,
    getCurrentExpression(position: IPosition): CodeSymbol | undefined
}