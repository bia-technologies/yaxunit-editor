import { languages, editor } from 'monaco-editor-core';
import { ModuleModel } from "@/bsl/moduleModel";
import { getBslHover } from '@/bsl/languageService';

export const hoverProvider: languages.HoverProvider = {
    async provideHover(model: editor.ITextModel, position): Promise<languages.Hover | undefined> {
        const start = performance.now()

        const content = await getBslHover(model as ModuleModel, position)

        console.debug('hover', performance.now() - start, 'ms')

        return content
    },
}
