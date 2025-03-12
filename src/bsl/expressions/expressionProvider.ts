import { IPosition } from "monaco-editor-core";
import { Constructor, Expression, MethodCall } from "./expressions";
import { CodeSymbol } from "@/common/codeModel";

export interface ExpressionProvider {
    getEditingExpression(position: IPosition): Expression | undefined,
    getEditingMethod(position: IPosition): Constructor | MethodCall | undefined,
    getCurrentExpression(position: IPosition): CodeSymbol | undefined
}