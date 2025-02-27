import { registerCommands } from './features/runner'
import { TestsModel } from './test-model'
import { TestStatusDecorator } from './features/decorator'
import { TestMessageMarkersProvider } from './features/markers'
import { TestModelRender } from './interfaces'
import { TestsResolver } from './test-resolver/resolver'
import { BslEditor } from '@/bsl/editor'

export class YAxUnitEditor extends BslEditor {
    testsModel: TestsModel = new TestsModel()
    renders: TestModelRender[] = []
    testsResolver: TestsResolver

    commands: {
        runTest?: string
    } = {}

    constructor() {
        super()

        this.commands.runTest = registerCommands(this) ?? undefined

        this.renders.push(new TestStatusDecorator(this.editor), new TestMessageMarkersProvider(this.editor))
        this.testsModel.onDidChangeContent(_ => this.renders.forEach(r => r.update(this.testsModel)))

        this.testsResolver = new TestsResolver(this, this.testsModel)

        this.editor.getModel()?.onDidChangeContent(e => {
            this.testsResolver.onDidChangeContent(e)
        })
    }

    getText(): string {
        const model = this.editor.getModel()
        return model ? model.getValue() : ''
    }
}
