import { resolveSymbol } from "@/tree-sitter/symbols";
import { IMarkdownString, languages } from "monaco-editor-core";
import { EditorScope } from "../scope/editorScope";
import { getPositionOffset } from "@/monaco/utils";

export const hoverProvider: languages.HoverProvider = {
    async provideHover(model, position): Promise<languages.Hover | undefined> {
        const scope = EditorScope.getScope(model)
        const node = scope.getAst().getCurrentNode(getPositionOffset(model, position))
        
        if (node) {
            const symbol = resolveSymbol(node)
            const content: IMarkdownString[] = [{ value: symbol.toString() }]

            let typeId = symbol.getResultTypeId()
            if (typeId instanceof Promise) {
                typeId = await typeId
            }

            if (typeId) {
                content.push({ value: '**Type:** ' + typeId })
            }
            return {
                contents: content
            }
        }
        return undefined
    },
}