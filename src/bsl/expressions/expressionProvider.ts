import { Position } from "monaco-editor-core";
import { Constructor, Expression, MethodCall } from "./expressions";

export interface ExpressionProvider {
    getEditingExpression(position: Position): Expression | undefined,
    getEditingMethod(position: Position): Constructor | MethodCall | undefined,
    getCurrentExpression(position: Position): Expression | undefined
}