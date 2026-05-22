import { TestsModel } from './test-model'
import { TestModelRender } from './interfaces'
import { TestsResolver } from './test-resolver/resolver'
import { BslEditor } from '@/bsl/editor'
import { BslEditorOptions } from '@/bsl/editor'
import { createYAxUnitPlugin } from './plugin'

export class YAxUnitEditor extends BslEditor {
    testsModel: TestsModel
    renders: TestModelRender[]
    testsResolver?: TestsResolver

    commands: {
        runTest?: string
    } = {}

    constructor(options: BslEditorOptions = {}) {
        const yaxunitPlugin = createYAxUnitPlugin()
        super({
            ...options,
            plugins: [yaxunitPlugin, ...(options.plugins ?? [])]
        })

        this.testsModel = yaxunitPlugin.testsModel
        this.renders = yaxunitPlugin.renders
        this.testsResolver = yaxunitPlugin.testsResolver
        this.commands.runTest = yaxunitPlugin.runTestCommand
    }

    getText(): string {
        const model = this.editor.getModel()
        return model ? model.getValue() : ''
    }
}
