import { BslParser } from "../tree-sitter";
import { BslCodeModel } from "./bslCodeModel";
import * as factory from './factory'

export interface BslCodeModelProvider {
    buildModel(parser: BslParser): BslCodeModel
    updateModel(): void
}
export const provider: BslCodeModelProvider = {
    buildModel(parser: BslParser): BslCodeModel {
        const start = performance.now()
        const model = new BslCodeModel()
        factory.fillChildren(parser.getRootNode().children, model.children)
        console.debug('Build code model', performance.now() - start, 'ms')
        return model
    },

    updateModel(): void {

    }
}