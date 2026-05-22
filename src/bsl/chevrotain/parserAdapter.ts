import { editor } from 'monaco-editor-core'
import { BslCodeModel } from '@/bsl/codeModel'
import { ModuleModel } from '@/bsl/moduleModel'
import { ParserAdapter, ParserDiagnostic } from '@/bsl/parserAdapter'
import { ChevrotainSitterCodeModelFactory } from './codeModelFactory'

export class ChevrotainParserAdapter implements ParserAdapter {
    readonly id = 'chevrotain'
    private readonly factory = new ChevrotainSitterCodeModelFactory()

    buildModel(model: ModuleModel | string): BslCodeModel {
        return this.factory.buildModel(model)
    }

    rebuildModel(codeModel: BslCodeModel, model: ModuleModel | string): void {
        this.factory.reBuildModel(codeModel, model)
    }

    updateModel(codeModel: BslCodeModel, _model: ModuleModel, changes: editor.IModelContentChange[]): boolean {
        return this.factory.updateModel(codeModel, changes)
    }

    getDiagnostics(): ParserDiagnostic[] {
        return this.factory.errors.map(error => ({ ...error, source: this.id }))
    }

    dispose(): void {
        this.factory.dispose()
    }
}

export function createChevrotainParserAdapter(): ChevrotainParserAdapter {
    return new ChevrotainParserAdapter()
}
