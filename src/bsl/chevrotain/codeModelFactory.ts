import { ModuleModel } from "../moduleModel"

export const ChevrotainSitterCodeModelFactory = {
    buildModel(_: ModuleModel) {
        const start = performance.now()
        // const model = new BslCodeModel()
        // const root = (moduleModel.getScope() as TreeSitterModuleModel).parser.getRootNode()
        // fillChildren(root.children, model.children)
        console.debug('Build code model', performance.now() - start, 'ms')
        return undefined
    },
}