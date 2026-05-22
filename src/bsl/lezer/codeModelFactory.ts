import { LezerCodeModelFactory as FullLezerCodeModelFactory } from './factory/codeModelFactory'
import { BslCodeModel, isMethodDefinition } from '../codeModel'
import { ModuleModel } from '../moduleModel'

export class LezerCodeModelFactory extends FullLezerCodeModelFactory {
    protected override useFastBuildForString = true

    override buildModel(model: ModuleModel | string): BslCodeModel {
        const codeModel = super.buildModel(model)
        this.resetAutoLoadedBodies(codeModel)
        return codeModel
    }

    override reBuildModel(codeModel: BslCodeModel, model: ModuleModel | string): void {
        super.reBuildModel(codeModel, model)
        this.resetAutoLoadedBodies(codeModel)
    }

    private resetAutoLoadedBodies(codeModel: BslCodeModel): void {
        for (const method of codeModel.children.filter(isMethodDefinition)) {
            method.children = []
            ;(method as unknown as { _bodyParsed: boolean })._bodyParsed = false
        }
    }
}

export { LezerCodeModelFactoryVisitor } from './factory/codeModelFactoryVisitor'
