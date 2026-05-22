import { editor } from 'monaco-editor-core'
import { BslCodeModel } from '@/bsl/codeModel'
import { ModuleModel } from '@/bsl/moduleModel'
import { ParserAdapter, ParserDiagnostic } from '@/bsl/parserAdapter'
import { LezerCodeModelFactory } from './factory/codeModelFactory'

export class LezerParserAdapter implements ParserAdapter {
    readonly id = 'lezer'
    private readonly factory = new LezerCodeModelFactory()

    buildModel(model: ModuleModel | string): BslCodeModel {
        return this.factory.buildModel(model)
    }

    rebuildModel(codeModel: BslCodeModel, model: ModuleModel | string): void {
        this.factory.reBuildModel(codeModel, model)
    }

    updateModel(codeModel: BslCodeModel, model: ModuleModel, changes: editor.IModelContentChange[]): boolean {
        return this.factory.updateModel(codeModel, model, changes)
    }

    getDiagnostics(): ParserDiagnostic[] {
        return this.factory.errors.map(error => ({ ...error, source: this.id }))
    }

    dispose(): void {
        this.factory.dispose()
    }
}

export function createLezerParserAdapter(): LezerParserAdapter {
    return new LezerParserAdapter()
}
