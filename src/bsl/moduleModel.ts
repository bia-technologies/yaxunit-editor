import { LocalModuleScope } from "@/common/scope";
import { editor } from "monaco-editor-core";
import { ExpressionProvider } from "./expressions/expressionProvider";

export interface ModuleModel extends editor.ITextModel, ExpressionProvider {
    getScope(): LocalModuleScope,
}
