import { languages, editor } from "monaco-editor";
import { ModuleModel } from "@/bsl/moduleModel";
import { hoverSymbolDescription } from './documentationRender';

export const hoverProvider: languages.HoverProvider = {
    async provideHover(model: editor.ITextModel, position): Promise<languages.Hover | undefined> {
        const start = performance.now()

        const moduleModel = model as ModuleModel
        const symbol = moduleModel.getCurrentExpression(position)
        const content = symbol ? await hoverSymbolDescription(symbol, model as ModuleModel) : undefined

        console.debug('hover', symbol, performance.now() - start, 'ms')

        return content ? { contents: content } : undefined
    },
}
